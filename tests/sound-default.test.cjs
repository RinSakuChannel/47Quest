const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
 for(const [width,height] of [[1440,900],[390,844],[360,640],[844,390]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  await page.addInitScript(()=>localStorage.setItem('47quest-sound','true'));
  await page.goto(pathToFileURL(path.resolve('build/index.html')).href);
  const toggle=page.locator('.sound-toggle-button');
  assert.equal(await toggle.innerText(),'音 OFF');
  await toggle.click();assert.equal(await page.evaluate(()=>state.sound),true);
  await page.locator('[data-action="start"]').click();
  assert.equal(await toggle.innerText(),'音 ON');
  await toggle.click();assert.equal(await page.evaluate(()=>state.sound),false);
  await page.locator('[data-action="start-writing"]').click();
  assert.equal(await toggle.innerText(),'音 OFF');
  const box=await toggle.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width);
  await page.reload();assert.equal(await toggle.innerText(),'音 OFF');
  await page.goto(pathToFileURL(path.resolve('build/games.html')).href);
  const galleryToggle=page.locator('#sound-toggle');assert.equal(await galleryToggle.innerText(),'音 OFF');
  await page.locator('#gallery button').first().click();
  assert.ok(await galleryToggle.isVisible());
  await galleryToggle.click();assert.equal(await galleryToggle.innerText(),'音 ON');
  await galleryToggle.click();assert.equal(await galleryToggle.innerText(),'音 OFF');
  await page.close();
 }
 console.log('PASS: fresh loads muted, main scenes and gallery toggle sound on/off at four sizes');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
