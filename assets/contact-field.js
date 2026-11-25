// Original communication orbits: the same geometry renders on the server and in the browser.
const TAU=Math.PI*2, CENTER={x:970,y:285};
const colors=['#8ee9ef','#98bdf2','#b3a0eb'];
const f=value=>value.toFixed(2);

function orbitPoint(angle,band,time,point,strength){
  const radius=170+band*11,turn=-.64+band*.15+Math.sin(time*.00012)*.07;
  const x=Math.cos(angle)*radius,y=Math.sin(angle)*(76+band*5);
  let px=CENTER.x+x*Math.cos(turn)-y*Math.sin(turn),py=CENTER.y+x*Math.sin(turn)+y*Math.cos(turn);
  const influence=Math.exp(-((px-point.x)**2+(py-point.y)**2)/38000)*strength;
  px+=(point.x-px)*.09*influence;py+=(point.y-py)*.09*influence;
  px+=(point.x-CENTER.x)*strength*.025;py+=(point.y-CENTER.y)*strength*.025;
  return {x:px,y:py};
}
const pathOf=points=>points.map((p,i)=>`${i?'L':'M'}${f(p.x)} ${f(p.y)}`).join('');
export function contactFrame(time=0,point=CENTER,strength=0){
  const paths=Array.from({length:12},(_,band)=>pathOf(Array.from({length:97},(_,i)=>orbitPoint(i/96*TAU,band,time,point,strength))));
  const particles=Array.from({length:36},(_,i)=>{
    const angle=i*2.39996+time*(.00008+(i%5)*.000013);
    return {...orbitPoint(angle,i%12,time,point,strength),r:i%3===0?2.5:1.6,opacity:.5+.3*Math.sin(angle)**2};
  });
  // Remote endpoints exchange small light packets with the orbital hub.
  const routes=Array.from({length:7},(_,i)=>{
    const angle=-2.7+i*.82,radius=265+(i%3)*28;
    const end={x:CENTER.x+Math.cos(angle)*radius,y:CENTER.y+Math.sin(angle)*radius*.66};
    const start=orbitPoint(angle,i+2,time,point,strength);
    const bend={x:(start.x+end.x)/2+Math.sin(angle)*44,y:(start.y+end.y)/2-Math.cos(angle)*44};
    const u=(time*.00011+i*.137)%1;
    const packet={x:(1-u)**2*start.x+2*u*(1-u)*bend.x+u*u*end.x,y:(1-u)**2*start.y+2*u*(1-u)*bend.y+u*u*end.y};
    return {d:`M${f(start.x)} ${f(start.y)}Q${f(bend.x)} ${f(bend.y)} ${f(end.x)} ${f(end.y)}`,end,packet,opacity:Math.sin(u*Math.PI)*.85};
  });
  return {paths,particles,routes};
}

export function createContactSvg(){
  const frame=contactFrame();
  const dust=Array.from({length:60},(_,i)=>{
    const x=540+(Math.sin(i*127.1)*43758.5453%1+1)%1*810,y=40+(Math.sin(i*311.7)*19341.171%1+1)%1*460;
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${i%7===0?1.3:.7}" fill="#8ab8d3" opacity="${i%7===0?.36:.15}"/>`;
  }).join('');
  return `<svg viewBox="0 0 1400 570" width="1400" height="570" focusable="false"><defs><radialGradient id="contact-aura"><stop stop-color="#578dc9" stop-opacity=".15"/><stop offset=".45" stop-color="#3d6a91" stop-opacity=".08"/><stop offset="1" stop-color="#080b10" stop-opacity="0"/></radialGradient><radialGradient id="contact-pointer-glow"><stop stop-color="#9eeef4" stop-opacity=".17"/><stop offset="1" stop-color="#a0c6ed" stop-opacity="0"/></radialGradient><linearGradient id="contact-spectrum" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#63aabc" stop-opacity=".35"/><stop offset=".36" stop-color="#a7eef0"/><stop offset=".7" stop-color="#9795d9"/><stop offset="1" stop-color="#5d77a7" stop-opacity=".3"/></linearGradient></defs><ellipse cx="970" cy="285" rx="365" ry="265" fill="url(#contact-aura)"/>${dust}<g fill="none" stroke="url(#contact-spectrum)" stroke-width=".85">${frame.paths.map((d,i)=>`<path data-contact-orbit="${i}" d="${d}" opacity="${i%3===0?.65:.28}"/>`).join('')}</g><g fill="none" stroke="#86bccf" stroke-width=".8">${frame.routes.map(r=>`<path data-contact-route="" d="${r.d}" opacity=".3"/>`).join('')}</g><g>${frame.routes.map((r,i)=>`<g><circle cx="${f(r.end.x)}" cy="${f(r.end.y)}" r="6" fill="none" stroke="${colors[i%3]}" stroke-width=".7" opacity=".45"/><circle cx="${f(r.end.x)}" cy="${f(r.end.y)}" r="2" fill="${colors[i%3]}" opacity=".7"/><circle data-contact-packet="" cx="${f(r.packet.x)}" cy="${f(r.packet.y)}" r="2" fill="${colors[i%3]}" opacity="${f(r.opacity)}"/></g>`).join('')}</g><g>${frame.particles.map((p,i)=>`<g data-contact-particle="" transform="translate(${f(p.x)} ${f(p.y)})" opacity="${f(p.opacity)}"><circle r="8" fill="${colors[i%3]}" opacity=".08"/><circle r="${p.r}" fill="${colors[i%3]}"/></g>`).join('')}</g><circle class="contact-pointer-light" r="160" fill="url(#contact-pointer-glow)" opacity="0"/><circle class="contact-pulse" r="0" fill="none" stroke="#b4eef5" stroke-width="1.2" opacity="0"/></svg>`;
}

