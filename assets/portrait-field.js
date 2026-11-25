import {portraitPoints,portraitEdges} from './portrait-data.js?v=front-blue-20261124';

// A photograph-derived relief, not a full 3D reconstruction. Keep rotation modest to preserve likeness.
export function portraitFrame(time=0,pointer={x:0,y:0},power=0,pulse=0){
  const yaw=Math.sin(time*.0002)*.025+pointer.x*power*.18,pitch=pointer.y*power*.09;
  return portraitPoints.map((p,i)=>{
    const x=p.x-300,y=p.y-350,z=p.z-40;
    const xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=-x*Math.sin(yaw)+z*Math.cos(yaw);
    const yy=y*Math.cos(pitch)-zz*Math.sin(pitch),depth=y*Math.sin(pitch)+zz*Math.cos(pitch),perspective=1+depth/2300;
    const sweep=Math.pow((1+Math.sin(p.y*.013-time*.0011))/2,18);
    const fade=Math.min(1,Math.max(0,(780-p.y)/125),Math.max(0,p.x/42),Math.max(0,(600-p.x)/42));
    const light=Math.min(1,(.15+Math.pow(p.light,.7)*.85+sweep*.12+pulse*.12)*fade);
    return {x:300+xx*perspective,y:350+yy*perspective,light,r:1.35+p.light*.9+sweep*.15};
  });
}
function paths(frame){
  const dots=Array.from({length:16},()=>[]),lines=Array.from({length:8},()=>[]);
  frame.forEach(p=>dots[Math.min(15,Math.floor(p.light*15))].push(`M${p.x.toFixed(1)} ${p.y.toFixed(1)}h.01`));
  portraitEdges.forEach(([a,b],i)=>{
    // Air between the triangulated strands keeps eyes, lips and hair legible.
    if(i%5>1)return;
    const p=frame[a],q=frame[b],shade=Math.min(7,Math.floor((p.light+q.light)*3.5));
    lines[shade].push(`M${p.x.toFixed(1)} ${p.y.toFixed(1)}L${q.x.toFixed(1)} ${q.y.toFixed(1)}`);
  });
  return {dots:dots.map(x=>x.join('')),lines:lines.map(x=>x.join(''))};
}
export function createPortraitSvg(){
  const {dots,lines}=paths(portraitFrame());
  return `<svg viewBox="0 0 600 780" width="600" height="780" focusable="false" aria-hidden="true"><g fill="none" stroke="#358ee6" stroke-width=".85">${lines.map((d,i)=>`<path d="${d}" opacity="${(.045+i*.06).toFixed(3)}"/>`).join('')}</g><g fill="none" stroke="#65b6ff" stroke-linecap="round">${dots.map((d,i)=>`<path d="${d}" stroke-width="${(2.7+i*.11).toFixed(2)}" opacity="${(.055+i*.062).toFixed(3)}"/>`).join('')}</g></svg>`;
}

export function mountPortrait(figure){
  const canvas=figure.querySelector('canvas'),context=canvas.getContext('2d');
  if(!context)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let width=600,height=780,frame=0,last=0,elapsed=0,power=0,active=false,target={x:0,y:0},pointer={x:0,y:0},pulseAt=-Infinity;
  const allowed=()=>!reduced.matches&&!document.hidden&&figure.dataset.motionState==='playing';
  function render(now){
    const pulseAge=(now-pulseAt)/1600,pulse=pulseAge>=0&&pulseAge<1?Math.sin(pulseAge*Math.PI):0;
    const points=portraitFrame(elapsed,pointer,power,pulse);
    context.clearRect(0,0,width,height);
    context.save();context.scale(width/600,height/780);
    const lineGroups=Array.from({length:8},()=>[]),dotGroups=Array.from({length:16},()=>[]);
    points.forEach(p=>dotGroups[Math.min(15,Math.floor(p.light*15))].push(p));
    portraitEdges.forEach(([a,b],i)=>{if(i%5>1)return;const p=points[a],q=points[b];lineGroups[Math.min(7,Math.floor((p.light+q.light)*3.5))].push([p,q]);});
    context.strokeStyle='#358ee6';context.lineWidth=.85;
    lineGroups.forEach((group,i)=>{context.globalAlpha=.045+i*.06;context.beginPath();group.forEach(([p,q])=>{context.moveTo(p.x,p.y);context.lineTo(q.x,q.y);});context.stroke();});
    context.fillStyle='#65b6ff';
    dotGroups.forEach((group,i)=>{context.globalAlpha=.055+i*.062;context.beginPath();group.forEach(p=>{context.moveTo(p.x+p.r,p.y);context.arc(p.x,p.y,p.r,0,Math.PI*2);});context.fill();});
    context.restore();
  }
  function resize(){
    const rect=figure.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,2);
    width=Math.max(1,Math.round(rect.width*ratio));height=Math.round(width*1.3);
    canvas.width=width;canvas.height=height;render(0);
  }
  function tick(now){
    frame=0;if(!allowed())return;
    if(now-last<40){frame=requestAnimationFrame(tick);return;}
    elapsed+=last?Math.min(80,now-last):40;last=now;
    pointer.x+=(target.x-pointer.x)*.1;pointer.y+=(target.y-pointer.y)*.1;power+=((active?1:0)-power)*.1;
    render(now);frame=requestAnimationFrame(tick);
  }
  const start=()=>{if(allowed()&&!frame)frame=requestAnimationFrame(tick);};
  function move(event){
    if(!allowed())return;
    const rect=figure.getBoundingClientRect();
    target={x:Math.max(-1,Math.min(1,(event.clientX-rect.left)/rect.width*2-1)),y:Math.max(-1,Math.min(1,(event.clientY-rect.top)/rect.height*2-1))};
    active=true;figure.dataset.interacting='true';start();
  }
  const leave=()=>{active=false;figure.dataset.interacting='false';};
  figure.addEventListener('pointermove',move,{passive:true});
  figure.addEventListener('pointerdown',event=>{if(!allowed())return;move(event);pulseAt=performance.now();},{passive:true});
  figure.addEventListener('pointerleave',leave,{passive:true});figure.addEventListener('pointercancel',leave,{passive:true});
  figure.addEventListener('pointerup',event=>{if(event.pointerType!=='mouse')leave();},{passive:true});
  function sync(){
    if(allowed()){start();return;}
    cancelAnimationFrame(frame);frame=0;last=0;active=false;power=0;pulseAt=-Infinity;figure.dataset.interacting='false';render(0);
  }
  new MutationObserver(sync).observe(figure,{attributes:true,attributeFilter:['data-motion-state']});
  new ResizeObserver(resize).observe(figure);
  reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  resize();figure.dataset.portraitReady='true';sync();
}
if(typeof document!=='undefined')document.querySelectorAll('[data-portrait]').forEach(mountPortrait);
