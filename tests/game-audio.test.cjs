const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync('src/game-audio.js','utf8'),sandbox);
const audio=sandbox.window.QUEST_AUDIO;
assert.equal(Object.keys(audio.recipes).length,47);
assert.equal(new Set(Object.values(audio.recipes).map(r=>JSON.stringify(r[1]))).size,47,'no identical effect recipes');
assert.equal(Object.keys(audio.profiles).length,47);
assert.equal(new Set(Object.values(audio.profiles).map(p=>JSON.stringify([p.root,p.wave,p.accent,p.shift,p.voicing,p.mode]))).size,47,'every prefecture needs a distinct playable music identity');
let connected=0,voices=0;const bus={};
const param=()=>({value:0,setValueAtTime(v,t){assert(Number.isFinite(v)&&Number.isFinite(t));},linearRampToValueAtTime(v,t){assert(Number.isFinite(v)&&Number.isFinite(t));},exponentialRampToValueAtTime(v,t){assert(v>0&&Number.isFinite(t));}});
const node=()=>({frequency:param(),gain:param(),Q:param(),connect(destination){if(destination===bus)connected++;return destination;},disconnect(){},start(t){assert(Number.isFinite(t));voices++;},stop(t){assert(Number.isFinite(t));}});
const context={currentTime:1,sampleRate:8000,createBuffer(channels,size){return{getChannelData(){return new Float32Array(size)}}},createGain:node,createOscillator:node,createBiquadFilter:node,createBufferSource:node};
for(const code of Object.keys(audio.recipes)){for(const event of ['action','motion','release','good','wrong','win'])assert.equal(audio.effect(context,bus,code,event),true);}
for(const scene of Object.keys(audio.scenes))for(let step=0;step<64;step++)audio.music(context,bus,scene,step,2+step*.25,{code:'02',mode:'catch',intensity:step/63,urgent:step>48,seed:1234});
assert.equal(connected,voices,'every sound must go through its supplied volume bus');
console.log(`PASS: 47 distinct material recipes and music identities, dynamic scene arrangements, ${voices} scheduled voices routed through volume control. Listening test not performed.`);
