const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('src/app.js','utf8');
function fn(name){const start=src.indexOf(`function ${name}(`);const end=src.indexOf('\nfunction ',start+1);return src.slice(start,end<0?undefined:end);}
const PREFECTURES=Array.from({length:47},(_,i)=>({code:String(i+1).padStart(2,'0'),name:`県${i}`}));
const state={coins:0,reviewResults:{},reviewIndex:0,round:PREFECTURES.slice(0,3),unlocked:new Set(),cleared:new Set(),current:PREFECTURES[0],screen:'review',gachaRewards:[],gachaFromReview:false,gachaPrefecture:null,gachaBusy:false};
const saved={};const ctx={state,PREFECTURES,storage:{get:(k,fallback)=>saved[k]??fallback,set:(k,v)=>saved[k]=v},sound(){},cleanups(){},shell:s=>s,button:()=>'',app:{},saveProgress(){saved.unlocked=[...state.unlocked];},renderRewardReveal(){state.screen='reward-reveal';},Math:Object.create(Math)};
vm.createContext(ctx);vm.runInContext(fn('advanceReview')+'\n'+fn('pullGacha'),ctx);
for(let i=0;i<3;i++){
  state.current=PREFECTURES[i];ctx.advanceReview(i!==1);ctx.advanceReview(true);
  assert.equal(state.coins,1);assert.equal(state.screen,'review-coin');assert.equal(state.gachaFromReview,true);assert.equal(state.gachaPrefecture.code,PREFECTURES[i].code);
  state.screen='gacha';state.gachaBusy=false;ctx.Math.random=()=>i/47;ctx.pullGacha();
  assert.equal(state.coins,0);assert.equal(state.screen,'reward-reveal');assert.equal(state.gachaFromReview,false);assert.equal(state.gachaRewards.at(-1).code,PREFECTURES[i].code);
}
assert.equal(state.reviewIndex,3);assert.equal(state.cleared.size,3);assert.equal(state.gachaRewards.length,3);assert.equal(state.unlocked.size,3);
assert.equal(saved['47quest-learning']['01'].recalled,1);
assert.equal(saved['47quest-learning']['02'].practiced,1);
assert.equal(saved['47quest-learning']['02'].recalled,0);
state.screen='gacha';state.gachaBusy=false;ctx.pullGacha();assert.equal(state.coins,0);
assert.match(src,/mapLayers\(pref,`\$\{pref.name\}の場所/);assert.match(src,/characterStats\(pref, 'reveal-stats'\)/);
console.log('PASS: each review immediately awards its matching prefecture character, preserves three reveals, and records learning clears');
