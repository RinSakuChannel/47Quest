const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync('src/regional-games.js','utf8'),sandbox);
const {games}=sandbox.window.QUEST_REGIONAL_GAMES;

function session(code){
  let time=0,wins=0,misses=0,view={circles:[],boxes:[],texts:[],icons:[],targets:[],mascots:[]};
  const api={
    get phase(){return Math.min(2,Math.floor(time/6.7));},get time(){return time;},
    win(){wins++;},progress(){},miss(){misses++;},tell(){},winterScene(){},
    circle(x,y,r,color){view.circles.push({x,y,r,color});},box(x,y,w,h,color){view.boxes.push({x,y,w,h,color});},
    line(){},text(s,x,y,size,color){view.texts.push({s,x,y,size,color});},
    icon(s,x,y,size){view.icons.push({s,x,y,size});},target(x,y,r){view.targets.push({x,y,r});},
    mascot(x,y,size){view.mascots.push({x,y,size});},
  };
  const game=games[code](api);let pointer={x:500,y:300,down:false};
  function draw(){view={circles:[],boxes:[],texts:[],icons:[],targets:[],mascots:[]};game.draw();return view;}
  function input(kind,p,previous=pointer){const next={...pointer,...p,down:kind==='down'?true:kind==='up'||kind==='cancel'?false:(p.down??pointer.down)};game.input?.(kind,next,previous);pointer=next;return next;}
  function step(seconds,p=pointer){for(let elapsed=0;elapsed<seconds&&!wins;elapsed+=.025){time+=.025;pointer={...pointer,...p};game.step?.(.025,pointer);}}
  function tap(p){input('down',p);input('up',p);}
  function drag(from,to,steps=8){input('down',from);let previous={...from,down:true};for(let i=1;i<=steps;i++){const p={x:from.x+(to.x-from.x)*i/steps,y:from.y+(to.y-from.y)*i/steps,down:true};input('move',p,previous);previous=p;}input('up',to,previous);}
  return {game,draw,input,step,tap,drag,get wins(){return wins;},get misses(){return misses;}};
}

