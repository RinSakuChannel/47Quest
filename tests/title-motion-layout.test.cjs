const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
for(const [width,height] of [[1440,900],[768,1024],[390,844],[360,640],[844,390]]){
const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});await page.goto(pathToFileURL(path.resolve('build/index.html')).href);
assert.equal(await page.locator('.title-motion').count(),0,`${width}: redundant motion control remains on title`);
assert.equal(await page.locator('.title-status,.title-stage>.daily-quest').count(),0,`${width}: redundant daily status remains on title`);
assert.equal(await page.locator('.title-shortcuts button').count(),3,`${width}: shortcut count`);
await page.waitForTimeout(1200);
for(const control of await page.locator('.title-actions button').all()){const box=await control.boundingBox();assert.ok(box&&box.y>=0&&box.y+box.height<=height&&box.height>=43,`${width}: title control outside viewport ${JSON.stringify(box)}`);}
const start=await page.locator('.title-start-button').boundingBox(),shortcut=await page.locator('.title-shortcut').first().boundingBox();assert.ok(start.height>shortcut.height&&start.width>shortcut.width*2,`${width}: start is not the clear primary action`);
await page.screenshot({path:`.verification/title-clean-${width}.png`});
await page.getByRole('button',{name:'音量と演出を設定する'}).click();const select=page.locator('[data-motion]');assert.ok(await select.isVisible(),`${width}: animation setting is not available in settings`);await select.selectOption('full');assert.equal(await page.evaluate(()=>QUEST_MOTION.mode),'full');await select.selectOption('auto');
await page.screenshot({path:`.verification/title-controls-${width}.png`});await page.close();
}console.log('PASS: one primary title action, compact shortcuts, motion setting remains available at five sizes');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
