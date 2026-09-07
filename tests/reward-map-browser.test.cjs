const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const root=path.resolve('build');
 const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!fs.existsSync(file)){res.writeHead(404);return res.end();}res.end(fs.readFileSync(file));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate(()=>{const p=PREFECTURES.find(p=>p.code==='05');state.gachaRewards=[p];state.rewardRevealIndex=0;renderRewardReveal();});
  await page.waitForTimeout(700);
  const transform=await page.locator('.gacha-map-preview .map-layers').evaluate(e=>getComputedStyle(e).transform);
  assert.match(transform,/matrix\(5,/);
  await page.screenshot({path:'.verification/akita-reward.png'});
  await page.locator('[data-action="reward-map"]').click();
  await page.waitForTimeout(700);
  await page.screenshot({path:'.verification/akita-map.png'});
  console.log('PASS: Akita reward preview is zoomed and map opens');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
