const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const calls=[];const window={};
const ctx=vm.createContext({window});
for(const file of ['prefectures','character-personalities'])vm.runInContext(fs.readFileSync(`src/${file}.js`,'utf8'),ctx);
assert.equal(Object.keys(window.QUEST_PERSONALITIES).length,47);
assert.equal(new Set(Object.values(window.QUEST_PERSONALITIES).map(p=>p.line)).size,47);
for(const p of window.PREFECTURE_DATA){assert.ok(p.characterCopy.length>15);assert.equal(p.funStats.length,2);for(const [label,v] of p.funStats){assert.ok(label);assert.ok(v>=0&&v<=100);}assert.ok(p.voiceLine);assert.ok(p.specialty&&p.feature);}
window.SpeechSynthesisUtterance=function(text){this.text=text;};
window.speechSynthesis={cancel(){calls.push('cancel');},getVoices(){return[{lang:'ja-JP'}];},speak(s){calls.push(s);}};
vm.runInContext(fs.readFileSync('src/character-cries.js','utf8'),ctx);
for(let n=1;n<=47;n++){window.QUEST_CHARACTER_CRIES.play({destination:{}},String(n).padStart(2,'0'),.2);assert.equal(calls.at(-1).volume,.2);assert.equal(calls.at(-1).lang,'ja-JP');assert.ok(calls.at(-1).text);}
window.QUEST_CHARACTER_CRIES.play({destination:{}},'02',0);assert.equal(calls.at(-1),'cancel');
console.log('PASS: 47 distinct Japanese lines, 47 profiles, stats range, speech volume and mute');
window.Audio=function(src){this.src=src;this.play=()=>{calls.push(this);return Promise.resolve();};this.pause=()=>calls.push('paused');this.removeAttribute=()=>{};};
for(let n=1;n<=47;n++){
 const code=String(n).padStart(2,'0'),wav=fs.readFileSync(`assets/sounds/voices/${code}.wav`);
 assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.toString('ascii',8,12),'WAVE');
 let data;for(let offset=12;offset+8<wav.length;){const size=wav.readUInt32LE(offset+4);if(wav.toString('ascii',offset,offset+4)==='data'){data=wav.subarray(offset+8,offset+8+size);break;}offset+=8+size+(size%2);}
 assert.ok(data?.length>24000);let peak=0;for(let i=0;i+1<data.length;i+=2)peak=Math.max(peak,Math.abs(data.readInt16LE(i)));assert.ok(peak>100,`silent ${code}`);
 window.QUEST_CHARACTER_CRIES.play({destination:{}},code,.15);assert.equal(calls.at(-1).volume,.15);assert.match(calls.at(-1).src,new RegExp(`${code}\\.wav$`));
}
window.QUEST_CHARACTER_CRIES.stop();assert.ok(calls.includes('paused'));
console.log('PASS: 47 non-silent WAV files, actual-file playback, volume, cancellation');
