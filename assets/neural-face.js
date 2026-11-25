// Rain Rig (CC BY 4.0), Blender Foundation / Blender Studio.
import {faceTopology,faceFrame,createFaceSvg} from './rain-face.js?v=d8c7c5a97536';
export {faceTopology,faceFrame,createFaceSvg};
const PI=Math.PI,TAU=PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
function occasionalSmile(time){
  const cycle=Math.floor(time/21000),start=cycle===0?2300:3200+(cycle*7919)%5000;
  const age=time-cycle*21000-start;
  return smooth(age/850)*(1-smooth((age-2100)/1150));
}
export function faceBehavior(time,lastActivity=0,wakeAt=-Infinity){
  const idle=time-lastActivity,wakeAge=time-wakeAt;
  if(wakeAge>=0&&wakeAge<1100){const surprise=1-smooth(wakeAge/1100);return {mode:'surprised',open:1+surprise*.45,turn:0,nod:-surprise*.055,brow:surprise*.12,mouth:.03+surprise*.09,smile:0};}
  if(idle>=8000){const sleep=smooth((idle-8000)/2200);return {mode:sleep<1?'sleepy':'asleep',open:1-sleep,turn:sleep*1.28,nod:sleep*(.16+Math.sin(time*.0012)*.018),brow:0,mouth:.025,smile:0};}
  const blinkPhase=time%4700,blink=blinkPhase>3500&&blinkPhase<3750?Math.sin((blinkPhase-3500)/250*PI):0;
  const smile=occasionalSmile(time)*(1-smooth((idle-6000)/1700))*smooth((wakeAge-1600)/900);
  return {mode:'awake',open:1-blink*.98,turn:0,nod:0,brow:0,mouth:.025,smile};
}



