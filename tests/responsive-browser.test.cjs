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

async function assertReadableText(page, label) {
  const issues = await page.locator('button,h1,h2,h3,p,small,strong,.top-title,.sample-word-text,.micro-command').evaluateAll(nodes => {
    const selected = nodes.filter(node => {
      const style = getComputedStyle(node); const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 && (node.textContent || '').trim();
    });
    return selected.flatMap(node => {
      if (node.matches('.home-roamer') || node.closest('.brand,.game-logo')) return [];
      const problems = []; const style = getComputedStyle(node); const text = (node.textContent || '').trim().replace(/\s+/g, ' ');
      if ((style.overflowX !== 'visible' && node.scrollWidth > node.clientWidth + 2)
        || (style.overflowY !== 'visible' && node.scrollHeight > node.clientHeight + 2)) problems.push('clipped');
      if (text.length >= 5 && !node.querySelector('ruby') && style.transform === 'none') {
        const lines = [];
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          if (walker.currentNode.parentElement?.closest('rt')) continue;
          for (let index = 0; index < walker.currentNode.data.length; index += 1) {
            const char = walker.currentNode.data[index]; if (/\s/.test(char)) continue;
            const range = document.createRange(); range.setStart(walker.currentNode, index); range.setEnd(walker.currentNode, index + 1);
            const rect = range.getBoundingClientRect(); if (!rect.width || !rect.height) continue;
            let line = lines.find(item => Math.abs(item.top - rect.top) < 2);
            if (!line) { line = { top:rect.top, text:'' }; lines.push(line); }
            line.text += char;
          }
        }
        lines.sort((a,b) => a.top - b.top);
        if (lines.length > 1) {
          const meaningful = value => value.replace(/[\s。、！？「」『』（）()→←▶⚡☆★0-9/・!]/g, '');
          if (meaningful(lines.at(-1).text).length <= 1) problems.push(`orphan-last-line:${lines.at(-1).text}`);
        }
      }
      return problems.length ? [{ tag:node.tagName, className:String(node.className), text:text.slice(0,60), problems, size:[node.clientWidth,node.scrollWidth,node.clientHeight,node.scrollHeight] }] : [];
    });
  });
  assert.deepEqual(issues, [], `${label}: unreadable text ${JSON.stringify(issues)}`);
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
      if (process.env.QUEST_TEXT_SWEEP === '1') {
        const failures = [];
        for (const code of await page.evaluate(() => PREFECTURES.map(pref => pref.code))) {
          for (const screen of ['reward', 'hiragana', 'kanji']) {
            await page.evaluate(({code,screen}) => {
              state.sound=false;
              const pref=PREFECTURES.find(pref=>pref.code===code);
              state.current=pref;state.round=[pref];state.roundIndex=0;
              if(screen==='reward') {
                state.gachaRewards=[pref];state.rewardRevealIndex=0;state.reviewIndex=1;
                renderRewardReveal();
              } else renderWriting(screen);
            }, {code,screen});
            await page.evaluate(() => new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
            try {
              await assertReadableText(page, `${name} ${code} ${screen}`);
              await assertPageNoScroll(page, `${name} ${code} ${screen}`);
              await assertInsideViewport(page, '.reveal-name-card,.reveal-next-button,.sample-word-text,.writing-tools button', `${name} ${code} ${screen}`);
            } catch(error) { failures.push(error.message); }
          }
        }
        console.log(`${name}: 141 prefecture/text screens checked`);
        assert.deepEqual(failures, [], failures.join('\n'));
        await context.close();
        continue;
      }
      assert.equal(errors.length, 0, `${name}: startup JavaScript error`);
      await assertInsideViewport(page, '.topbar button,.title-stage button,.home-roamer', `${name} title`);
      await assertPageNoScroll(page, `${name} title`);
      await assertReadableText(page, `${name} title`);
      assert.equal(await page.locator('.home-roamer [data-character-code]').count(), 6, `${name}: title characters are not voice-enabled`);
      assert.equal(await page.locator('.home-roamer-pixels').count(), 6, `${name}: coarse title mosaics were not rendered`);
      assert.ok(await page.locator('.home-roamer-pixels').first().evaluate(canvas => canvas.width === 12 && canvas.height === 12), `${name}: title mosaic is not coarse enough`);
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
      await assertReadableText(page, `${name} gacha`);
      const gacha = await page.locator('.gacha-scene').boundingBox();
      const machine = await page.locator('.gacha-machine').boundingBox();
      assert.ok(machine.y >= gacha.y && machine.y + machine.height <= gacha.y + gacha.height + 1, `${name}: gacha machine clipped`);

      await page.locator('[data-action="gacha-pull"]').click();
      await page.waitForSelector('.reward-reveal-scene');
      await assertInsideViewport(page, '.reward-reveal-scene,.reveal-character-wrap,.reveal-name-card,.reveal-next-button', `${name} reveal`);
      await assertPageNoScroll(page, `${name} reveal`);
      await assertReadableText(page, `${name} reveal`);
      assert.ok(await page.locator('.reveal-character img').evaluate(img => img.complete && img.naturalWidth > 0), `${name}: reveal character did not load`);
      await page.locator('[data-action="reward-map"]').click();
      await assertInsideViewport(page,'.reward-map-dialog,.reward-map-surface',`${name} reward map`);
      assert.equal(await page.locator('.reward-map-surface').evaluate(e=>e._mapZoom.getState().scale),3);
      await page.locator('[data-action="reward-map-toggle"]').click();
      assert.equal(await page.locator('.reward-map-surface').evaluate(e=>e._mapZoom.getState().scale),1);
      await page.locator('[data-action="close-reward-map"]').click();
      await page.locator('.reward-map-dialog').waitFor({state:'detached'});
      assert.equal(await page.locator('.reward-map-dialog').count(),0);
      if (isPhone) {
        const character = await page.locator('.reveal-character-wrap').boundingBox();
        assert.ok(character.width >= Math.min(145, width * .38), `${name}: reward character is too small (${character.width}px)`);
        assert.equal(await page.locator('.reveal-get-banner').isVisible(), false, `${name}: duplicate reward headings overlap`);
        const introWraps = await page.locator('.reveal-name-card > small').evaluate(element => element.getClientRects().length);
        assert.equal(introWraps, 1, `${name}: reward intro has an orphaned line`);
      }

      await page.goto(baseUrl, { waitUntil:'networkidle' });
      await page.locator('[data-action="start"]').click();
      await page.waitForSelector('.map-scene');
      await assertInsideViewport(page, '.map-scene,.map-stage,.map-learning-tray button,.zoom-button', `${name} map`);
      await assertPageNoScroll(page, `${name} map`);
      await assertReadableText(page, `${name} map`);
      await page.locator('[data-action="start-writing"]').click();
      await page.waitForSelector('.writing-scene');
      await assertInsideViewport(page, '.writing-scene,.lesson-panel,.writing-board,.canvas-shell,.writing-tools button,.canvas-next-button', `${name} writing`);
      const sampleFits = await page.locator('.sample-word-text').evaluate(element => {
        const text = element.getBoundingClientRect();
        const frame = element.parentElement.getBoundingClientRect();
        return text.top >= frame.top - 1 && text.bottom <= frame.bottom + 1 && text.left >= frame.left - 1 && text.right <= frame.right + 1;
      });
      assert.ok(sampleFits, `${name}: handwriting sample text is clipped`);
      if (isPhone) await assertTouchTargets(page, '.writing-tools.action-dock button', `${name} writing controls`);
      await assertPageNoScroll(page, `${name} writing`);
      await assertReadableText(page, `${name} writing`);
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
      await assertReadableText(page, `${name} game`);
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
      await assertReadableText(page, `${name} result`);

      // Canvas-based regional games draw all copy in a fixed 1000x600 world.
      // The displayed box must keep that 5:3 ratio or every Japanese glyph is
      // visibly stretched/crushed even though its DOM bounds remain on screen.
      await page.goto(`${baseUrl}games.html`, { waitUntil:'networkidle' });
      await assertInsideViewport(page, '.gallery-head,#gallery,.gallery-footer,.gallery-footer button', `${name} game gallery`);
      await assertPageNoScroll(page, `${name} game gallery`);
      await assertReadableText(page, `${name} game gallery`);
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
      await assertReadableText(page, `${name} quick quiz`);
      if (name === 'phone') {
        const pinAlignment = await page.evaluate(() => {
          state.round=[PREFECTURE_DATA.find(pref => pref.code === '47')];state.reviewIndex=0;state.reviewPhase='location';renderReviewLocation();alignMapPins();
          const layers=document.querySelector('.review-location-map .map-layers');
          const pin=layers.querySelector('.prefecture-pin');
          const rect=layers.getBoundingClientRect();const box=mapDisplayBox(rect.width,rect.height);const point=mapPoint(state.round[0]);
          return {left:Number.parseFloat(pin.style.left),top:Number.parseFloat(pin.style.top),expectedLeft:box.left+box.width*point.x/100,expectedTop:box.top+box.height*point.y/100,width:pin.getBoundingClientRect().width,oldBeacon:!!layers.querySelector('.prefecture-beacon')};
        });
        assert.ok(Math.abs(pinAlignment.left-pinAlignment.expectedLeft)<1 && Math.abs(pinAlignment.top-pinAlignment.expectedTop)<1, `${name}: Okinawa pin tip is not aligned to the portrait map`);
        assert.ok(pinAlignment.width <= 28, `${name}: prefecture pin covers too much of the map`);
        assert.equal(pinAlignment.oldBeacon,false, `${name}: obsolete circular beacon is still rendered`);
      }

      await page.goto(baseUrl, { waitUntil:'networkidle' });
      await page.locator('[data-action="collection"]').click();
      await page.waitForSelector('.collection-scene');
      await assertInsideViewport(page, '.collection-scene,.section-head,.collection-grid,.collection-card', `${name} collection`);
      await assertNoHiddenOverflow(page, '.collection-scene,.collection-grid,.collection-card', `${name} collection`);
      await assertPageNoScroll(page, `${name} collection`);
      await assertReadableText(page, `${name} collection`);
      assert.ok(await page.locator('.collection-card:not(.is-locked)').count(), `${name}: no collected card available for detail test`);
      await page.locator('.collection-card:not(.is-locked)').first().click();
      await page.waitForSelector('.detail-scene');
      await page.waitForTimeout(900);
      await assertInsideViewport(page, '.detail-scene,.character-profile-card,.character-profile-card button,.map-stage', `${name} detail`);
      await assertNoHiddenOverflow(page, '.detail-scene,.character-profile-card', `${name} detail`);
      await assertPageNoScroll(page, `${name} detail`);
      await assertReadableText(page, `${name} detail`);
      if (name === 'desktop') {
        await page.evaluate(() => {
          state.round=[PREFECTURE_DATA[0]];state.reviewIndex=0;state.reviewPhase='kanji';state.current=PREFECTURE_DATA[0];state.reviewHints={};renderReview();
        });
        await page.locator('[data-action="review-hint"]').first().click();
        await page.waitForSelector('.review-first-letter');
        assert.equal((await page.locator('.review-first-letter strong').innerText()).length, 1, 'first-character hint did not show one kanji');
        await assertInsideViewport(page, '.review-first-letter', `${name} first-character hint`);
      }
      if (name === 'desktop' || name === 'phone') {
        await page.evaluate(() => localStorage.setItem('47quest-cleared', JSON.stringify(Array.from({length:47},(_,i)=>String(i+1).padStart(2,'0')))));
        await page.goto(baseUrl, { waitUntil:'networkidle' });
        await page.locator('[data-action="start"]').click();
        await page.waitForSelector('.nation-complete-scene');
        await assertInsideViewport(page, '.nation-complete-scene,.nation-complete-medal,.nation-complete-scene button', `${name} nationwide completion`);
        await assertPageNoScroll(page, `${name} nationwide completion`);
        await assertReadableText(page, `${name} nationwide completion`);
      }
      for (const code of ['03','05','23','26']) {
        await page.evaluate(code => {state.current=PREFECTURE_DATA.find(p=>p.code===code);state.round=[state.current];state.roundIndex=0;renderGame();}, code);
        await assertReadableText(page, `${name} ${code} instructions`);
        await page.locator('.fg-intro button').click();
        await page.waitForSelector('.rg-canvas');
        await assertPageNoScroll(page, `${name} ${code} game`);
        await assertInsideViewport(page, '.rg-canvas,.fg-banner,.fg-status,.fg-star-track', `${name} ${code} game`);
        const ratio=await page.locator('.rg-canvas').evaluate(c=>{const r=c.getBoundingClientRect();return r.width/r.height;});
        assert.ok(Math.abs(ratio-5/3)<.02,`${name} ${code}: canvas text is stretched`);
        if(name==='phone'||name==='desktop'){
          await page.waitForTimeout(250);
          fs.mkdirSync(path.resolve('.verification/minigames'),{recursive:true});
          await page.screenshot({path:path.resolve(`.verification/minigames/${name}-${code}.png`)});
        }
      }
      await page.evaluate(()=>{state.gachaRewards=PREFECTURE_DATA.slice(0,3);state.reviewResults={'01':{kanji:true},'02':{kanji:false}};renderReward();});
      await page.waitForTimeout(400);
      await assertPageNoScroll(page, `${name} memory rewards`);
      await assertInsideViewport(page, '.memory-friend,.memory-progress,.memory-reward-scene .button-row', `${name} memory rewards`);
      for(const card of await page.locator('.memory-friend').all()){
        await card.click();
        assert.equal(await card.getAttribute('aria-expanded'),'true');
        await assertReadableText(page, `${name} memory answer`);
      }
      await assertNoHiddenOverflow(page,'.memory-friend',`${name} memory cards`);
      if(name==='phone')await page.screenshot({path:path.resolve('.verification/minigames/phone-memory.png')});
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
    await motionPage.evaluate(() => { state.round=[PREFECTURE_DATA.find(pref => pref.code === '47')];state.reviewIndex=0;state.reviewPhase='location';renderReviewLocation(); });
    await motionPage.waitForSelector('.prefecture-pin');
    assert.ok(await motionPage.locator('.prefecture-pin svg').evaluate(pin => pin.getAnimations().length === 1), 'map pin landing animation did not start');
    await assertPageNoScroll(motionPage, 'phone motion');
    await motionContext.close();
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
  console.log('PASS: desktop, tablet and phone full flow stays inside one viewport');
})().catch(error => { console.error(error); process.exit(1); });
