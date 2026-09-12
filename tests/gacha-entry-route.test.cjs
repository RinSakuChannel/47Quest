const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await page.goto(pathToFileURL(path.resolve('build/index.html')).href);
await page.evaluate(()=>{state.sound=false;state.coins=1;state.round=PREFECTURE_DATA.slice(0,3);state.reviewIndex=1;state.gachaFromReview=true;state.gachaPrefecture=PREFECTURE_DATA[0];renderHome();});
await page.getByRole('button',{name:/コインでガチャ/}).click();assert.equal(await page.evaluate(()=>state.gachaFromReview),false,'top coin button retained a stale review route');
await page.locator('[data-action="gacha-pull"]').click();await page.waitForSelector('.reward-reveal-scene');assert.equal(await page.locator('[data-action="reward-reveal-next"]').innerText(),'ガチャへもどる →');assert.equal(await page.getByText(/つぎのおさらいへ/).count(),0);
await page.locator('[data-action="reward-reveal-next"]').click();await page.waitForSelector('.gacha-scene');assert.equal(await page.locator('[data-action="gacha-pull"]').count(),1);
await page.evaluate(()=>{state.coins=1;state.gachaFromReview=true;state.gachaPrefecture=PREFECTURE_DATA[1];state.reviewIndex=1;state.round=PREFECTURE_DATA.slice(0,3);renderGacha();});await page.locator('[data-action="gacha-pull"]').click();await page.waitForSelector('.reward-reveal-scene');assert.match(await page.locator('[data-action="reward-reveal-next"]').innerText(),/つぎのおさらいへ/);
console.log('PASS: top-bar gacha returns to gacha; only immediate review gacha advances the review');await page.close();
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
