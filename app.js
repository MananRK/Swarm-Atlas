const $=id=>document.getElementById(id);
const icons={
  map:"<path d='m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15m6-12v15'/>",
  book:"<path d='M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1zm0 0v14'/>",
  calc:"<rect x='5' y='2.5' width='14' height='19' rx='2'/><path d='M8 7h8M8 11h2m4 0h2m-8 4h2m4 0h2m-8 3h2'/>",
  play:"<path d='m7 4 12 8-12 8z' fill='currentColor' stroke='none'/>",pause:"<path d='M8 5v14m8-14v14' stroke-width='4'/>",
  step:"<path d='m5 5 10 7-10 7zm13 0v14'/>",reset:"<path d='M3 4v6h6M4 9a8 8 0 1 1 .8 8'/>",
  sliders:"<path d='M4 5h8m4 0h4M4 12h2m4 0h10M4 19h10m4 0h2'/><circle cx='14' cy='5' r='2'/><circle cx='8' cy='12' r='2'/><circle cx='16' cy='19' r='2'/>",
  notes:"<rect x='5' y='3' width='14' height='18' rx='2'/><path d='M9 3v18m3-12h4m-4 4h4M3 7h3m-3 5h3m-3 5h3'/>",
  cross:"<circle cx='12' cy='12' r='7'/><path d='M12 2v5m0 10v5M2 12h5m10 0h5'/>",close:"<path d='m6 6 12 12M6 18 18 6'/>"
};
const icon=k=>'<i aria-hidden="true"><svg viewBox="0 0 24 24">'+icons[k]+'</svg></i>';
document.querySelectorAll("[data-icon]").forEach(el=>{el.outerHTML=icon(el.dataset.icon);});
const config={n:24,w:.7,c1:1.5,c2:1.5};
const ranges=[["n","Swarm size","N",3,48,1],["w","Inertia","w",0,1.2,.05],["c1","Personal pull","c₁",0,3,.05],["c2","Social pull","c₂",0,3,.05]];
let sim, selected=0, playing=false, lecture=false, view="map",timer=null, seed=107;
const maxIterations=100;
function fmt(x,d=4){if(x===0)return "0";if(Math.abs(x)<.5*10**(-d))return x.toExponential(2);return String(Number(x.toFixed(d)));}
const vec=(v,d=3)=>v.length===1?fmt(v[0],d):"("+v.map(x=>fmt(x,d)).join(", ")+")";
const pid=i=>"P"+String(i+1).padStart(2,"0");
$("problem").innerHTML=Object.entries(objectives).map(([k,o])=>'<option value="'+k+'">'+o.name+'</option>').join("");
$("sliders").innerHTML=ranges.map(([k,name,symbol,min,max,step])=>'<div><div class="slidertop"><label for="'+k+'">'+name+' <small>'+symbol+'</small></label><output for="'+k+'" id="'+k+'Val"></output></div><input type="range" id="'+k+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+config[k]+'"></div>').join("");
function controlValues(){
  for(const [k,,,min,max] of ranges){const el=$(k);el.value=config[k];el.style.setProperty("--pct",100*(config[k]-min)/(max-min)+"%");$(k+"Val").textContent=k==="n"?config[k]:config[k].toFixed(2);}
}
function stop(){playing=false;clearTimeout(timer);timer=null;}
function reset(){
  stop();sim=new Swarm($("problem").value,config,seed,lecture);selected=bound(selected,0,config.n-1);
  $("particle").innerHTML=sim.particles.map((p,i)=>'<option value="'+i+'">'+pid(i)+'</option>').join("");
  $("problemHint").textContent=sim.obj.description;
  $("configHint").textContent=lecture?"Lecture replay uses recorded draws for the first iteration. Editing a parameter opens a seeded experiment.":"Changing a parameter restarts the run from the same seed.";
  controlValues();render();
}
function advance(){if(sim.t<maxIterations)sim.step();if(sim.t>=maxIterations) stop();render();}
function schedule(){clearTimeout(timer);if(playing)timer=setTimeout(()=>{advance();schedule();},Number($("speed").value));}
function togglePlay(){if(playing){stop();render();}else if(sim.t<maxIterations){playing=true;advance();schedule();}}
function describe(){
  const p=sim.particles[selected],id=pid(selected),goal=sim.obj.max?"highest":"lowest";
  if(sim.phase===1)return ["01 / 03 · Velocity","Choose the next move.",
    id+" combines its momentum, its own best position, and the swarm’s shared best. Its new velocity is "+vec(p.v)+". Dashed lines show the planned moves."];
  if(sim.phase===2)return ["02 / 03 · Position & fitness","Move and measure.",
    id+" moves from "+vec(p.old)+" to "+vec(p.x)+" and scores "+fmt(p.f)+". Each particle is evaluated at its new location. The best memories still hold their previous values."];
  if(sim.t===0)return ["Initialization","Meet the swarm.",
    "Each of the "+config.n+" particles remembers its starting position. "+pid(sim.best.i)+" has the "+goal+" initial score, so the swarm uses its position as the first shared best."];
  const improved=sim.better(sim.best.f,sim.previousBest.f);
  return ["03 / 03 · Update memory",sim.t===maxIterations?"Iteration limit reached.":improved?"A new swarm best.":"Keep the best discovery.",
    sim.improvements+" of "+config.n+" particles improved their own records. "+(improved?pid(sim.best.i)+" improved the shared best from "+fmt(sim.previousBest.f)+" to "+fmt(sim.best.f)+".":"The swarm keeps its previous best of "+fmt(sim.best.f)+".")+" The next move uses this shared memory."];
}
function render(){
  const p=sim.particles[selected],it=sim.t+(sim.phase?1:0);
  $("play").innerHTML=icon(playing?"pause":"play")+(playing?"Pause":"Play");$("step").disabled=$("play").disabled=sim.t>=maxIterations;
  $("status").textContent=sim.t>=maxIterations?"Complete":playing?"Playing":sim.t===0&&sim.phase===0?"Ready":"Paused";
  $("maplabel").textContent=view==="map"?(lecture?"Lecture replay":sim.obj.name)+" / "+sim.obj.dimension+"D":"Best fitness history";
  $("iteration").textContent="Iteration "+String(it).padStart(3,"0")+" / 100";
  $("fitness").textContent=fmt(sim.best.f);$("bestPosition").textContent=vec(sim.best.x);
  const [phase,title,explanation]=describe();$("phaseLine").textContent=phase;$("stepTitle").textContent=title;$("explain").textContent=explanation;
  $("particle").value=selected;
  $("mapTab").setAttribute("aria-pressed",view==="map");$("chartTab").setAttribute("aria-pressed",view==="chart");
  $("legend").innerHTML=view==="map"?'<span><b class="keydot"></b>Particle</span><span><b class="keybest"></b>Swarm best</span><span><b class="keyprobe"></b>Tracked particle</span>':'<span><b class="keydot"></b>Best recorded fitness per completed iteration</span>';
  const terms=p.terms;
  const term=(label,value)=>'<div class="term"><span>'+label+'</span><b>'+value+'</b></div>';
  $("probe").innerHTML='<div><div class="eyeline">'+pid(selected)+' · '+(sim.obj.max?"Maximize":"Minimize")+'</div><p>Position <b class="num">'+vec(p.x)+'</b> · Fitness <b class="num">'+fmt(p.f)+'</b></p><p>Personal best <b class="num">'+vec(p.p)+'</b></p></div><div><div class="terms">'+(terms?["inertia","memory","social"].map((k,i)=>term(["Inertia","Personal pull","Social pull"][i],vec(terms.map(q=>q[k])))).join(""):term("Starting velocity",vec(p.v)))+'</div><p class="hint">'+(terms?(lecture?"Velocity is the sum of these three terms.":"The sum is capped at 20% of the search range per axis."):"Step once to inspect the three contributions to velocity.")+'</p></div>';
  if($("population").open)renderRows();
  renderMap(sim,selected,$("trails").checked,view==="chart");
}
function renderRows(){$("rows").innerHTML=sim.particles.map((p,i)=>'<tr class="'+(i===selected?"activeRow":"")+'"><th scope="row">'+pid(i)+'</th><td>'+vec(p.x)+'</td><td>'+vec(p.v)+'</td><td>'+fmt(p.f)+'</td><td>'+vec(p.p)+'</td><td>'+fmt(p.pf)+'</td></tr>').join("");}
$("population").ontoggle=()=>{if($("population").open)renderRows();};
$("problem").onchange=()=>{lecture=false;selected=0;reset();};
for(const [k] of ranges)$(k).oninput=()=>{config[k]=Number($(k).value);lecture=false;reset();};
$("play").onclick=togglePlay;$("step").onclick=()=>{stop();advance();};$("reset").onclick=reset;$("speed").onchange=schedule;
$("particle").onchange=()=>{selected=Number($("particle").value);render();};
$("trails").onchange=render;
$("mapTab").onclick=()=>{view="map";render();};$("chartTab").onclick=()=>{view="chart";render();};
field.onclick=e=>{
  if(view!=="map")return;
  const r=field.getBoundingClientRect();let best=17,found=selected;
  sim.particles.forEach((p,i)=>{const [x,y]=pointOf(sim,p.x,plotRect.W,plotRect.H);const d=Math.hypot(e.clientX-r.left-x,e.clientY-r.top-y);if(d<best){best=d;found=i;}});
  selected=found;render();
};
function dialog(html){
  stop();render();$("reading").innerHTML=html;$("reader").showModal();$("reader").scrollTop=0;
}
$("close").onclick=()=>$("reader").close();
$("reader").onclick=e=>{if(e.target===$("reader")){const r=$("reader").getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$("reader").close();}};
$("guideBtn").onclick=()=>dialog('<h2>Field guide</h2><h3>Read the field</h3><p>Each dot is a candidate solution. On a 2D landscape, both axes are inputs. Contours join positions with the same fitness, and lighter bands mark higher values. On a 1D problem the vertical axis shows fitness directly. The gold diamond marks the best position found so far.</p><p><b>'+sim.obj.name+'</b> · '+sim.obj.description+' Its reference optimum is '+sim.obj.target+'. The swarm only receives scores at the positions it samples.</p><h3>Follow one particle</h3><p>Click a dot or choose a particle in the inspector. Step through one full iteration in three clicks. First calculate velocity, then move and score each particle, then update the memories. A trail shows its last fourteen positions.</p><div class="equation">v′ = wv + c₁r₁(p − x) + c₂r₂(g − x)<br>x′ = x + v′</div><p>Inertia carries the previous velocity forward. Personal pull points toward the particle’s best visit, p. Social pull points toward the swarm’s best visit, g. Independent random weights r₁ and r₂ scale the pulls on each axis. Every particle uses the same previous swarm best for a given iteration.</p><h3>Run an experiment</h3><p>Set social pull to zero and watch the paths. Reset, then raise social pull and compare how quickly the particles gather. Reset reuses the seed so you can compare settings from the same starting positions for a fixed swarm size.</p><p>Exploration uses fixed inertia, a speed limit of 20% of the search range per axis, and positions clipped to the domain. Playback stops after 100 iterations. The worked example uses the lecture’s unclamped velocities and recorded first-step draws.</p><p class="sources">Course references · <i>PSO-Lecture Notes</i>, sections 2–6, and A. P. Engelbrecht, <i>Computational Intelligence: An Introduction</i>, chapter 16, sections 16.1.1 and 16.1.4.</p>');
$("exampleBtn").onclick=()=>{
  const check=checkLecture();
  dialog('<div class="eyeline">Lecture notes · Problem 1 · pp. 3–4</div><h2>One move, by hand.</h2><p>Minimize f(x) = x². Three particles start at 4, −3, and 2 with zero velocity. Their scores are 16, 9, and 4, so the first shared best is x = 2. Use w = 0.7 and c₁ = c₂ = 1.5.</p><h3>Calculate P01’s first move</h3><p>Use the lecture’s draws r₁ = 0.61 and r₂ = 0.86. P01 starts at its own best, so only the social term moves it.</p><div class="equation">v′ = 0.7(0) + 1.5(0.61)(4 − 4) + 1.5(0.86)(2 − 4) = −2.58<br>x′ = 4 − 2.58 = 1.42<br>f(x′) = 1.42² = 2.0164</div><h3>Check the whole swarm</h3><p>The simulator runs the same three updates and compares its velocity, position, fitness, and memory with the hand values below.</p><div class="scrolltable"><table><thead><tr><th>Particle</th><th>r₁ / r₂</th><th>Hand v′</th><th>Hand x′</th><th>Hand f</th><th>Simulator f</th></tr></thead><tbody>'+expected.map((e,i)=>'<tr><th>'+pid(i)+'</th><td>'+recordedDraws[i].join(' / ')+'</td><td>'+e.v+'</td><td>'+e.x+'</td><td>'+e.f+'</td><td>'+fmt(check.rows[i].p.f,6)+'</td></tr>').join("")+'</tbody></table></div><p class="passed">'+(check.ok?"✓ All three particles and the shared best match.":"Comparison failed.")+'</p><p>P02 takes the lead at x = −1.125 with f = 1.265625. Replay the first iteration with three clicks of Step. Later iterations use seeded draws.</p><button id="loadLecture" class="primary">'+icon("play")+'Replay in simulator</button>');
  $("loadLecture").onclick=()=>{lecture=true;$("problem").value="bowl";Object.assign(config,{n:3,w:.7,c1:1.5,c2:1.5});selected=0;view="map";$("reader").close();reset();$("step").focus();};
};
decorations();reset();
new ResizeObserver(()=>renderMap(sim,selected,$("trails").checked,view==="chart")).observe(field.parentElement);
