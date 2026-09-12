const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try {
    for (const [width, height] of [[1440, 900], [390, 844], [360, 640], [844, 390]]) {
      const page = await browser.newPage({viewport: {width, height}, reducedMotion: 'reduce'});
      await page.goto(pathToFileURL(path.resolve('build/index.html')).href);
      await page.evaluate(() => {
        const oita = PREFECTURES.find(prefecture => prefecture.code === '44');
        state.round = [oita];
        state.gachaRewards = [oita];
        state.rewardRevealIndex = 0;
        state.newlyUnlocked = new Set(['44']);
        renderRewardReveal();
      });
      const rewardText = await page.locator('.reward-reveal-scene').innerText();
      assert.match(rewardText, /ユゲイシゴロウ/);
      assert.match(rewardText, /温泉の湯の花/);
      assert.match(rewardText, /見てましたね。こちらも、見ています。/);
      assert.equal(rewardText.includes(['オンセン', 'タマゴン'].join('')), false);
      assert.equal(rewardText.includes(['黄', '身'].join('')), false);
      assert.equal(rewardText.includes(['白', '身'].join('')), false);
      const rewardImage = await page.locator('.reveal-character img').evaluate(image => ({
        src: image.getAttribute('src'),
        complete: image.complete,
        width: image.naturalWidth,
        height: image.naturalHeight,
      }));
      assert.match(rewardImage.src, /assets\/characters\/v3\/44\.webp$/);
      assert.equal(rewardImage.complete, true);
      assert.equal(rewardImage.width, 1024);
      assert.equal(rewardImage.height, 1024);

      await page.evaluate(() => renderDetail(PREFECTURES.find(prefecture => prefecture.code === '44')));
      assert.equal(await page.locator('.character-profile-card h1').innerText(), 'ユゲイシゴロウ');
      assert.match(await page.locator('.character-profile-card').innerText(), /見つめ返す力\s*100/);
      assert.match(await page.locator('.character-profile-card').innerText(), /一日の歩数\s*0/);
      assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), true, `${width}x${height}: page scrolls`);
      await page.close();
    }
    console.log('PASS: Oita replacement appears with complete copy and decoded art on desktop and mobile layouts');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
