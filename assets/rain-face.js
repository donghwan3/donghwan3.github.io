import {rain} from './rain-face-data-6e50f251caa0.js';

// Adapted Rain Rig (CC BY 4.0), Blender Foundation / Blender Studio.
// Geometry and expression deltas are baked from the original Blender rig.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),TAU=Math.PI*2;
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const vertices=[],edges=[],triangles=[];
for(const object of rain.objects){
  const start=vertices.length,irises=new Set(object.k===2?object.e:[]);
  for(let i=0;i<object.p.length;i+=3)vertices.push({x:object.p[i]/1e4,y:object.p[i+1]/1e4,z:object.p[i+2]/1e4,
    nx:object.n[i]/1e3,ny:object.n[i+1]/1e3,nz:object.n[i+2]/1e3,k:object.k,iris:irises.has(i/3),blink:[0,0,0],surprise:[0,0,0]});
  for(const morph of ['blink','surprise'])for(let i=0;i<object[morph].length;i+=4){
    const data=object[morph];vertices[start+data[i]][morph]=data.slice(i+1,i+4).map(x=>x/1e4);
  }
  for(let i=0;i<object.e.length;i+=2)edges.push([start+object.e[i],start+object.e[i+1],object.k]);
  for(let i=0;i<object.f.length;i+=3)triangles.push([start+object.f[i],start+object.f[i+1],start+object.f[i+2],object.k]);
}
// A soft, spatially blended smile moves the lips and cheeks together. Weights
// are computed once in model coordinates, so rotation never changes the smile.
for(const p of vertices){
  const front=smooth((p.z-.4)/.35),x=Math.abs(p.x);
  const corner=p.k===0?Math.exp(-(((x-.29)/.22)**2+((p.y+.35)/.19)**2))*front:0;
  const cheek=p.k===0?Math.exp(-(((x-.51)/.30)**2+((p.y+.02)/.30)**2))*front:0;
  p.smile=[Math.sign(p.x)*(.044*corner+.007*cheek),.105*corner+.030*cheek,-.018*corner+.014*cheek];
}
export const faceTopology={model:rain.name,license:rain.license,points:vertices.length,edges:edges.length,
  hairPoints:vertices.filter(p=>p.k===3).length,skinPoints:vertices.filter(p=>p.k===0).length,
  blinkPoints:vertices.filter(p=>p.blink.some(x=>Math.abs(x)>.001)).length};

