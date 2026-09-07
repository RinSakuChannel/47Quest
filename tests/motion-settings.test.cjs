const assert=require('node:assert/strict');
const path=require('node:path'),{pathToFileURL}=require('node:url');
const fs=require('node:fs'),http=require('node:http');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.join(path.resolve('build'),req.url==='/'?'index.html':req.url);if(!fs.existsSync(file)){res.writeHead(404);return res.end();}res.end(fs.readFileSync(file));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  assert.equal(await page.evaluate(()=>QUEST_MOTION.reduced()),true);
  await page.locator('.sound-menu-button').click();
  await page.locator('[data-motion]').selectOption('full');
  assert.equal(await page.evaluate(()=>QUEST_MOTION.reduced()),false);
  assert.ok(await page.locator('.home-roamer').first().evaluate(e=>parseFloat(getComputedStyle(e).animationDuration)>.01));
  await page.reload();
  assert.equal(await page.evaluate(()=>QUEST_MOTION.mode),'full');
  await page.evaluate(()=>{state.current=PREFECTURE_DATA[4];state.round=[state.current];renderMap();});
  assert.ok(await page.locator('.prefecture-pin svg').evaluate(e=>parseFloat(getComputedStyle(e).animationDuration)>.1));
  await page.locator('.sound-menu-button').click();
  await page.locator('[data-motion]').selectOption('calm');
  assert.equal(await page.evaluate(()=>QUEST_MOTION.reduced()),true);
  assert.equal(await page.locator('.prefecture-pin svg').evaluate(e=>getComputedStyle(e).animationName),'none');
  console.log('PASS: desktop full effects override reduced motion by explicit choice, persist, and remain switchable');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
