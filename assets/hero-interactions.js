// Decorative pointer responses; the original content and CSS idle motion stay fixed.
// Original 3D network geometry: decorative connections, not research measurements.
const networkPoints=Array.from({length:104},(_,i)=>{
  const y=1-2*(i+.5)/104,r=Math.sqrt(1-y*y),angle=i*2.399963229728653;
  return {x:Math.cos(angle)*r,y,z:Math.sin(angle)*r,color:i%5===0?'#bea9f6':i%7===0?'#b7e7ed':'#78dce9'};
});
const networkEdges=[];
for(let i=0;i<networkPoints.length;i++){
  const a=networkPoints[i];
  const nearest=networkPoints.map((b,j)=>({j,d:(a.x-b.x)**2+(a.y-b.y)**2+(a.z-b.z)**2})).filter(p=>p.j!==i).sort((a,b)=>a.d-b.d).slice(0,5);
  for(const {j} of nearest)if(!networkEdges.some(e=>e[0]===j&&e[1]===i))networkEdges.push([i,j]);
}
export function networkFrame(time=0,point={x:940,y:325},strength=0,pulse=0){
  const nx=Math.max(-1,Math.min(1,(point.x-940)/450))*strength,ny=Math.max(-1,Math.min(1,(point.y-325)/325))*strength;
  const yaw=time*.000065+nx*.32,tilt=-.22+ny*.24;
  const nodes=networkPoints.map((p,i)=>{
    const breath=1+Math.sin(time*.0006+i*.35)*.025;
    const x=p.x*Math.cos(yaw)+p.z*Math.sin(yaw),z=-p.x*Math.sin(yaw)+p.z*Math.cos(yaw);
    const y=p.y*Math.cos(tilt)-z*Math.sin(tilt),depth=p.y*Math.sin(tilt)+z*Math.cos(tilt),perspective=1+depth*.16;
    let px=940+x*245*perspective*breath,py=325+y*245*perspective*breath;
    const dx=point.x-px,dy=point.y-py,near=Math.exp(-(dx*dx+dy*dy)/47000)*strength;
    px+=dx*.13*near+x*pulse*18;py+=dy*.13*near+y*pulse*18;
    return {x:px,y:py,z:depth,opacity:.24+(depth+1)*.32,r:1.5+(depth+1)*1.2+near*1.7,color:p.color,glow:(.06+(depth+1)*.08+near*.2)*(1+pulse)};
  });
  const edges=networkEdges.map(([a,b],i)=>({a,b,opacity:.055+((nodes[a].z+nodes[b].z+2)/4)*.27+Math.pow((1+Math.sin(time*.0016-i*.38))/2,9)*.22+pulse*.12}));
  return {nodes,edges};
}
export function createResearchSvg(){
  const frame=networkFrame(),f=n=>n.toFixed(2);
  return `<svg viewBox="0 0 1400 650" width="1400" height="650" focusable="false"><defs><radialGradient id="network-aura"><stop stop-color="#5297bf" stop-opacity=".13"/><stop offset=".6" stop-color="#555c9f" stop-opacity=".06"/><stop offset="1" stop-color="#080b10" stop-opacity="0"/></radialGradient><radialGradient id="network-light"><stop stop-color="#a2ecf5" stop-opacity=".36"/><stop offset="1" stop-color="#a2ecf5" stop-opacity="0"/></radialGradient><linearGradient id="network-orbit"><stop stop-color="#7bdbeb" stop-opacity="0"/><stop offset=".5" stop-color="#7bdbeb" stop-opacity=".38"/><stop offset="1" stop-color="#b8a0ed" stop-opacity=".1"/></linearGradient><filter id="network-soft"><feGaussianBlur stdDeviation="4"/></filter></defs><ellipse cx="940" cy="325" rx="420" ry="320" fill="url(#network-aura)"/><g transform="translate(940 325)"><g class="network-orbits" fill="none" stroke="url(#network-orbit)" stroke-width="1"><ellipse rx="335" ry="116" transform="rotate(-24)"/><ellipse rx="320" ry="98" transform="rotate(52)"/><ellipse rx="290" ry="125" transform="rotate(105)"/></g></g><g stroke="#82c9dd" stroke-width=".9" fill="none">${frame.edges.map(({a,b,opacity})=>`<line data-network-edge="" x1="${f(frame.nodes[a].x)}" y1="${f(frame.nodes[a].y)}" x2="${f(frame.nodes[b].x)}" y2="${f(frame.nodes[b].y)}" opacity="${f(opacity)}"/>`).join('')}</g><g filter="url(#network-soft)">${frame.nodes.map(n=>`<circle data-network-glow="" cx="${f(n.x)}" cy="${f(n.y)}" r="12" fill="${n.color}" opacity="${f(n.glow)}"/>`).join('')}</g><g>${frame.nodes.map(n=>`<circle data-network-node="" cx="${f(n.x)}" cy="${f(n.y)}" r="${f(n.r)}" fill="${n.color}" opacity="${f(n.opacity)}"/>`).join('')}</g><circle class="hero-pointer-light" r="150" fill="url(#network-light)" opacity="0"/><circle class="hero-pointer-ring" r="0" fill="none" stroke="#b8cbff" stroke-width="1" opacity="0"/></svg>`;
}

