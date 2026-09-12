const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{const page=await browser.newPage();await page.goto(pathToFileURL(path.resolve('build/index.html')).href);
for(const [width,height] of [[390,844],[1440,900]]){
await page.setViewportSize({width,height});
for(let n=1;n<=47;n++){
const code=String(n).padStart(2,'0'),portrait=width===390;
const png=fs.readFileSync(`assets/maps/${portrait?'play-overlays-portrait':'play-overlays'}/${code}.png`).toString('base64');
const hit=await page.evaluate(async({code,png})=>{
 state.sound=false;state.current=PREFECTURE_DATA.find(p=>p.code===code);state.round=[state.current];state.roundIndex=0;renderMap();document.querySelector('.map-stage').dispatchEvent(new PointerEvent('pointerdown'));alignMapPins();
 const image=new Image();image.src='data:image/png;base64,'+png;await image.decode();
 const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const g=c.getContext('2d');g.drawImage(image,0,0);
 const point=mapPoint(state.current);const alpha=g.getImageData(Math.round(point.x/100*image.width),Math.round(point.y/100*image.height),1,1).data[3];
 const layers=document.querySelector('.map-layers'),pin=layers.querySelector('.prefecture-pin');
 // Include a transformed ancestor: the anchor must still share image coordinates.
 layers.style.transform='translate(7px, 4px) scale(1.7)';alignMapPins();
 pin.querySelector('svg').getAnimations().forEach(a=>a.finish());
 const r=layers.getBoundingClientRect(),p=pin.getBoundingClientRect();
 const aspect=image.width/image.height,drawW=Math.min(r.width,r.height*aspect),drawH=drawW/aspect;
 const x=r.left+(r.width-drawW)/2+point.x/100*drawW,y=r.top+(r.height-drawH)/2+point.y/100*drawH;
 let nearest=null;if(alpha<200){const data=g.getImageData(0,0,c.width,c.height).data;let best=Infinity;for(let yy=0;yy<c.height;yy++)for(let xx=0;xx<c.width;xx++){if(data[(yy*c.width+xx)*4+3]<240)continue;const d=(xx-point.x/100*c.width)**2+(yy-point.y/100*c.height)**2;if(d<best){best=d;nearest={x:xx/c.width*100,y:yy/c.height*100};}}}
 return {alpha,nearest,dx:Math.abs(p.left+p.width/2-x),dy:Math.abs(p.bottom-y)};
},{code,png});
if(hit.alpha<200)console.log(width,code,JSON.stringify(hit));
assert.ok(hit.alpha>=200,`${width} ${code}: pin must land inside the solid prefecture`);
assert.ok(hit.dx<1.5&&hit.dy<1.5,`${width} ${code}: rendered tip offset ${JSON.stringify(hit)}`);
}
}
await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{state.current=PREFECTURE_DATA.find(p=>p.code==='31');state.round=[state.current];renderMap();});
await page.waitForFunction(()=>document.querySelector('.map-stage')?._mapZoom?.getState().scale===3,null,{timeout:1800});
assert.ok(await page.locator('.map-stage').evaluate(e=>e._mapZoom.getState().scale===3),'initial prefecture zoom');
await page.waitForFunction(()=>document.querySelector('.map-stage')?._mapZoom?.getState().scale===1,null,{timeout:3500});
assert.equal(await page.locator('.map-stage').evaluate(e=>e._mapZoom.getState().scale),1,'returns to whole map');
fs.mkdirSync('.verification/maps',{recursive:true});await page.screenshot({path:'.verification/maps/tottori-phone.png'});
console.log('PASS: 94 actual overlay pixel checks and transformed pin-tip alignments');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
