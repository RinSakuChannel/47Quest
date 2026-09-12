const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
for(const [width,height] of [[1440,900],[768,1024],[390,844],[360,640],[844,390]]){
const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});await page.goto(pathToFileURL(path.resolve('build/index.html')).href);
const select=page.getByRole('button',{name:'なめらか',exact:true});await select.click();
assert.equal(await page.evaluate(()=>QUEST_MOTION.mode),'full');await page.getByRole('button',{name:'標準',exact:true}).click();
await page.waitForTimeout(800);const box=await select.boundingBox();assert.ok(box.y>=0&&box.y+box.height<=height&&box.height>=43,`motion control ${width}: ${JSON.stringify(box)}`);
await page.evaluate(()=>{const art=document.querySelector('.home-roamer-art');bounceCharacter(art);const image=art.querySelector('.home-roamer-pixels,img');const a=image.getAnimations().find(a=>a.id==='character-bounce');if(a){a.pause();a.currentTime=270;}});
await page.screenshot({path:`.verification/title-motion-${width}.png`});await page.close();
}console.log('PASS: visible title motion selector at five sizes, both modes selectable');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