export function faceFrame({time=0,yaw=0,pitch=0,gazeX=0,gazeY=0,open=1,smile=0}={},width=1400,height=900){
  const mobile=width<700,scale=Math.min(height*(mobile?.41:.355),width*(mobile?.64:.36)),cx=width*(mobile?.5:.72),cy=height*.59;
  const sy=Math.sin(yaw),co=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch);
  const surprise=clamp((open-1)/.45,0,1),expression=clamp(smile,0,1)*(1-surprise);
  const baseBlink=clamp(1-open,0,1),smilingEyes=.12*expression*(1-baseBlink);
  const gx=clamp(gazeX,-1,1)*.30,gy=clamp(gazeY,-1,1)*.21,sgx=Math.sin(gx),cgx=Math.cos(gx),sgy=Math.sin(gy),cgy=Math.cos(gy);
  function project(x,y,z){
    const rx=x*co+z*sy,rz=-x*sy+z*co,ry=y*cp-rz*sp,depth=y*sp+rz*cp,perspective=1+depth*.045;
    return {x:cx+rx*scale*perspective,y:cy-ry*scale*perspective,z:depth};
  }
  const projected=vertices.map(p=>{
    const blink=baseBlink+((p.k===0||p.k===5)?smilingEyes:0);
    let x=p.x+p.blink[0]*blink+p.surprise[0]*surprise+p.smile[0]*expression,y=p.y+p.blink[1]*blink+p.surprise[1]*surprise+p.smile[1]*expression,z=p.z+p.blink[2]*blink+p.surprise[2]*surprise+p.smile[2]*expression;
    if(p.k===2){
      const eye=rain.eyes[p.x>0?0:1],dx=x-eye[0],dy=y-eye[1],dz=z-eye[2],rx=dx*cgx+dz*sgx,rz=-dx*sgx+dz*cgx;
      x=eye[0]+rx;y=eye[1]+dy*cgy+rz*sgy;z=eye[2]-dy*sgy+rz*cgy;
    }
    return project(x,y,z);
  });
  // A small depth buffer hides the rear hair, far eye, and inner mouth surfaces.
  const dw=Math.max(96,Math.ceil(width/6)),dh=Math.max(96,Math.ceil(height/6)),depth=new Float32Array(dw*dh);depth.fill(-Infinity);
  const dx=dw/width,dy=dh/height;
  for(const [ia,ib,ic,kind] of triangles){
    if(kind===2&&open<.4)continue;
    const a=projected[ia],b=projected[ib],c=projected[ic],ax=a.x*dx,ay=a.y*dy,bx=b.x*dx,by=b.y*dy,cx=c.x*dx,cy=c.y*dy;
    const den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(den)<.005)continue;
    const x0=Math.max(0,Math.floor(Math.min(ax,bx,cx))),x1=Math.min(dw-1,Math.ceil(Math.max(ax,bx,cx))),y0=Math.max(0,Math.floor(Math.min(ay,by,cy))),y1=Math.min(dh-1,Math.ceil(Math.max(ay,by,cy)));
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
      const u=((by-cy)*(x+.5-cx)+(cx-bx)*(y+.5-cy))/den,v=((cy-ay)*(x+.5-cx)+(ax-cx)*(y+.5-cy))/den,w=1-u-v;
      if(u<0||v<0||w<0)continue;
      const z=u*a.z+v*b.z+w*c.z,index=y*dw+x;if(z>depth[index])depth[index]=z;
    }
  }
  function visible(p){
    const x=Math.floor(p.x*dx),y=Math.floor(p.y*dy);if(x<0||x>=dw||y<0||y>=dh)return true;
    return p.z>=depth[y*dw+x]-.028;
  }
  const dots=projected.map((q,i)=>{
    const p=vertices[i],normal=(-p.nx*sy+p.nz*co)*cp+p.ny*sp,front=clamp(normal,0,1);
    const fade=clamp((p.y+1.42)/.40,0,1),sweep=((1+Math.sin(p.y*3-time*.0006))/2)**12*.08;
    const hidden=!visible(q)||normal<-.15||(p.k===2&&(!p.iris||open<.08));
    return {...q,alpha:hidden?0:((p.k>=4?.50:p.k===3?.18:.14)+front*.34+sweep)*fade*(p.k===5?Math.min(1,open):1),r:(p.k>=4?.78:.66)*Math.sqrt(scale/220),hair:p.k===3,eye:p.k===2&&p.iris};
  });
  const lines=[];
  for(const [a,b,kind] of edges){
    if(kind===2&&open<.08)continue;
    const p=dots[a],q=dots[b];if(p.alpha===0&&q.alpha===0)continue;
    const mid={x:(p.x+q.x)/2,y:(p.y+q.y)/2,z:(p.z+q.z)/2};if(!visible(mid))continue;
    const alpha=Math.max(p.alpha,q.alpha)*(kind>=4?.95:kind===2?1:kind===3?.65:.55);
    if(alpha>.02)lines.push({a:p,b:q,alpha,kind:kind===2?2:kind===3?3:kind>=4?1:0});
  }
  // Tiny highlights share the eye mesh transform and depth test.
  if(open>.08)for(const eye of rain.eyes){
    const x=eye[0]+.35*sgx-.024,y=eye[1]+.35*sgy+.025,z=eye[2]+.35*cgx*cgy;
    const p=project(x,y,z);if(visible(p))dots.push({...p,r:1.55*Math.sqrt(scale/220),alpha:.9,eye:true});
  }
  return {dots,lines,cx,cy,scale};
}

export function createFaceSvg(options={}){
  const frame=faceFrame(options),f=n=>n.toFixed(1),groups=Array.from({length:10},()=>[]);
  frame.lines.forEach(l=>groups[Math.min(9,Math.floor(l.alpha*10))].push(`M${f(l.a.x)} ${f(l.a.y)}L${f(l.b.x)} ${f(l.b.y)}`));
  return `<svg viewBox="0 0 1400 900" width="1400" height="900" aria-hidden="true" focusable="false"><g fill="none" stroke="#67b9ed" stroke-width=".8">${groups.map((g,i)=>`<path d="${g.join('')}" opacity="${(i+.5)/10}"/>`).join('')}</g><g fill="#a1dcff">${frame.dots.filter(p=>p.alpha>.03).map(p=>`<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(p.r)}" opacity="${p.alpha.toFixed(2)}"/>`).join('')}</g></svg>`;
}
