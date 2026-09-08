const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
for(const [width,height] of [[1440,900],[768,1024],[390,844],[360,640],[844,390]]){
const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});await page.goto(pathToFileURL(path.resolve('build/index.html')).href);
for(const hint of [0,1]){
await page.evaluate(hint=>{state.current=PREFECTURES.find(p=>p.code==='45');state.reviewPhase='kanji';state.reviewHints={'45-kanji':hint};const c=document.createElement('canvas');c.width=800;c.height=300;const ctx=c.getContext('2d');ctx.font='100px serif';ctx.fillStyle='#173e51';ctx.fillText('宮崎県',150,190);state.inkPreview=c.toDataURL();renderReviewCompare();},hint);
await page.waitForTimeout(100);
const issues=await page.locator('.compare-heading,.compare-card,.compare-actions,.compare-actions button').evaluateAll(nodes=>nodes.flatMap(n=>{const r=n.getBoundingClientRect();return r.x<0||r.y<0||r.right>innerWidth+1||r.bottom>innerHeight+1||n.scrollWidth>n.clientWidth+2||n.scrollHeight>n.clientHeight+2?[n.className]:[]}));assert.deepEqual(issues,[],`${width} hint ${hint}`);
const cards=await page.locator('.compare-card').all();const a=await cards[0].boundingBox(),b=await cards[1].boundingBox();assert.ok(a.y+a.height<=b.y+1);
for(const button of await page.locator('.compare-actions button').all()){const box=await button.boundingBox();assert.ok(box.width>=120&&box.height>=44);}
if(hint)await page.screenshot({path:`.verification/compare-${width}.png`});
}
await page.close();}
console.log('PASS: compare stacked, unclipped, usable buttons in both hint states at five sizes');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
