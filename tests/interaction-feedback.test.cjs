const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  for(const reducedMotion of ['no-preference','reduce']){
   const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion});
   await page.goto(pathToFileURL(path.resolve('build/index.html')).href);
   await page.evaluate(()=>{state.sound=false;window.feedbackSounds=[];sound=kind=>feedbackSounds.push(kind);});
   const collection=page.locator('[data-action="collection"]').first();
   await collection.dispatchEvent('pointerdown',{pointerId:1,clientX:350,clientY:25});
   assert.equal(await collection.evaluate(el=>el.classList.contains('is-pressing')),true);
   await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointercancel',{pointerId:1})));
   assert.equal(await collection.evaluate(el=>el.classList.contains('is-pressing')),false,'cancel must release visual press');
   assert.deepEqual(await page.evaluate(()=>feedbackSounds),['ui-press'],'cancel must not confirm');
   await collection.click();
   assert.ok((await page.evaluate(()=>feedbackSounds)).includes('ui-open'),'collection uses opening feedback');
   await page.locator('[data-action="home"]').first().click();
   assert.ok((await page.evaluate(()=>feedbackSounds)).includes('ui-back'),'return uses closing feedback');
   if(reducedMotion==='reduce')assert.equal(await page.locator('.tap-spark').count(),0,'reduced motion has no particle burst');
   await page.evaluate(()=>{state.current=PREFECTURE_DATA[0];state.round=[state.current];state.roundIndex=0;renderGame();finishGame(true,{score:3,stars:1});renderHome();window.feedbackVoices=0;characterCry=()=>feedbackVoices++;});
   await page.waitForTimeout(650);
   assert.equal(await page.evaluate(()=>feedbackVoices),0,'leaving results cancels delayed voice');
   await page.close();
  }
  console.log('PASS: cancelled presses, distinct navigation sounds, reduced motion, delayed voice cleanup');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
