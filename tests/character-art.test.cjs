const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{}};vm.runInNewContext(fs.readFileSync('src/character-art.js','utf8'),context);
const art=context.window.CHARACTER_ART;
assert.equal(Object.keys(art).length,47);
assert.equal(new Set(Object.values(art)).size,47);
for(const [code,file] of Object.entries(art)){
 assert.match(code,/^(0[1-9]|[1-3][0-9]|4[0-7])$/);
 assert.match(file,/^\.\/assets\/characters\/v[34]\/\d{2}\.webp$/);
 assert.ok(fs.existsSync(file),`${code}: missing ${file}`);
 assert.ok(fs.statSync(file).size>1000&&fs.statSync(file).size<500000,`${code}: suspicious asset size`);
}
console.log('PASS: 47/47 individual uncanny character assets exist, use unique paths, and fit the size budget');