const solvers={
  '01'(s){const snows=s.draw().icons.filter(i=>i.s==='❄');for(const snow of snows)s.drag(s.draw().circles.at(-1),snow,30);s.drag(s.draw().circles.at(-1),{x:875,y:380},40);},
  '03'(s){for(let n=0;n<80&&!s.wins;n++){for(const x of [220,500,780])s.tap({x,y:350});s.step(.2);}},
  '04'(s){for(let n=0;n<30&&!s.wins;n++){const v=s.draw(),goal=v.targets[0],chime=v.icons.find(i=>i.s==='🎐'),d=Math.max(1,Math.hypot(goal.x-chime.x,goal.y-chime.y)),to={x:chime.x+(goal.x-chime.x)/d*100,y:chime.y+(goal.y-chime.y)/d*100};s.input('down',chime);s.input('move',to,{...chime,down:true});s.input('up',to);s.step(.35);}},
  '05'(s){for(let n=0;n<5&&!s.wins;n++){const target=s.draw().targets[0];s.drag({x:150,y:395},target);}},
  '06'(s){const v=s.draw();s.drag({x:330,y:340},v.targets[1]);s.drag(s.draw().circles.find(c=>c.color==='#d74755'),s.draw().targets[0]);},
  '07'(s){for(let n=0;n<15&&!s.wins;n++){const bell=s.draw().icons.find(i=>i.s==='🔔');s.tap({x:bell.x,y:430});s.step(2);}},
  '08'(s){for(let n=0;n<360&&!s.wins;n++){s.tap({x:500,y:280});s.step(.1);}},
  '09'(s){for(let n=0;n<4&&!s.wins;n++){const v=s.draw(),origin=v.icons.find(i=>i.s==='🍓'),goal=v.targets[0],flight=1.2,vx=(goal.x-origin.x)/flight,vy=(goal.y-origin.y-120*flight*flight)/flight;s.drag(origin,{x:origin.x-vx/4,y:origin.y-vy/4});s.step(1.5);}},
  '10'(s){for(let round=0;round<3&&!s.wins;round++){const view=s.draw(),yellow=view.boxes.find(b=>b.color==='#ffd85d'),arrow=view.texts.find(t=>t.s==='▲'),target=(287-yellow.y)/2.1,pivot=700,rate=42+(pivot-300)*.16;s.drag({x:arrow.x,y:420},{x:pivot,y:420});s.input('down',{x:180,y:330});s.step(target/rate,{x:180,y:330,down:true});s.input('up',{x:180,y:330});}},
  '11'(s){for(let side=0;side<2;side++){for(let n=0;n<100&&s.draw().boxes.filter(b=>b.color==='#dfab3f').length<=side;n++)s.step(.1);if(side===0)s.tap({x:430,y:300});}s.drag({x:430,y:300},{x:830,y:310});},
  '13'(s){const points=Array.from({length:8},(_,i)=>({x:500+Math.cos(i*Math.PI/4)*190,y:290+Math.sin(i*Math.PI/4)*150}));for(let n=0;n<80&&!s.wins;n++){points.forEach(p=>s.tap(p));s.step(.1);}},
  '14'(s){for(let n=0;n<360&&!s.wins;n++){const fish=s.draw().icons.filter(i=>i.s==='🐟'&&i.x<810).sort((a,b)=>a.x-b.x)[0];if(!fish)break;s.step(.08,{x:fish.x-90,y:fish.y,down:true});}},
  '15'(s){for(let n=0;n<12&&!s.wins;n++){const grains=s.draw().circles.filter(c=>c.color==='#fff');for(const g of grains)for(let i=0;i<6;i++)s.input('move',{x:g.x+(500-g.x)*i/6,y:g.y+(280-g.y)*i/6,down:true});}s.drag({x:160,y:490},{x:500,y:280});},
  '16'(s){for(let n=0;n<8&&!s.wins;n++){s.step(.4);const squid=s.draw().icons.find(i=>i.s==='🦑');if(squid)s.tap(squid);}},
  '17'(s){const v=s.draw(),foil=v.boxes.find(b=>b.color==='#efd060'),goal=v.targets[0];s.drag({x:foil.x+foil.w/2,y:foil.y+foil.h/2},goal,24);},
  '18'(s){for(let y=20;y<420;y+=35)for(let x=25;x<1000;x+=42)s.input('move',{x,y,down:true});for(let n=0;n<3&&!s.wins;n++){const bone=s.draw().icons.find(i=>i.s==='🦴');assert.ok(bone,'a brushed fossil remains available');s.drag(bone,{x:500,y:500});}},
  '19'(s){for(const p of [{x:500,y:120},{x:680,y:300},{x:500,y:480},{x:320,y:300}]){s.input('down',p);s.input('move',{...p,down:true});s.step(1.7);s.input('up',p);}},
  '20'(s){const yellow=s.draw().boxes.find(b=>b.color==='#ffdc5b');const width=yellow.x-280;s.input('down',{x:500,y:300});s.step(width/120);s.input('up',{x:500,y:300});s.step(5);},
  '21'(s){const fish=s.draw().icons.find(i=>i.s==='🐟');s.drag({x:150,y:100},fish);s.drag(fish,{x:fish.x,y:80});},
  '22'(s){for(const bud of s.draw().icons.filter(i=>i.s==='🌱'))s.drag(bud,{x:bud.x,y:bud.y-100});},
  '23'(s){for(let n=0;n<30&&!s.wins;n++){const fire=s.draw().icons.find(i=>i.s==='🔥');if(fire)s.tap(fire);s.step(.4);}},
  '24'(s){for(let n=0;n<40&&!s.wins;n++){const pearl=s.draw().circles.find(c=>c.color==='#fff');if(pearl)s.drag(pearl,{x:pearl.x,y:100});else s.step(.1);}},
  '25'(s){for(let n=0;n<18&&!s.wins;n++)s.tap({x:n%2?700:300,y:450});},
  '26'(s){for(let n=0;n<500&&!s.wins;n++){const v=s.draw(),petal=v.icons.find(i=>i.s==='🌸'),goal=v.targets[0];if(petal.y>goal.y+60)s.tap({x:petal.x-(goal.x-petal.x)/1.8,y:490});s.step(.05);}},
  '27'(s){const pans=[{x:300,y:200},{x:680,y:200},{x:300,y:430},{x:680,y:430}];for(const p of pans){s.tap(p);s.tap(p);}s.step(2.5);for(const p of pans)s.tap(p);},
  '28'(s){for(let n=0;n<420&&!s.wins;n++){const bird=s.draw().icons.find(i=>i.s==='🕊');if(bird.y>350){const from={x:bird.x,y:bird.y+70,down:true},to={x:bird.x,y:bird.y-35,down:true};s.input('move',to,from);}s.step(.04);}},
  '29'(s){for(let n=0;n<160&&!s.wins;n++){const ready=s.draw().texts.find(t=>t.s==='どうぞ！');if(ready)s.drag({x:500,y:470},{x:ready.x,y:250});else s.step(.08);}},
  '30'(s){for(let n=0;n<12&&!s.wins;n++){const orange=s.draw().icons.find(i=>i.s==='🍊'),big=orange.size>70;s.tap({x:big?750:250,y:300});s.step(3.1);}},
  '31'(s){const goal=s.draw().targets[0].x,height=(goal-130)/4.018;s.input('down',{x:500,y:450-height});s.input('move',{x:500,y:450-height,down:true});s.input('up',{x:500,y:450-height});s.tap({x:130,y:420});s.step(4);},
  '32'(s){s.input('down',{x:100,y:450});for(const target of s.draw().targets){s.input('move',{...target,down:true});}for(let n=0;n<3&&!s.wins;n++){const target=s.draw().targets[0];if(target)s.input('move',{...target,down:true});}s.input('up',{x:800,y:200});},
  '33'(s){const peach=s.draw().icons.find(i=>i.s==='🍑');s.step(2.4,{x:peach.x,y:330,down:true});for(let y=332;y<=450&&!s.wins;y+=2)s.step(.025,{x:peach.x,y,down:true});},
  '34'(s){for(let n=0;n<500&&!s.wins;n++){const v=s.draw(),boat=v.icons.find(i=>i.s==='🍁'),gate=v.targets[0];if(gate&&gate.x-boat.x<115)s.tap({x:gate.x,y:300});s.step(.04);}},
  '35'(s){for(let n=0;n<8&&!s.wins;n++){const wantedBig=s.draw().texts.some(t=>t.s==='大');s.tap({x:wantedBig?725:275,y:526});s.step(6);}},
  '36'(s){for(let n=0;n<260&&!s.wins;n++){s.step(.04);const foot=s.draw().icons.find(i=>i.s==='👣'&&Math.abs(i.y-430)<70);if(foot)s.tap(foot);}},
  '38'(s){s.tap({x:500,y:200});for(let n=0;n<700&&!s.wins;n++){const marker=s.draw().boxes.find(b=>b.w===10&&b.h===32);if(marker&&marker.x>505)s.tap({x:500,y:180});else if(marker&&marker.x<485)s.tap({x:500,y:420});s.step(.04);}},
  '39'(s){for(let n=0;n<18&&!s.wins;n++){s.step(1.45,{x:500,y:300,down:true});s.step(.8,{x:500,y:300,down:false});}},
  '40'(s){let jumped=false;for(let n=0;n<700&&!s.wins;n++){const wave=s.draw().icons.find(i=>i.s==='🌊');if(wave.x>355&&wave.x<385&&!jumped){s.tap({x:500,y:300});s.step(.1);s.tap({x:500,y:300});jumped=true;}if(wave.x>850)jumped=false;s.step(.04);}},
  '41'(s){for(let n=0;n<900&&!s.wins;n++){s.step(.02);const lit=s.draw().circles.find(c=>c.color==='#ffd34f'&&c.x>680);if(lit)s.tap({x:800,y:lit.y});}},
  '42'(s){for(const target of s.draw().targets)s.drag({x:target.x,y:170},{x:target.x,y:420});},
  '43'(s){for(const x of [260,500,740])for(let n=0;n<4&&!s.wins;n++)s.tap({x,y:300});},
  '44'(s){s.tap({x:500,y:300});for(let n=0;n<900&&!s.wins;n++){const v=s.draw(),current=Number.parseFloat(v.texts.find(t=>String(t.s).endsWith('℃'))?.s),target=Number.parseFloat(v.texts.find(t=>String(t.s).startsWith('目標'))?.s.match(/\d+/)?.[0]);if(current<target-.4)s.step(.04,{x:740,y:460,down:true});else if(current>target+.4)s.step(.04,{x:260,y:460,down:true});else s.step(.04,{x:500,y:300,down:false});}},
  '45'(s){const v=s.draw(),net=v.texts.find(t=>t.s==='網'),fruit=v.targets[0];s.input('down',net);s.input('move',{...fruit,down:true});for(let i=0;i<=28&&!s.wins;i++){const t=i/28*Math.PI*2;s.input('move',{x:fruit.x+120*Math.cos(t),y:fruit.y+120*Math.sin(t),down:true});}s.input('up',{x:fruit.x+120,y:fruit.y});},
  '46'(s){let target=s.draw().targets[0];s.input('down',target);for(let n=0;n<4;n++){target=s.draw().targets[0];s.input('move',{...target,down:true});}const potato=s.draw().icons.find(i=>i.s==='🍠');s.input('move',{x:potato.x,y:100,down:true});s.input('up',{x:potato.x,y:100});},
  '47'(s){s.input('down',{x:150,y:80});for(const target of s.draw().targets)s.input('move',{...target,down:true});s.input('move',{x:840,y:70,down:true});s.input('up',{x:840,y:70});},
};

assert.deepEqual(Object.keys(solvers).sort(),Object.keys(games).sort(),'every regional game needs an explicit playthrough');
for(const [code,solve] of Object.entries(solvers)){
  const idle=session(code);idle.draw();idle.step(25,{x:500,y:300,down:false});assert.equal(idle.wins,0,`${code}: must not clear without input`);
  const played=session(code);solve(played);assert.ok(played.wins>0,`${code}: intended controls must clear the game`);played.game.input?.('cancel',{x:0,y:0,down:false});played.draw();
}
console.log('PASS: 44/44 regional games reject idle play and clear through their intended, distinct controls');
