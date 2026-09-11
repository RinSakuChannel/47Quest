const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const box={window:{}};vm.runInNewContext(fs.readFileSync('src/gesture-guide.js','utf8'),box);
const codes=Object.values(box.window.QUEST_GESTURE_GUIDE.types).flat();
assert.equal(codes.length,47);assert.equal(new Set(codes).size,47);
for(let i=1;i<=47;i++)assert.ok(codes.includes(String(i).padStart(2,'0')));
console.log('PASS: all 47 games have exactly one operation guide');
