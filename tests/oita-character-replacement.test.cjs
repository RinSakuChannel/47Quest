const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const sharp = require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

(async () => {
  const context = {window: {}};
  vm.runInNewContext(fs.readFileSync('src/prefectures.js', 'utf8'), context);
  vm.runInNewContext(fs.readFileSync('src/character-personalities.js', 'utf8'), context);
  const oita = context.window.PREFECTURE_DATA.find(prefecture => prefecture.code === '44');
  assert.equal(oita.character, 'ユゲイシゴロウ');
  assert.match(oita.characterCopy, /湯の花/);
  assert.match(oita.characterCopy, /かぼす/);
  assert.deepEqual(Array.from(oita.funStats, row => Array.from(row)), [['見つめ返す力', 100], ['一日の歩数', 0]]);
  assert.equal(oita.voiceLine, '見てましたね。こちらも、見ています。');
  assert.equal(oita.specialMove, 'ゆけむりかくれ');

  const checkedFiles = [
    'src/prefectures.js',
    'src/character-personalities.js',
    'docs/08-character-rebuild.md',
  ];
  const combinedText = checkedFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
  const rejectedCharacterName = ['オンセン', 'タマゴン'].join('');
  const rejectedProfileCopy = ['白身の', '折り目'].join('');
  const rejectedVoiceLine = ['黄身は、', 'まだ入っています。'].join('');
  assert.equal(combinedText.includes(rejectedCharacterName), false);
  assert.equal(combinedText.includes(rejectedProfileCopy), false);
  assert.equal(combinedText.includes(rejectedVoiceLine), false);

  const artwork = path.resolve('assets/characters/v3/44.webp');
  const metadata = await sharp(artwork).metadata();
  const stats = await sharp(artwork).stats();
  assert.equal(metadata.format, 'webp');
  assert.equal(metadata.width, 1024);
  assert.equal(metadata.height, 1024);
  assert.equal(metadata.hasAlpha, true);
  assert.equal(stats.channels[3].min, 0);
  assert.equal(stats.channels[3].max, 255);
  assert.ok(fs.statSync(artwork).size < 350000, 'Oita character should stay within the page asset budget');

  const voice = fs.readFileSync('assets/sounds/voices/44.wav');
  assert.equal(voice.toString('ascii', 0, 4), 'RIFF');
  assert.ok(voice.length > 10000, 'Oita character voice should not be empty');
  console.log('PASS: Oita character art, profile, stats, line and voice were fully replaced');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
