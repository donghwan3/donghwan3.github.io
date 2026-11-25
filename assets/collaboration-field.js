const TAU=Math.PI*2;
const bands=3, strands=9;

export function fieldPoint(u,band,strand,time,pointer={x:700,y:340,power:0}) {
  const envelope=Math.sin(Math.PI*u);
  const phase=band*1.85+time*.18;
  let x=30+1340*u;
  let y=350+Math.sin(u*TAU+phase)*108*envelope+(strand-4)*9*(.3+envelope)+Math.cos(u*Math.PI+band)*38;
  y+=Math.sin(u*TAU*1.5-time*.25+band)*16*envelope;
  const dx=pointer.x-x,dy=pointer.y-y;
  const influence=Math.exp(-(dx*dx+dy*dy)/(2*230*230))*pointer.power;
  x+=dx*.14*influence;
  y+=dy*.38*influence;
  return {x,y};
}

export function ribbonPath(band,strand,time,pointer) {
  const points=[];
  for(let i=0;i<=44;i++){
    const {x,y}=fieldPoint(i/44,band,strand,time,pointer);
    points.push(`${i?'L':'M'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return points.join('');
}

export function createFieldSvg() {
  const ribbons=Array.from({length:bands},(_,band)=>Array.from({length:strands},(_,strand)=>`<path id="collab-ribbon-${band}-${strand}" data-ribbon="${band},${strand}" d="${ribbonPath(band,strand,0)}" stroke="url(#collab-spectrum-${band})" stroke-width="${strand===4?1.8:1}" opacity="${strand===4?.9:.25+(.25*(1-Math.abs(strand-4)/4))}"/>`).join('')).join('');
  const colors=['#94ecf4','#ad9df5','#b8dcf7'];
  const points=Array.from({length:30},(_,i)=>{
    const p=fieldPoint((i*.137+.08)%1,i%3,4,0);
    return `<g data-field-particle="${i}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})"><circle r="9" fill="${colors[i%3]}" opacity=".05"/><circle r="${i%5===0?3.2:1.8}" fill="${colors[i%3]}" opacity=".8"/></g>`;
  }).join('');
  return `<svg viewBox="0 0 1400 620" width="1400" height="620" preserveAspectRatio="none" focusable="false">
  <defs>
    <linearGradient id="collab-spectrum-0"><stop stop-color="#4a7899" stop-opacity="0"/><stop offset=".28" stop-color="#7ddce9"/><stop offset=".66" stop-color="#a9e8eb"/><stop offset="1" stop-color="#8d79da" stop-opacity="0"/></linearGradient>
    <linearGradient id="collab-spectrum-1"><stop stop-color="#6d71a6" stop-opacity="0"/><stop offset=".3" stop-color="#8580df"/><stop offset=".72" stop-color="#c2a4e9"/><stop offset="1" stop-color="#a4b9dc" stop-opacity="0"/></linearGradient>
    <linearGradient id="collab-spectrum-2"><stop stop-color="#b8dcf7" stop-opacity="0"/><stop offset=".38" stop-color="#9ecbe3"/><stop offset=".7" stop-color="#f0d6b3"/><stop offset="1" stop-color="#8dd2dd" stop-opacity="0"/></linearGradient>
    <radialGradient id="collab-glow"><stop stop-color="#71d9ed" stop-opacity=".2"/><stop offset=".4" stop-color="#6a9bd4" stop-opacity=".06"/><stop offset="1" stop-color="#080b10" stop-opacity="0"/></radialGradient>
    <filter id="collab-blur" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="7"/></filter>
  </defs>
  <ellipse cx="850" cy="340" rx="530" ry="235" fill="url(#collab-glow)" opacity=".65"/>
  <g fill="none" stroke-linecap="round">${ribbons}</g>
  <g fill="none" stroke-width="12" filter="url(#collab-blur)" opacity=".16"><use href="#collab-ribbon-0-4"/><use href="#collab-ribbon-1-4"/><use href="#collab-ribbon-2-4"/></g>
  <g class="field-particles">${points}</g>
  <g class="field-pointer" opacity="0"><circle class="field-halo" r="190" fill="url(#collab-glow)"/><circle r="4" fill="#d1faff"/><circle r="13" fill="none" stroke="#a3e4f1" stroke-width=".8" opacity=".5"/></g>
  <g class="field-connections" fill="none" stroke="#a0dfe9" stroke-width=".7"></g>
  <circle class="field-ripple" cx="700" cy="340" r="0" fill="none" stroke="#b8e9f3" stroke-width="1" opacity="0"/>
  </svg>`;
}

function mountField() {
  const hero=document.querySelector('[data-motion="collaboration-field"]');
  if(!hero)return;
  const svg=hero.querySelector('svg'),ribbons=[...svg.querySelectorAll('[data-ribbon]')],particles=[...svg.querySelectorAll('[data-field-particle]')];
  const halo=svg.querySelector('.field-pointer'),connections=svg.querySelector('.field-connections'),ripple=svg.querySelector('.field-ripple');
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  hero.dataset.fieldReady='true';
  const target={x:700,y:340,power:0},pointer={...target};
  let frame=0,last=0,time=0,pulse=null;
  const canAnimate=()=>hero.dataset.motionState==='playing'&&!document.hidden&&!media.matches;
  const lineNodes=Array.from({length:5},()=>{const path=document.createElementNS('http://www.w3.org/2000/svg','path');connections.append(path);return path;});
  function draw(delta=0) {
    const ease=delta?1-Math.exp(-delta*6):1;
    for(const key of ['x','y','power'])pointer[key]+=(target[key]-pointer[key])*ease;
    for(let i=0;i<ribbons.length;i++)ribbons[i].setAttribute('d',ribbonPath(Math.floor(i/strands),i%strands,time,pointer));
    const positions=[];
    particles.forEach((node,i)=>{
      const u=(i*.137+.08+time*(.012+(i%3)*.003))%1;
      const p=fieldPoint(u,i%3,4,time,pointer),edge=Math.min(1,u*8,(1-u)*8);
      node.setAttribute('transform',`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
      node.setAttribute('opacity',edge.toFixed(3));positions.push(p);
    });
    halo.setAttribute('transform',`translate(${pointer.x.toFixed(2)} ${pointer.y.toFixed(2)})`);
    halo.setAttribute('opacity',(pointer.power*.9).toFixed(3));
    const nearest=positions.map(p=>({...p,d:Math.hypot(p.x-pointer.x,p.y-pointer.y)})).sort((a,b)=>a.d-b.d).slice(0,5);
    lineNodes.forEach((line,i)=>{
      const p=nearest[i];line.setAttribute('d',`M${pointer.x} ${pointer.y}Q${(pointer.x+p.x)/2} ${(pointer.y+p.y)/2-20} ${p.x} ${p.y}`);
      line.setAttribute('opacity',(pointer.power*Math.max(0,1-p.d/300)*.5).toFixed(3));
    });
    if(pulse){const age=time-pulse.start;ripple.setAttribute('cx',pulse.x);ripple.setAttribute('cy',pulse.y);ripple.setAttribute('r',18+age*95);ripple.setAttribute('opacity',Math.max(0,.5-age*.35));if(age>1.45)pulse=null;}
    else ripple.setAttribute('opacity','0');
  }
  function tick(now) {
    frame=0;if(!canAnimate())return;
    if(!last||now-last>=32){const delta=last?Math.min(.08,(now-last)/1000):.033;last=now;time+=delta;draw(delta);}
    frame=requestAnimationFrame(tick);
  }
  function sync() {
    if(!canAnimate()){cancelAnimationFrame(frame);frame=0;last=0;if(media.matches){target.power=0;time=0;pulse=null;draw();}return;}
    if(!frame)frame=requestAnimationFrame(tick);
  }
  function move(event) {
    if(!canAnimate())return;
    const rect=svg.getBoundingClientRect();
    target.x=Math.max(0,Math.min(1400,(event.clientX-rect.left)/rect.width*1400));
    target.y=Math.max(0,Math.min(620,(event.clientY-rect.top)/rect.height*620));target.power=1;
    hero.dataset.fieldInteracting='true';
  }
  function leave(){target.power=0;hero.dataset.fieldInteracting='false';}
  hero.addEventListener('pointermove',move,{passive:true});
  hero.addEventListener('pointerdown',event=>{move(event);if(canAnimate())pulse={x:target.x,y:target.y,start:time};},{passive:true});
  hero.addEventListener('pointerleave',leave,{passive:true});
  hero.addEventListener('pointercancel',leave,{passive:true});
  hero.addEventListener('pointerup',event=>{if(event.pointerType!=='mouse')leave();},{passive:true});
  new MutationObserver(sync).observe(hero,{attributes:true,attributeFilter:['data-motion-state']});
  document.addEventListener('visibilitychange',sync);media.addEventListener('change',sync);sync();
}
if(typeof document!=='undefined')mountField();
