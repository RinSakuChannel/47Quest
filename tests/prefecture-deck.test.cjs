const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

global.window = {};
vm.runInThisContext(fs.readFileSync('src/prefecture-deck.js', 'utf8'));

const codes = Array.from({ length: 47 }, (_, index) => String(index + 1).padStart(2, '0'));
let deck = [];
const drawn = [];
let seed = 91247;
const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

for (let round = 0; round < 16; round += 1) {
  const result = window.QUEST_PREFECTURE_DECK.draw(codes, deck, 3, random);
  assert.equal(result.selected.length, 3);
  assert.equal(new Set(result.selected).size, 3, 'one round must not contain duplicates');
  drawn.push(...result.selected);
  deck = result.deck;
}

assert.equal(new Set(drawn.slice(0, 47)).size, 47, 'the first 47 questions must cover every prefecture exactly once');
assert.deepEqual(new Set(drawn.slice(0, 47)), new Set(codes));
console.log('prefecture deck: 47/47 covered, no duplicates inside any round');