export function scenePoint(clientX, clientY, rect, width, height) {
  const scale=Math.min(rect.width/width,rect.height/height);
  if(!scale)return {x:width/2,y:height/2};
  return {x:(clientX-rect.left-(rect.width-width*scale)/2)/scale,y:(clientY-rect.top-(rect.height-height*scale)/2)/scale};
}
export function characterPose(point, center, strength, jump) {
  const dx=point.x-center.x,dy=point.y-center.y;
  const near=Math.exp(-(dx*dx+dy*dy)/65000)*strength;
  return {x:dx*.055*near,y:-18*near-jump*36*near,angle:Math.max(-11,Math.min(11,dx*.065))*near};
}
export function mountHero(hero) {
  const svg=hero.querySelector('svg');
  if(!svg)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const cast=[...hero.querySelectorAll('.playground-response')].map(node=>({node,x:+node.dataset.centerX,y:+node.dataset.centerY,px:+node.dataset.pivotX,py:+node.dataset.pivotY}));
  const galaxy=hero.querySelector('.galaxy-response');
  const home=hero.querySelector('.home-art-response');
  const networkNodes=[...hero.querySelectorAll('[data-network-node]')],networkLines=[...hero.querySelectorAll('[data-network-edge]')],networkGlows=[...hero.querySelectorAll('[data-network-glow]')];
  const light=hero.querySelector('.hero-pointer-light'),ring=hero.querySelector('.hero-pointer-ring');
  const box=svg.viewBox.baseVal;
  let target={x:box.width/2,y:box.height/2},point={...target},strength=0,active=false,frame=0,last=0,elapsed=0,pulseAt=-Infinity,pulsePoint={...target};
  const allowed=()=>!reduced.matches&&!document.hidden&&hero.dataset.motionState==='playing';
  const attr=(node,name,value)=>node?.setAttribute(name,String(value));
  const f=value=>value.toFixed(2);
  function render(now) {
    const age=(now-pulseAt)/1100,pulse=age>=0&&age<1?Math.sin(age*Math.PI):0;
    for(const item of cast){
      const pose=characterPose(point,item,strength,pulse);
      attr(item.node,'transform',`translate(${f(pose.x)} ${f(pose.y)}) rotate(${f(pose.angle)} ${item.px} ${item.py})`);
    }
    if(galaxy){
      const x=Math.max(-1,Math.min(1,(point.x-700)/700))*strength,y=Math.max(-1,Math.min(1,(point.y-325)/325))*strength;
      attr(galaxy,'transform',`translate(${f(x*25)} ${f(y*16)}) rotate(${f(x*8)} 950 325)`);
    }
    if(home){
      const x=Math.max(-1,Math.min(1,(point.x-700)/700))*strength,y=Math.max(-1,Math.min(1,(point.y-325)/325))*strength;
      home.style.transform=`translate3d(${f(x*24)}px,${f(y*18)}px,0) scale(1.035)`;
    }
    if(networkNodes.length){
      const data=networkFrame(elapsed,point,strength,pulse);
      data.nodes.forEach((n,i)=>{
        for(const node of [networkNodes[i],networkGlows[i]]){attr(node,'cx',f(n.x));attr(node,'cy',f(n.y));}
        attr(networkNodes[i],'r',f(n.r));attr(networkNodes[i],'opacity',f(n.opacity));attr(networkGlows[i],'opacity',f(n.glow));
      });
      data.edges.forEach(({a,b,opacity},i)=>{
        attr(networkLines[i],'x1',f(data.nodes[a].x));attr(networkLines[i],'y1',f(data.nodes[a].y));
        attr(networkLines[i],'x2',f(data.nodes[b].x));attr(networkLines[i],'y2',f(data.nodes[b].y));attr(networkLines[i],'opacity',f(opacity));
      });
    }
    attr(light,'cx',f(point.x));attr(light,'cy',f(point.y));attr(light,'opacity',f(strength*.55));
    attr(ring,'cx',f(pulsePoint.x));attr(ring,'cy',f(pulsePoint.y));
    attr(ring,'r',f(Math.max(0,Math.min(1,age))*230));attr(ring,'opacity',f(pulse?pulse*(1-age)*.65:0));
  }
  function tick(now){
    frame=0;
    if(!allowed())return;
    if(now-last<32){frame=requestAnimationFrame(tick);return;}
    elapsed+=last?Math.min(64,now-last):32;last=now;
    point.x+=(target.x-point.x)*.16;point.y+=(target.y-point.y)*.16;
    const targetStrength=active?1:0;
    strength+=(targetStrength-strength)*.13;
    if(Math.abs(targetStrength-strength)<.002)strength=targetStrength;
    render(now);
    if(networkNodes.length||Math.abs(target.x-point.x)+Math.abs(target.y-point.y)>.1||strength!==targetStrength||now-pulseAt<1100)frame=requestAnimationFrame(tick);
  }
  function start(){if(allowed()&&!frame)frame=requestAnimationFrame(tick);}
  function locate(event){
    if(!allowed())return;
    target=scenePoint(event.clientX,event.clientY,svg.getBoundingClientRect(),box.width,box.height);
    active=true;hero.dataset.interacting='true';start();
  }
  function leave(){active=false;hero.dataset.interacting='false';start();}
  hero.addEventListener('pointermove',locate,{passive:true});
  hero.addEventListener('pointerdown',event=>{
    if(!allowed()||event.target.closest('a,button'))return;
    locate(event);pulseAt=performance.now();pulsePoint={...target};start();
  },{passive:true});
  hero.addEventListener('pointerleave',leave,{passive:true});
  hero.addEventListener('pointercancel',leave,{passive:true});
  hero.addEventListener('pointerup',event=>{if(event.pointerType!=='mouse')leave();},{passive:true});
  function sync(){
    if(allowed()){start();return;}
    cancelAnimationFrame(frame);frame=0;last=0;active=false;strength=0;pulseAt=-Infinity;
    hero.dataset.interacting='false';render(0);
  }
  new MutationObserver(sync).observe(hero,{attributes:true,attributeFilter:['data-motion-state']});
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',sync);
  hero.dataset.interactionReady='true';sync();
}
if(typeof document!=='undefined')document.querySelectorAll('[data-hero-interaction]').forEach(mountHero);
