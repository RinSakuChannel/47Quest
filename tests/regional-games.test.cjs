const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const box={window:{}};vm.runInNewContext(fs.readFileSync('src/regional-games.js','utf8'),box);
const {games,definitions}=box.window.QUEST_REGIONAL_GAMES;
assert.equal(Object.keys(games).length,44);
for(const [code,factory] of Object.entries(games)){
  let time=0,wins=0;
  const coords=(...args)=>args.forEach(v=>{if(typeof v==='number')assert(Number.isFinite(v),`${code}: finite rendering coordinates`);});
  const api={get phase(){return Math.min(2,Math.floor(time/15))},get time(){return time},win(){wins++},miss(){},tell(){},circle:coords,box:coords,line(points){points.forEach(p=>coords(p.x,p.y))},text:coords,icon:coords,target:coords};
  const game=factory(api);assert.equal(typeof game.draw,'function');
  let previous={x:500,y:300,down:false};
  for(let i=0;i<1200;i++){
    time=i/20;const p={x:100+(i*31)%800,y:60+(i*17)%480,down:i%30<24};
    game.input?.(i%30===0?'down':i%30===24?'up':'move',p,previous);game.step?.(.05,p);game.draw();previous=p;
  }
  game.input?.('cancel',{x:0,y:0,down:false},previous);game.draw();
}
// Grabbing an edge must preserve the cursor offset, not teleport the block.
{
 let snow=null;
 const game=games['05']({tell(){},win(){},box(){},line(){},target(){},text(text,x,y){if(text==='雪')snow={x,y};}});
 game.input('down',{x:180,y:405});
 game.input('move',{x:181,y:406});game.draw();
 assert.equal(snow.x,151);assert.equal(snow.y,396);
 game.input('cancel',{x:181,y:406});game.draw();
 assert.equal(snow.x,150);assert.equal(snow.y,395);
}
console.log('PASS: 44 regional factories, finite rendering, cancellation and Akita grab offset (not visual or clearability testing)');
