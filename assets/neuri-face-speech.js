import {faceFrame} from './rain-face.js?v=d8c7c5a97536';
let stopCurrent=()=>{};
document.addEventListener('neuri-speaking',event=>{
 stopCurrent();const scene=document.querySelector('[data-neural-face]'),stage=scene?.querySelector('.neural-stage'),canvas=stage?.querySelector('canvas');
 if(!canvas||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const context=canvas.getContext('2d'),status=scene.querySelector('.neural-status-text'),before=scene.dataset.motionState,oldStatus=status.textContent;
 scene.dataset.motionState='paused';scene.dataset.neuriSpeaking='true';status.textContent=document.documentElement.lang==='ko'?'뉴리가 이야기하는 중':'Neuri is speaking';
 const duration=Math.min(12000,Math.max(500,Number(event.detail?.duration)||3000)),began=performance.now();let frame=0,finished=false;
 const finish=()=>{if(finished)return;finished=true;cancelAnimationFrame(frame);scene.dataset.neuriSpeaking='false';stage.dataset.mouthOpen='0.025';status.textContent=oldStatus;scene.dataset.motionState=before;};stopCurrent=finish;
 function draw(now){
  const elapsed=now-began,end=elapsed>=duration||document.hidden;
  const rect=stage.getBoundingClientRect(),width=rect.width,height=rect.height;if(!width||!height){finish();return;}
  const ratio=canvas.width/width;
  const envelope=Math.min(1,elapsed/180,(duration-elapsed)/180);
  const mouth=end?.025:.025+Math.max(0,envelope)*(.06+.22*Math.pow(Math.sin(elapsed*.016),2)+.08*Math.pow(Math.sin(elapsed*.027),2));
  const data=faceFrame({time:now,yaw:Number(stage.dataset.yaw)||0,pitch:0,gazeX:0,gazeY:0,open:1,brow:0,mouth,smile:.08},width,height);
  context.setTransform(ratio,0,0,ratio,0,0);context.clearRect(0,0,width,height);context.strokeStyle='#67b9ed';context.lineWidth=Math.max(.6,Math.sqrt(data.scale/300));
  const lines=Array.from({length:10},()=>[]),dots=Array.from({length:10},()=>[]);
  data.lines.forEach(l=>lines[Math.min(9,Math.floor(l.alpha*10))].push(l));data.dots.forEach(p=>{if(p.alpha>.025)dots[Math.min(9,Math.floor(p.alpha*10))].push(p);});
  lines.forEach((group,i)=>{context.globalAlpha=(i+.5)/10;context.beginPath();for(const l of group){context.moveTo(l.a.x,l.a.y);context.lineTo(l.b.x,l.b.y);}context.stroke();});
  context.fillStyle='#a1dcff';dots.forEach((group,i)=>{context.globalAlpha=(i+.5)/10;context.beginPath();for(const p of group){context.moveTo(p.x+p.r,p.y);context.arc(p.x,p.y,p.r,0,Math.PI*2);}context.fill();});context.globalAlpha=1;stage.dataset.mouthOpen=mouth.toFixed(3);
  if(end)finish();else frame=requestAnimationFrame(draw);
 }
 // Let the existing scene renderer pause before taking over its canvas.
 frame=requestAnimationFrame(draw);
});

