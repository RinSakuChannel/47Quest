const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
 for(const [width,height] of [[1440,900],[768,1024],[390,844],[360,640],[844,390]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  await page.goto(pathToFileURL(path.resolve('build/index.html')).href);
  await page.evaluate(()=>{state.sound=false;state.current=PREFECTURE_DATA[4];state.round=[state.current];renderMap();});
  for(const screen of ['map','writing']){
   if(screen==='writing')await page.evaluate(()=>renderWriting('hiragana'));
   const opener=page.locator('[data-action="guide-help"]');await opener.click();
   const dialog=page.locator('.guide-help-dialog');
   assert.ok(await dialog.evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth&&e.scrollHeight<=e.clientHeight+1;}),`${width} ${screen}: help must fit without scrolling`);
   assert.match(await dialog.innerText(),screen==='map'?/秋田県/:/一画/);
   await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
   assert.ok(await opener.evaluate(e=>e===document.activeElement),'restore keyboard focus');
  }
  await page.close();
 }
 console.log('PASS: contextual guide, no overflow on five sizes, Escape and focus restore');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
