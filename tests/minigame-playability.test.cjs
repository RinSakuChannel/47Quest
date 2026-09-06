const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const box={window:{}};vm.runInNewContext(fs.readFileSync('src/regional-games.js','utf8'),box);
function setup(code){
  let wins=0,time=0,icons=[],targets=[];
  const api={get phase(){return 0},get time(){return time},win(){wins++},miss(){},tell(){},box(){},circle(){},line(){},text(){},icon(s,x,y){icons.push({s,x,y})},target(x,y){targets.push({x,y})}};
  const game=box.window.QUEST_REGIONAL_GAMES.games[code](api);
  return {game,get wins(){return wins},draw(){icons=[];targets=[];game.draw();return {icons,targets}},step(dt=.05){time+=dt;game.step?.(dt,{down:false,x:500,y:500})},tap(p){game.input?.('down',{...p,down:true});game.input?.('up',{...p,down:false})}};
}
for(const code of ['03','23','26']){
  const idle=setup(code);for(let i=0;i<500;i++)idle.step();assert.equal(idle.wins,0,`${code}: no automatic win`);
}
const soba=setup('03');for(let i=0;i<100&&!soba.wins;i++){if(i%10===0)for(const x of [220,500,780])soba.tap({x,y:350});soba.step();}assert.ok(soba.wins,'soba can be served within 5 seconds');
for(let trial=0;trial<15;trial++){
  const water=setup('23');
  for(let i=0;i<400&&!water.wins;i++){
    if(i%20===0){const fire=water.draw().icons.find(o=>o.s==='🔥');if(fire)water.tap(fire);}water.step();
  }
  assert.ok(water.wins,'aiming at visible fires clears the round');
  const wind=setup('26');
  for(let i=0;i<450&&!wind.wins;i++){
    const view=wind.draw(),p=view.icons.find(o=>o.s==='🌸'),g=view.targets[0];
    if(i%10===0&&p.y>g.y+60){wind.tap({x:p.x-(g.x-p.x)/1.8,y:470});}wind.step();
  }
  assert.ok(wind.wins,'directed gusts can reach three randomized rings within 25 seconds');
}
const cancelled=setup('23');cancelled.game.input('down',{x:650,y:160,down:true});cancelled.game.input('cancel',{x:650,y:160,down:false});cancelled.game.input('up',{x:650,y:160,down:false});for(let i=0;i<40;i++)cancelled.step();assert.equal(cancelled.draw().icons.filter(i=>i.s==='🔥').length,3,'cancel never fires');
console.log('PASS: 3 redesigned games playable, idle cannot win, aim cancellation, 15 randomized trajectories');
