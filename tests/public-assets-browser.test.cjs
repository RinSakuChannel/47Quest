const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve('build');
const server=http.createServer((request,response)=>{const relative=decodeURIComponent(new URL(request.url,'http://local').pathname).replace(/^\/+$/,'index.html').replace(/^\//,'');const file=path.resolve(root,relative);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){response.writeHead(404).end();return;}response.end(fs.readFileSync(file));});
(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{const page=await browser.newPage({viewport:{width:390,height:844}});const bad=[];page.on('requestfailed',request=>bad.push(`${request.url()} ${request.failure()?.errorText}`));page.on('response',response=>{if(response.status()>=400)bad.push(`${response.status()} ${response.url()}`);});
 await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'networkidle'});
 const characters=await page.evaluate(async()=>Promise.all(Object.entries(CHARACTER_ART).map(async([code,src])=>{const image=new Image();image.src=src;try{await image.decode();return {code,width:image.naturalWidth,height:image.naturalHeight};}catch(error){return {code,error:String(error)};}})));
 assert.equal(characters.length,47);for(const image of characters){assert.ok(!image.error&&image.width>0&&image.height>0,`${image.code}: character link is broken ${JSON.stringify(image)}`);}
 await page.goto(`http://127.0.0.1:${server.address().port}/games.html`,{waitUntil:'networkidle'});
 assert.equal(await page.locator('#gallery img').evaluateAll(images=>images.filter(image=>!image.complete||!image.naturalWidth).length),0,'gallery contains broken images');
 assert.deepEqual(bad,[],'public build contains failed requests');
 console.log('PASS: all 47 character URLs decode, home and game gallery have no failed or 4xx asset requests');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}})().catch(error=>{console.error(error);process.exit(1);});
