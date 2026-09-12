const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await page.goto(pathToFileURL(path.resolve('build/index.html')).href);
 const draws=[];
 for(let index=0;index<12;index++){await page.evaluate(()=>renderHome());draws.push(await page.locator('.home-roamer [data-character-code]').evaluateAll(nodes=>nodes.map(node=>node.dataset.characterCode)));}
 assert.ok(draws.every(draw=>draw.length===6&&new Set(draw).size===6),'each title draw must contain six unique characters');
 assert.ok(new Set(draws.map(draw=>draw.join(','))).size>1,'title characters stayed fixed across redraws');
 assert.ok(new Set(draws.flat()).size>=20,'random title draws do not cover enough of the 47-character roster');
 console.log('PASS: title draws six non-repeating random characters from the 47-character roster');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1});
