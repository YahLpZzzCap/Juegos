const $=s=>document.querySelector(s),money=n=>n?'$'+n.toFixed(2):'Gratis';
const MS=['winter','winter','spring','spring','spring','summer','summer','summer','autumn','autumn','autumn','winter'];
let sim='',sel='',filter='Todos',query='',fi=0,cart=JSON.parse(localStorage.getItem('pf_cart')||'[]');
const season=()=>sim||MS[new Date().getMonth()];
const game=id=>GAMES.find(g=>g.id===id);
const deal=g=>SEASONS[season()].ids.includes(g.id)?SEASONS[season()].pct:0;
const price=g=>+(g.p*(1-deal(g)/100)).toFixed(2);
let tileN=0,sort='rel',coupon=0;
const CODES={CHELES10:10,VICECITY:15};
const RT=(()=>{try{return JSON.parse(localStorage.getItem('pf_rate'))||{}}catch(e){return{}}})();
const stars=g=>`<div class="stars">${[1,2,3,4,5].map(n=>`<button class="st ${(RT[g.id]||0)>=n?'on':''}" data-rate="${n}" aria-label="${n} estrellas">★</button>`).join('')}<small>${RT[g.id]?'Tu valoración':'Valora este juego'}</small></div>`;
const SORTS={rel:()=>0,pa:(a,b)=>price(a)-price(b),pd:(a,b)=>price(b)-price(a),az:(a,b)=>a.t.localeCompare(b.t),yr:(a,b)=>b.yr-a.yr};
const ytid=u=>{u=String(u||'');const m=u.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);return m?m[1]:/^[\w-]{11}$/.test(u)?u:''};
const sound=g=>{const s=(MEDIA[g.id]||{}).soundtrack||'',y=ytid(s);Music.stop();return y?`<iframe class="yt sm" src="https://www.youtube-nocookie.com/embed/${y}" allow="autoplay" title="Banda sonora de ${g.t}"></iframe>`:s?`<audio controls preload="none" src="${s}"></audio>`:''};
const NEW=GAMES.filter(g=>g.yr>=2025).sort((a,b)=>b.yr-a.yr);
const FEAT=NEW.filter(g=>!soon(g)).slice(0,5);
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
function priceHtml(g,pct=deal(g),base=g.p){const f=+(base*(1-pct/100)).toFixed(2);return `<div class="pr">${pct?`<span class="off">-${pct}%</span><span class="old">${money(base)}</span>`:''}<b>${money(f)}</b></div>`}
function tile(g,pct,tag){tag=soon(g)?'Próximamente':tag;return `<article class="tile rv" style="--d:${(tileN++%8)*70}ms" data-v="${g.id}"><div class="cv">${cover(g)}${tag?`<span class="tag">${tag}</span>`:''}</div><div class="tb"><h4>${g.t}</h4><small>${g.g} · ${g.yr}</small>${priceHtml(g,pct)}<button class="add" data-a="${g.id}">${cart.includes(g.id)?'En el carrito':'Añadir al carrito'}</button></div></article>`}
function renderFeat(){
 const g=FEAT[fi];
 $('#feat').innerHTML=`<div class="fmain" data-v="${g.id}"><div class="art">${cover(g,fi%3).replace('<svg','<svg preserveAspectRatio="xMidYMid slice"')}</div><div class="info"><h3>${g.t}</h3><p>${g.d}</p>${soon(g)?`<p><b>Sale en <span data-cd="${UPCOMING[g.id]}"></span></b></p>`:''}${priceHtml(g)}</div></div><div class="fside">${FEAT.map((x,i)=>`<button data-fi="${i}" class="${i===fi?'on':''}">${cover(x)}<span>${x.t}</span></button>`).join('')}</div>`;
}
function renderSeasons(){
 const cur=season(),s=SEASONS[sel||cur],open=(sel||cur)===cur;
 $('#seasonTabs').innerHTML=Object.entries(SEASONS).map(([k,v])=>`<button class="tab ${k===(sel||cur)?'on':''} ${k===cur?'now':''}" data-s="${k}">${v.ico} ${v.n}${k===cur?' · activa':' 🔒'}</button>`).join('');
 const k=sel||cur,bg=`linear-gradient(120deg,${s.c[0]},${s.c[1]})`,nd=m=>{const n=new Date(),y=new Date(n.getFullYear(),m,1)<=n?n.getFullYear()+1:n.getFullYear();return `${y}-${String(m+1).padStart(2,'0')}-01T00:00:00`},mo={spring:2,summer:5,autumn:8,winter:11};
 $('#seasonView').innerHTML=`${cur!=='summer'?`<button class="teaser" data-s="summer"><img src="verano.jpg" alt="Ilustración de verano"><span><b>El verano llega pronto</b><br>Se desbloquea en <span data-cd="${nd(5)}"></span></span></button>`:''}<div class="sale ${open?'':'locked'}" style="--bh:${k==='summer'?280:190}px"><div class="banner" style="background-image:${bg}"><h3>Ofertas de ${s.n}</h3><span>Hasta -${s.pct}%</span>${k==='summer'?'<img class="bimg" src="verano.jpg" alt="Ilustración de verano">':''}</div>${open?'':`<div class="lock"><i>🔒</i><b>Oferta de ${s.n} bloqueada</b><span>Se desbloquea en <span data-cd="${nd(mo[k])}"></span></span></div>`}<div class="row4">${s.ids.map(id=>tile(game(id),s.pct,'Oferta')).join('')}</div>${open?`<div style="padding:0 16px 16px"><button class="cta" data-pack="${cur}">Añadir las 6 ofertas al carrito</button></div>`:''}</div>`;
}
function renderFilters(){$('#filters').innerHTML=['Todos','En oferta','Gratis',...new Set(GAMES.map(g=>g.g))].map(g=>`<button class="chip ${g===filter?'on':''}" data-f="${g}">${g}</button>`).join('')+`<select id="sort" aria-label="Ordenar">${[['rel','Relevancia'],['pa','Precio: menor a mayor'],['pd','Precio: mayor a menor'],['az','Nombre A–Z'],['yr','Más recientes']].map(o=>`<option value="${o[0]}" ${o[0]===sort?'selected':''}>${o[1]}</option>`).join('')}</select>`}
function renderGrid(){
 const q=query.toLowerCase(),l=GAMES.filter(g=>(filter==='Todos'||(filter==='En oferta'?deal(g)>0:filter==='Gratis'?g.p===0:g.g===filter))&&g.t.toLowerCase().includes(q)).sort(SORTS[sort]);
 $('#grid').innerHTML=l.length?l.map(g=>tile(g,deal(g),g.yr>=2025?'Nuevo':'')).join(''):'<p>No hay juegos con ese nombre. Prueba otra búsqueda o cambia el género.</p>';
 $('#newRow').innerHTML=NEW.map(g=>tile(g,deal(g),'Nuevo')).join('');
 $('#freeRow').innerHTML=GAMES.filter(g=>g.p===0).map(g=>tile(g,0,'Gratis')).join('');
}
function renderAll(){tileN=0;renderFeat();renderSeasons();renderFilters();renderGrid();renderCart();renderRec()}
function renderRec(){let L=[];try{L=JSON.parse(localStorage.getItem('pf_lib'))||[]}catch(e){}const own=new Set(L.map(l=>l.id)),n={};L.forEach(l=>{const g=game(l.id);if(g)n[g.g]=(n[g.g]||0)+1});const top=Object.keys(n).sort((x,y)=>n[y]-n[x]).slice(0,2),r=GAMES.filter(g=>!own.has(g.id)&&!soon(g)&&top.includes(g.g)).slice(0,4);$('#recSec').hidden=!r.length;$('#recRow').innerHTML=r.map(g=>tile(g,deal(g),'Para ti')).join('')}
function save(){localStorage.setItem('pf_cart',JSON.stringify(cart));renderAll()}
function add(id){if(cart.includes(id))return toast('Ese juego ya está en tu carrito');cart.push(id);save();toast('Añadido al carrito')}
function renderCart(){
 $('#cartN').textContent=cart.length;
 $('#cartItems').innerHTML=cart.length?cart.map(id=>{const g=game(id);return `<div class="ci">${cover(g)}<div><b>${g.t}</b><br>${money(price(g))}</div><button class="x" data-r="${id}" aria-label="Quitar ${g.t}">✕</button></div>`}).join(''):'<p style="padding:14px 0">Tu carrito está vacío. Añade un juego de la tienda.</p>';
 $('#cartTotal').textContent=money(+(cart.reduce((s,id)=>s+price(game(id)),0)*(1-coupon/100)).toFixed(2));$('#buy').disabled=!cart.length;const ah=cart.reduce((s,id)=>s+game(id).p-price(game(id)),0);$('#sav').textContent=ah>0?`Ahorras ${money(ah)} con las ofertas`:'';
}
function showDrawer(){$('#drawer').hidden=false;$('#overlay').hidden=false}
function openModal(id){
 const g=game(id),yt='https://www.youtube.com/results?search_query=';
 $('#modal').dataset.id=id;
 $('#modal').innerHTML=`<div class="mw"><div class="pv"><div class="main" id="mainPv">${ytid((MEDIA[g.id]||{}).trailer)?`<iframe class="yt" src="https://www.youtube-nocookie.com/embed/${ytid(MEDIA[g.id].trailer)}" allowfullscreen title="Tráiler de ${g.t}"></iframe>`:cover(g,0)}</div><div class="thumbs">${[0,1,2].map(v=>`<span data-pv="${v}">${cover(g,v).replace('<svg','<svg class="'+(v?'':'on')+'"')}</span>`).join('')}</div></div><div class="info"><button class="x" data-close aria-label="Cerrar">✕</button><h3>${g.t}</h3><small>${g.dev} · ${g.yr} · ${g.g}</small><p>${g.d}</p>${soon(g)?`<p><b>Sale en <span data-cd="${UPCOMING[g.id]}"></span></b></p>`:''}${priceHtml(g)}${sound(g)}${stars(g)}<div class="btns"><button class="cta" data-a="${g.id}">Añadir al carrito</button><button class="ghost" data-mu="${g.id}">${Music.now===g.id?'■ Detener tema':'♪ Escuchar tema'}</button><button class="ghost" data-w="${g.id}">${Profile.wished(g.id)?'💖 En deseos':'🤍 Lista de deseos'}</button></div><div class="btns"><a href="${yt}${encodeURIComponent(g.t+' official trailer')}" target="_blank" rel="noopener">Ver tráiler oficial</a><a href="${yt}${encodeURIComponent(g.t+' main theme OST')}" target="_blank" rel="noopener">Banda sonora oficial</a></div></div></div>`;
 $('#modal').hidden=false;$('#overlay').hidden=false;
}
function closeAll(){$('#modal').hidden=true;$('#drawer').hidden=true;$('#overlay').hidden=true}
document.addEventListener('click',e=>{
 const b=e.target.closest('button,[data-pv],[data-v]');if(!b)return;
 const d=b.dataset;
 if(d.close!==undefined)closeAll();
 else if(d.a){add(d.a)}
 else if(d.fi!==undefined){fi=+d.fi;renderFeat()}
 else if(d.s){sel=d.s;renderSeasons()}
 else if(d.f){filter=d.f;renderFilters();renderGrid()}
 else if(d.r){cart=cart.filter(x=>x!==d.r);save()}
 else if(d.pack){SEASONS[d.pack].ids.forEach(id=>{if(!cart.includes(id))cart.push(id)});save();showDrawer()}
 else if(d.mu){const g=game(d.mu);Music.now===g.id?Music.stop():Music.play(g);b.textContent=Music.now===g.id?'■ Detener tema':'♪ Escuchar tema'}
 else if(d.pv!==undefined){const g=game($('#modal').dataset.id);$('#mainPv').innerHTML=cover(g,+d.pv);document.querySelectorAll('.thumbs svg').forEach((s,i)=>s.classList.toggle('on',i==d.pv))}
 else if(d.cup!==undefined){const c=CODES[$('#cup').value.trim().toUpperCase()];coupon=c||0;renderCart();toast(c?`Cupón aplicado: -${c}%`:'Cupón no válido')}
 else if(d.rate){RT[$('#modal').dataset.id]=+d.rate;localStorage.setItem('pf_rate',JSON.stringify(RT));openModal($('#modal').dataset.id)}
 else if(d.v)openModal(d.v);
});
$('#cartBtn').onclick=showDrawer;$('#overlay').onclick=closeAll;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll()});
document.addEventListener('change',e=>{if(e.target.id==='sort'){sort=e.target.value;renderGrid()}});
$('#q').oninput=e=>{query=e.target.value;renderGrid()};
$('#buy').onclick=()=>Profile.checkout();
setInterval(()=>{if(!document.hidden&&$('#modal').hidden){fi=(fi+1)%FEAT.length;renderFeat()}},7000);
renderAll();
Profile.init();Friends.init();
