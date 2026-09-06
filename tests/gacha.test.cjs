const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('src/app.js','utf8');
function fn(name){const start=src.indexOf(`function ${name}(`);const end=src.indexOf('\nfunction ',start+1);return src.slice(start,end<0?undefined:end);}
const PREFECTURES=Array.from({length:47},(_,i)=>({code:String(i+1).padStart(2,'0'),name:`県${i}`}));
const state={coins:0,reviewResults:{},reviewIndex:0,unlocked:new Set(),current:PREFECTURES[0],screen:'review'};
const saved={};const ctx={state,PREFECTURES,storage:{set:(k,v)=>saved[k]=v},sound(){},cleanups(){},shell:s=>s,button:()=>'',app:{},saveProgress(){saved.unlocked=[...state.unlocked];},renderRewardReveal(){state.screen='reward-reveal';},Math:Object.create(Math)};
vm.createContext(ctx);vm.runInContext(fn('advanceReview')+'\n'+fn('pullGacha'),ctx);
for(let i=0;i<3;i++){state.current=PREFECTURES[i];ctx.advanceReview(i!==1);ctx.advanceReview(true);}
assert.equal(state.coins,3);assert.equal(state.unlocked.size,0);assert.equal(state.reviewIndex,3);
state.screen='gacha';ctx.Math.random=()=>.9999;ctx.pullGacha();assert.equal(state.coins,2);assert.ok(state.unlocked.has('47'));ctx.pullGacha();assert.equal(state.coins,2);
for(let i=0;i<2;i++){state.screen='gacha';state.gachaBusy=false;ctx.Math.random=()=>0;ctx.pullGacha();}
assert.equal(state.coins,0);assert.equal(state.unlocked.size,2);state.screen='gacha';state.gachaBusy=false;ctx.pullGacha();assert.equal(state.coins,0);
assert.match(src,/mapLayers\(pref,`\$\{pref.name\}の場所/);assert.match(src,/characterStats\(pref, 'reveal-stats'\)/);
console.log('PASS: 3 reviews = 3 coins, hints included, no double award, random non-reviewed prefecture, duplicate draw, no overspend, map and stats in result');
