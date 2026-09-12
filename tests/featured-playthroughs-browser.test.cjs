const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    const page=await browser.newPage({viewport:{width:1024,height:768},reducedMotion:'reduce'});
    await page.goto(pathToFileURL(path.resolve('build/index.html')).href);
    async function open(code){
      await page.evaluate(code=>{state.sound=false;state.current=PREFECTURES.find(pref=>pref.code===code);state.round=[state.current];state.roundIndex=0;state.replay=true;renderGame();},code);
      await page.getByRole('button',{name:'スタート',exact:true}).click();
      await page.waitForSelector('.fg-world');
    }
    async function cleared(code){
      await page.waitForSelector('.result-card.is-clear',{timeout:22000});
      assert.equal(await page.locator('#game-score').textContent(),code==='02'?'8 / 8':code==='12'?'8 / 8':'5 / 5');
    }

    await open('02');
    for(let n=0;n<320&&!await page.locator('.result-card.is-clear').count();n++){
      const fruit=await page.locator('.fg-apple').evaluateAll(nodes=>nodes.map(node=>({x:parseFloat(node.style.left),y:parseFloat(node.style.top)})).sort((a,b)=>b.y-a.y)[0]);
      if(fruit){const world=await page.locator('.fg-world').boundingBox();await page.mouse.move(world.x+world.width*fruit.x/100,world.y+world.height*.86);}
      await page.waitForTimeout(35);
    }
    await cleared('02');

    await page.reload({waitUntil:'load'});
    await open('12');
    await page.waitForTimeout(2500);
    assert.ok(await page.locator('.fg-parcel').count(),await page.locator('#game-field').innerHTML());
    for(let n=0;n<60&&!await page.locator('.result-card.is-clear').count();n++){
      const parcel=page.locator('.fg-parcel').first();
      if(!await parcel.count()||!await parcel.isVisible()){await page.waitForTimeout(150);continue;}
      const label=await parcel.getAttribute('aria-label');const bin=page.locator(label.includes('葉')?'.fg-bin-1':'.fg-bin-0');
      const from=await parcel.boundingBox(),to=await bin.boundingBox();
      await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:8});await page.mouse.up();await page.waitForTimeout(520);
    }
    await cleared('12');

    await page.reload({waitUntil:'load'});
    await open('37');
    for(let n=0;n<40&&!await page.locator('.result-card.is-clear').count();n++){
      const gripNode=page.locator('.fg-grip');if(await gripNode.isDisabled()){await page.waitForTimeout(100);continue;}
      let ready=false;const first=(await page.locator('#game-score').textContent()).startsWith('0 ');
      if(first){
        const grip=await gripNode.boundingBox(),world=await page.locator('.fg-world').boundingBox(),x=grip.x+grip.width/2;
        await page.mouse.move(x,grip.y+grip.height/2);await page.mouse.down();
        for(let y=grip.y+grip.height/2;y>world.y+20&&!ready;y-=6){await page.mouse.move(x,y);ready=(await gripNode.getAttribute('class')).includes('is-ready');}
        await page.mouse.up();
      }else{
        await gripNode.focus();await page.keyboard.down('Space');
        for(let wait=0;wait<90&&!ready;wait++){await page.waitForTimeout(25);ready=(await gripNode.getAttribute('class')).includes('is-ready');}
        await page.keyboard.up('Space');
      }
      assert.ok(ready,`the visible yellow release band must be reachable; score=${await page.locator('#game-score').textContent()}`);await page.waitForTimeout(750);
    }
    await cleared('37');
    console.log('PASS: Aomori, Chiba and Kagawa clear through real browser pointer input');
    await page.close();
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
