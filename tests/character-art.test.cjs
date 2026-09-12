const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{}};vm.runInNewContext(fs.readFileSync('src/character-art.js','utf8'),context);
const art=context.window.CHARACTER_ART;
const actors=context.window.QUEST_CHARACTER_ACTORS;
assert.equal(new Set(Object.values(art)).size,Object.keys(art).length);
assert.equal(Object.keys(art).length,47);assert.ok(actors?.markup&&actors?.svg);
assert.equal(Object.keys(actors.motion).length,47);assert.ok(new Set(Object.values(actors.motion)).size>=4);
for(const [code,data] of Object.entries(art)){
 assert.match(code,/^(0[1-9]|[1-3][0-9]|4[0-7])$/);assert.match(data,/^data:image\/svg\+xml/);
 const svg=decodeURIComponent(data.slice(data.indexOf(',')+1));
 for(const part of ['actor-eye-left','actor-eye-right','actor-pupil','actor-mouth-joy','actor-mouth-sad','actor-arm-left','actor-arm-right','actor-ornament'])assert.match(svg,new RegExp(part),`${code}: missing ${part}`);
}
console.log('PASS: 47/47 unique layered SVG actors include eyes, pupils, mouths, arms, ornaments and four motion personalities');
