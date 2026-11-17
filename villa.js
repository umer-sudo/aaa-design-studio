/* AAA Design Studio · the model. Drifted Studio, 17 Nov 2026.
   One villa, built from real walls with real openings. Units are metres.
   Local frame: +z is the street, +x is the viewer's right from the street, +y is up.
   The street front faces bearing 235° (south-west); the sun is rotated into this frame. */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

export const LAT=24.86,LON=67.00,TZ=5,BEARING=235;
const rad=d=>d*Math.PI/180,clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t)};

/* NOAA solar position. day = day of year, clock = local clock hours (PKT, UTC+5). */
export function solar(day,clock){
  const g=2*Math.PI/365*(day-1+(clock-12)/24);
  const eot=229.18*(.000075+.001868*Math.cos(g)-.032077*Math.sin(g)-.014615*Math.cos(2*g)-.040849*Math.sin(2*g));
  const decl=.006918-.399912*Math.cos(g)+.070257*Math.sin(g)-.006758*Math.cos(2*g)+.000907*Math.sin(2*g)-.002697*Math.cos(3*g)+.00148*Math.sin(3*g);
  const tst=clock*60+eot+4*LON-60*TZ,ha=rad(tst/4-180),lat=rad(LAT);
  const cz=Math.sin(lat)*Math.sin(decl)+Math.cos(lat)*Math.cos(decl)*Math.cos(ha),zen=Math.acos(clamp(cz,-1,1));
  let az=Math.acos(clamp((Math.sin(lat)*Math.cos(zen)-Math.sin(decl))/(Math.cos(lat)*Math.sin(zen)),-1,1));
  az=ha>0?(az+Math.PI)%(2*Math.PI):(3*Math.PI-az)%(2*Math.PI);
  return {alt:Math.PI/2-zen,az};
}
export function sunBucket(altDeg){return altDeg<2?'dusk':altDeg<38?'golden':'noon'}

/* ---------- procedural finishes: colour + height from one drawing ---------- */
function rng(s){return()=>(s=(s*16807)%2147483647)/2147483647}
function finish(kind){
  const S=512,c=document.createElement('canvas'),b=document.createElement('canvas');c.width=c.height=b.width=b.height=S;
  const g=c.getContext('2d'),h=b.getContext('2d'),r=rng(kind.length*7919+kind.charCodeAt(0)*131+17);
  const fill=(col)=>{g.fillStyle=col;g.fillRect(0,0,S,S);h.fillStyle='#b8b8b8';h.fillRect(0,0,S,S)};
  const speck=(n,a)=>{for(let i=0;i<n;i++){const d=r()>.5;g.fillStyle=`rgba(${d?'60,45,25':'255,250,240'},${r()*a})`;const x=r()*S,y=r()*S,w=1+r()*2;g.fillRect(x,y,w,w);h.fillStyle=`rgba(${d?'0,0,0':'255,255,255'},${r()*a*1.6})`;h.fillRect(x,y,w,w)}};
  const joint=(x,y,w,hh,a=.34)=>{g.fillStyle=`rgba(70,58,40,${a})`;g.fillRect(x,y,w,hh);h.fillStyle='rgba(0,0,0,.85)';h.fillRect(x,y,w,hh)};
  const panels=(rows,cols,vary,jw=2)=>{const ph=S/rows,pw=S/cols;for(let j=0;j<rows;j++){const off=(j%2)*pw/2;for(let i=-1;i<cols;i++){const x=i*pw+off;g.fillStyle=`rgba(${r()>.5?'255,246,228':'88,70,44'},${r()*vary})`;g.fillRect(x,j*ph,pw,ph);joint(x,j*ph,jw,ph)}joint(0,j*ph,S,jw)}};
  let rough=.9,tile=2.4,bump=.5;
  if(kind==='plaster'){fill('#f0ebe1');speck(2600,.05);bump=.12;rough=.94}
  else if(kind==='limestone'){fill('#ded4be');panels(4,2,.04);speck(3200,.07);bump=.55;rough=.86}
  else if(kind==='travertine'){fill('#d2b98f');for(let i=0;i<220;i++){const y=r()*S;g.strokeStyle=`rgba(${r()>.45?'246,228,196':'120,88,48'},${.05+r()*.14})`;g.lineWidth=.6+r()*2.2;g.beginPath();g.moveTo(0,y);g.bezierCurveTo(S*.3,y+r()*8-4,S*.7,y+r()*8-4,S,y+r()*6-3);g.stroke()}
    for(let i=0;i<260;i++){const x=r()*S,y=r()*S,w=2+r()*7;g.fillStyle=`rgba(96,70,38,${.12+r()*.2})`;g.fillRect(x,y,w,1.2);h.fillStyle='rgba(0,0,0,.7)';h.fillRect(x,y,w,1.4)}panels(4,2,.05);bump=.6;rough=.8}
  else if(kind==='concrete'){fill('#aaa69f');const n=16,bh=S/n;for(let j=0;j<n;j++){g.fillStyle=`rgba(${r()>.5?'255,255,255':'40,40,40'},${r()*.07})`;g.fillRect(0,j*bh,S,bh);for(let k=0;k<5;k++){const y=j*bh+r()*bh;g.strokeStyle=`rgba(60,58,54,${.04+r()*.07})`;g.lineWidth=.7;g.beginPath();g.moveTo(0,y);g.lineTo(S,y+r()*3-1.5);g.stroke()}joint(0,j*bh,S,1.4,.22)}
    for(let x=S/4;x<S;x+=S/2)for(let y=S/4;y<S;y+=S/2){g.fillStyle='rgba(50,48,44,.5)';g.beginPath();g.arc(x,y,4.2,0,7);g.fill();h.fillStyle='#000';h.beginPath();h.arc(x,y,4.6,0,7);h.fill()}speck(2400,.06);bump=.7;rough=.92}
  else if(kind==='teak'){fill('#8e6b4c');const n=20,bw=S/n;for(let i=0;i<n;i++){g.fillStyle=`rgba(${r()>.5?'214,160,104':'58,30,10'},${r()*.2})`;g.fillRect(i*bw,0,bw,S);for(let k=0;k<7;k++){const x=i*bw+r()*bw;g.strokeStyle=`rgba(52,28,10,${.06+r()*.12})`;g.lineWidth=.6;g.beginPath();g.moveTo(x,0);g.bezierCurveTo(x+r()*4-2,S*.3,x+r()*4-2,S*.7,x+r()*3-1.5,S);g.stroke()}joint(i*bw,0,2.2,S,.6)}bump=.9;rough=.62}
  else if(kind==='marble'){fill('#f1eeea');for(let i=0;i<26;i++){g.strokeStyle=`rgba(120,122,128,${.05+r()*.16})`;g.lineWidth=.5+r()*2.4;g.beginPath();let x=r()*S,y=r()*S;g.moveTo(x,y);for(let k=0;k<5;k++){x+=40+r()*90;y+=r()*120-60;g.lineTo(x,y)}g.stroke()}panels(2,2,.02,1.2);bump=.15;rough=.24}
  else if(kind==='ashlar'){fill('#8e8a84');const rows=8,ph=S/rows;for(let j=0;j<rows;j++){let x=-(j%2)*40;while(x<S){const w=70+r()*80;const v=r();g.fillStyle=`rgba(${v>.5?'255,255,255':'20,20,20'},${r()*.16})`;g.fillRect(x,j*ph,w,ph);h.fillStyle=`rgba(${v>.5?'255,255,255':'0,0,0'},${r()*.5})`;h.fillRect(x,j*ph,w,ph);joint(x,j*ph,3,ph,.55);x+=w}joint(0,j*ph,S,3,.55)}speck(5200,.16);bump=1.6;rough=.97}
  else if(kind==='paver'){fill('#cfc7b8');const u=S/16;for(let j=0;j<16;j++)for(let i=0;i<16;i++){g.fillStyle=`rgba(${r()>.5?'255,250,240':'70,62,50'},${r()*.09})`;g.fillRect(i*u,j*u,u,u);if((i+j)%2){joint(i*u,j*u,u,1.2,.2)}else{joint(i*u,j*u,1.2,u,.2)}}speck(1500,.05);bump=.3;rough=.9;tile=3.2}
  else if(kind==='rooftile'){fill('#8b8f92');const rows=14,ph=S/rows,cols=18,pw=S/cols;for(let j=0;j<rows;j++){for(let i=0;i<cols;i++){const x=i*pw+(j%2)*pw/2;const gr=g.createLinearGradient(x,0,x+pw,0);gr.addColorStop(0,'rgba(0,0,0,.26)');gr.addColorStop(.5,'rgba(255,255,255,.2)');gr.addColorStop(1,'rgba(0,0,0,.26)');g.fillStyle=gr;g.fillRect(x,j*ph,pw,ph);const hr=h.createLinearGradient(x,0,x+pw,0);hr.addColorStop(0,'#222');hr.addColorStop(.5,'#eee');hr.addColorStop(1,'#222');h.fillStyle=hr;h.fillRect(x,j*ph,pw,ph)}joint(0,j*ph,S,3,.5)}bump=1.4;rough=.7;tile=2.2}
  else if(kind==='lawn'){fill('#98a184');speck(9000,.12);bump=.3;rough=1;tile=3}
  const map=new THREE.CanvasTexture(c),bm=new THREE.CanvasTexture(b);
  for(const t of [map,bm]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1/tile,1/tile);t.anisotropy=8}
  map.colorSpace=THREE.SRGBColorSpace;
  return {map,bumpMap:bm,bumpScale:bump,roughness:rough};
}
const FIN={};const fin=k=>FIN[k]||(FIN[k]=finish(k));
export function finishSwatch(k){return fin(k).map.image.toDataURL('image/jpeg',.8)}
export const MATERIALS={
  plaster:{name:'Lime plaster',note:'Smooth white lime render'},
  limestone:{name:'Jhimpir limestone',note:'Honed cream stone, coursed panels'},
  travertine:{name:'Travertine',note:'Vein-cut, warm and open-pored'},
  concrete:{name:'Board-marked concrete',note:'Cast in place, timber-board finish'},
  teak:{name:'Teak cladding',note:'Vertical oiled boards'},
  marble:{name:'White marble',note:'Honed slabs, grey veining'},
};