export function mountNeuralFace(scene){
  const stage=scene.querySelector('.neural-stage'),canvas=stage.querySelector('canvas'),context=canvas.getContext('2d');
  if(!context)return;
  const status=scene.querySelector('.neural-status-text'),korean=document.documentElement.lang==='ko';
  const labels=korean?{awake:'눈을 맞추는 중',sleepy:'졸음이 밀려와요',asleep:'잠들었어요',surprised:'앗, 다시 오셨네요!',still:'고요한 얼굴'}:{awake:'Following your gaze',sleepy:'Getting sleepy',asleep:'Dreaming',surprised:'Oh! You’re back.',still:'A quiet portrait'};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,last=0,time=0,lastActivity=0,wakeAt=-Infinity,manualYaw=0,manualPitch=0,yaw=0,pitch=0,gazeX=0,gazeY=0,targetX=0,targetY=0,drag=null,width=1400,height=900,ratio=1;
  const allowed=()=>!document.hidden&&!reduced.matches&&scene.dataset.motionState==='playing';
  const setMode=mode=>{if(scene.dataset.faceState!==mode){scene.dataset.faceState=mode;status.textContent=labels[mode];}};
  function draw(still=false){
    const behavior=still?{...faceBehavior(0),mode:'still',smile:0}:faceBehavior(time,lastActivity,wakeAt);
    setMode(behavior.mode);
    const data=faceFrame({time:still?0:time,yaw:still?0:yaw,pitch:still?0:pitch,gazeX:still?0:gazeX,gazeY:still?0:gazeY,open:behavior.open,brow:behavior.brow,mouth:behavior.mouth,smile:behavior.smile},width,height);
    context.setTransform(ratio,0,0,ratio,0,0);context.clearRect(0,0,width,height);
    const lineGroups=Array.from({length:10},()=>[]),dotGroups=Array.from({length:10},()=>[]);
    data.lines.forEach(l=>lineGroups[Math.min(9,Math.floor(l.alpha*10))].push(l));
    data.dots.forEach(p=>{if(p.alpha>.025)dotGroups[Math.min(9,Math.floor(p.alpha*10))].push(p);});
    context.strokeStyle='#67b9ed';context.lineWidth=Math.max(.6,Math.sqrt(data.scale/300));
    lineGroups.forEach((group,i)=>{context.globalAlpha=(i+.5)/10;context.beginPath();for(const l of group){context.moveTo(l.a.x,l.a.y);context.lineTo(l.b.x,l.b.y);}context.stroke();});
    context.fillStyle='#a1dcff';
    dotGroups.forEach((group,i)=>{context.globalAlpha=(i+.5)/10;context.beginPath();for(const p of group){context.moveTo(p.x+p.r,p.y);context.arc(p.x,p.y,p.r,0,TAU);}context.fill();});
    context.globalAlpha=1;
    stage.dataset.yaw=yaw.toFixed(3);stage.dataset.eyeOpen=behavior.open.toFixed(3);stage.dataset.gazeX=gazeX.toFixed(3);stage.dataset.gazeY=gazeY.toFixed(3);stage.dataset.smile=behavior.smile.toFixed(3);
  }
  function resize(){const rect=stage.getBoundingClientRect();width=rect.width;height=rect.height;ratio=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);draw(reduced.matches);}
  function tick(now){
    frame=0;if(!allowed())return;
    if(last&&now-last<33){frame=requestAnimationFrame(tick);return;}
    const dt=last?Math.min(80,now-last):33;last=now;time+=dt;
    const b=faceBehavior(time,lastActivity,wakeAt),resting=b.mode==='asleep'||b.mode==='sleepy';
    const desiredYaw=resting?b.turn:manualYaw+targetX*.055+Math.sin(time*.00035)*.012;
    const desiredPitch=resting?b.nod:manualPitch+b.nod;
    const ease=1-Math.exp(-dt/(b.mode==='surprised'?150:310));
    yaw+=(desiredYaw-yaw)*ease;pitch+=(desiredPitch-pitch)*ease;
    gazeX+=((resting?0:targetX)-gazeX)*.23;gazeY+=((resting?0:targetY)-gazeY)*.23;
    draw();frame=requestAnimationFrame(tick);
  }
  const start=()=>{if(allowed()&&!frame)frame=requestAnimationFrame(tick);};
  function activity(){
    if(!allowed())return;
    const mode=faceBehavior(time,lastActivity,wakeAt).mode;
    if(mode==='asleep'||mode==='sleepy'){wakeAt=time;manualYaw=0;manualPitch=0;}
    lastActivity=time;start();
  }
  function move(event){
    if(!allowed())return;activity();
    const rect=stage.getBoundingClientRect(),faceX=rect.left+width*(width<700?.5:.72),faceY=rect.top+height*.43;
    const dx=event.clientX-faceX,reach=(dx>0?rect.left+width-faceX:faceX-rect.left)*.85;
    targetX=clamp(dx/Math.max(1,reach),-1,1);targetY=clamp((faceY-event.clientY)/(height*.32),-1,1);
    if(drag&&drag.id===event.pointerId){
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      manualYaw=clamp(drag.yaw+dx*.006,-1.48,1.48);
      if(event.pointerType!=='touch')manualPitch=clamp(drag.pitch+dy*.003,-.24,.24);
    }
  }
  document.addEventListener('pointermove',move,{passive:true});
  stage.addEventListener('pointerdown',event=>{
    if(!allowed())return;move(event);drag={id:event.pointerId,x:event.clientX,y:event.clientY,yaw:manualYaw,pitch:manualPitch};
    stage.setPointerCapture?.(event.pointerId);stage.dataset.dragging='true';
  },{passive:true});
  const release=()=>{drag=null;stage.dataset.dragging='false';};
  stage.addEventListener('pointerup',release,{passive:true});stage.addEventListener('pointercancel',release,{passive:true});
  function reset(){activity();manualYaw=0;manualPitch=0;targetX=0;targetY=0;if(reduced.matches)draw(true);}
  scene.querySelector('.neural-reset').addEventListener('click',reset);
  stage.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','Enter',' '].includes(event.key))return;
    event.preventDefault();if(reduced.matches)return;activity();
    if(event.key==='ArrowLeft')manualYaw=clamp(manualYaw-.22,-1.48,1.48);
    else if(event.key==='ArrowRight')manualYaw=clamp(manualYaw+.22,-1.48,1.48);
    else if(event.key==='ArrowUp')manualPitch=clamp(manualPitch-.07,-.24,.24);
    else if(event.key==='ArrowDown')manualPitch=clamp(manualPitch+.07,-.24,.24);
    else reset();
  });
  function sync(){
    if(allowed()){start();return;}
    cancelAnimationFrame(frame);frame=0;last=0;release();
    if(reduced.matches){yaw=0;pitch=0;draw(true);}
  }
  new MutationObserver(sync).observe(scene,{attributes:true,attributeFilter:['data-motion-state']});
  new ResizeObserver(resize).observe(stage);
  reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  resize();scene.dataset.faceReady='true';sync();
}
if(typeof document!=='undefined')document.querySelectorAll('[data-neural-face]').forEach(mountNeuralFace);
