const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const PORT = Number(process.env.PORT || 3000);
const DATABASE_URL = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 5
});
const allowedOrigins = new Set((process.env.FRONTEND_ORIGIN || 'https://yahlpzzzcap.github.io,http://localhost:3000,http://127.0.0.1:3000').split(',').map(x => x.trim()).filter(Boolean));
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.mp3':'audio/mpeg', '.ogg':'audio/ogg' };

const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const clampText = (value, max) => String(value == null ? '' : value).slice(0, max);
const number = (value, max) => Math.max(0, Math.min(Number(value) || 0, max));

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' });
  res.end(JSON.stringify(data));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 200000) {
        reject(Object.assign(new Error('body too large'), { status:413 }));
        req.destroy();
      }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); }
      catch (_) { reject(Object.assign(new Error('invalid json'), { status:400 })); }
    });
    req.on('error', reject);
  });
}
function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-id, x-token');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
}
function publicUser(row) {
  return {
    id:String(row.id).trim(), name:row.name, bio:row.bio, avatar:row.avatar,
    status:row.status, title:row.title, fav:row.fav, games:row.games, achs:row.achs,
    online:Date.now() - new Date(row.seen_at).getTime() < 120000
  };
}
function profileValues(body, oldName) {
  const avatar = typeof body.avatar === 'string' && body.avatar.startsWith('data:image/') && body.avatar.length < 90000 ? body.avatar : '';
  return {
    name:clampText(body.name,20).trim() || oldName || 'Jugador',
    bio:clampText(body.bio,120),
    status:['online','away','busy'].includes(body.status) ? body.status : 'online',
    title:clampText(body.title,30), fav:clampText(body.fav,30),
    games:number(body.games,999), achs:number(body.achs,99), avatar,
    lib:Array.isArray(body.lib) ? body.lib.slice(0,300).map(x => clampText(x,30)) : []
  };
}
async function authenticate(req) {
  const id = clampText(req.headers['x-id'],4);
  const token = String(req.headers['x-token'] || '');
  if (!/^\d{4}$/.test(id) || !token) return null;
  const result = await pool.query('SELECT * FROM players WHERE id=$1', [id]);
  const player = result.rows[0];
  if (!player) return null;
  const expected = Buffer.from(player.token_hash,'hex');
  const actual = Buffer.from(sha(token),'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(expected,actual) ? player : null;
}
async function getMe(id) {
  const results = await Promise.all([
    pool.query('SELECT p.* FROM friendships f JOIN players p ON p.id=f.friend_id WHERE f.player_id=$1 ORDER BY p.name',[id]),
    pool.query('SELECT p.* FROM friend_requests r JOIN players p ON p.id=r.from_id WHERE r.to_id=$1 ORDER BY p.name',[id]),
    pool.query('SELECT p.* FROM friend_requests r JOIN players p ON p.id=r.to_id WHERE r.from_id=$1 ORDER BY p.name',[id])
  ]);
  return { id, friends:results[0].rows.map(publicUser), incoming:results[1].rows.map(publicUser), outgoing:results[2].rows.map(publicUser) };
}
async function initializeDatabase() {
  if (!DATABASE_URL) throw new Error('Falta configurar DATABASE_URL.');
  const statements = [
    "CREATE TABLE IF NOT EXISTS players (id CHAR(4) PRIMARY KEY, token_hash CHAR(64) NOT NULL, name VARCHAR(20) NOT NULL DEFAULT 'Jugador', bio VARCHAR(120) NOT NULL DEFAULT '', avatar TEXT NOT NULL DEFAULT '', status VARCHAR(10) NOT NULL DEFAULT 'online', title VARCHAR(30) NOT NULL DEFAULT '', fav VARCHAR(30) NOT NULL DEFAULT '', games INTEGER NOT NULL DEFAULT 0, achs INTEGER NOT NULL DEFAULT 0, lib JSONB NOT NULL DEFAULT '[]'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW())",
    "CREATE TABLE IF NOT EXISTS friendships (player_id CHAR(4) NOT NULL REFERENCES players(id) ON DELETE CASCADE, friend_id CHAR(4) NOT NULL REFERENCES players(id) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (player_id,friend_id), CHECK (player_id <> friend_id))",
    "CREATE TABLE IF NOT EXISTS friend_requests (from_id CHAR(4) NOT NULL REFERENCES players(id) ON DELETE CASCADE, to_id CHAR(4) NOT NULL REFERENCES players(id) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (from_id,to_id), CHECK (from_id <> to_id))",
    "CREATE INDEX IF NOT EXISTS players_name_idx ON players (lower(name))",
    "CREATE INDEX IF NOT EXISTS friend_requests_to_idx ON friend_requests (to_id)"
  ];
  for (const sql of statements) await pool.query(sql);
}
async function handleApi(req,res,url) {
  const route = url.pathname.slice(5);
  const body = req.method === 'POST' ? await readBody(req) : {};
  if (route === 'ping') return send(res,200,{ok:1});
  if (route === 'register' && req.method === 'POST') {
    const token = crypto.randomBytes(32).toString('hex');
    const v = profileValues(body);
    for (let attempt=0; attempt<40; attempt++) {
      const id = String(crypto.randomInt(1000,10000));
      try {
        await pool.query('INSERT INTO players (id,token_hash,name,bio,avatar,status,title,fav,games,achs,lib) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
          [id,sha(token),v.name,v.bio,v.avatar,v.status,v.title,v.fav,v.games,v.achs,JSON.stringify(v.lib)]);
        return send(res,200,{id,token});
      } catch (error) { if (error.code !== '23505') throw error; }
    }
    return send(res,503,{error:'codes_full'});
  }
  const player = await authenticate(req);
  if (!player) return send(res,401,{error:'auth'});
  const id = String(player.id).trim();

  if (route === 'sync' && req.method === 'POST') {
    const v = profileValues(body,player.name);
    await pool.query('UPDATE players SET name=$2,bio=$3,avatar=$4,status=$5,title=$6,fav=$7,games=$8,achs=$9,lib=$10::jsonb,seen_at=NOW() WHERE id=$1',
      [id,v.name,v.bio,v.avatar,v.status,v.title,v.fav,v.games,v.achs,JSON.stringify(v.lib)]);
    return send(res,200,await getMe(id));
  }
  if (route === 'search' && req.method === 'GET') {
    const term = clampText(url.searchParams.get('q'),30).replace('#','').trim();
    if (!term) return send(res,200,{users:[]});
    const result = await pool.query(
      "SELECT p.*, CASE WHEN EXISTS (SELECT 1 FROM friendships f WHERE f.player_id=$1 AND f.friend_id=p.id) THEN 'friend' WHEN EXISTS (SELECT 1 FROM friend_requests r WHERE r.from_id=$1 AND r.to_id=p.id) THEN 'sent' WHEN EXISTS (SELECT 1 FROM friend_requests r WHERE r.from_id=p.id AND r.to_id=$1) THEN 'got' ELSE '' END AS rel FROM players p WHERE p.id<>$1 AND (p.id=$2 OR p.name ILIKE $3) ORDER BY p.name LIMIT 12",
      [id,term,'%'+term+'%']);
    return send(res,200,{users:result.rows.map(row => Object.assign(publicUser(row),{rel:row.rel}))});
  }
  if (route === 'request' && req.method === 'POST') {
    const target = clampText(body.to,4);
    if (!/^\d{4}$/.test(target) || target === id) return send(res,400,{error:'invalid'});
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const exists = await client.query('SELECT id FROM players WHERE id=$1',[target]);
      if (!exists.rowCount) { await client.query('ROLLBACK'); return send(res,400,{error:'invalid'}); }
      const already = await client.query('SELECT 1 FROM friendships WHERE player_id=$1 AND friend_id=$2',[id,target]);
      if (already.rowCount) { await client.query('ROLLBACK'); return send(res,400,{error:'invalid'}); }
      const reverse = await client.query('DELETE FROM friend_requests WHERE from_id=$1 AND to_id=$2 RETURNING from_id',[target,id]);
      if (reverse.rowCount) {
        await client.query('INSERT INTO friendships (player_id,friend_id) VALUES ($1,$2),($2,$1) ON CONFLICT DO NOTHING',[id,target]);
      } else {
        await client.query('INSERT INTO friend_requests (from_id,to_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',[id,target]);
      }
      await client.query('COMMIT');
      return send(res,200,{ok:1});
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  if (route === 'respond' && req.method === 'POST') {
    const from = clampText(body.from,4);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const had = await client.query('DELETE FROM friend_requests WHERE from_id=$1 AND to_id=$2 RETURNING from_id',[from,id]);
      if (had.rowCount && body.accept && from !== id) {
        await client.query('INSERT INTO friendships (player_id,friend_id) VALUES ($1,$2),($2,$1) ON CONFLICT DO NOTHING',[id,from]);
      }
      await client.query('COMMIT');
      return send(res,200,{ok:1});
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  if (route === 'remove' && req.method === 'POST') {
    const other = clampText(body.id,4);
    await pool.query('DELETE FROM friendships WHERE (player_id=$1 AND friend_id=$2) OR (player_id=$2 AND friend_id=$1)',[id,other]);
    return send(res,200,{ok:1});
  }
  if (route === 'profile' && req.method === 'GET') {
    const other = clampText(url.searchParams.get('id'),4);
    const result = await pool.query('SELECT p.* FROM players p WHERE p.id=$1 AND EXISTS (SELECT 1 FROM friendships f WHERE f.player_id=$2 AND f.friend_id=p.id)',[other,id]);
    if (!result.rowCount) return send(res,403,{error:'forbidden'});
    return send(res,200,{user:publicUser(result.rows[0]),lib:result.rows[0].lib || []});
  }
  return send(res,404,{error:'not found'});
}
const server = http.createServer(async (req,res) => {
  cors(req,res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const url = new URL(req.url,'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req,res,url);
    const requested = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const file = path.resolve(__dirname,'.'+requested);
    if (!file.startsWith(__dirname+path.sep) || ['server.js','db.json','.env'].includes(path.basename(file))) return send(res,404,{error:'not found'});
    fs.readFile(file,(error,data) => {
      if (error) return send(res,404,{error:'not found'});
      res.writeHead(200,{'Content-Type':MIME[path.extname(file).toLowerCase()] || 'application/octet-stream'});
      res.end(data);
    });
  } catch (error) {
    console.error('API error:',error);
    if (!res.headersSent) send(res,error.status || 500,{error:error.status === 400 ? 'invalid_json' : 'server_error'});
    else res.destroy();
  }
});
initializeDatabase().then(() => {
  server.listen(PORT,() => console.log('Cheles.py API listo en el puerto '+PORT));
}).catch(error => {
  console.error('No se pudo iniciar Cheles.py:',error.message);
  process.exit(1);
});
process.on('SIGTERM',async () => { await pool.end(); process.exit(0); });
