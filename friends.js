const Friends=(()=>{
 const K='pf_net',API=(window.CHELES_API_URL||'').replace(/\/$/,'');let net=null,data={friends:[],incoming:[],outgoing:[]},ok=null,box=null,res=[],q='',tm;
 try{net=JSON.parse(localStorage.getItem(K))}catch(e){}
 const api=async(p,body)=>{const h={'Content-Type':'application/json'};if(net){h['x-id']=net.id;h['x-token']=net.token}const r=await fetch(API+'/api/'+p,{method:body?'POST':'GET',headers:h,body:body?JSON.stringify(body):undefined});if(!r.ok)throw new Error(r.status);return r.json()};
 const rd=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
 const mine=()=>{const p=rd('pf_profile'),l=rd('pf_lib')||[],s=Profile.stats();return p&&{name:p.name,bio:p.bio,avatar:p.avatar,status:p.status||'online',title:p.title||'',fav:p.fav||'',games:s.games,achs:s.achs,lib:l.map(x=>x.id)}};
 async function sync(){
  if(location.protocol==='file:'){ok=false;draw();return}
  const m=mine();if(!m)return;
  try{
   if(!net){const r=await api('register',m);net={id:r.id,token:r.token};localStorage.setItem(K,JSON.stringify(net))}
   data=await api('sync',m);ok=true;
  }catch(e){ok=false;if(String(e.message)==='401'){net=null;localStorage.removeItem(K)}}
  const me=$('#me');if(me){me.dataset.n=data.incoming.length;me.classList.toggle('has',data.incoming.length>0)}
  draw();
 }
 const av=u=>u.avatar||Profile.ini(u.name);
 const card=(u,b)=>`<div class="fc"><span class="avw sm"><img class="avatar" src="${av(u)}" alt=""><i class="dot ${u.online?(u.status||'online'):'off'}"></i></span><div class="fi"><b>${esc(u.name)}</b> <small>#${u.id}</small><br><small>${u.online?STATUS[u.status]||'En línea':'Desconectado'} · ${u.games} juegos · ${u.achs} logros</small></div><div class="fb">${b}</div></div>`;
 const rel=u=>u.rel==='friend'?'<small>Ya son amigos</small>':u.rel==='sent'?'<small>Pendiente</small>':u.rel==='got'?`<button class="cta" data-fa="yes:${u.id}">Aceptar</button>`:`<button class="cta" data-fa="add:${u.id}">Añadir</button>`;
 function draw(){
  if(!box||!document.body.contains(box))return;
  if(ok===false){box.innerHTML='<div class="note"><b>Servidor no conectado</b><p>Comprueba que el servidor de Cheles.py esté publicado y que la dirección de api-config.js sea correcta.</p></div>';return}
  if(!net){box.innerHTML='<p>Conectando…</p>';return}
  const m=mine();
  box.innerHTML=`<div class="fhead"><span>Tu código de amigo: <b>${esc(m.name)}#${net.id}</b></span><button class="ghost" data-fa="copy">Copiar</button></div><input id="fs" class="fsearch" placeholder="Buscar jugadores por nombre o código" value="${esc(q)}" aria-label="Buscar jugadores"><div id="fres">${res.map(u=>card(u,rel(u))).join('')}</div>${data.incoming.length?`<h3>Solicitudes</h3>${data.incoming.map(u=>card(u,`<button class="cta" data-fa="yes:${u.id}">Aceptar</button><button class="ghost" data-fa="no:${u.id}">Rechazar</button>`)).join('')}`:''}<h3>Amigos (${data.friends.length})</h3>${data.friends.length?data.friends.map(u=>card(u,`<button class="ghost" data-fa="view:${u.id}">Ver perfil</button><button class="ghost" data-fa="del:${u.id}">Eliminar</button>`)).join(''):'<p>Aún no tienes amigos. Busca a alguien por su nombre o su código.</p>'}${data.outgoing.length?`<h3>Enviadas</h3>${data.outgoing.map(u=>card(u,'<small>Pendiente</small>')).join('')}`:''}`;
 }
 function showProfile(r){
  const u=r.user,m=$('#modal');
  m.innerHTML=`<div class="info" style="padding:28px"><button class="x" data-close aria-label="Cerrar">✕</button><div class="phead" style="padding:0"><img class="avatar big" src="${av(u)}" alt=""><div style="flex:1"><h3>${esc(u.name)}</h3>${u.title?`<span class="tag inl">${esc(u.title)}</span>`:''}<p>${esc(u.bio)||'Sin biografía.'}</p><small>${u.games} juegos · ${u.achs} logros${u.fav&&game(u.fav)?' · Favorito: '+esc(game(u.fav).t):''}</small></div></div><h4>Biblioteca</h4><div class="row4 mini">${r.lib.map(game).filter(Boolean).map(g=>`<div class="tile"><div class="cv">${cover(g)}</div></div>`).join('')||'<p>Biblioteca vacía.</p>'}</div></div>`;
  m.hidden=false;$('#overlay').hidden=false;
 }
 document.addEventListener('input',e=>{if(e.target.id!=='fs')return;q=e.target.value;clearTimeout(tm);tm=setTimeout(async()=>{try{res=q.trim()?(await api('search?q='+encodeURIComponent(q.trim()))).users:[];const f=$('#fres');if(f)f.innerHTML=res.map(u=>card(u,rel(u))).join('')}catch(x){}},300)});
 document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-fa]');if(!b)return;const[a,id]=b.dataset.fa.split(':');
  try{
   if(a==='copy'){if(navigator.clipboard)navigator.clipboard.writeText(mine().name+'#'+net.id);toast('Código copiado');return}
   if(a==='add'){await api('request',{to:id});res.forEach(u=>{if(u.id===id)u.rel='sent'});toast('Solicitud enviada')}
   if(a==='yes'||a==='no'){await api('respond',{from:id,accept:a==='yes'});res.forEach(u=>{if(u.id===id)u.rel=a==='yes'?'friend':''})}
   if(a==='del'){if(!confirm('¿Eliminar a este amigo?'))return;await api('remove',{id})}
   if(a==='view'){showProfile(await api('profile?id='+id));return}
   await sync();
  }catch(x){toast('No se pudo completar la acción')}
 });
 return{init(){sync();setInterval(()=>{if(!document.hidden)sync()},30000)},sync,mount(el){box=el;draw();sync()},count:()=>data.friends.length};
})();
