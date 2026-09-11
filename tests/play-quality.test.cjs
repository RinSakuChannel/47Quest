const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
for(const [width,height] of [[1440,900],[1024,768],[768,1024],[390,844],[360,640],[844,390]]){
const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});await page.goto(pathToFileURL(path.resolve('build/index.html')).href);
for(const screen of ['journey','game']){
await page.evaluate(screen=>{state.current=PREFECTURES[0];state.round=[state.current];if(screen==='journey')renderJourney();else renderGame()},screen);
await page.waitForTimeout(50);
await page.screenshot({path:`.verification/quality-${screen}-${width}.png`});
const issues=await page.locator(screen==='journey'?'.journey-region,.journey-scene button':'.fg-intro,.fg-intro button,.fg-difficulty').evaluateAll(ns=>ns.filter(n=>{const r=n.getBoundingClientRect();return r.top<0||r.bottom>innerHeight+1||r.right>innerWidth+1||n.scrollHeight>n.clientHeight+2||n.scrollWidth>n.clientWidth+2}).map(n=>[n.className,n.clientHeight,n.scrollHeight,n.clientWidth,n.scrollWidth,n.textContent]));assert.deepEqual(issues,[],`${width} ${screen}`);
}
await page.getByRole('button',{name:'時間なしで れんしゅう'}).click();await page.waitForTimeout(200);assert.equal(await page.locator('.fg-practice-badge').isVisible(),true);
await page.evaluate(()=>{cleanups();window.QUEST_REGIONAL_GAMES.create=(code,ctx)=>{window.testGameContext=ctx;return{update(){}}};renderGame()});
await page.getByRole('button',{name:'時間なしで れんしゅう'}).click();
await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>testGameContext.model.elapsed),0);assert.ok(await page.evaluate(()=>testGameContext.model.playTime>0));
await page.evaluate(()=>testGameContext.hit(3));await page.waitForTimeout(60);
assert.equal(await page.evaluate(()=>testGameContext.model.score),0);
await page.getByRole('button',{name:'本番へ →'}).click();await page.evaluate(()=>testGameContext.hit(3));assert.equal(await page.evaluate(()=>testGameContext.model.score),3);
await page.evaluate(()=>finishGame(true,{score:3,stars:1}));assert.equal(await page.locator('.result-learning').isVisible(),true);
await page.evaluate(()=>{QUEST_MOTION.set('full');state.gachaRewards=[PREFECTURES[0]];state.rewardRevealIndex=0;state.reviewIndex=1;state.newlyUnlocked=new Set(['01']);renderRewardReveal()});
assert.equal(await page.locator('.reveal-name-card').getAttribute('inert'),'');
await page.getByRole('button',{name:'紹介を見る →'}).click();assert.equal(await page.locator('.reveal-name-card').getAttribute('inert'),null);
const reveal=await page.locator('.reveal-character-wrap').boundingBox();assert.ok(reveal.y>=0&&reveal.y+reveal.height<=height);
await page.close();
}console.log('PASS: journey, game intro, practice reset and retry goal at six sizes');}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
