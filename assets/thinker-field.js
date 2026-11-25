// Original procedural seated figure: connected points, not a scanned sculpture or portrait.
// Geometry is shared by the static build and the browser, with no rendering dependencies.
const nodes=[],edges=[];
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const mul=(a,s)=>a.map(v=>v*s);
const unit=a=>mul(a,1/(Math.hypot(...a)||1));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function mesh(rings,part){
  const base=nodes.length,n=rings[0].length;
  rings.forEach((ring,i)=>ring.forEach((position,j)=>{
    const index=nodes.length;nodes.push({position,part});
    edges.push([index,base+i*n+(j+1)%n]);
    if(i){edges.push([index,index-n]);edges.push([index,base+(i-1)*n+(j+(i%2?1:n-1))%n]);}
  }));
}
function tube(points,radii,part,around=10){
  const rings=points.map((center,i)=>{
    const tangent=unit(sub(points[Math.min(i+1,points.length-1)],points[Math.max(0,i-1)]));
    const side=unit(cross(tangent,Math.abs(tangent[2])<.9?[0,0,1]:[0,1,0])),depth=cross(tangent,side);
    const [rx,rz]=Array.isArray(radii[i])?radii[i]:[radii[i],radii[i]];
    return Array.from({length:around},(_,j)=>{
      const angle=2*Math.PI*(j+(i%2)*.16)/around;
      return add(center,add(mul(side,rx*Math.cos(angle)),mul(depth,rz*Math.sin(angle))));
    });
  });
  mesh(rings,part);
}
function limb(a,b,r1,r2,part){
  const points=Array.from({length:6},(_,i)=>add(a,mul(sub(b,a),i/5)));
  tube(points,points.map((_,i)=>(r1+(r2-r1)*i/5)*(1+.12*Math.sin(Math.PI*i/5))),part,9);
}
function horizontalRings(spec,part,around=14){
  mesh(spec.map(([x,y,z,rx,rz],i)=>Array.from({length:around},(_,j)=>{
    const angle=2*Math.PI*(j+(i%2)*.14)/around;
    return [x+rx*Math.cos(angle),y,z+rz*Math.sin(angle)];
  })),part);
}

// Low, faceted seat behind the body, deliberately subordinate to the human outline.
horizontalRings([[.12,-1.25,0,.34,.36],[.16,-1.02,0,.37,.39],[.18,-.75,0,.32,.36],[.16,-.49,0,.30,.33],[.07,-.27,0,.27,.29]],'seat',10);
// Back, abdomen, rib cage and shoulders follow a forward-leaning curve.
horizontalRings([[.02,-.25,0,.13,.18],[.015,-.16,0,.22,.28],[-.015,.02,0,.24,.29],[-.06,.20,0,.21,.27],[-.13,.37,0,.20,.29],[-.21,.54,0,.20,.32],[-.29,.69,0,.17,.32],[-.34,.79,0,.13,.23],[-.37,.85,0,.08,.12]],'torso');
limb([-.35,.78,0],[-.43,.99,0],.105,.105,'neck');
// A bowed head with a brow, nose, jaw and rounded cranium. Front is negative X.
const headSpec=[[-.53,.88,.08,.08],[-.56,.93,.14,.12],[-.56,1.00,.17,.15],[-.56,1.08,.20,.17],[-.55,1.16,.20,.18],[-.53,1.24,.18,.17],[-.50,1.31,.13,.13],[-.48,1.35,.065,.075],[-.48,1.365,.018,.025]];
mesh(headSpec.map(([x,y,rx,rz],i)=>Array.from({length:16},(_,j)=>{
  const angle=2*Math.PI*j/16,front=Math.max(0,-Math.cos(angle));
  const nose=i===3?.075:i===4?.025:0;
  return [x+rx*Math.cos(angle)-nose*Math.pow(front,16),y,rz*Math.sin(angle)];
})),'head');
// Far leg and relaxed arm are drawn behind the near side.
limb([.01,-.17,-.19],[-.61,-.40,-.28],.17,.135,'far-leg');
limb([-.61,-.40,-.28],[-.28,-1.12,-.29],.12,.065,'far-leg');
tube([[-.28,-1.11,-.29],[-.36,-1.22,-.29],[-.55,-1.25,-.30],[-.67,-1.25,-.30]],[.075,[.07,.10],[.045,.10],.018],'far-leg',9);
limb([-.28,.66,-.29],[-.15,.06,-.38],.115,.09,'far-arm');
limb([-.15,.06,-.38],[-.55,-.31,-.35],.095,.065,'far-arm');
tube([[-.55,-.31,-.35],[-.65,-.38,-.34],[-.68,-.49,-.32]],[.065,.085,.045],'far-arm',9);
// Near thigh and shin provide the elbow's support, with the foot planted forward.
limb([.035,-.15,.19],[-.72,-.35,.24],.19,.145,'near-leg');
limb([-.72,-.35,.24],[-.64,-1.13,.27],.13,.07,'near-leg');
tube([[-.64,-1.11,.27],[-.69,-1.22,.27],[-.88,-1.25,.28],[-1.02,-1.25,.28]],[.075,[.07,.115],[.045,.12],.02],'near-leg',9);
// Shoulder -> elbow on thigh -> hand under chin: the unmistakable thinking gesture.
limb([-.29,.67,.30],[-.68,-.21,.28],.135,.095,'thinking-arm');
limb([-.68,-.21,.28],[-.73,.70,.20],.105,.065,'thinking-arm');
horizontalRings([[-.72,.68,.19,.045,.05],[-.73,.74,.18,.085,.07],[-.72,.82,.16,.085,.08],[-.67,.87,.13,.055,.06]],'hand',10);

