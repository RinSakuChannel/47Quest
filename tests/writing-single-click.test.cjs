const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
for(const touch of [false,true])for(const edge of [false,true]){
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:touch});await page.goto(pathToFileURL(path.resolve('build/index.html')).href);
await page.evaluate(()=>{QUEST_MOTION.set('full');state.current=PREFECTURES[0];state.round=[state.current];renderWriting('kanji');state.strokes=[[[.1,.2],[.8,.7]]];updateInkReadiness()});await page.waitForTimeout(900);
const button=page.locator('[data-action="writing-next"]');assert.equal(await button.isEnabled(),true);const r=await button.boundingBox();const x=edge?r.x+2:r.x+r.width/2,y=r.y+r.height/2;
if(touch)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
assert.equal(await page.evaluate(()=>state.screen),'game',`touch=${touch} edge=${edge}`);await page.close();
}console.log('PASS: one click/tap enters game, including button edges');}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
