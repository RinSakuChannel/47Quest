const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
for(const [width,height] of [[1440,900],[768,1024],[390,844],[360,640],[844,390]]){
const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});await page.goto(pathToFileURL(path.resolve('build/index.html')).href);
await page.evaluate(()=>{state.round=[PREFECTURES.find(p=>p.code==='46')];state.reviewIndex=0;state.reviewPhase='kanji';state.reviewHints={};renderReview()});
for(let hint=0;hint<3;hint++){
assert.equal(await page.locator('[data-action="review-hint"]').count(),1);
assert.equal(await page.getByText('答えはまだ見えないよ').count(),0);
const issues=await page.locator('.review-writing-top,.review-answer-hint,.writing-tools button').evaluateAll(ns=>ns.filter(n=>{const r=n.getBoundingClientRect();return r.right>innerWidth+1||r.bottom>innerHeight+1||n.scrollWidth>n.clientWidth+2||n.scrollHeight>n.clientHeight+2}).map(n=>n.className));assert.deepEqual(issues,[],`${width} hint ${hint}`);
if(hint<2)await page.locator('[data-action="review-hint"]').click();
}await page.close();
}console.log('PASS: single hint control, three hint states, five sizes');}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
