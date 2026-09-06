// Lossy format encoding only; no cropping, rescaling or alpha reconstruction.
const sharp=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs=require('node:fs');
const manifest=JSON.parse(fs.readFileSync(process.argv[2]||'tmp/character-import.json','utf8'));
(async()=>{for(const {code,source} of manifest){
 const out=`assets/characters/v2/${code}.webp`;
 if(fs.existsSync(out))continue;
 const meta=await sharp(source).metadata();
 if(!meta.hasAlpha){console.log(`${code}: REJECT missing alpha`);continue;}
 let data;for(const quality of [85,78,70]){data=await sharp(source).webp({quality,alphaQuality:100,effort:4}).toBuffer();if(data.length<280000)break;}
 if(data.length>500000){console.log(`${code}: REJECT size ${data.length}`);continue;}
 fs.writeFileSync(out,data);console.log(`${code}: ${meta.width}x${meta.height} ${data.length} bytes`);
}})();