/* ---------- the villa ---------- */
export function createVilla(canvas,labelRoot,opt={}){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'default',preserveDrawingBuffer:false});
  const DPR=Math.min(devicePixelRatio||1,opt.maxDpr||1.6);
  renderer.setPixelRatio(DPR);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1.02;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();
  const BG=new THREE.Color('#ece7dd');scene.background=BG;scene.fog=new THREE.Fog(BG,70,190);
  const camera=new THREE.PerspectiveCamera(30,1,.3,600);
  const controls=new OrbitControls(camera,canvas);
  controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=false;controls.minDistance=3;controls.maxDistance=110;controls.maxPolarAngle=Math.PI*.497;controls.rotateSpeed=.6;controls.zoomSpeed=.7;
  if(matchMedia('(pointer:coarse)').matches){canvas.style.touchAction='pan-y'}

  const hemi=new THREE.HemisphereLight(0xf3f5f8,0xcdbfa6,.7);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff1de,3.2);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-26,right:26,top:26,bottom:-26,near:5,far:140});sun.shadow.bias=-.0006;sun.shadow.normalBias=.04;sun.shadow.radius=3;
  scene.add(sun,sun.target);

  /* sky environments for reflections and fill */
  const pm=new THREE.PMREMGenerator(renderer);const ENV={};
  function env(kind){
    if(ENV[kind])return ENV[kind];
    const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');
    const stops={noon:['#7fa6c9','#bcd3e4','#eef0ec','#cfc5b2','#b6ab98'],golden:['#7d9cbd','#c7cfd6','#f6dcb4','#c9b79b','#a99a84'],dusk:['#27314a','#59607c','#d99a7e','#4a4651','#33323a']}[kind];
    const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,stops[0]);gr.addColorStop(.36,stops[1]);gr.addColorStop(.5,stops[2]);gr.addColorStop(.56,stops[3]);gr.addColorStop(1,stops[4]);g.fillStyle=gr;g.fillRect(0,0,512,256);
    if(kind!=='dusk'){const rg=g.createRadialGradient(330,84,2,330,84,90);rg.addColorStop(0,'rgba(255,250,235,1)');rg.addColorStop(.15,'rgba(255,244,220,.6)');rg.addColorStop(1,'rgba(255,240,210,0)');g.fillStyle=rg;g.fillRect(0,0,512,256)}
    const t=new THREE.CanvasTexture(c);t.mapping=THREE.EquirectangularReflectionMapping;t.colorSpace=THREE.SRGBColorSpace;
    ENV[kind]=pm.fromEquirectangular(t).texture;t.dispose();return ENV[kind];
  }

  /* shared materials */
  const std=(o)=>new THREE.MeshStandardMaterial(o);
  const M={
    facade:std({color:0xffffff}),base:std({color:0xffffff,...fin('ashlar')}),
    white:std({color:0xf4f1ea,roughness:.9}),soffit:std({color:0xf2ede3,roughness:.95}),
    frame:std({color:0x24211e,roughness:.45,metalness:.6}),
    glass:std({color:0xa9bcc6,metalness:1,roughness:.05,transparent:true,opacity:.34,envMapIntensity:1.5,depthWrite:false}),
    interior:std({color:0xf2e6d0,roughness:1,emissive:0xffc277,emissiveIntensity:.3,side:THREE.BackSide}),
    part:std({color:0xf3eee4,roughness:.95,emissive:0xffc277,emissiveIntensity:.1}),
    floorIn:std({color:0xc9b08a,roughness:.7,emissive:0xffb060,emissiveIntensity:.12}),
    furn:std({color:0xb9ad9b,roughness:.9}),furnDark:std({color:0x5b5047,roughness:.8}),
    timber:std({color:0xffffff,...fin('teak')}),brass:std({color:0xb08d57,metalness:.9,roughness:.32}),
    paver:std({color:0xffffff,...fin('paver')}),lawn:std({color:0xffffff,...fin('lawn')}),
    pool:std({color:0x29414a,metalness:.9,roughness:.06,envMapIntensity:1.4}),
    roofTile:std({color:0xffffff,...fin('rooftile')}),roofFlat:std({color:0xd8d2c6,roughness:1}),
    lamp:std({color:0xfff1d6,emissive:0xffc67a,emissiveIntensity:2.2}),
    bark:std({color:0x6e6257,roughness:1}),leaf:std({color:0x8b957a,roughness:.95}),bloom:std({color:0xa8557c,roughness:.9}),
    ground:new THREE.MeshBasicMaterial({color:BG.clone()}),road:new THREE.MeshBasicMaterial({color:0xd9d3c8}),shadow:new THREE.ShadowMaterial({opacity:.3,color:0x2b2118}),
    ink:new THREE.LineBasicMaterial({color:0x2a2622,transparent:true,opacity:.26}),
    inkDash:new THREE.LineDashedMaterial({color:0x2a2622,transparent:true,opacity:.5,dashSize:.5,gapSize:.34}),
    brassLine:new THREE.LineBasicMaterial({color:0xb08d57}),
    pick:new THREE.LineBasicMaterial({color:0xa9772a}),
  };
  let facadeKey='limestone';
  function applyFacade(k){facadeKey=k;const f=fin(k);Object.assign(M.facade,{map:f.map,bumpMap:f.bumpMap,bumpScale:f.bumpScale,roughness:f.roughness});M.facade.needsUpdate=true}
  applyFacade('limestone');

  const site=new THREE.Group(),house=new THREE.Group();scene.add(site,house);
  const mesh=(geo,mat,parent,sh=true)=>{const m=new THREE.Mesh(geo,mat);m.castShadow=sh;m.receiveShadow=true;parent.add(m);return m};
  const box=(parent,mat,x0,x1,y0,y1,z0,z1,sh=true)=>{const m=mesh(new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0),mat,parent,sh);m.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);return m};

  /* a wall is a solid with real holes; every hole gets a frame, glass and mullions set back in the reveal */
  function holePath(o,inset=0,P=THREE.Path){const a0=o.a0+inset,a1=o.a1-inset,y0=o.y0+inset,y1=o.y1-inset,p=new P();
    if(o.arch){const r=(a1-a0)/2;p.moveTo(a0,y0);p.lineTo(a1,y0);p.lineTo(a1,y1-r);p.absarc((a0+a1)/2,y1-r,r,0,Math.PI,false);p.lineTo(a0,y0)}
    else{p.moveTo(a0,y0);p.lineTo(a1,y0);p.lineTo(a1,y1);p.lineTo(a0,y1);p.lineTo(a0,y0)}return p}
  function wall(parent,side,fixed,a0,a1,y0,y1,t,mat,holes=[],ud={}){
    const sh=new THREE.Shape();sh.moveTo(a0,y0);sh.lineTo(a1,y0);sh.lineTo(a1,y1);sh.lineTo(a0,y1);sh.lineTo(a0,y0);
    holes.forEach(o=>{if(o.y0<=y0)o.y0=y0+.02;sh.holes.push(holePath(o))});
    const g=new THREE.Group();parent.add(g);
    if(side==='f')g.position.z=fixed-t;else if(side==='b')g.position.z=fixed;
    else{g.rotation.y=-Math.PI/2;g.position.x=side==='r'?fixed:fixed+t}
    const outer=(side==='f'||side==='l')?t:0,inward=outer?-1:1;
    const m=mesh(new THREE.ExtrudeGeometry(sh,{depth:t,bevelEnabled:false,curveSegments:20}),mat,g);
    Object.assign(m.userData,ud,{side});
    holes.forEach(o=>{
      const rev=o.rev??Math.min(t-.06,.22),z=outer+inward*rev;
      if(o.kind==='void')return;
      const fs=holePath(o,0,THREE.Shape);fs.holes.push(holePath(o,o.fw??.055));
      const fr=mesh(new THREE.ExtrudeGeometry(fs,{depth:.07,bevelEnabled:false,curveSegments:20}),M.frame,g);fr.position.z=z-.035;
      const mv=o.mv||0,mh=o.mh||0,top=o.arch?o.y1-(o.a1-o.a0)/2:o.y1;
      for(let i=1;i<=mv;i++){const x=lerp(o.a0,o.a1,i/(mv+1));box(g,M.frame,x-.018,x+.018,o.y0,top,z-.03,z+.03,false)}
      for(let i=1;i<=mh;i++){const y=lerp(o.y0,top,i/(mh+1));box(g,M.frame,o.a0,o.a1,y-.018,y+.018,z-.03,z+.03,false)}
      if(o.arch)box(g,M.frame,o.a0,o.a1,top-.025,top+.025,z-.03,z+.03,false);
      if(o.kind==='door'){const d=box(g,M.timber,o.a0+.06,o.a1-.06,o.y0,o.y1-.06,z-.04,z+.04);box(g,M.brass,o.a1-.32,o.a1-.28,o.y0+.8,o.y0+1.9,z+inward*-.09,z+inward*-.05,false);d.userData.door=1}
      else{const gl=new THREE.Mesh(new THREE.ShapeGeometry(holePath(o,.04,THREE.Shape),20),M.glass);gl.position.z=z;gl.renderOrder=2;Object.assign(gl.userData,ud,{side});g.add(gl)}
    });
    return m;
  }
  /* one storey of one volume: four walls, a floor slab, a lit interior */
  function storey(parent,o){
    const {x0,x1,z0,z1,y0,y1,t=.3,mat=M.facade,slot='facade',vol,open={},skip='',par=0,roof=false}=o;
    const ud={slot,vol};
    if(!skip.includes('f'))wall(parent,'f',z1,x0,x1,y0,y1+par,t,mat,open.f,{...ud,face:'South-west elevation'});
    if(!skip.includes('b'))wall(parent,'b',z0,x0,x1,y0,y1+par,t,mat,open.b,{...ud,face:'North-east elevation'});
    if(!skip.includes('l'))wall(parent,'l',x0,z0+t,z1-t,y0,y1+par,t,mat,open.l,{...ud,face:'North-west elevation'});
    if(!skip.includes('r'))wall(parent,'r',x1,z0+t,z1-t,y0,y1+par,t,mat,open.r,{...ud,face:'South-east elevation'});
    box(parent,M.soffit,x0+.02,x1-.02,y0-.22,y0,z0+.02,z1-.02);                      // slab; its underside is the soffit
    box(parent,M.floorIn,x0+t,x1-t,y0,y0+.02,z0+t,z1-t,false);
    const inn=new THREE.Mesh(new THREE.BoxGeometry(x1-x0-2*t+.02,y1-y0-.04,z1-z0-2*t+.02),M.interior);inn.position.set((x0+x1)/2,(y0+y1)/2+.02,(z0+z1)/2);parent.add(inn);
    if(roof)box(roof,M.roofFlat,x0+t,x1-t,y1-.06,y1,z0+t,z1-t);
  }
  function hipRoof(parent,x0,x1,z0,z1,ye,over=.75,pitch=17){
    x0-=over;x1+=over;z0-=over;z1+=over;const w=x1-x0,d=z1-z0,s=Math.min(w,d)/2,hh=s*Math.tan(rad(pitch)),alongZ=d>=w;
    const A=[x0,ye,z1],B=[x1,ye,z1],C=[x1,ye,z0],D=[x0,ye,z0];
    const R1=alongZ?[(x0+x1)/2,ye+hh,z1-s]:[x0+s,ye+hh,(z0+z1)/2],R2=alongZ?[(x0+x1)/2,ye+hh,z0+s]:[x1-s,ye+hh,(z0+z1)/2];
    const tris=alongZ?[[A,B,R1],[B,C,R2],[B,R2,R1],[C,D,R2],[D,A,R1],[D,R1,R2]]:[[A,B,R2],[A,R2,R1],[B,C,R2],[C,D,R1],[C,R1,R2],[D,A,R1]];
    const pos=[],uv=[];tris.forEach(([p,q,rr])=>{const e=new THREE.Vector3(q[0]-p[0],0,q[2]-p[2]).normalize();[p,q,rr].forEach(v=>{pos.push(...v);const dv=new THREE.Vector3(v[0]-p[0],v[1]-p[1],v[2]-p[2]);const u=dv.dot(e),rest=dv.clone().addScaledVector(e,-u).length();uv.push(u/2.2,rest/2.2)})});
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();
    const m=mesh(g,M.roofTile.clone(),parent);m.material.map=M.roofTile.map.clone();m.material.map.repeat.set(1,1);m.material.bumpMap=m.material.map;m.material.side=THREE.DoubleSide;
    box(parent,M.white,x0+.12,x1-.12,ye-.16,ye,z0+.12,z1-.12);box(parent,M.white,x0+.34,x1-.34,ye-.34,ye-.16,z0+.34,z1-.34);   // eaves cornice, two fillets
  }
  function band(parent,x0,x1,z0,z1,y,h=.14,p=.07){box(parent,M.white,x0-p,x1+p,y,y+h,z0-p,z1+p);box(parent,M.white,x0-p*.45,x1+p*.45,y-h*.6,y,z0-p*.45,z1+p*.45)}
  function quatrefoil(parent,side,fixed,a,y,s=1){
    const d=.3*s,r=.29*s,th=rad(96);const path=(k,P)=>{const p=new P(),D=d*k,R=r*k;p.absarc(D,0,R,-th,th,false);p.absarc(0,D,R,Math.PI/2-th,Math.PI/2+th,false);p.absarc(-D,0,R,Math.PI-th,Math.PI+th,false);p.absarc(0,-D,R,1.5*Math.PI-th,1.5*Math.PI+th,false);return p};
    const sh=path(1,THREE.Shape);sh.holes.push(path(.84,THREE.Path));
    const m=mesh(new THREE.ExtrudeGeometry(sh,{depth:.05,bevelEnabled:false,curveSegments:18}),M.white,parent);
    if(side==='f')m.position.set(a,y,fixed-.005);else if(side==='l'){m.rotation.y=-Math.PI/2;m.position.set(fixed+.005,y,a)}else{m.rotation.y=Math.PI/2;m.position.set(fixed-.005,y,a)}
  }
  function lantern(parent,x,y,z){box(parent,M.frame,x-.09,x+.09,y-.2,y+.24,z,z+.16,false);box(parent,M.lamp,x-.06,x+.06,y-.14,y+.16,z+.03,z+.19,false)}
  function tree(parent,x,z,s=1,bloom=false){
    const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);const r=rng(Math.round(x*31+z*17+99));const tips=[];
    const limb=(from,dir,len,rad0,depth)=>{const to=from.clone().addScaledVector(dir,len);const m=mesh(new THREE.CylinderGeometry(rad0*.62,rad0,len,7),M.bark,g);m.position.copy(from).addScaledVector(dir,len/2);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
      if(depth===0){tips.push(to);return}const n=depth>1?3:2;for(let i=0;i<n;i++){const a=i/n*Math.PI*2+r()*1.2;const nd=dir.clone().multiplyScalar(.75).add(new THREE.Vector3(Math.cos(a)*.75,.35+r()*.3,Math.sin(a)*.75)).normalize();limb(to,nd,len*(.62+r()*.12),rad0*.6,depth-1)}};
    limb(new THREE.Vector3(0,0,0),new THREE.Vector3(.12,1,.05).normalize(),1.5*s,.11*s,3);
    const geo=new THREE.IcosahedronGeometry(1,1),n=tips.length*46,im=new THREE.InstancedMesh(geo,bloom?M.bloom:M.leaf,n),mt=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler();
    let k=0;tips.forEach(p=>{for(let i=0;i<46;i++){const sc=(.045+r()*.055)*s;e.set(r()*3,r()*3,r()*3);q.setFromEuler(e);mt.compose(new THREE.Vector3(p.x+(r()-.5)*1.25*s,p.y+(r()-.3)*.7*s,p.z+(r()-.5)*1.25*s),q,new THREE.Vector3(sc*1.3,sc*.8,sc*1.2));im.setMatrixAt(k++,mt)}});
    im.castShadow=true;im.receiveShadow=true;g.add(im);return g;
  }
  function creeper(parent,x0,x1,y,z0,z1,n=90){const r=rng(71+Math.round(x0*9+z0*5)),mt=new THREE.Matrix4(),q=new THREE.Quaternion();
    [[M.bloom,.04,.07,.55],[M.leaf,.05,.09,.62]].forEach(([mat,s0,s1,dy])=>{const im=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),mat,n);
      for(let i=0;i<n;i++){const sc=s0+r()*s1;mt.compose(new THREE.Vector3(lerp(x0,x1,r()),y+(r()-dy)*.75,lerp(z0,z1,r())),q,new THREE.Vector3(sc*1.4,sc,sc*1.4));im.setMatrixAt(i,mt)}im.castShadow=true;parent.add(im)})}
  const inkObjs=[];
  function lines(parent,pts,mat=M.ink){const g=new THREE.BufferGeometry().setFromPoints(pts.map(p=>new THREE.Vector3(...p)));const l=new THREE.LineSegments(g,mat);if(mat.isLineDashedMaterial)l.computeLineDistances();parent.add(l);inkObjs.push(l);return l}
  function wireBox(parent,x0,x1,y1,z0,z1){const e=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(x1-x0,y1,z1-z0)),M.ink);e.position.set((x0+x1)/2,y1/2,(z0+z1)/2);parent.add(e);inkObjs.push(e)}

  /* ----- site: restrained ground, plot, courtyard, boundary, street ----- */
  const PX=7.6,PZ=13.7;
  const ground=mesh(new THREE.PlaneGeometry(600,600),M.ground,site,false);ground.rotation.x=-Math.PI/2;ground.position.y=-.04;ground.receiveShadow=false;
  const catcher=mesh(new THREE.PlaneGeometry(120,120),M.shadow,site,false);catcher.rotation.x=-Math.PI/2;catcher.position.y=.005;
  {const r=box(site,M.road,-90,90,-.03,.0,PZ+1.8,PZ+9.4,false);r.receiveShadow=false}
  lines(site,[[-90,.01,PZ+1.8],[90,.01,PZ+1.8],[-90,.01,PZ+9.4],[90,.01,PZ+9.4]]);
  lines(site,[[-90,.012,PZ+5.6],[90,.012,PZ+5.6]],M.inkDash);
  box(site,M.paver,-PX,PX,0,.05,-PZ,PZ,false);                                           // plot plinth
  const lawnA=box(site,M.lawn,-PX+.5,.9,.05,.09,6.6,PZ-.5,false),lawnB=box(site,M.lawn,-PX+.5,PX-.5,.05,.09,-PZ+.5,-10.6,false);
  const yard=new THREE.Group();site.add(yard);
  box(yard,M.white,-1.6,6.0,.05,.12,-6.8,-1.2,false);                                    // courtyard stone
  box(yard,M.pool,-1.2,-.2,.1,.14,-6.4,-1.6,false);box(yard,M.frame,-1.26,-.14,.05,.13,-6.46,-1.54,false);
  box(yard,M.white,3.0,5.4,.12,.5,-2.0,-1.55);                                           // courtyard bench
  const bw=(x0,x1,z0,z1,h=2.1)=>box(site,M.white,x0,x1,0,h,z0,z1);
  bw(-PX,-PX+.23,-PZ,PZ);bw(PX-.23,PX,-PZ,PZ);bw(-PX,PX,-PZ,-PZ+.23);
  bw(-PX,-1.3,PZ-.23,PZ,.8);bw(.1,1.9,PZ-.23,PZ,.8);                                 // low street wall, piers, gates
  [[-1.3,-1.0],[-.2,.1],[1.9,2.25],[6.75,PX]].forEach(([a,b])=>bw(a,b,PZ-.3,PZ+.04,1.7));
  box(site,M.frame,2.25,6.75,.08,1.45,PZ-.16,PZ-.1);for(let i=0;i<9;i++)box(site,M.frame,2.25+i*.5+.2,2.25+i*.5+.24,.08,1.45,PZ-.19,PZ-.07,false);
  box(site,M.frame,-1.0,-.2,.08,1.45,PZ-.16,PZ-.1);
  const frangi=tree(site,4.9,9.6,1.25),courtTree=tree(yard,4.7,-5.7,1.0);const treeL=tree(site,-5.6,11.2,.9);
  creeper(site,7.0,7.5,2.1,7.5,13.2,420);creeper(site,-7.5,-7.0,2.1,-2,3,200);
  /* ----- parametric site: boundary wall height, pool, extra trees, setback lines ----- */
  const wallsB=[],gatesB=[];
  site.children.forEach(m=>{if(m.isMesh&&m.geometry.type==='BoxGeometry'){const hh=m.geometry.parameters.height,y0=m.position.y-hh/2;
    if(m.material===M.white&&Math.abs(y0)<1e-3&&hh>.6){wallsB.push(m);m.userData.h0=hh}else if(m.material===M.frame&&Math.abs(y0-.08)<1e-3){gatesB.push(m);m.userData.h0=hh}}});
  const P={wall:null,pool:false,trees:false,third:false};let wallNow=2.1;
  function wallApply(h){wallNow=h;wallsB.forEach(m=>{const h0=m.userData.h0,t=h0>1.6&&h0<1.8?h+.15:(h0<1?Math.max(h0,h):h);m.scale.y=t/h0;m.position.y=t/2});
    gatesB.forEach(m=>{const h0=m.userData.h0,t=Math.max(h0,h-.3);m.scale.y=t/h0;m.position.y=.08+t/2});dirty=true}
  const poolG=new THREE.Group();site.add(poolG);poolG.visible=false;
  box(poolG,M.white,-6.75,-3.05,.05,.17,6.75,13.05,false);box(poolG,M.frame,-6.5,-3.3,.05,.172,7.0,12.8,false);
  const water=box(poolG,new THREE.MeshStandardMaterial({color:0x4fa3b3,metalness:.55,roughness:.08,envMapIntensity:1.5}),-6.46,-3.34,.1,.18,7.04,12.76,false);
  box(poolG,M.white,-3.05,-2.2,.05,.2,8.2,11.4);                                          // pool deck step
  const treesX=new THREE.Group();site.add(treesX);treesX.visible=false;tree(treesX,-4.6,-12.1,1.0);tree(treesX,2.6,-12.2,.9);tree(treesX,6.4,12.0,.8);tree(treesX,-.3,11.6,.7);
  const SB={front:3.048,rear:1.524,side:1.524};
  {const mat=new THREE.LineDashedMaterial({color:0xa07d3e,dashSize:.28,gapSize:.2,transparent:true,opacity:.9});const a=-PX+SB.side,b=PX-SB.side,c=-PZ+SB.rear,d=PZ-SB.front;
   lines(site,[[a,.07,c],[b,.07,c],[b,.07,c],[b,.07,d],[b,.07,d],[a,.07,d],[a,.07,d],[a,.07,c]],mat)}
  function tween(ms,fn,done){if(reduce){fn(1);done&&done();return}const st=performance.now();busy++;const step=now=>{const t=Math.min(1,(now-st)/ms),e=1-Math.pow(1-t,3);fn(e);dirty=true;if(t<1)requestAnimationFrame(step);else{busy--;done&&done()}};requestAnimationFrame(step)}
  function setParams(n,animate){
    const ms=animate?1100:0;
    if('wall' in n&&n.wall!==P.wall){P.wall=n.wall;const from=wallNow,to=n.wall==null?2.1:n.wall;if(n.wall==null){wallsB.forEach(m=>{m.scale.y=1;m.position.y=m.userData.h0/2});gatesB.forEach(m=>{m.scale.y=1;m.position.y=.08+m.userData.h0/2});wallNow=2.1}else tween(ms,e=>wallApply(lerp(from,to,e)))}
    if('pool' in n&&n.pool!==P.pool){P.pool=n.pool;poolG.visible=n.pool;treeL.visible=!n.pool;lawnA.scale.x=n.pool?.52:1;lawnA.position.x=n.pool?-1.05:(-PX+.5+.9)/2;if(n.pool)tween(ms+500,e=>{water.position.y=lerp(-.05,.14,e);poolG.scale.setScalar(1)})}
    if('trees' in n&&n.trees!==P.trees){P.trees=n.trees;treesX.visible=n.trees;if(n.trees)tween(ms,e=>treesX.children.forEach(g=>g.scale.setScalar(Math.max(.01,e))))}
    if('third' in n&&n.third!==P.third){P.third=n.third;if(top){top.visible=n.third&&style!=='classical';if(top.visible)tween(ms,e=>{top.position.y=(1-e)*9})}}
    dirty=true;
  }
  function measure(){const cl=style==='classical',third=P.third&&!cl;
    return {plot:PX*2*PZ*2,ground:4.4*16+8*7+8*3+(cl?3.3*1.6:0),front:PZ-(cl?7.3:6),rear:PZ-10,side:PX-6.2,storeys:third?3:2,
      height:third?YC+PAR+3.4:(cl?YA+2.95*Math.tan(rad(17)):YA+PAR),wall:wallNow,wallSet:P.wall!=null,pool:P.pool,riser:(Y1-.17)/22,stairW:1.14,gate:4.5,third:P.third,thirdBuilt:third}}

  /* neighbours and the plot, as drawing lines only */
  wireBox(site,-PX-14.6,-PX-.9,7,-9,7);wireBox(site,PX+.9,PX+14.6,7,-9,7);wireBox(site,-PX,PX,6.6,-PZ-24,-PZ-9);
  lines(site,[[-PX-15.2,.01,-PZ],[-PX-15.2,.01,PZ],[-PX-15.2,.01,PZ],[-PX,.01,PZ],[PX,.01,PZ],[PX+15.2,.01,PZ],[PX+15.2,.01,PZ],[PX+15.2,.01,-PZ],[-PX-15.2,.01,-PZ],[PX+15.2,.01,-PZ]],M.inkDash);
  const dims=new THREE.Group();site.add(dims);
  lines(dims,[[-PX,.02,PZ+1.1],[PX,.02,PZ+1.1],[-PX,.02,PZ+.8],[-PX,.02,PZ+1.4],[PX,.02,PZ+.8],[PX,.02,PZ+1.4],[-PX-1.1,.02,-PZ],[-PX-1.1,.02,PZ],[-PX-.8,.02,-PZ],[-PX-1.4,.02,-PZ],[-PX-.8,.02,PZ],[-PX-1.4,.02,PZ]],M.brassLine);
  /* north arrow on the ground: bearing 0 in the local frame */
  const NORTH=new THREE.Vector3(Math.cos(rad(BEARING-90)),0,Math.cos(rad(BEARING))).normalize();
  {const c=new THREE.Vector3(-PX-4.2,.02,PZ-2.5),a=c.clone().addScaledVector(NORTH,2.2),b=c.clone().addScaledVector(NORTH,-1.2),s=new THREE.Vector3(-NORTH.z,0,NORTH.x);
   lines(site,[b.toArray(),a.toArray(),a.toArray(),a.clone().addScaledVector(NORTH,-.7).addScaledVector(s,.32).toArray(),a.toArray(),a.clone().addScaledVector(NORTH,-.7).addScaledVector(s,-.32).toArray()],M.brassLine)}

  /* ----- house ----- */
  const G=new THREE.Group(),F=new THREE.Group(),R=new THREE.Group(),EX=new THREE.Group();house.add(G,F,R,EX);
  let louvres=new THREE.Group(),stairGroup,style='contemporary',top=null;
  const Y1=3.5,YA=7.5,YC=7.0,PAR=.45;
  function clear(g){for(let i=g.children.length-1;i>=0;i--){const c=g.children[i];g.remove(c);c.traverse?.(o=>{if(o.geometry)o.geometry.dispose()})}}
  function stair(parent,cx,cz){
    const g=new THREE.Group();parent.add(g);const n=22,r0=.28,r1=1.42,h=Y1;
    for(let i=0;i<n;i++){const a=-Math.PI*.15+i/n*Math.PI*1.72,y=.17+i*(h-.17)/n;const tr=mesh(new THREE.BoxGeometry(r1-r0,.05,.36),M.white,g);tr.position.set(cx+Math.cos(a)*(r0+r1)/2,y,cz+Math.sin(a)*(r0+r1)/2);tr.rotation.y=-a;
      const bl=mesh(new THREE.CylinderGeometry(.012,.012,.95,5),M.frame,g,false);bl.position.set(cx+Math.cos(a)*r1,y+.5,cz+Math.sin(a)*r1)}
    const helix=(rr,dy)=>{const pts=[];for(let i=0;i<=44;i++){const a=-Math.PI*.15+i/44*Math.PI*1.72;pts.push(new THREE.Vector3(cx+Math.cos(a)*rr,.17+i/44*(h-.17)+dy,cz+Math.sin(a)*rr))}return new THREE.CatmullRomCurve3(pts)};
    mesh(new THREE.TubeGeometry(helix(r1,.98),60,.028,6),M.brass,g,false);mesh(new THREE.TubeGeometry(helix(r1,-.06),60,.05,6),M.frame,g,false);mesh(new THREE.TubeGeometry(helix(r0,-.06),40,.07,6),M.frame,g,false);
    for(let i=0;i<5;i++){const m=mesh(new THREE.SphereGeometry(.09,10,8),M.lamp,g,false);m.position.set(cx+Math.cos(i*1.26)*.34,5.9-i*.34,cz+Math.sin(i*1.26)*.34);box(g,M.frame,m.position.x-.004,m.position.x+.004,m.position.y,YA-.3,m.position.z-.004,m.position.z+.004,false)}
    return g;
  }
  function build(st){
    style=st;[G,F,R,EX].forEach(clear);louvres=new THREE.Group();top=null;
    const cl=st==='classical',mBase=cl?M.facade:M.base,sBase=cl?'facade':'base';
    /* A · stair block (left, full depth) */
    const aWinG=cl?[{a0:-4.75,a1:-3.25,y0:.5,y1:Y1-.02,mv:1,mh:2,kind:'top'}]:[{a0:-4.9,a1:-3.1,y0:.45,y1:Y1-.02,mv:1,mh:1}];
    const aWinF=cl?[{a0:-4.75,a1:-3.25,y0:Y1+.02,y1:6.7,arch:true,mv:1,mh:2}]:[{a0:-4.9,a1:-3.1,y0:Y1+.02,y1:6.95,mv:1,mh:1}];
    storey(G,{vol:'Stair block',x0:-6.2,x1:-1.8,z0:-10,z1:6,y0:0,y1:Y1,open:{f:aWinG,l:[{a0:-3,a1:1.5,y0:1.9,y1:2.6,mv:3}],r:[{a0:-6.6,a1:-1.5,y0:.12,y1:3.1,mv:3}]}});
    storey(F,{vol:'Stair block',x0:-6.2,x1:-1.8,z0:-10,z1:6,y0:Y1,y1:YA,par:cl?0:PAR,roof:cl?null:R,open:{f:aWinF,l:[{a0:-8,a1:-5.4,y0:4.6,y1:6.3,mv:1},{a0:.2,a1:2.8,y0:4.6,y1:6.3,mv:1}],r:[{a0:-6.2,a1:-2.0,y0:4.3,y1:6.5,mv:2}]}});
    stairGroup=stair(G,-4.0,4.2);
    /* B · base course (ground, right) */
    const door=cl?[]:[{a0:-1.35,a1:.25,y0:0,y1:2.95,kind:'door',rev:.5}];
    storey(G,{vol:'Base course',mat:mBase,slot:sBase,t:cl?.3:.56,x0:-1.8,x1:6.2,z0:-1,z1:6,y0:0,y1:Y1,skip:'l',open:{f:cl?[{a0:2.25,a1:3.05,y0:.6,y1:3.0,mh:2},{a0:3.95,a1:4.75,y0:.6,y1:3.0,mh:2}]:[...door,{a0:1.5,a1:5.6,y0:.3,y1:2.95,mv:2,rev:.42}],b:[{a0:-1.3,a1:5.6,y0:.12,y1:3.1,mv:4}],r:[{a0:1.2,a1:4.4,y0:1.9,y1:2.6,mv:2}]}});
    /* C · upper volume */
    const cz1=cl?6:8.4;
    storey(F,{vol:'Upper volume',t:cl?.3:.6,x0:-1.8,x1:cl?6.2:6.6,z0:-1,z1:cz1,y0:Y1,y1:YC,par:cl?0:PAR,roof:cl?null:R,skip:'l',
      open:{f:cl?[{a0:2.25,a1:3.05,y0:4.1,y1:6.4,arch:true,mh:2},{a0:3.95,a1:4.75,y0:4.1,y1:6.4,arch:true,mh:2}]:[{a0:.5,a1:5.3,y0:4.15,y1:6.5,mv:2,rev:.5}],b:[{a0:-1.0,a1:5.6,y0:4.1,y1:6.5,mv:3}],r:[{a0:.6,a1:3.4,y0:4.6,y1:6.3,mv:1}]}});
    if(!cl){wall(F,'l',-1.8,6,8.4-.6,Y1,YC+PAR,.6,M.facade,[],{slot:'facade',vol:'Upper volume',face:'North-west elevation'});
      for(const [x,z] of [[.4,7.2],[2.4,7.2],[4.4,7.2],[-.6,6.6]]){const d=mesh(new THREE.CylinderGeometry(.07,.07,.02,12),M.lamp,F,false);d.position.set(x,Y1-.235,z)}
      box(G,M.white,-1.7,.6,.05,.2,6,7.3);box(G,M.white,-1.5,.4,.05,.34,6,6.7);}
    /* D · rear wing */
    storey(G,{vol:'Garden wing',x0:-1.8,x1:6.2,z0:-10,z1:-7,y0:0,y1:Y1,skip:'l',open:{f:[{a0:-1.2,a1:5.5,y0:.12,y1:3.05,mv:4}]}});
    storey(F,{vol:'Garden wing',x0:-1.8,x1:6.2,z0:-10,z1:-7,y0:Y1,y1:YC,par:cl?0:PAR,roof:cl?null:R,skip:'l',open:{f:[{a0:-.8,a1:1.8,y0:4.3,y1:6.3,mv:1,arch:cl},{a0:2.8,a1:5.4,y0:4.3,y1:6.3,mv:1,arch:cl}]}});
    box(G,M.white,6.0,6.2,0,Y1,-7,-1);                                                   // courtyard garden wall
    /* interiors: partitions and a little furniture so the cut floors read as rooms */
    [[1.2,1.3,-.6,2.6,0],[-5.85,-2.15,.9,1.0,0],[-5.85,-2.15,-6.9,-6.8,0],[2.2,2.3,-9.65,-7.35,0]].forEach(([a,b,c,d])=>box(G,M.part,a,b,.02,Y1-.25,c,d));
    [[2.1,2.2,-.6,5.6,1],[-5.85,-2.15,-.1,0,1],[-5.85,-2.15,-5.1,-5,1],[2.1,2.2,-9.65,-7.35,1]].forEach(([a,b,c,d])=>box(F,M.part,a,b,Y1+.02,YC-.25,c,d));
    [[2.2,5.2,.3,.75,2.2,3.2,M.furn],[3.0,4.4,.3,.5,4.0,4.8,M.furnDark],[-.9,.5,.3,1.05,1.2,3.0,M.furnDark],[-5.4,-2.6,.3,1.05,-3.4,-2.4,M.furnDark],[-5.6,-2.4,.3,.78,-9.2,-7.6,M.furn],[3.0,5.6,.3,.7,-9.5,-7.7,M.furn]].forEach(([a,b,c,d,e,f,m])=>box(G,m,a,b,c-.28,d-.28,e,f));
    [[2.9,5.4,Y1+.3,Y1+.75,1.6,3.8,M.furn],[-5.6,-2.6,Y1+.3,Y1+.75,-9.2,-6.6,M.furn],[-5.4,-2.8,Y1+.3,Y1+.7,-3.6,-1.4,M.furn],[3.0,5.4,Y1+.3,Y1+.75,-9.5,-7.6,M.furn]].forEach(([a,b,c,d,e,f,m])=>box(F,m,a,b,c-.28,d-.28,e,f));
    if(cl){
      /* E · arched entrance bay, cornices, string courses, quatrefoils, tiled hip roofs, lanterns */
      storey(G,{vol:'Entrance bay',x0:-1.8,x1:1.5,z0:5.7,z1:7.3,y0:0,y1:Y1,skip:'b',open:{f:[{a0:-1.0,a1:.7,y0:0,y1:Y1-.02,mv:1,mh:3,rev:.2}]}});
      storey(F,{vol:'Entrance bay',x0:-1.8,x1:1.5,z0:5.7,z1:7.3,y0:Y1,y1:YC,skip:'b',open:{f:[{a0:-1.0,a1:.7,y0:Y1+.02,y1:6.2,arch:true,mv:1,mh:2,rev:.2}]}});
      box(F,M.white,-1.95,1.65,YC,YC+.5,5.6,7.45);band(F,-1.8,1.5,5.7,7.3,YC+.5,.16,.1);
      band(F,-6.2,-1.8,-10,6,Y1-.05);band(F,-1.8,6.2,-1,6,Y1-.05);band(F,-1.8,6.2,-10,-7,Y1-.05);
      hipRoof(R,-6.2,-1.8,-10,6,YA);hipRoof(R,-1.8,6.2,-1,6,YC);hipRoof(R,-1.8,6.2,-10,-7,YC);
      quatrefoil(F,'f',6.005,-5.45,5.45,.95);quatrefoil(F,'f',6.005,-2.55,5.45,.95);quatrefoil(F,'f',6.005,5.45,5.3,1.05);
      quatrefoil(F,'l',-6.205,3.4,5.4,1.2);quatrefoil(F,'l',-6.205,-2.2,5.4,1.2);quatrefoil(F,'r',6.205,2.5,5.6,1.1);
      lantern(G,-1.42,2.5,7.3);lantern(G,1.12,2.5,7.3);
      box(G,M.white,-1.9,1.6,.05,.2,7.3,8.3);box(G,M.white,-1.7,1.4,.05,.34,7.3,7.8);
      [[-2.3,8.0],[2.0,8.0]].forEach(([x,z])=>{const u=mesh(new THREE.CylinderGeometry(.26,.16,.5,12),M.frame,G);u.position.set(x,.3,z);const p=mesh(new THREE.IcosahedronGeometry(.34,1),M.leaf,G);p.position.set(x,.78,z);p.scale.y=.8});
    }else{
      /* teak fins: the privacy screen the revision adds */
      const fin1=(x,y0,y1,z)=>{const m=box(louvres,M.timber,x-.025,x+.025,y0,y1,z,z+.17);m.userData.y0=y0;return m};
      for(let x=.42;x<=5.4;x+=.2)fin1(x,4.02,6.63,8.42);
      for(let x=-4.98;x<=-3.0;x+=.2)fin1(x,Y1+.05,7.02,6.02);
      box(louvres,M.frame,.36,5.44,4.0,4.04,8.42,8.6);box(louvres,M.frame,.36,5.44,6.61,6.65,8.42,8.6);box(louvres,M.frame,-5.04,-2.96,7.0,7.04,6.02,6.2);
      EX.add(louvres);louvres.visible=false;
      /* roof pavilion: the third floor a brief can ask for (and the DHA check then flags) */
      top=new THREE.Group();const ty=YC+PAR;storey(top,{vol:'Roof pavilion',x0:-1.8,x1:6.6,z0:-1,z1:4.6,y0:ty,y1:ty+3.1,par:.3,open:{f:[{a0:.5,a1:5.3,y0:ty+.35,y1:ty+2.7,mv:2}],b:[{a0:-.8,a1:5.4,y0:ty+.35,y1:ty+2.7,mv:3}]}});
      box(top,M.roofFlat,-1.5,6.3,ty+3.04,ty+3.1,-.7,4.3);EX.add(top);top.visible=P.third;
    }
    house.traverse(o=>{if(o.isMesh&&o.userData.slot&&!o.userData.edges){o.userData.edges=new THREE.EdgesGeometry(o.geometry,30)}});
    select(null);setFloors(floorMode,true);dirty=true;
  }

  /* ----- selection ----- */
  let picked=[],sel=null;const pickCbs=[];
  function select(s){
    picked.forEach(l=>l.parent&&l.parent.remove(l));picked=[];sel=s;
    if(s){house.traverse(o=>{if(o.isMesh&&o.userData.slot===s.slot&&o.userData.vol===s.vol&&o.visible){const l=new THREE.LineSegments(o.userData.edges,M.pick);l.renderOrder=5;o.add(l);picked.push(l)}})}
    dirty=true;
  }
  const ray=new THREE.Raycaster(),ptr=new THREE.Vector2();let down=null;
  canvas.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY]});
  canvas.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;const r=canvas.getBoundingClientRect();ptr.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ptr,camera);
    const hit=ray.intersectObjects(house.children,true).find(h=>h.object.isMesh&&h.object.userData.slot&&h.object.parent.parent.visible);
    const s=hit?{slot:hit.object.userData.slot,vol:hit.object.userData.vol,face:hit.object.userData.face,point:hit.point.clone()}:null;select(s);pickCbs.forEach(f=>f(s))});

  /* ----- sun ----- */
  const sunArc=new THREE.Group();scene.add(sunArc);const sunDot=new THREE.Mesh(new THREE.SphereGeometry(.42,16,12),new THREE.MeshBasicMaterial({color:0xc9973f}));sunArc.add(sunDot);let arcLine=null,arcDay=-1;
  const toLocal=(az,alt)=>{const e=Math.cos(alt)*Math.sin(az),n=Math.cos(alt)*Math.cos(az);return new THREE.Vector3(e*Math.sin(rad(BEARING-90))+n*Math.cos(rad(BEARING-90)),Math.sin(alt),e*Math.sin(rad(BEARING))+n*Math.cos(rad(BEARING)))};
  const C=(h)=>new THREE.Color(h),cDay=C('#ece7dd'),cGold=C('#ebe2d2'),cDusk=C('#3d4049'),hDay=C('#f3f5f8'),hDusk=C('#8fa3c9'),sWarm=C('#ffe6cc'),sWhite=C('#fff8ee');
  let sunState={};const sunCbs=[];let rain=false,lastSun=[321,16.6];const cRain=C('#c3c7c9');
  function setSun(day,time){
    const s=solar(day,time),altD=s.alt*180/Math.PI,azD=(s.az*180/Math.PI+360)%360,v=toLocal(s.az,s.alt);
    lastSun=[day,time];const d=smooth(-5,5,altD),k=smooth(3,34,altD);
    sun.position.copy(v.clone().setY(Math.max(v.y,.05)).normalize().multiplyScalar(70));sun.intensity=3.3*d;sun.color.copy(sWarm).lerp(sWhite,k);
    hemi.intensity=lerp(.5,.46,d);hemi.color.copy(hDusk).lerp(hDay,d);scene.environmentIntensity=lerp(.5,.62,d);M.shadow.opacity=.34*d;
    const b=sunBucket(altD);scene.environment=env(b);
    BG.copy(cDusk).lerp(cGold,d).lerp(cDay,k);if(rain){BG.lerp(cRain,.82);sun.intensity*=.2;hemi.intensity=.95;hemi.color.set(0xdfe6ea)}M.ground.color.copy(BG);M.road.color.copy(BG).multiplyScalar(.955);scene.fog.color.copy(BG);
    const glow=rain?Math.max(1.25,lerp(2.1,.26,d)):lerp(2.1,.26,d);M.paver.roughness=rain?.28:.9;M.roofFlat.roughness=rain?.3:1;M.shadow.opacity=rain?.1:.34*d;M.interior.emissiveIntensity=glow;M.part.emissiveIntensity=glow*.4;M.floorIn.emissiveIntensity=glow*.45;M.lamp.emissiveIntensity=lerp(3.2,1.2,d);M.glass.opacity=lerp(.16,.36,d);
    M.ink.color.set(d<.5?0xe9e2d4:0x2a2622);M.inkDash.color.copy(M.ink.color);
    if(arcDay!==day){arcDay=day;if(arcLine){sunArc.remove(arcLine);arcLine.geometry.dispose()}const pts=[];for(let t=4.5;t<=20;t+=.2){const q=solar(day,t);if(q.alt>-.02)pts.push(toLocal(q.az,q.alt).multiplyScalar(24))}
      arcLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineDashedMaterial({color:0xb08d57,dashSize:.6,gapSize:.5,transparent:true,opacity:.8}));arcLine.computeLineDistances();sunArc.add(arcLine)}
    sunDot.position.copy(v).multiplyScalar(24);sunDot.visible=altD>-1;
    sunState={alt:altD,az:azD,bucket:b,day:rain?Math.min(d,1):d,rain};dirty=true;sunCbs.forEach(f=>f(sunState));return sunState;
  }

  /* ----- cameras ----- */
  const CAMS={street:{p:[-17.6,2.0,33.2],t:[.4,3.4,3],fov:30},court:{p:[5.3,1.62,-1.5],t:[-1.6,2.5,-4.6],fov:56},aerial:{p:[-27,22,35],t:[0,2.2,-1],fov:30},plan:{p:[0,74,.02],t:[0,0,0],fov:30}};
  let camAnim=0,camName='aerial';
  function camTarget(k){const c=CAMS[k],P=new THREE.Vector3(...c.p),T=new THREE.Vector3(...c.t),a=camera.aspect;
    if(a<1.15&&k!=='street'&&k!=='court'){P.sub(T).multiplyScalar(1+(1.15/a-1)*.8).add(T)}
    if(a<.9&&k==='street'){P.sub(T).multiplyScalar(1+(.9/a-1)*.9).add(T)}return {P,T,fov:c.fov}}
  function goCam(k,instant){camName=k;const {P,T,fov}=camTarget(k);cancelAnimationFrame(camAnim);
    if(instant||reduce){camera.position.copy(P);controls.target.copy(T);camera.fov=fov;camera.updateProjectionMatrix();controls.update();dirty=true;return Promise.resolve()}
    const p0=camera.position.clone(),t0=controls.target.clone(),f0=camera.fov,st=performance.now(),dur=1300;
    return new Promise(done=>{const step=now=>{const t=Math.min(1,(now-st)/dur),e=1-Math.pow(1-t,4);camera.position.lerpVectors(p0,P,e);controls.target.lerpVectors(t0,T,e);camera.fov=lerp(f0,fov,e);camera.updateProjectionMatrix();controls.update();dirty=true;if(t<1)camAnim=requestAnimationFrame(step);else done()};camAnim=requestAnimationFrame(step)});
  }
  const atCam=k=>{const {P,T}=camTarget(k);return camera.position.distanceTo(P)<.4&&controls.target.distanceTo(T)<.4};
  controls.addEventListener('change',()=>{dirty=true});

  /* ----- floors ----- */
  let floorMode='all',fAnim=0;const lift={F:0,R:0};
  function setFloors(mode,instant){floorMode=mode;const tgt={all:[0,0,1,1],ground:[0,0,0,0],first:[0,0,1,0],exploded:[5.2,9.6,1,1]}[mode];
    const fin=()=>{F.visible=!!tgt[2];R.visible=!!tgt[3];EX.visible=!!tgt[2];dirty=true};
    if(tgt[2])F.visible=EX.visible=true;if(tgt[3])R.visible=true;
    cancelAnimationFrame(fAnim);const a0=lift.F,b0=lift.R,st=performance.now();
    const set=(a,b)=>{lift.F=a;lift.R=b;F.position.y=a;EX.position.y=a;R.position.y=b;dirty=true};
    if(instant||reduce){set(tgt[0],tgt[1]);fin();return}
    const step=now=>{const t=Math.min(1,(now-st)/900),e=1-Math.pow(1-t,4);set(lerp(a0,tgt[0],e),lerp(b0,tgt[1],e));if(t<1)fAnim=requestAnimationFrame(step);else fin()};fAnim=requestAnimationFrame(step);
    if(sel)select(null);
  }

  /* ----- labels (HTML, projected) ----- */
  const labs=[],v3=new THREE.Vector3();
  function label(html,pos,cls='',when=()=>true){const el=document.createElement('div');el.className='lab '+cls;el.innerHTML=html;labelRoot.appendChild(el);const L={el,pos:new THREE.Vector3(...pos),when};labs.push(L);return L}
  label('50′-0″',[0,.02,PZ+1.1],'dim',()=>camName!=='street'&&camName!=='court');label('90′-0″',[-PX-1.1,.02,0],'dim',()=>camName!=='street'&&camName!=='court');
  label('Road',[-13,.02,PZ+5.6],'tag',()=>camName==='aerial'||camName==='plan');label('N',NORTH.clone().multiplyScalar(2.9).add(new THREE.Vector3(-PX-4.2,.02,PZ-2.5)).toArray(),'north',()=>camName==='aerial'||camName==='plan');
  const rooms=[['Living','double height',3.7,2.6,0],['Entrance','',-.3,2.6,0],['Stair hall','',-4,3.4,0],['Kitchen · dining','',-4,-3,0],['Courtyard','open to sky',2.2,-4,0],['Guest suite','',4.2,-8.5,0],['Staff · laundry','',-4,-8.5,0],
    ['Master suite','',4.3,3.4,1],['Family lounge','',0,3.2,1],['Bedroom 2','',-4,-2.6,1],['Bedroom 3','',-4,-7.6,1],['Bedroom 4','',2.2,-8.5,1]];
  rooms.forEach(([n,a,x,z,f])=>label(`<b>${n}</b><i>${a}</i>`,[x,f?Y1+.4:.4,z],'room',()=>f?(floorMode==='first'||floorMode==='exploded'):(floorMode==='ground'||floorMode==='exploded')).floor=f);
  function placeLabels(){const w=canvas.clientWidth,h=canvas.clientHeight;labs.forEach(L=>{v3.copy(L.pos);if(L.floor)v3.y+=lift.F;v3.project(camera);const on=L.when()&&v3.z<1&&Math.abs(v3.x)<1.05&&Math.abs(v3.y)<1.05;L.el.style.opacity=on?1:0;if(on)L.el.style.transform=`translate(-50%,-50%) translate(${((v3.x+1)/2*w).toFixed(1)}px,${((1-v3.y)/2*h).toFixed(1)}px)`})}
  function project(p){v3.copy(p).project(camera);return {x:(v3.x+1)/2*canvas.clientWidth,y:(1-v3.y)/2*canvas.clientHeight}}

  /* ----- rain: streaks, wet ground, and brass markers on the points where water gets in ----- */
  const RN=520,rainPos=new Float32Array(RN*6),rr=rng(4242);for(let i=0;i<RN;i++){const x=(rr()-.5)*46,y=rr()*24,z=(rr()-.5)*52;rainPos.set([x,y,z,x+.12,y-1.1,z+.05],i*6)}
  const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));
  const rainLines=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.42}));rainLines.visible=false;rainLines.frustumCulled=false;scene.add(rainLines);
  let rainT=0;function rainStep(){const now=performance.now(),dt=Math.min(.05,(now-rainT)/1000);rainT=now;for(let i=0;i<RN;i++){let y=rainPos[i*6+1]-dt*19;if(y<0)y+=24;rainPos[i*6+1]=y;rainPos[i*6+4]=y-1.1}rainGeo.attributes.position.needsUpdate=true}
  const MARKS={roof:[[2.4,7.05,3],[2.2,7.95,2.5]],parapet:[[6.6,7.45,6.2],[6.9,6.95,4]],wet:[[4.2,3.75,-7],[4.2,3.75,-7]],plaster:[[-5.6,5.7,6],[-5.6,5.7,6]],sill:[[2.9,4.15,8.4],[2.65,4.1,6]],plinth:[[3.6,.22,6],[3.6,.22,6]]};
  const markCbs=[],markEls={};
  Object.keys(MARKS).forEach((id,i)=>{const L=label(String(i+1),MARKS[id][0],'mark',()=>rain&&G.visible);L.id=id;L.el.dataset.id=id;markEls[id]=L;L.el.addEventListener('click',()=>markCbs.forEach(f=>f(id)))});
  function setRain(on){if(on===rain)return;rain=on;rainLines.visible=on&&!reduce;rainT=performance.now();busy+=on?1:-1;Object.values(markEls).forEach(L=>{L.pos.set(...MARKS[L.id][style==='classical'?1:0])});setSun(...lastSun);dirty=true}

  /* ----- render loop: on demand, AO pass when available ----- */
  let composer=null,gtao=null,dirty=true,W=1,H=1,raf=0,busy=0;
  try{
    composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(4,4,{samples:4,type:THREE.HalfFloatType}));
    composer.addPass(new RenderPass(scene,camera));gtao=new GTAOPass(scene,camera,4,4);
    gtao.updateGtaoMaterial({radius:1.1,distanceExponent:1.4,thickness:1.2,scale:1.25,samples:12,distanceFallOff:1,screenSpaceRadius:false});
    gtao.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6,radiusExponent:1.5,rings:2,samples:12});
    gtao.blendIntensity=.9;composer.addPass(gtao);composer.addPass(new OutputPass());
  }catch(e){composer=null;console.warn('AO pass unavailable, plain render',e)}
  function draw(){if(rain&&!reduce)rainStep();controls.update();if(composer&&opt.ao!==false)composer.render();else renderer.render(scene,camera);placeLabels();frameCbs.forEach(f=>f())}
  const frameCbs=[];
  function resize(){const r=canvas.parentElement.getBoundingClientRect();W=Math.max(2,r.width);H=Math.max(2,r.height);renderer.setSize(W,H,false);if(composer){composer.setPixelRatio(DPR);composer.setSize(W,H)}camera.aspect=W/H;camera.updateProjectionMatrix();dirty=true}
  new ResizeObserver(resize).observe(canvas.parentElement);
  function loop(){raf=requestAnimationFrame(loop);if(dirty||busy>0){dirty=false;draw()}}

  /* ----- assembly: the one orchestrated moment ----- */
  function assemble(){
    if(reduce){[G,F,R,EX,yard].forEach(g=>g.visible=true);setFloors('all',true);return Promise.resolve()}
    const parts=[[G,0,7],[F,380,11],[EX,380,11],[R,760,16]];const st=performance.now();busy++;
    parts.forEach(([g])=>{g.visible=true});dims.visible=false;yard.visible=true;
    return new Promise(done=>{const step=now=>{let all=true;parts.forEach(([g,delay,drop])=>{const t=clamp((now-st-delay)/900,0,1),e=1-Math.pow(1-t,4);g.position.y=(1-e)*drop;g.scale.setScalar(.001+.999*Math.min(1,t*30));g.visible=t>0;if(t<1)all=false});dirty=true;
      if(!all)requestAnimationFrame(step);else{busy--;dims.visible=true;lift.F=lift.R=0;setFloors('all',true);done()}};requestAnimationFrame(step)});
  }
  function setLouvres(on,animate){if(style==='classical')return;louvres.visible=on;if(on&&animate&&!reduce){const st=performance.now();busy++;const kids=louvres.children;const step=now=>{let all=true;kids.forEach((m,i)=>{const t=clamp((now-st-i*22)/420,0,1),e=1-Math.pow(1-t,3);m.scale.y=Math.max(.001,e);if(m.userData.y0!==undefined){const hgt=m.geometry.parameters.height;m.position.y=m.userData.y0+hgt*e/2}if(t<1)all=false});dirty=true;if(!all)requestAnimationFrame(step);else busy--};requestAnimationFrame(step)}dirty=true}
  function snapshot(w=960,h=540){const pw=W,ph=H,pa=camera.aspect;renderer.setPixelRatio(1);renderer.setSize(w,h,false);if(composer){composer.setPixelRatio(1);composer.setSize(w,h)}camera.aspect=w/h;camera.updateProjectionMatrix();
    const vis=sunArc.visible;sunArc.visible=false;picked.forEach(l=>l.visible=false);if(composer&&opt.ao!==false)composer.render();else renderer.render(scene,camera);const url=canvas.toDataURL('image/jpeg',.86);sunArc.visible=vis;picked.forEach(l=>l.visible=true);
    renderer.setPixelRatio(DPR);renderer.setSize(pw,ph,false);if(composer){composer.setPixelRatio(DPR);composer.setSize(pw,ph)}camera.aspect=pa;camera.updateProjectionMatrix();dirty=true;return url}

  build('contemporary');resize();goCam('aerial',true);setSun(321,16.6);loop();
  return {
    build,setStyle:build,get style(){return style},
    setMaterial(k){applyFacade(k);dirty=true},get material(){return facadeKey},
    setSun,get sun(){return sunState},onSun:f=>sunCbs.push(f),showSunPath(v){sunArc.visible=v;dirty=true},
    goCam,atCam,get cam(){return camName},setFloors,get floors(){return floorMode},
    setLouvres,get louvres(){return louvres.visible},
    setParams,get params(){return {...P}},measure,
    setRain,get rain(){return rain},onMark:f=>markCbs.push(f),markActive(id){Object.values(markEls).forEach(L=>L.el.classList.toggle('on',L.id===id))},
    select,get selection(){return sel},onPick:f=>pickCbs.push(f),
    assemble,snapshot,project,onFrame:f=>frameCbs.push(f),resize,requestRender(){dirty=true},
    setDrawing(v){inkObjs.forEach(o=>o.visible=v);labelRoot.style.display=v?'':'none';dirty=true},
    hide(){[G,F,R,EX,yard].forEach(g=>g.visible=false);dirty=true},show(){[G,F,R,EX,yard].forEach(g=>g.visible=true);setFloors(floorMode,true)},
    northScreenAngle(){const a=project(new THREE.Vector3(0,0,0)),b=project(NORTH.clone().multiplyScalar(4));return Math.atan2(b.x-a.x,-(b.y-a.y))*180/Math.PI},
    footprint:{ground:(4.4*16)+(8*7)+(8*3),first:(4.4*16)+(8.4*9.4)+(8*3),plot:15.2*27.4},
  };
}
