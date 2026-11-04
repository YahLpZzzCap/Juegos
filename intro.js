const Intro=(()=>{
 let raf,el,burst;
 const owned=()=>{try{return JSON.parse(localStorage.getItem('pf_lib')||'[]').some(l=>l.id==='gta6')}catch(e){return false}};
 function chime(){try{const c=new (window.AudioContext||window.webkitAudioContext)();[523.25,659.25,783.99,1046.5].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+i*.12;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.18,t+.03);g.gain.exponentialRampToValueAtTime(.001,t+1.3);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+1.4)})}catch(e){}}
 function loop(cv){
  const x=cv.getContext('2d'),W=cv.width=innerWidth,H=cv.height=innerHeight,hs=[330,200,160,260];
  const ps=Array.from({length:90},()=>({x:Math.random()*W,y:Math.random()*H,r:1+Math.random()*3,s:.2+Math.random()*.7,h:hs[Math.random()*4|0]}));let cf=[];
  const f=()=>{x.clearRect(0,0,W,H);ps.forEach(p=>{p.y-=p.s;p.x+=Math.sin(p.y/40)*.3;if(p.y<-10){p.y=H+10;p.x=Math.random()*W}x.globalAlpha=.75;x.fillStyle=`hsl(${p.h},80%,78%)`;x.shadowBlur=14;x.shadowColor=x.fillStyle;x.beginPath();x.arc(p.x,p.y,p.r,0,7);x.fill()});x.shadowBlur=0;cf.forEach(c=>{c.vy+=.12;c.x+=c.vx;c.y+=c.vy;c.a-=.006;x.globalAlpha=Math.max(c.a,0);x.fillStyle=c.c;x.fillRect(c.x,c.y,c.w,c.w*.5)});cf=cf.filter(c=>c.a>0);raf=requestAnimationFrame(f)};f();
  const cols=['#f4a3b8','#a89ee0','#8fd3c0','#f7ecaa','#6fa8c8'];
  burst=()=>{cf=Array.from({length:160},()=>({x:W/2,y:H/2,vx:(Math.random()-.5)*15,vy:-Math.random()*13-2,w:5+Math.random()*7,a:1.2,c:cols[Math.random()*5|0]}))};
 }
 function close(){cancelAnimationFrame(raf);if(el)el.remove();el=null;document.removeEventListener('keydown',esc);try{sessionStorage.setItem('pf_intro','1')}catch(e){}}
 const esc=e=>{if(e.key==='Escape')close()};
 function buy(){
  const a=$('#ia'),g=game('gta6');
  a.innerHTML='<div class="ring"></div><p>Procesando tu reserva…</p>';
  setTimeout(()=>{Profile.grant('gta6');chime();burst();a.innerHTML=`<svg class="chk" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" fill="none" stroke="#8fd3c0" stroke-width="3"/><path d="M14 27l8 8 16-17" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg><h3>¡Reservado!</h3><p>${g.t} ya está en tu biblioteca.</p><div class="btns" style="justify-content:center"><button class="cta" data-skip>Continuar</button><button class="ghost" data-prof>Ver mi perfil</button></div>`},1600);
 }
 function show(){
  const g=game('gta6');try{if(!g||!soon(g)||sessionStorage.getItem('pf_intro'))return}catch(e){return}
  el=document.createElement('div');el.className='intro';
  el.innerHTML=`<canvas></canvas><button class="skip" data-skip>Saltar ✕</button><div class="ic"><small class="i1">Rockstar Games presenta</small><h1 class="i2">GTA <span>VI</span></h1><p class="i3">Vice City · 19 de noviembre de 2026</p><p class="i3 big"><span data-cd="${UPCOMING.gta6}"></span></p><div class="ia i4" id="ia">${owned()?'<span class="done">✓ Ya lo tienes reservado</span>':`<button class="cta big" data-res>Reservar ahora · $${g.p.toFixed(2)} (estimado)</button>`}<button class="ghost" data-skip>Entrar a la tienda</button></div></div>`;
  document.body.appendChild(el);loop(el.querySelector('canvas'));
  el.addEventListener('click',e=>{const d=e.target.closest('button')?.dataset;if(!d)return;if(d.skip!==undefined)close();else if(d.res!==undefined)buy();else if(d.prof!==undefined){close();location.hash='#perfil'}});
  document.addEventListener('keydown',esc);
 }
 return{show};
})();
