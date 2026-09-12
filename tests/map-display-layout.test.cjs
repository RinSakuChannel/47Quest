const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
const page=await browser.newPage();await page.goto(pathToFileURL(path.resolve('build/index.html')).href);
for(const file of ['assets/images/japan-map-play.png','assets/images/japan-map-play-portrait.png']){
 const png=fs.readFileSync(file).toString('base64');
 const audit=await page.evaluate(async png=>{const image=new Image();image.src='data:image/png;base64,'+png;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const context=canvas.getContext('2d');context.drawImage(image,0,0);const data=context.getImageData(0,0,image.width,image.height).data;let minX=image.width,maxX=-1,minY=image.height,maxY=-1,dark=0;for(let y=0;y<image.height;y+=4){for(let x=0;x<image.width;x+=4){const i=(y*image.width+x)*4,r=data[i],g=data[i+1],b=data[i+2];const ocean=Math.abs(r-223)<8&&Math.abs(g-245)<8&&Math.abs(b-247)<8;if(!ocean){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}if(r<90&&g<120&&b<140)dark++;}}return {width:image.width,height:image.height,minX,maxX,minY,maxY,dark};},png);
 assert.ok(audit.maxX>audit.minX,`${file}: no land pixels`);const center=(audit.minX+audit.maxX)/2;assert.ok(Math.abs(center-audit.width/2)<=audit.width*.015,`${file}: archipelago is not horizontally centered ${JSON.stringify(audit)}`);assert.equal(audit.dark,0,`${file}: baked label or separator-like dark pixels remain`);
}
console.log('PASS: landscape and portrait archipelagos are centered, with no baked Okinawa label or separator');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
