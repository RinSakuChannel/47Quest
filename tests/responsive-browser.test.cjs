const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const sizes = [
  ['desktop', 1440, 900],
  ['laptop', 1366, 768],
  ['tablet-landscape', 1024, 768],
  ['tablet-portrait', 768, 1024],
  ['phone', 390, 844],
  ['phone-small', 360, 640],
  ['phone-landscape', 844, 390],
];

async function visibleBounds(page, selector) {
  return page.locator(selector).evaluateAll(nodes => nodes.filter(node => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  }).map(node => {
    const rect = node.getBoundingClientRect();
    return { tag:node.tagName, text:(node.textContent || '').trim().slice(0, 50), left:rect.left, top:rect.top, right:rect.right, bottom:rect.bottom };
  }));
}

async function assertInsideViewport(page, selector, label) {
  const viewport = page.viewportSize();
  for (const rect of await visibleBounds(page, selector)) {
    assert.ok(rect.left >= -1, `${label}: ${rect.tag} starts left of viewport: ${JSON.stringify(rect)}`);
    assert.ok(rect.top >= -1, `${label}: ${rect.tag} starts above viewport: ${JSON.stringify(rect)}`);
    assert.ok(rect.right <= viewport.width + 1, `${label}: ${rect.tag} exceeds viewport width: ${JSON.stringify(rect)}`);
    assert.ok(rect.bottom <= viewport.height + 1, `${label}: ${rect.tag} exceeds viewport height: ${JSON.stringify(rect)}`);
  }
}

async function assertNoHiddenOverflow(page, selector, label) {
  for (const item of await page.locator(selector).evaluateAll(nodes => nodes.filter(node => {
    const style=getComputedStyle(node), rect=node.getBoundingClientRect();
    return style.display!=='none' && style.visibility!=='hidden' && rect.width>0 && rect.height>0;
  }).map(node => ({
    className:node.className,
    text:(node.textContent||'').trim().slice(0,40),
    clientWidth:node.clientWidth,scrollWidth:node.scrollWidth,
    clientHeight:node.clientHeight,scrollHeight:node.scrollHeight,
  })))) {
    assert.ok(item.scrollWidth <= item.clientWidth + 2, `${label}: horizontal content is clipped ${JSON.stringify(item)}`);
    assert.ok(item.scrollHeight <= item.clientHeight + 2, `${label}: vertical content needs scrolling ${JSON.stringify(item)}`);
  }
}

async function assertPageNoScroll(page, label) {
  const size = await page.evaluate(() => ({
    width:document.documentElement.clientWidth,
    scrollWidth:document.documentElement.scrollWidth,
    height:document.documentElement.clientHeight,
    scrollHeight:document.documentElement.scrollHeight,
  }));
  assert.ok(size.scrollWidth <= size.width + 2, `${label}: page scrolls horizontally ${JSON.stringify(size)}`);
  assert.ok(size.scrollHeight <= size.height + 2, `${label}: page scrolls vertically ${JSON.stringify(size)}`);
}

async function assertTouchTargets(page, selector, label) {
  for (const rect of await visibleBounds(page, selector)) {
    assert.ok(rect.right - rect.left >= 44, `${label}: touch target is narrower than 44px ${JSON.stringify(rect)}`);
    assert.ok(rect.bottom - rect.top >= 44, `${label}: touch target is shorter than 44px ${JSON.stringify(rect)}`);
  }
}

async function drawEnoughInk(page) {
  const box = await page.locator('#write-canvas').boundingBox();
  for (let row=1; row<=3; row++) {
    await page.mouse.move(box.x + box.width*.18, box.y + box.height*(row*.22));
    await page.mouse.down();
    await page.mouse.move(box.x + box.width*.82, box.y + box.height*(row*.22), {steps:8});
    await page.mouse.up();
  }
}