const edgePart=edges.map(([a])=>nodes[a].part);
export const thinkerTopology={nodes:nodes.length,edges:edges.length};
export function thinkerFrame(time=0,point={x:960,y:320},strength=0,pulse=0){
  const nx=Math.max(-1,Math.min(1,(point.x-960)/360))*strength,ny=Math.max(-1,Math.min(1,(point.y-320)/320))*strength;
  const yaw=.46+Math.sin(time*.00018)*.055+nx*.24,tilt=-.035+ny*.07;
  const projected=nodes.map(({position,part},i)=>{
    let [x,y,z]=position;
    const body=part!=='seat',breath=body?Math.sin(time*.00065)*.008*Math.max(0,y+.2):0;
    y+=breath;
    const xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=-x*Math.sin(yaw)+z*Math.cos(yaw);
    const yy=y*Math.cos(tilt)-zz*Math.sin(tilt),depth=y*Math.sin(tilt)+zz*Math.cos(tilt);
    const scale=200*(1+depth*.07);
    let px=990+(xx+.20)*scale,py=320-yy*scale;
    const near=body?Math.exp(-((px-point.x)**2+(py-point.y)**2)/16000)*strength:0;
    px+=(point.x-px)*near*.035;py+=(point.y-py)*near*.035;
    const flow=body?Math.pow((1+Math.sin(time*.0011+y*3.2+x*.9))/2,12):0;
    const brightness=body?.34+Math.max(0,depth+.35)*.34+flow*.26+near*.3+pulse*.25:.075;
    return {x:px,y:py,r:body?1.05+Math.max(0,depth)*.6+near*.85+flow*.5:.8,opacity:Math.min(.95,brightness),part,flow};
  });
  // A few paths per depth/intensity band keep the moving mesh inexpensive to render.
  const paths=Array.from({length:8},()=>[]),f=n=>n.toFixed(1);
  edges.forEach(([a,b],i)=>{
    const p=projected[a],q=projected[b],seat=edgePart[i]==='seat';
    const band=seat?0:Math.max(1,Math.min(7,Math.floor((p.opacity+q.opacity)*3.7)));
    paths[band].push(`M${f(p.x)} ${f(p.y)}L${f(q.x)} ${f(q.y)}`);
  });
  return {nodes:projected,paths:paths.map(p=>p.join(''))};
}
export function createThinkerSvg(){
  const frame=thinkerFrame(),f=n=>n.toFixed(2);
  return `<svg viewBox="0 0 1400 650" width="1400" height="650" focusable="false"><defs><radialGradient id="thinker-aura"><stop stop-color="#346c91" stop-opacity=".16"/><stop offset=".55" stop-color="#264554" stop-opacity=".07"/><stop offset="1" stop-color="#080b10" stop-opacity="0"/></radialGradient><radialGradient id="thinker-pointer"><stop stop-color="#9be9f6" stop-opacity=".18"/><stop offset="1" stop-color="#7ab9ef" stop-opacity="0"/></radialGradient><linearGradient id="thinker-spectrum" x1=".1" y1="0" x2=".9" y2="1"><stop stop-color="#a8edee"/><stop offset=".52" stop-color="#69bfda"/><stop offset="1" stop-color="#9689cb"/></linearGradient></defs><ellipse cx="955" cy="320" rx="340" ry="315" fill="url(#thinker-aura)"/><g fill="none" stroke="#527a97" stroke-width=".7" opacity=".15"><ellipse cx="955" cy="588" rx="236" ry="34"/><ellipse cx="955" cy="588" rx="176" ry="22"/></g><g fill="none" stroke="url(#thinker-spectrum)" stroke-linejoin="round" stroke-linecap="round">${frame.paths.map((d,i)=>`<path data-thinker-lines="${i}" d="${d}" stroke-width="${i>5?1:.7}" opacity="${[.13,.14,.21,.28,.37,.47,.58,.7][i]}"/>`).join('')}</g><g fill="#b0e7ef">${frame.nodes.map(p=>`<circle data-thinker-node="" cx="${f(p.x)}" cy="${f(p.y)}" r="${f(p.r)}" opacity="${f(p.opacity)}"/>`).join('')}</g><circle class="thinker-pointer-light" r="150" fill="url(#thinker-pointer)" opacity="0"/><circle class="thinker-pulse" r="0" fill="none" stroke="#96dced" stroke-width="1" opacity="0"/></svg>`;
}

