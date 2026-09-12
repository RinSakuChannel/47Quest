const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const sandbox={window:{}};
vm.runInNewContext(readFileSync('src/regional-games.js','utf8'),sandbox);
vm.runInNewContext(readFileSync('src/featured-games.js','utf8'),sandbox);
const {round,definitions}=sandbox.window.QUEST_FEATURED_GAMES;
assert.equal(Object.keys(definitions).length,47,'all prefectures must use the new engine');
for(const def of Object.values(definitions)){
  const r=round(def.goal,def.time);
  for(let i=0;i<def.goal;i++)r.hit();
  assert.equal(r.stars,1);
  const ticks=Math.round(def.time/.05);
  for(let i=0;i<ticks-1;i++)assert.equal(r.tick(.05),false,'must not end before configured limit');
  assert.equal(r.tick(.05),true);
  const practice=round(def.goal,def.time);
  for(let i=0;i<ticks-1;i++)assert.equal(practice.tick(.05),false,'round remains active until configured limit');
  assert.equal(practice.tick(.05),true,'round ends at configured limit');
  const bonus=round(def.goal);for(let i=0;i<def.goal*3;i++)bonus.hit();
  assert.equal(bonus.stars,3);assert.equal(bonus.score,def.goal*3);
  bonus.miss();assert.equal(bonus.streak,0);assert.equal(bonus.score,def.goal*3,'mistake never confiscates points');
  const phase=round(def.goal);phase.elapsed=9;assert.equal(phase.phase,1);phase.elapsed=17;assert.equal(phase.phase,2);
  const pause=round(def.goal);pause.tick(0);assert.equal(pause.elapsed,0);
}
vm.runInNewContext(readFileSync('src/microgames-v3.js','utf8'),sandbox);
assert.equal(Object.keys(sandbox.window.QUEST_MICROGAMES.catalog).length,47);
for(const [code,def] of Object.entries(definitions)){
  assert.equal(sandbox.window.QUEST_MICROGAMES.catalog[code].title,def.title);
  assert.equal(sandbox.window.QUEST_MICROGAMES.catalog[code].time,20);
}
console.log('PASS: 20-second round cap, stars, phases, scoring, catalog integration');
