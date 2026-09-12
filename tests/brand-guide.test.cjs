const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
 for(const [width,height] of [[1440,900],[390,844]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  await page.goto(pathToFileURL(path.resolve('build/index.html')).href);
  assert.ok(await page.locator('.illustrated-logo img').evaluate(e=>e.complete&&e.naturalWidth>0));
  await page.evaluate(()=>{state.current=PREFECTURE_DATA[0];openGuideHelp(document.createElement('button'));});
  await page.screenshot({path:`.verification/guide-dialog-${width}.png`});
  await page.keyboard.press('Escape');
  await page.screenshot({path:`.verification/brand-${width}.png`});
  await page.evaluate(()=>{state.current=PREFECTURE_DATA[4];state.round=[state.current];renderMap();});
  assert.ok(await page.locator('.discovery-instruction .japan-guide').evaluate(e=>e.complete&&e.naturalWidth>0));
  await page.screenshot({path:`.verification/guide-${width}.png`});
  await page.close();
 }
 console.log('PASS: logo and guide assets load on desktop and phone');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
