"use strict";
const objectives = {
  peaks: {name:"Peaks landscape", dimension:2, limit:3, max:true, target:"8.1062 near (−0.0093, 1.5814)", description:"Three hills compete. Search for the highest summit.", fn:([x,y]) => 3*(1-x)**2*Math.exp(-x*x-(y+1)**2)-10*(x/5-x**3-y**5)*Math.exp(-x*x-y*y)-Math.exp(-((x+1)**2)-y*y)/3},
  bowl: {name:"Quadratic bowl", dimension:1, limit:5, max:false, target:"0 at x = 0", description:"Follow a smooth bowl down to its lowest point.", fn:([x]) => x*x},
  rastrigin: {name:"Rastrigin field", dimension:2, limit:5.12, max:false, target:"0 at (0, 0)", description:"Find the deepest basin among repeating local valleys.", fn:([x,y]) => 20+x*x+y*y-10*(Math.cos(2*Math.PI*x)+Math.cos(2*Math.PI*y))},
  arch: {name:"Inverted parabola", dimension:1, limit:10, max:true, target:"10 at x = 3", description:"Climb a smooth arch to find its highest point.", fn:([x]) => 10-(x-3)**2}
};
const recordedDraws = [[.61,.86],[.75,.25],[.32,.84]];
const expected = [
  {v:-2.58,x:1.42,f:2.0164},
  {v:1.875,x:-1.125,f:1.265625},
  {v:0,x:2,f:4}
];
function seeded(seed) {
  let s = seed >>> 0;
  return () => {s = (Math.imul(s,1664525)+1013904223) >>> 0; return s/4294967296;};
}
function bound(n,a,b){return Math.min(b,Math.max(a,n));}
class Swarm {
  constructor(key,config,seed=107,lecture=false) {
    this.obj=objectives[key]; this.cfg={...config}; this.random=seeded(seed);
    this.lecture=lecture; this.t=0; this.phase=0; this.improvements=0;
    const {limit,dimension,fn}=this.obj;
    this.particles=Array.from({length:config.n},(_,i)=>{
      const x=Array.from({length:dimension},()=>lecture?[4,-3,2][i]:(this.random()*2-1)*limit);
      const v=x.map(()=>lecture?0:(this.random()*2-1)*limit*.2);
      return {x,v,f:fn(x),p:x.slice(),pf:fn(x),trail:[x.slice()],terms:null};
    });
    this.collectBest(); this.history=[this.best.f];
  }
  better(a,b){return this.obj.max?a>b:a<b;}
  collectBest(){
    this.particles.forEach((p,i)=>{
      if(!this.best||this.better(p.pf,this.best.f)) this.best={x:p.p.slice(),f:p.pf,i};
    });
  }
  step() {
    const {limit,fn}=this.obj, {w,c1,c2}=this.cfg;
    if(this.phase===0){
      this.previousBest={...this.best};
      this.particles.forEach((p,i)=>{
        p.old=p.x.slice();
        p.terms=p.x.map((x,d)=>{
          const [r1,r2]=this.lecture&&this.t===0?recordedDraws[i]:[this.random(),this.random()];
          const inertia=w*p.v[d], memory=c1*r1*(p.p[d]-x), social=c2*r2*(this.best.x[d]-x);
          const raw=inertia+memory+social;
          return {inertia,memory,social,r1,r2,raw,v:this.lecture?raw:bound(raw,-.4*limit,.4*limit)};
        });
        p.v=p.terms.map(q=>q.v);
      });
      this.phase=1;
    }else if(this.phase===1){
      this.particles.forEach(p=>{
        p.x=p.x.map((x,d)=>bound(x+p.v[d],-limit,limit)); p.f=fn(p.x);
        p.trail.push(p.x.slice()); if(p.trail.length>14) p.trail.shift();
      });
      this.phase=2;
    }else{
      this.improvements=0;
      this.particles.forEach(p=>{
        if(this.better(p.f,p.pf)){p.p=p.x.slice();p.pf=p.f;this.improvements++;}
      });
      this.collectBest(); this.history.push(this.best.f); this.t++; this.phase=0;
    }
  }
}
function checkLecture(){
  const s=new Swarm("bowl",{n:3,w:.7,c1:1.5,c2:1.5},1,true);
  for(let i=0;i<3;i++)s.step();
  const near=(a,b)=>Math.abs(a-b)<1e-9;
  const rows=s.particles.map((p,i)=>({p,ok:near(p.v[0],expected[i].v)&&near(p.x[0],expected[i].x)&&near(p.f,expected[i].f)&&near(p.p[0],expected[i].x)}));
  return {rows,ok:rows.every(row=>row.ok)&&s.best.i===1&&near(s.best.x[0],-1.125)&&near(s.best.f,1.265625)};
}
