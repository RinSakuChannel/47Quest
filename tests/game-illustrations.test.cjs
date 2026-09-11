const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
const page=await browser.newPage({viewport:{width:1000,height:800}});
await page.goto(pathToFileURL(path.resolve('build/index.html')).href);
const result=await page.evaluate(()=>{
 const art=window.QUEST_GAME_ILLUSTRATIONS,canvas=document.createElement('canvas');canvas.width=1000;canvas.height=800;
 const c=canvas.getContext('2d');document.body.replaceChildren(canvas);document.body.style.cssText='margin:0;background:#fff';
 const failures=[];art.glyphs.forEach((glyph,i)=>{const x=i%10*100,y=Math.floor(i/10)*140;c.clearRect(x,y,100,100);art.draw(c,glyph,x+50,y+50,90,1);if(!c.getImageData(x,y,100,100).data.some((v,j)=>j%4===3&&v>0))failures.push(glyph);c.font='16px sans-serif';c.fillStyle='#173e51';c.fillText(String(i+1),x+40,y+120);});
 return {count:art.glyphs.length,failures};
});assert.ok(result.count>=39);assert.deepEqual(result.failures,[]);
await page.screenshot({path:'.verification/game-illustrations.png'});console.log('PASS: '+result.count+' original illustrations render in Chrome');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
