const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const THEMES={pastel:['Pastel','#f4a3b8','#a89ee0'],menta:['Menta','#8fd3c0','#6fa8c8'],atardecer:['Atardecer','#f7b38a','#f08fa6'],lavanda:['Lavanda','#c5b3ee','#a89ee0']};
const BANNERS=[['#6fa8c8','#f7ecaa'],['#f4a3b8','#a89ee0'],['#8fd3c0','#f7ecaa'],['#2b3a55','#a89ee0'],['#f7b38a','#f08fa6'],['#c5b3ee','#9fc3dd']];
const FRAMES=['#f4a3b8','#8fd3c0','#f7ecaa','#2b3a55'];
const STATUS={online:'En línea',away:'Ausente',busy:'No molestar'};
const Profile=(()=>{
 const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}};
 const sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){toast('No se pudo guardar: espacio lleno')}if(k==='pf_profile'||k==='pf_lib')Friends.sync()};
 let P=ld('pf_profile',null),L=ld('pf_lib',[]),W=ld('pf_wish',[]),tab='juegos',tmp='';
 const initial=n=>'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#a89ee0"/><text x="50" y="66" font-size="52" font-family="Arial" font-weight="700" text-anchor="middle" fill="#fff">${esc((n||'?')[0].toUpperCase())}</text></svg>`);
 const av=()=>P.avatar||initial(P.name);
 function theme(){if(!P)return;const t=THEMES[P.theme]||THEMES.pastel;document.documentElement.style.setProperty('--pink',t[1]);document.documentElement.style.setProperty('--lilac',t[2])}
 function readImg(f,cb,w=160,h=160){const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;const k=Math.max(w/i.width,h/i.height),sw=w/k,sh=h/k;c.getContext('2d').drawImage(i,(i.width-sw)/2,(i.height-sh)/2,sw,sh,0,0,w,h);cb(c.toDataURL('image/jpeg',.82))};i.src=r.result};r.readAsDataURL(f)}
 function welcome(){
  const w=document.createElement('div');w.className='welcome';w.id='welcome';
  w.innerHTML=`<form class="wbox" id="wf"><h2>Bienvenido a Cheles.py</h2><p>Crea tu perfil para empezar.</p><img id="wav" class="avatar big" src="${initial('?')}" alt="Foto de perfil"><label class="ghost up">Elegir foto<input type="file" accept="image/*" id="wfile" hidden></label><input id="wname" maxlength="20" required placeholder="Tu nombre de usuario" aria-label="Nombre de usuario"><button class="cta wide" type="submit">Crear perfil</button></form>`;
  document.body.appendChild(w);tmp='';
  $('#wfile').onchange=e=>e.target.files[0]&&readImg(e.target.files[0],u=>{tmp=u;$('#wav').src=u});
  $('#wname').oninput=e=>{if(!tmp)$('#wav').src=initial(e.target.value)};
  $('#wf').onsubmit=e=>{e.preventDefault();const n=$('#wname').value.trim().slice(0,20);if(!n)return;P={name:n,bio:'',avatar:tmp,theme:'pastel',banner:0,since:Date.now()};sv('pf_profile',P);w.remove();theme();chip();Intro.show();toast('Perfil creado. ¡Bienvenido, '+n+'!')};
 }
 const chip=()=>{$('#me').innerHTML=P?`<img class="avatar" style="border-color:${FRAMES[P.frame||0]}" src="${av()}" alt=""><span>${esc(P.name)}</span>`:''};
 const owned=()=>L.map(l=>game(l.id)).filter(Boolean);
 function ach(){const o=owned(),g=new Set(o.map(x=>x.g));return[
  ['👋','Bienvenido','Crear tu perfil',!!P],['📷','Con cara','Subir una foto de perfil',!!(P&&P.avatar)],['✍️','Biógrafo','Escribir tu biografía',!!(P&&P.bio)],
  ['🛒','Primera compra','Tener un juego',o.length>=1],['📚','Coleccionista','Tener 5 juegos',o.length>=5],['🏆','Biblioteca épica','Tener 10 juegos',o.length>=10],
  ['🏷️','Cazador de ofertas','Comprar con descuento de temporada',L.some(l=>l.deal)],['🆕','Primicia','Tener un estreno de 2025 o más',o.some(x=>x.yr>=2025)],
  ['🌴','Fan de Vice City','Reservar GTA VI',L.some(l=>l.id==='gta6')],['🧭','Explorador','Tener juegos de 3 géneros',g.size>=3],['💖','Soñador','Añadir un juego a tu lista de deseos',W.length>=1],['🎨','Estilista','Cambiar el tema o el marco de tu perfil',!!P&&(P.theme!=='pastel'||P.frame>0)],['🤝','Sociable','Tener al menos un amigo',Friends.count()>0]]}
 function render(){
  if(!P)return;const b=BANNERS[P.banner]||BANNERS[0],bs=P.bannerImg?`url(${P.bannerImg}) center/cover`:`linear-gradient(120deg,${b[0]},${b[1]})`,o=owned(),A=ach(),ok=A.filter(x=>x[3]).length,spent=L.reduce((s,l)=>s+l.paid,0);
  let body='';
  if(tab==='juegos')body=o.length?`<div class="row4">${L.map(l=>{const g=game(l.id);return `<article class="tile rv" data-v="${g.id}"><div class="cv">${cover(g)}<span class="tag">${soon(g)?'Reservado':'En biblioteca'}</span></div><div class="tb"><h4>${g.t}</h4><small>${g.g} · ${new Date(l.at).toLocaleDateString('es')}</small></div></article>`}).join('')}</div>`:'<p>Aún no tienes juegos. Visita la tienda y añade alguno al carrito.</p>';
  if(tab==='amigos')body='<div id="fr"></div>';
  if(tab==='deseos')body=W.length?`<div class="row4">${W.map(id=>tile(game(id),deal(game(id)),'')).join('')}</div>`:'<p>Tu lista está vacía. Abre un juego y pulsa «Lista de deseos».</p>';
  if(tab==='logros')body=`<div class="achs">${A.map((x,i)=>`<div class="ach rv ${x[3]?'ok':''}" style="--d:${i*50}ms"><i>${x[3]?x[0]:'🔒'}</i><div><b>${x[1]}</b><br><small>${x[2]}</small></div></div>`).join('')}</div>`;
  if(tab==='editar'){const un=A.filter(x=>x[3]),op=(v,l,s)=>`<option value="${esc(v)}" ${s?'selected':''}>${esc(l)}</option>`;body=`<div class="edit"><label>Nombre<input id="en" maxlength="20" value="${esc(P.name)}"></label><label>Biografía<textarea id="eb" maxlength="120" rows="3">${esc(P.bio)}</textarea></label><label>Estado<select id="es">${Object.entries(STATUS).map(([k,v])=>op(k,v,(P.status||'online')===k)).join('')}</select></label><label>Título (logros desbloqueados)<select id="et">${op('','Sin título',!P.title)}${un.map(x=>op(x[1],x[1],P.title===x[1])).join('')}</select></label><label>Juego favorito<select id="ef">${op('','Ninguno',!P.fav)}${owned().map(x=>op(x.id,x.t,P.fav===x.id)).join('')}</select></label><div class="two"><label class="ghost up">Cambiar foto<input type="file" accept="image/*" id="efile" hidden></label><label class="ghost up">Banner con tu imagen<input type="file" accept="image/*" id="ebn" hidden></label>${P.bannerImg?'<button class="ghost" data-nob>Quitar banner propio</button>':''}</div><div><b>Marco de la foto</b><div class="opts">${FRAMES.map((v,i)=>`<button class="sw ${(P.frame||0)===i?'on':''}" data-fr="${i}" style="background:${v}" aria-label="Marco ${i+1}"></button>`).join('')}</div></div><div><b>Tema de color</b><div class="opts">${Object.entries(THEMES).map(([k,v])=>`<button class="sw ${P.theme===k?'on':''}" data-th="${k}" style="background:linear-gradient(90deg,${v[1]},${v[2]})">${v[0]}</button>`).join('')}</div></div><div><b>Banner de color</b><div class="opts">${BANNERS.map((v,i)=>`<button class="sw ${P.banner===i?'on':''}" data-bn="${i}" style="background:linear-gradient(90deg,${v[0]},${v[1]})" aria-label="Banner ${i+1}"></button>`).join('')}</div></div><button class="cta" data-psave>Guardar cambios</button></div>`}
  $('#perfilView').innerHTML=`<section><div class="pban" style="background:${bs}"></div><div class="phead"><span class="avw"><img class="avatar huge" style="border-color:${FRAMES[P.frame||0]}" src="${av()}" alt="Tu foto"><i class="dot ${P.status||'online'}" title="${STATUS[P.status||'online']}"></i></span><div><h2>${esc(P.name)}</h2>${P.title?`<span class="tag inl">${esc(P.title)}</span>`:''}<p>${P.bio?esc(P.bio):'Sin biografía todavía.'}</p><small>${STATUS[P.status||'online']} · Miembro desde ${new Date(P.since).toLocaleDateString('es')}${P.fav&&game(P.fav)?` · Favorito: ${esc(game(P.fav).t)}`:''}</small></div><div class="stats"><span><b>${o.length}</b>Juegos</span><span><b>${ok}/${A.length}</b>Logros</span><span><b>${money(spent)}</b>Invertido</span></div></div><div class="tabs">${[['juegos','Mis juegos'],['amigos','Amigos'],['deseos','Lista de deseos'],['logros','Logros'],['editar','Personalizar']].map(t=>`<button class="tab ${tab===t[0]?'on':''}" data-pt="${t[0]}">${t[1]}</button>`).join('')}</div>${body}</section>`;if(tab==='amigos')Friends.mount($('#fr'));
 }
 function route(){const p=location.hash==='#perfil';$('#inicio').hidden=p;$('#perfilView').hidden=!p;if(p)render();else{const e=document.getElementById(location.hash.slice(1));e?e.scrollIntoView():window.scrollTo(0,0)}}
 const fmt=iso=>{let s=Math.max(0,Math.floor((Date.parse(iso)-Date.now())/1e3));return[Math.floor(s/86400),Math.floor(s%86400/3600),Math.floor(s%3600/60),s%60]};
 function premiere(){
  const g=game('gta6');if(!soon(g)){$('#premiere').innerHTML='';return}
  $('#premiere').innerHTML=`<div class="prem rv"><div class="sun"></div><svg class="palm" viewBox="0 0 120 200" aria-hidden="true"><path d="M58 200 Q62 120 60 60" stroke="#7b6fb8" stroke-width="7" fill="none"/><g fill="#7b6fb8"><path d="M60 60 Q20 40 0 70 Q35 50 60 60"/><path d="M60 60 Q100 30 120 62 Q85 48 60 60"/><path d="M60 60 Q40 10 14 20 Q44 24 60 60"/><path d="M60 60 Q85 8 112 16 Q80 24 60 60"/></g></svg><div class="pt"><span class="tag">Gran estreno</span><h3>Grand Theft Auto VI</h3><p>Vice City vuelve en la entrega más esperada. Sale el 19 de noviembre de 2026 en PS5 y Xbox Series X|S; la versión de PC aún no está anunciada.</p><div class="cd" id="cd"><div><b id="cd0">0</b>días</div><div><b id="cd1">0</b>horas</div><div><b id="cd2">0</b>min</div><div><b id="cd3">0</b>seg</div></div><div class="btns"><button class="cta" data-a="gta6">Reservar · ${money(g.p)} (estimado)</button><button class="ghost" data-v="gta6">Ver detalles</button></div></div></div>`;
 }
 function tick(){
  document.querySelectorAll('[data-cd]').forEach(e=>{const[d,h,m,s]=fmt(e.dataset.cd);e.textContent=`${d}d ${h}h ${m}m ${s}s`});
  const c=$('#cd0');if(c){fmt(UPCOMING.gta6).forEach((v,i)=>{const e=$('#cd'+i);if(e.textContent!=v){e.textContent=v;e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop')}})}
 }
 function checkout(){
  const n=cart.length,t=$('#cartTotal').textContent;
  cart.forEach(id=>{const g=game(id);if(!L.some(l=>l.id===id))L.push({id,at:Date.now(),paid:price(g),deal:deal(g)>0})});
  sv('pf_lib',L);cart=[];coupon=0;save();closeAll();toast(`¡Compra completada! ${n} juego(s) por ${t}. Ya están en tu perfil`);if(location.hash==='#perfil')render();
 }
 let io;
 function observe(){document.querySelectorAll('.rv:not(.in)').forEach(e=>io.observe(e))}
 function init(){
  io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.08});
  new MutationObserver(observe).observe(document.body,{childList:true,subtree:true});
  theme();chip();premiere();tick();setInterval(tick,1000);window.addEventListener('hashchange',route);route();observe();
  if(!P)welcome();else{Intro.show();tick()}
  document.addEventListener('click',e=>{const d=e.target.closest('button')?.dataset;if(!d)return;
   if(d.pt){tab=d.pt;render()}
   else if(d.th){P.theme=d.th;theme();render()}
   else if(d.bn!==undefined){P.banner=+d.bn;P.bannerImg='';sv('pf_profile',P);render()}
   else if(d.fr!==undefined){P.frame=+d.fr;sv('pf_profile',P);chip();render()}
   else if(d.nob!==undefined){P.bannerImg='';sv('pf_profile',P);render()}
   else if(d.w){const i=W.indexOf(d.w);i<0?W.push(d.w):W.splice(i,1);sv('pf_wish',W);e.target.closest('button').textContent=i<0?'💖 En deseos':'🤍 Lista de deseos';toast(i<0?'Añadido a tu lista de deseos':'Quitado de tu lista de deseos')}
   else if(d.psave!==undefined){P.name=($('#en').value.trim()||P.name).slice(0,20);P.bio=$('#eb').value.trim().slice(0,120);P.status=$('#es').value;P.title=$('#et').value;P.fav=$('#ef').value;sv('pf_profile',P);chip();render();toast('Perfil actualizado')}});
  document.addEventListener('change',e=>{if(e.target.id==='ebn'&&e.target.files[0])readImg(e.target.files[0],u=>{P.bannerImg=u;sv('pf_profile',P);render();toast('Banner actualizado')},900,260);if(e.target.id==='efile'&&e.target.files[0])readImg(e.target.files[0],u=>{P.avatar=u;sv('pf_profile',P);chip();render();toast('Foto actualizada')})});
 }
 function grant(id){const g=game(id);if(!L.some(l=>l.id===id)){L.push({id,at:Date.now(),paid:price(g),deal:deal(g)>0});sv('pf_lib',L)}if(location.hash==='#perfil')render()}
 return{init,checkout,render,grant,ini:initial,stats:()=>({games:L.length,achs:ach().filter(x=>x[3]).length}),wished:id=>W.includes(id)};
})();
