const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const errors=[];
  try{
    for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}]){
      const page=await browser.newPage({viewport,reducedMotion:'reduce'});
      page.on('pageerror',error=>errors.push(`${viewport.width}x${viewport.height}: ${error.message}`));
      await page.goto(pathToFileURL(path.resolve('build/index.html')).href);
      for(const code of ['10','19','30','34','38','43','44']){
        await page.evaluate(code=>{state.sound=false;state.current=PREFECTURE_DATA.find(pref=>pref.code===code);state.round=[state.current];state.roundIndex=0;renderGame();},code);
        assert.equal(await page.locator('.fg-challenge').isVisible(),true,`${code}: replay challenge is hidden`);
        await page.getByRole('button',{name:'スタート',exact:true}).click();
        await page.waitForSelector('.rg-canvas');
        const box=await page.locator('.rg-canvas').boundingBox();
        assert.ok(box&&box.x>=-1&&box.y>=-1&&box.x+box.width<=viewport.width+1&&box.y+box.height<=viewport.height+1,`${code}: board leaves ${viewport.width}x${viewport.height}`);
        await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
        await page.waitForTimeout(40);
      }
      await page.evaluate(()=>finishGame(false,{score:1,stars:0,failureReason:'黄色の帯で 指をはなそう'}));
      assert.match(await page.locator('.retry-friend p').textContent(),/黄色の帯/);
      await page.getByRole('button',{name:'もう一度',exact:true}).click();
      await page.waitForSelector('.fg-world');
      assert.equal(await page.locator('.fg-intro').count(),0,'retry must skip the repeated tutorial');
      await page.close();
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: seven rebuilt games fit desktop/phone portrait/phone landscape, show challenges, explain failure, and retry instantly');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