(async () => {
  const root = path.resolve('build');
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://local/').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    fs.readFile(file, (error, data) => {
      if (error) { response.writeHead(404).end(); return; }
      response.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.wav':'audio/wav'}[path.extname(file)] || 'application/octet-stream'));
      response.end(data);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    for (const [name, width, height] of sizes) {
      const isPhone = name.startsWith('phone');
      const context = await browser.newContext({ viewport:{width,height}, reducedMotion:'reduce', hasTouch:isPhone, isMobile:isPhone });
      await context.addInitScript(() => {
        localStorage.setItem('47quest-coins', '3');
        localStorage.setItem('47quest-unlocked', JSON.stringify(['02','12','37']));
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      await page.goto(baseUrl, { waitUntil:'networkidle' });
      await page.locator('img').evaluateAll(images => Promise.all(images.map(img => img.complete ? null : new Promise(resolve => img.addEventListener('load', resolve, {once:true})))));
      await page.waitForTimeout(1800);
      assert.equal(errors.length, 0, `${name}: startup JavaScript error`);
      await assertInsideViewport(page, '.topbar button,.title-stage button,.home-roamer', `${name} title`);
      await assertPageNoScroll(page, `${name} title`);
      assert.equal(await page.locator('.home-roamer [data-character-code]').count(), 6, `${name}: title characters are not voice-enabled`);
      if (name === 'desktop') {
        await page.locator('.sound-menu-button').click();
        assert.equal(await page.locator('[data-volume="bgm"]').inputValue(), '34', 'default BGM must be twenty percent quieter');
        assert.equal(await page.locator('[data-volume="se"]').inputValue(), '42', 'SE/Voice slider default changed unexpectedly');
        await page.evaluate(() => {
          window.__voiceCalls = [];
          window.QUEST_CHARACTER_CRIES.play = (_context, code, volume) => window.__voiceCalls.push({ code, volume });
        });
        await page.locator('.home-roamer').first().click();
        const voiceCall = await page.evaluate(() => window.__voiceCalls.at(-1));
        assert.ok(voiceCall?.code, 'clicking a title character did not play its voice');
        assert.ok(voiceCall.volume >= .7, `default character voice is still too quiet (${voiceCall.volume})`);
        await page.locator('.sound-menu-button').click();
      }

      await page.locator('[data-action="gacha"]').click();
      await assertInsideViewport(page, '.gacha-scene,.gacha-machine,.gacha-scene button', `${name} gacha`);
      await assertPageNoScroll(page, `${name} gacha`);
      const gacha = await page.locator('.gacha-scene').boundingBox();
      const machine = await page.locator('.gacha-machine').boundingBox();
      assert.ok(machine.y >= gacha.y && machine.y + machine.height <= gacha.y + gacha.height + 1, `${name}: gacha machine clipped`);

      await page.locator('[data-action="gacha-pull"]').click();
      await page.waitForSelector('.reward-reveal-scene');
      await assertInsideViewport(page, '.reward-reveal-scene,.reveal-character-wrap,.reveal-name-card,.reveal-next-button', `${name} reveal`);
      await assertPageNoScroll(page, `${name} reveal`);
      assert.ok(await page.locator('.reveal-character img').evaluate(img => img.complete && img.naturalWidth > 0), `${name}: reveal character did not load`);

      await page.goto(baseUrl, { waitUntil:'networkidle' });
      await page.locator('[data-action="start"]').click();
      await page.waitForSelector('.map-scene');
      await assertInsideViewport(page, '.map-scene,.map-stage,.map-learning-tray button,.zoom-button', `${name} map`);
      await assertPageNoScroll(page, `${name} map`);
      await page.locator('[data-action="start-writing"]').click();
      await page.waitForSelector('.writing-scene');
      await assertInsideViewport(page, '.writing-scene,.lesson-panel,.writing-board,.canvas-shell,.writing-tools button,.canvas-next-button', `${name} writing`);
      if (isPhone) await assertTouchTargets(page, '.writing-tools.action-dock button', `${name} writing controls`);
      await assertPageNoScroll(page, `${name} writing`);
      const canvas = await page.locator('.canvas-shell').boundingBox();
      const minimumCanvasHeight = height <= 500 ? 230 : width <= 420 ? 300 : width <= 1100 ? 360 : 420;
      assert.ok(canvas.height >= minimumCanvasHeight, `${name}: writing canvas too short (${canvas.height}px)`);
      assert.ok(canvas.width >= (width <= 420 ? width - 30 : 500), `${name}: writing canvas too narrow (${canvas.width}px)`);

      assert.equal(await page.locator('[data-action="writing-skip-hiragana"]').isVisible(), true, `${name}: hiragana skip is missing`);
      await page.locator('[data-action="writing-skip-hiragana"]').click();
      await page.waitForSelector('.writing-scene');
      assert.match(await page.locator('.top-title').innerText(), /漢字/, `${name}: hiragana skip did not open kanji writing`);
      await drawEnoughInk(page);
      await page.locator('[data-action="writing-next"]').click();
      await page.waitForSelector('.game-scene');
      await assertInsideViewport(page, '.game-scene,.game-info,.game-board,.game-info button', `${name} game`);
      await assertPageNoScroll(page, `${name} game`);
      const info = await page.locator('.game-info').boundingBox();
      const board = await page.locator('.game-board').boundingBox();
      assert.ok(info.y + info.height <= board.y + 1, `${name}: game instructions overlap play surface`);
      await page.evaluate(() => finishGame(true, {stars:1, score:3, maxStreak:3}));
      await page.waitForSelector('.result-card');
      await page.waitForTimeout(900);
      await assertInsideViewport(page, '.game-overlay,.result-card,.result-summary,.result-details,.result-actions button', `${name} result`);
      assert.equal(await page.locator('.result-card [data-character-code]').count(), 1, `${name}: result character is not voice-enabled`);
      await assertNoHiddenOverflow(page, '.result-card,.result-details', `${name} result`);
      await assertPageNoScroll(page, `${name} result`);

      // Canvas-based regional games draw all copy in a fixed 1000x600 world.
      // The displayed box must keep that 5:3 ratio or every Japanese glyph is
      // visibly stretched/crushed even though its DOM bounds remain on screen.
      await page.goto(`${baseUrl}games.html`, { waitUntil:'networkidle' });
      await assertInsideViewport(page, '.gallery-head,#gallery,.gallery-footer,.gallery-footer button', `${name} game gallery`);
      await assertPageNoScroll(page, `${name} game gallery`);
      for (let pageNumber=0; pageNumber<8 && !await page.locator('#gallery button').filter({ hasText:'奈良県' }).count(); pageNumber++) {
        await page.locator('#gallery-next').click();
      }
      await page.locator('#gallery button').filter({ hasText:'奈良県' }).click();
      const lessonLayout = await page.locator('.fg-intro strong').evaluate(node => ({
        clientWidth:node.clientWidth,
        scrollWidth:node.scrollWidth,
        fontSize:Number.parseFloat(getComputedStyle(node).fontSize),
        balanced:[...node.children].every(line => getComputedStyle(line).textWrapStyle === 'balance'),
      }));
      assert.ok(lessonLayout.scrollWidth <= lessonLayout.clientWidth + 1, `${name}: game instructions overflow horizontally`);
      assert.ok(lessonLayout.fontSize >= 18, `${name}: game instructions are too small`);
      assert.ok(lessonLayout.balanced, `${name}: game instruction lines are not balanced`);
      if (isPhone) await page.locator('.fg-intro button').tap();
      else await page.locator('.fg-intro button').click();
      await page.waitForSelector('.rg-canvas');
      const regionalCanvas = await page.locator('.rg-canvas').boundingBox();
      assert.ok(Math.abs(regionalCanvas.width / regionalCanvas.height - 5 / 3) < .02,
        `${name}: regional canvas distorts text (${regionalCanvas.width}x${regionalCanvas.height})`);
      await assertInsideViewport(page, '#player,.rg-canvas,#player nav,#player button', `${name} regional game`);
      await assertPageNoScroll(page, `${name} regional game`);

      await page.goto(baseUrl, { waitUntil:'networkidle' });
      await page.locator('[data-action="quick-quiz"]').click();
      await page.waitForSelector('.review-location-picker');
      await assertInsideViewport(page, '.review-scene,.review-location-picker,.review-prefecture-choice,.review-location-map', `${name} quick quiz`);
      await assertPageNoScroll(page, `${name} quick quiz`);

      await page.goto(baseUrl, { waitUntil:'networkidle' });
      await page.locator('[data-action="collection"]').click();
      await page.waitForSelector('.collection-scene');
      await assertInsideViewport(page, '.collection-scene,.section-head,.collection-grid,.collection-card', `${name} collection`);
      await assertNoHiddenOverflow(page, '.collection-scene,.collection-grid,.collection-card', `${name} collection`);
      await assertPageNoScroll(page, `${name} collection`);
      assert.ok(await page.locator('.collection-card:not(.is-locked)').count(), `${name}: no collected card available for detail test`);
      await page.locator('.collection-card:not(.is-locked)').first().click();
      await page.waitForSelector('.detail-scene');
      await page.waitForTimeout(900);
      await assertInsideViewport(page, '.detail-scene,.character-profile-card,.character-profile-card button,.map-stage', `${name} detail`);
      await assertNoHiddenOverflow(page, '.detail-scene,.character-profile-card', `${name} detail`);
      await assertPageNoScroll(page, `${name} detail`);
      await context.close();
    }
    const motionContext = await browser.newContext({ viewport:{width:390,height:844}, hasTouch:true, isMobile:true, reducedMotion:'no-preference' });
    const motionPage = await motionContext.newPage();
    await motionPage.goto(baseUrl, { waitUntil:'networkidle' });
    await motionPage.waitForTimeout(160);
    assert.ok(await motionPage.locator('.scene').evaluate(scene => scene.getAnimations({subtree:true}).length >= 6), 'title motion choreography did not start');
    await motionPage.locator('[data-action="start"]').tap();
    await motionPage.waitForSelector('.map-learning-tray.action-dock');
    await motionPage.waitForTimeout(80);
    assert.ok(await motionPage.locator('.map-learning-tray button').evaluate(button => button.getAnimations().length > 0), 'primary action spring entrance did not start');
    await assertPageNoScroll(motionPage, 'phone motion');
    await motionContext.close();
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
  console.log('PASS: desktop, tablet and phone full flow stays inside one viewport');
})().catch(error => { console.error(error); process.exit(1); });
