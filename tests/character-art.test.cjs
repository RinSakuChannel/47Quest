const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{}};vm.runInNewContext(fs.readFileSync('src/character-art.js','utf8'),context);
const art=context.window.CHARACTER_ART;
assert.equal(new Set(Object.values(art)).size,Object.keys(art).length);
for(const [code,path] of Object.entries(art)){assert.match(code,/^(0[1-9]|[1-3][0-9]|4[0-7])$/);assert.ok(fs.existsSync(path));assert.ok(fs.statSync(path).size<500000);}
console.log(`PASS: ${Object.keys(art).length}/47 replacement assets exist, unique paths, each under 500 KB`);
