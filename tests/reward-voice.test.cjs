const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try {
    for(const [width,height] of [[1440,900],[390,844],[360,640],[844,390]]) {
      const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
      await page.goto(pathToFileURL(path.resolve('build/index.html')).href);
      await page.evaluate(()=>{
        const pref=PREFECTURES[4];state.round=[pref];state.reviewIndex=1;
        state.gachaRewards=[pref];state.rewardRevealIndex=0;renderRewardReveal();
        window.__calls=[];characterCry=pref=>window.__calls.push(pref.code);
      });
      await page.waitForTimeout(1400);
      await page.evaluate(()=>window.__calls=[]);
      const button=page.locator('.reveal-voice-button');
      await button.focus();await page.keyboard.press('Enter');
      assert.deepEqual(await page.evaluate(()=>window.__calls),['05']);
      await page.locator('.reveal-voice-label').click();
      assert.deepEqual(await page.evaluate(()=>window.__calls),['05','05']);
      const box=await button.boundingBox();
      assert.ok(box.width>=44&&box.height>=44);
      await page.screenshot({path:`.verification/reward-voice-${width}.png`});
      await page.close();
    }
    console.log('PASS: reward voice button supports pointer and keyboard at four viewport sizes');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
