const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const sandbox = { window:{} };
vm.runInNewContext(fs.readFileSync('src/regional-games.js', 'utf8'), sandbox);
vm.runInNewContext(fs.readFileSync('src/featured-games.js', 'utf8'), sandbox);

const definitions = sandbox.window.QUEST_FEATURED_GAMES.definitions;
const codes = Object.keys(definitions).sort();
assert.deepEqual(codes, Array.from({length:47}, (_, index) => String(index + 1).padStart(2, '0')));

for (const [code, game] of Object.entries(definitions)) {
  for (const key of ['title','command','lesson','demo','gesture','variation']) {
    assert.equal(typeof game[key], 'string', `${code}: ${key} must be text`);
    assert.ok(game[key].trim().length >= (key === 'demo' ? 1 : 2), `${code}: ${key} is too short`);
  }
  assert.ok(game.time >= 10 && game.time <= 30, `${code}: play time must stay within 10–30 seconds`);
  assert.ok(game.goal > 0, `${code}: goal must be positive`);
  assert.equal(game.acts.length, 3, `${code}: three escalating round messages are required`);
}

const unique = (key) => new Set(Object.values(definitions).map(game => game[key]));
assert.equal(unique('title').size, 47, 'every prefecture needs its own game title');
assert.equal(unique('variation').size, 47, 'every game needs a distinct replay variation');
assert.ok(unique('gesture').size >= 35, 'the 47 games need broad operation variety');

console.log(`PASS: ${codes.length} complete game definitions, ${unique('gesture').size} operation patterns, 47 distinct replay variations, all 10–30 seconds`);
