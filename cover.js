function cover(g,v=0){
 const[a,b]=g.c,w=g.t.split(' '),mid=Math.ceil(w.length/2),l1=w.slice(0,mid).join(' '),l2=w.slice(mid).join(' ');
 const sh=[['M0 300 L90 220 L170 290 L250 200 L300 280 V400 H0Z','M0 340 L120 270 L220 330 L300 290 V400 H0Z'],['M0 320 Q75 260 150 320 T300 300 V400 H0Z','M0 360 Q75 310 150 360 T300 340 V400 H0Z'],['M0 280 L60 240 L130 300 L220 230 L300 300 V400 H0Z','M0 350 L100 300 L200 350 L300 310 V400 H0Z']][v%3];
 let deco='';const mo=g.m;
 if(mo==='snow')for(let i=0;i<22;i++)deco+=`<circle cx="${(i*47+v*31)%300}" cy="${(i*83)%260}" r="${2+i%3}" fill="#fff" opacity=".8"/>`;
 if(mo==='moon')deco+=`<circle cx="${210-v*40}" cy="90" r="38" fill="#fff" opacity=".85"/><circle cx="${224-v*40}" cy="82" r="34" fill="${a}"/>`;
 else deco+=`<circle cx="${150+v*50-50}" cy="${mo==='sun'?150:110}" r="${mo==='sun'?60:44}" fill="#fff" opacity=".55"/>`;
 if(mo==='leaf')for(let i=0;i<8;i++)deco+=`<ellipse cx="${30+i*38}" cy="${120+(i*53)%120}" rx="9" ry="4" fill="#fff" opacity=".55" transform="rotate(${i*35} ${30+i*38} ${120+(i*53)%120})"/>`;
 const id='g'+g.id+v;
 return `<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Portada de ${g.t}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="300" height="400" fill="url(#${id})"/>${deco}<path d="${sh[0]}" fill="#fff" opacity=".35"/><path d="${sh[1]}" fill="#2b3a55" opacity=".55"/><text x="150" y="${l2?60:75}" text-anchor="middle" font-family="Poppins,Trebuchet MS,sans-serif" font-weight="800" font-size="25" fill="#2b3a55">${l1}</text>${l2?`<text x="150" y="92" text-anchor="middle" font-family="Poppins,Trebuchet MS,sans-serif" font-weight="800" font-size="25" fill="#2b3a55">${l2}</text>`:''}<image href="${(MEDIA[g.id]||{}).caratula||g.id+'.jpg'}" width="300" height="400" preserveAspectRatio="xMidYMid slice"/></svg>`;
}
