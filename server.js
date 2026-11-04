const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=process.env.PORT||3000,DB=path.join(__dirname,'db.json');
let db={users:{},req:[],fr:{}},timer;
try{db=JSON.parse(fs.readFileSync(DB,'utf8'))}catch(e){}
const save=()=>{clearTimeout(timer);timer=setTimeout(()=>fs.writeFile(DB,JSON.stringify(db),()=>{}),300)};
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const cl=(s,n)=>String(s==null?'':s).slice(0,n);
const pub=u=>({id:u.id,name:u.name,bio:u.bio,avatar:u.avatar,status:u.status,title:u.title,fav:u.fav,games:u.games,achs:u.achs,online:Date.now()-u.seen<120000});
const MIME={'.html':'text/html;charset=utf-8','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
const send=(r,c,o)=>{r.writeHead(c,{'Content-Type':'application/json'});r.end(JSON.stringify(o))};
const body=q=>new Promise(res=>{let b='';q.on('data',c=>{b+=c;if(b.length>2e5)q.destroy()});q.on('end',()=>{try{res(JSON.parse(b||'{}'))}catch(e){res({})}})});
const auth=q=>{const u=db.users[q.headers['x-id']];return u&&u.th===sha(String(q.headers['x-token']))?u:null};
const friends=u=>db.fr[u.id]||(db.fr[u.id]=[]);
const me=u=>({id:u.id,friends:friends(u).map(i=>db.users[i]).filter(Boolean).map(pub),incoming:db.req.filter(x=>x.to===u.id).map(x=>db.users[x.from]).filter(Boolean).map(pub),outgoing:db.req.filter(x=>x.from===u.id).map(x=>db.users[x.to]).filter(Boolean).map(pub)});
function fill(u,b){
 u.name=cl(b.name,20).trim()||u.name||'Jugador';u.bio=cl(b.bio,120);u.status=['online','away','busy'].includes(b.status)?b.status:'online';
 u.title=cl(b.title,30);u.fav=cl(b.fav,30);u.games=Math.min(+b.games||0,999);u.achs=Math.min(+b.achs||0,99);
 u.avatar=typeof b.avatar==='string'&&b.avatar.startsWith('data:image/')&&b.avatar.length<90000?b.avatar:'';
 u.lib=Array.isArray(b.lib)?b.lib.slice(0,300).map(x=>cl(x,30)):[];u.seen=Date.now();
}
http.createServer(async(q,r)=>{
 const url=new URL(q.url,'http://localhost');
 if(url.pathname.startsWith('/api/')){
  const p=url.pathname.slice(5),b=q.method==='POST'?await body(q):{};
  if(p==='ping')return send(r,200,{ok:1});
  if(p==='register'){
   let id;do{id=String(Math.floor(1000+Math.random()*9000))}while(db.users[id]);
   const token=crypto.randomBytes(16).toString('hex'),u={id,th:sha(token),created:Date.now()};fill(u,b);db.users[id]=u;save();return send(r,200,{id,token});
  }
  const u=auth(q);if(!u)return send(r,401,{error:'auth'});
  if(p==='sync'){fill(u,b);save();return send(r,200,me(u))}
  if(p==='search'){
   const s=cl(url.searchParams.get('q'),30).toLowerCase().replace('#','').trim();if(!s)return send(r,200,{users:[]});
   const users=Object.values(db.users).filter(x=>x.id!==u.id&&(x.id===s||x.name.toLowerCase().includes(s))).slice(0,12).map(x=>({...pub(x),rel:friends(u).includes(x.id)?'friend':db.req.some(y=>y.from===u.id&&y.to===x.id)?'sent':db.req.some(y=>y.from===x.id&&y.to===u.id)?'got':''}));
   return send(r,200,{users});
  }
  if(p==='request'){
   const t=db.users[b.to];if(!t||t.id===u.id||friends(u).includes(t.id))return send(r,400,{error:'invalid'});
   if(db.req.some(y=>y.from===t.id&&y.to===u.id)){db.req=db.req.filter(y=>!(y.from===t.id&&y.to===u.id));friends(u).push(t.id);friends(t).push(u.id)}
   else if(!db.req.some(y=>y.from===u.id&&y.to===t.id))db.req.push({from:u.id,to:t.id});
   save();return send(r,200,{ok:1});
  }
  if(p==='respond'){
   const had=db.req.some(y=>y.from===b.from&&y.to===u.id);db.req=db.req.filter(y=>!(y.from===b.from&&y.to===u.id));
   if(had&&b.accept&&db.users[b.from]){friends(u).push(b.from);friends(db.users[b.from]).push(u.id)}
   save();return send(r,200,{ok:1});
  }
  if(p==='remove'){db.fr[u.id]=friends(u).filter(i=>i!==b.id);if(db.users[b.id])db.fr[b.id]=friends(db.users[b.id]).filter(i=>i!==u.id);save();return send(r,200,{ok:1})}
  if(p==='profile'){const t=db.users[url.searchParams.get('id')];if(!t||!friends(u).includes(t.id))return send(r,403,{error:'forbidden'});return send(r,200,{user:pub(t),lib:t.lib||[]})}
  return send(r,404,{error:'not found'});
 }
 let f=path.normalize(decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
 const full=path.join(__dirname,f);
 if(!full.startsWith(__dirname)||['db.json','server.js'].includes(path.basename(full)))return send(r,404,{error:'not found'});
 fs.readFile(full,(e,d)=>{if(e)return send(r,404,{error:'not found'});r.writeHead(200,{'Content-Type':MIME[path.extname(full).toLowerCase()]||'application/octet-stream'});r.end(d)});
}).listen(PORT,()=>console.log('Cheles.py listo en http://localhost:'+PORT));