export function mountThinker(hero){
  const svg=hero.querySelector('svg'),points=[...hero.querySelectorAll('[data-thinker-node]')],paths=[...hero.querySelectorAll('[data-thinker-lines]')];
  const light=hero.querySelector('.thinker-pointer-light'),ring=hero.querySelector('.thinker-pulse');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let target={x:960,y:320},point={...target},active=false,strength=0,frame=0,last=0,elapsed=0,pulseAt=-Infinity,pulsePoint={...target};
  const allowed=()=>!reduced.matches&&!document.hidden&&hero.dataset.motionState==='playing';
  const attr=(node,key,value)=>node.setAttribute(key,typeof value==='number'?value.toFixed(2):value);
  function render(now){
    const age=(now-pulseAt)/1500,pulse=age>=0&&age<1?Math.sin(age*Math.PI):0;
    const data=thinkerFrame(elapsed,point,strength,pulse);
    data.nodes.forEach((p,i)=>{attr(points[i],'cx',p.x);attr(points[i],'cy',p.y);attr(points[i],'r',p.r);attr(points[i],'opacity',p.opacity);});
    data.paths.forEach((d,i)=>attr(paths[i],'d',d));
    attr(light,'cx',point.x);attr(light,'cy',point.y);attr(light,'opacity',strength*.55);
    attr(ring,'cx',pulsePoint.x);attr(ring,'cy',pulsePoint.y);attr(ring,'r',Math.max(0,Math.min(1,age))*245);attr(ring,'opacity',pulse*(1-Math.min(1,age))*.4);
  }
  function tick(now){
    frame=0;if(!allowed())return;
    if(now-last<40){frame=requestAnimationFrame(tick);return;}
    elapsed+=last?Math.min(80,now-last):40;last=now;
    point.x+=(target.x-point.x)*.12;point.y+=(target.y-point.y)*.12;
    strength+=((active?1:0)-strength)*.10;
    render(now);frame=requestAnimationFrame(tick);
  }
  const start=()=>{if(allowed()&&!frame)frame=requestAnimationFrame(tick);};
  function locate(event){
    if(!allowed())return;
    const rect=svg.getBoundingClientRect(),scale=Math.min(rect.width/1400,rect.height/650);
    if(!scale)return;
    target={x:(event.clientX-rect.left-(rect.width-1400*scale)/2)/scale,y:(event.clientY-rect.top-(rect.height-650*scale)/2)/scale};
    active=true;hero.dataset.interacting='true';start();
  }
  const leave=()=>{active=false;hero.dataset.interacting='false';};
  hero.addEventListener('pointermove',locate,{passive:true});
  hero.addEventListener('pointerdown',event=>{
    if(!allowed()||event.target.closest('a,button'))return;
    locate(event);pulsePoint={...target};pulseAt=performance.now();start();
  },{passive:true});
  hero.addEventListener('pointerleave',leave,{passive:true});hero.addEventListener('pointercancel',leave,{passive:true});
  hero.addEventListener('pointerup',event=>{if(event.pointerType!=='mouse')leave();},{passive:true});
  function sync(){
    if(allowed()){start();return;}
    cancelAnimationFrame(frame);frame=0;last=0;active=false;strength=0;pulseAt=-Infinity;
    hero.dataset.interacting='false';render(0);
  }
  new MutationObserver(sync).observe(hero,{attributes:true,attributeFilter:['data-motion-state']});
  reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  hero.dataset.interactionReady='true';sync();
}
if(typeof document!=='undefined')document.querySelectorAll('[data-thinker]').forEach(mountThinker);
