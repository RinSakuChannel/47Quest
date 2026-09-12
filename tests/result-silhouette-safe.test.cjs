const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
for(const [width,height] of [[390,844],[360,640],[844,390]]){
const page=await browser.newPage({viewport:{width,height}});await page.goto(pathToFileURL(path.resolve('build/index.html')).href);
await page.evaluate(()=>{state.sound=false;state.current=PREFECTURE_DATA.find(pref=>pref.code==='42');state.round=[state.current];renderGame();finishGame(true,{stars:1,score:3,maxStreak:3});});
const friend=page.locator('.clear-friend.is-mystery'),image=friend.locator('.clear-friend-art img');assert.equal(await friend.count(),1,`${width}: result must remain a mystery`);assert.equal(await image.evaluate(e=>getComputedStyle(e).filter),'brightness(0)',`${width}: character is visible before review`);
let elapsed=0;for(const target of [0,180,300,600,900,1200,1800]){if(target>elapsed)await page.waitForTimeout(target-elapsed);elapsed=target;const inside=await page.evaluate(()=>{const image=document.querySelector('.clear-friend-art img').getBoundingClientRect(),stage=document.querySelector('.clear-friend-art').getBoundingClientRect(),card=document.querySelector('.result-card').getBoundingClientRect(),e=1;return image.left>=stage.left-e&&image.right<=stage.right+e&&image.top>=stage.top-e&&image.bottom<=stage.bottom+e&&stage.left>=card.left-e&&stage.right<=card.right+e&&stage.top>=card.top-e&&stage.bottom<=card.bottom+e;});assert.ok(inside,`${width}: animated silhouette is clipped at ${target}ms`);}
await page.screenshot({path:`.verification/result-silhouette-${width}.png`});await page.close();
}console.log('PASS: result character stays silhouetted and inside its safe stage throughout motion');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