export function mountContact(hero){
  const svg=hero.querySelector('svg'),orbits=[...hero.querySelectorAll('[data-contact-orbit]')],particles=[...hero.querySelectorAll('[data-contact-particle]')],routes=[...hero.querySelectorAll('[data-contact-route]')],packets=[...hero.querySelectorAll('[data-contact-packet]')];
  const light=hero.querySelector('.contact-pointer-light'),ring=hero.querySelector('.contact-pulse');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let target={...CENTER},point={...CENTER},active=false,strength=0,frame=0,last=0,elapsed=0,pulseAt=-Infinity,pulsePoint={...CENTER};
  const allowed=()=>!reduced.matches&&!document.hidden&&hero.dataset.motionState==='playing';
  const attr=(node,key,value)=>node.setAttribute(key,typeof value==='number'?f(value):value);
  function render(now){
    const data=contactFrame(elapsed,point,strength);
    data.paths.forEach((d,i)=>attr(orbits[i],'d',d));
    data.particles.forEach((p,i)=>{attr(particles[i],'transform',`translate(${f(p.x)} ${f(p.y)})`);attr(particles[i],'opacity',p.opacity);});
    data.routes.forEach((r,i)=>{attr(routes[i],'d',r.d);attr(packets[i],'cx',r.packet.x);attr(packets[i],'cy',r.packet.y);attr(packets[i],'opacity',r.opacity);});
    attr(light,'cx',point.x);attr(light,'cy',point.y);attr(light,'opacity',strength*.7);
    const age=(now-pulseAt)/1800,pulse=age>=0&&age<1?Math.sin(age*Math.PI):0;
    attr(ring,'cx',pulsePoint.x);attr(ring,'cy',pulsePoint.y);attr(ring,'r',Math.max(0,Math.min(1,age))*280);attr(ring,'opacity',pulse*(1-Math.min(1,age))*.6);
  }
  function tick(now){
    frame=0;if(!allowed())return;
    if(now-last<40){frame=requestAnimationFrame(tick);return;}
    elapsed+=last?Math.min(80,now-last):40;last=now;
    point.x+=(target.x-point.x)*.12;point.y+=(target.y-point.y)*.12;strength+=((active?1:0)-strength)*.1;
    render(now);frame=requestAnimationFrame(tick);
  }
  const start=()=>{if(allowed()&&!frame)frame=requestAnimationFrame(tick);};
  function locate(event){
    if(!allowed())return;
    const rect=svg.getBoundingClientRect(),scale=Math.min(rect.width/1400,rect.height/570);
    if(!scale)return;
    target={x:(event.clientX-rect.left-(rect.width-1400*scale)/2)/scale,y:(event.clientY-rect.top-(rect.height-570*scale)/2)/scale};
    active=true;hero.dataset.interacting='true';start();
  }
  const leave=()=>{active=false;hero.dataset.interacting='false';};
  hero.addEventListener('pointermove',locate,{passive:true});
  hero.addEventListener('pointerdown',event=>{if(!allowed()||event.target.closest('a,button'))return;locate(event);pulsePoint={...target};pulseAt=performance.now();start();},{passive:true});
  hero.addEventListener('pointerleave',leave,{passive:true});hero.addEventListener('pointercancel',leave,{passive:true});
  hero.addEventListener('pointerup',event=>{if(event.pointerType!=='mouse')leave();},{passive:true});
  function sync(){
    if(allowed()){start();return;}
    cancelAnimationFrame(frame);frame=0;last=0;active=false;strength=0;pulseAt=-Infinity;hero.dataset.interacting='false';render(0);
  }
  new MutationObserver(sync).observe(hero,{attributes:true,attributeFilter:['data-motion-state']});
  reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  hero.dataset.interactionReady='true';sync();
}
if(typeof document!=='undefined')document.querySelectorAll('[data-contact-field]').forEach(mountContact);
