const field=document.getElementById("plot");
let plotRect, cachedTerrain,terrainKey="";
function coords(x,y,s,W,H){
  const l=s.obj.limit;
  const left=38,right=W-18,top=47,bottom=H-27;
  const fy=s.obj.dimension===1;
  const ymin=fy?(s.obj.max?-159:0):-l, ymax=fy?(s.obj.max?16:27):l;
  return [left+(x+l)/(2*l)*(right-left),bottom-(y-ymin)/(ymax-ymin)*(bottom-top)];
}
function pointOf(s,pos,W,H){return coords(pos[0],s.obj.dimension===1?s.obj.fn(pos):pos[1],s,W,H);}
function line(c,x,y,u,v){c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.stroke();}
function dot(c,x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fill();}
function terrain(s,W,H){
  const cache=document.createElement("canvas"), ratio=Math.min(devicePixelRatio||1,2);
  cache.width=W*ratio;cache.height=H*ratio;const c=cache.getContext("2d");c.scale(ratio,ratio);
  const l=s.obj.limit, left=38, right=W-18, top=47, bottom=H-27;
  c.fillStyle="#0c302e";c.fillRect(0,0,W,H);
  const sample=(px,py)=>s.obj.fn([((px-left)/(right-left)*2-1)*l,((bottom-py)/(bottom-top)*2-1)*l]);
  if(s.obj.dimension===2){
    const isPeaks=s.obj===objectives.peaks, range=isPeaks?[-6.6,8.2]:[0,83];
    const colors=[[8,37,48],[12,54,55],[21,77,68],[53,102,73],[102,126,74],[158,158,91]];
    const res=2,g=document.createElement("canvas");g.width=Math.ceil(W/res);g.height=Math.ceil(H/res);
    const gc=g.getContext("2d"),img=gc.createImageData(g.width,g.height);
    for(let y=0;y<g.height;y++)for(let x=0;x<g.width;x++){
      const z=sample(x*res,y*res),t=bound((z-range[0])/(range[1]-range[0]),0,.9999)*(colors.length-1),k=Math.floor(t);
      const pix=(y*g.width+x)*4, noise=1.6*Math.sin(x*13.1+y*35.2);
      for(let j=0;j<3;j++)img.data[pix+j]=colors[k][j]+(colors[k+1][j]-colors[k][j])*(t-k)+noise;
      img.data[pix+3]=255;
    }
    gc.putImageData(img,0,0);c.drawImage(g,0,0,W,H);
    // Interpolate each crossing so isolines follow the same objective as the particles.
    const h=isPeaks?5:3, cols=Math.ceil(W/h)+1, rows=Math.ceil(H/h)+1;
    const values=Array.from({length:rows},(_,j)=>Array.from({length:cols},(_,i)=>sample(i*h,j*h)));
    const spacing=isPeaks?.32:3;
    for(let n=Math.ceil(range[0]/spacing);n*spacing<range[1];n++){
      const level=n*spacing; c.beginPath();
      for(let j=0;j<rows-1;j++)for(let i=0;i<cols-1;i++){
        const a=values[j][i],b=values[j][i+1],d=values[j+1][i],e=values[j+1][i+1];
        if(level<Math.min(a,b,d,e)||level>=Math.max(a,b,d,e))continue;
        const pts=[],px=i*h,py=j*h;
        if((a>level)!==(b>level))pts.push([px+h*(level-a)/(b-a),py]);
        if((b>level)!==(e>level))pts.push([px+h,py+h*(level-b)/(e-b)]);
        if((d>level)!==(e>level))pts.push([px+h*(level-d)/(e-d),py+h]);
        if((a>level)!==(d>level))pts.push([px,py+h*(level-a)/(d-a)]);
        for(let k=1;k<pts.length;k+=2){c.moveTo(...pts[k-1]);c.lineTo(...pts[k]);}
      }
      c.strokeStyle=n%4===0?"rgba(221,235,172,.60)":"rgba(195,220,163,.34)";c.lineWidth=n%4===0?1:.65;c.stroke();
    }
  }else{
    c.beginPath();
    for(let i=0;i<=400;i++){const p=pointOf(s,[-l+2*l*i/400],W,H);if(i===0)c.moveTo(...p);else c.lineTo(...p);}
    c.strokeStyle="#c9dc92";c.lineWidth=2;c.stroke();
  }
  c.font='12px Consolas, monospace';c.lineWidth=.6;c.textAlign="center";
  for(let i=0;i<=4;i++){
    const x=left+(right-left)*i/4,y=bottom-(bottom-top)*i/4;
    c.strokeStyle="rgba(214,238,212,.20)";c.setLineDash([2,5]);line(c,x,top,x,bottom);line(c,left,y,right,y);c.setLineDash([]);
    c.fillStyle="#d4e5d7";c.fillText(String(Number((-l+2*l*i/4).toFixed(2))),x,bottom+17);
    const yval=s.obj.dimension===2?(-l+2*l*i/4):s.obj.max?(-159+175*i/4):(27*i/4);
    c.textAlign="right";c.fillText(String(Number(yval.toFixed(1))),left-5,y+4);c.textAlign="center";
  }
  c.textAlign="left";c.fillStyle="#d8e6d6";c.fillText(s.obj.dimension===2?"y":"f(x)",5,top-7);c.fillText("x",right+6,bottom+16);
  return cache;
}
function renderMap(s,selected,showTrails,chart){
  const {width,height}=field.getBoundingClientRect(),W=Math.round(width),H=Math.round(height);if(!W||!H)return;
  const ratio=Math.min(devicePixelRatio||1,2);field.width=W*ratio;field.height=H*ratio;
  const c=field.getContext("2d");c.scale(ratio,ratio);plotRect={W,H};
  if(chart){drawHistory(c,s,W,H);return;}
  const key=[s.obj.name,W,H,ratio].join("/");
  if(key!==terrainKey){cachedTerrain=terrain(s,W,H);terrainKey=key;}
  c.drawImage(cachedTerrain,0,0,W,H);c.save();c.beginPath();c.rect(30,39,W-39,H-55);c.clip();
  s.particles.forEach((p,i)=>{
    if(showTrails&&p.trail.length>1){
      c.lineWidth=i===selected?1.8:1;c.strokeStyle=i===selected?"#c0f6db":"rgba(202,246,226,.42)";c.beginPath();
      p.trail.forEach((pos,j)=>{const pt=pointOf(s,pos,W,H);if(j===0)c.moveTo(...pt);else c.lineTo(...pt);});c.stroke();
    }
    if(s.phase===1){
      const end=p.x.map((x,d)=>bound(x+p.v[d],-s.obj.limit,s.obj.limit));
      c.setLineDash([3,3]);c.strokeStyle=i===selected?"#f6ffe8":"#b2d4be";c.lineWidth=i===selected?2:1;
      line(c,...pointOf(s,p.x,W,H),...pointOf(s,end,W,H));c.setLineDash([]);
    }
  });
  s.particles.forEach((p,i)=>{
    const [x,y]=pointOf(s,p.x,W,H);dot(c,x,y,4.1,"#0b4035");dot(c,x,y,2.9,"#e7f6cf");
    if(i===selected){c.strokeStyle="#9ef8e6";c.lineWidth=1.5;c.beginPath();c.arc(x,y,8,0,2*Math.PI);c.stroke();
      c.font="bold 12px Consolas, monospace";c.fillStyle="#0d302bf2";const tx=x>W-65?x-44:x+10;c.fillRect(tx,y-18,31,18);c.fillStyle="#d8fae8";c.fillText("P"+String(i+1).padStart(2,"0"),tx+4,y-5);}
  });
  const [gx,gy]=pointOf(s,s.best.x,W,H);c.translate(gx,gy);c.rotate(Math.PI/4);
  c.strokeStyle="#ffd076";c.fillStyle="#f0b354";c.lineWidth=1.4;c.strokeRect(-6,-6,12,12);c.fillRect(-2.3,-2.3,4.6,4.6);c.restore();
}
function drawHistory(c,s,W,H){
  c.fillStyle="#0d322f";c.fillRect(0,0,W,H);const a=s.history,min=Math.min(...a),max=Math.max(...a),pad=Math.max((max-min)*.12,Math.abs(max)*.015,.00001);
  const lo=min-pad,hi=max+pad,left=69,right=W-23,top=62,bottom=H-34;
  const Y=v=>bottom-(v-lo)/(hi-lo)*(bottom-top),X=t=>left+t/Math.max(1,s.t)*(right-left);
  c.font="12px Consolas, monospace";
  for(let i=0;i<=4;i++){const val=lo+(hi-lo)*i/4,y=Y(val);c.strokeStyle="#496c5d";line(c,left,y,right,y);c.fillStyle="#d2e6d7";c.textAlign="right";c.fillText(fmt(val,3),left-6,y+4);}
  c.beginPath();c.moveTo(X(0),Y(a[0]));for(let i=1;i<a.length;i++){c.lineTo(X(i),Y(a[i-1]));c.lineTo(X(i),Y(a[i]));}
  c.lineWidth=2.6;c.strokeStyle="#c6e9a1";c.stroke();dot(c,X(s.t),Y(a[s.t]),4,"#ffca78");
  c.textAlign="left";c.fillStyle="#d2e6d7";c.fillText("0",left,bottom+20);c.textAlign="right";c.fillText("iteration "+s.t,right,bottom+20);
}
function decorations(){
  const mark=document.getElementById("mark").getContext("2d");mark.scale(2,2);mark.lineWidth=1.55;mark.strokeStyle="#1f644b";
  for(let n=0;n<5;n++){mark.beginPath();for(let i=0;i<=140;i++){const t=i*Math.PI/70,r=(5+n*2.65)*(1+.12*Math.sin(3*t+.3)+.08*Math.cos(2*t));const x=19.2+r*Math.cos(t),y=20+r*Math.sin(t);if(i===0)mark.moveTo(x,y);else mark.lineTo(x,y);}mark.stroke();}
  const c=document.getElementById("engraving").getContext("2d");c.translate(214,123);c.scale(1.42,1.42);
  const project=(x,y)=>[(x-y)*22,(x+y)*8-objectives.peaks.fn([x,y])*8.5];
  c.lineWidth=.75;
  for(let axis=0;axis<2;axis++)for(let k=0;k<=26;k++){
    const a=-3+6*k/26;c.beginPath();for(let i=0;i<=100;i++){const b=-3+6*i/100,p=axis?project(a,b):project(b,a);if(!i)c.moveTo(...p);else c.lineTo(...p);}
    c.strokeStyle=axis?"#74a089":"#9cb69d";c.stroke();
  }
  const p=project(-.009,1.581);dot(c,...p,2.4,"#ba8c40");
}
