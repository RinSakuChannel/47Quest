// Format/size optimization only: keep artwork composition and alpha unchanged.
const sharp=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs=require('node:fs');
const base='C:/Users/freecar/.codex/generated_images/01a06fc8-dd44-7a90-9733-5ddac5181836/';
const assets=[['02','exec-fc4803ca-460e-489a-96a3-5699cbd4c0d0.png'],['10','exec-1bbfc0ae-3303-4bce-aae0-6fbd95485233.png'],['12','exec-cc1a6616-2c49-4e84-819f-335b439c5eb8.png'],['37','exec-2b84872d-311c-4be3-9d4b-2070f0090766.png']];
(async()=>{
  assets.push(['04','exec-45497593-7c06-4a97-b619-81681e1e7245.png'],['06','exec-74fd8341-8a35-41fe-ae25-2cf1ac5af3f7.png']);
  fs.mkdirSync('assets/characters/v2',{recursive:true});
  for(const [code,file] of assets){
    const input=sharp(base+file);const meta=await input.metadata();
    if(!meta.hasAlpha)throw Error(code+': expected transparent image');
    const output=`assets/characters/v2/${code}.webp`;
    await input.webp({quality:88,alphaQuality:100,effort:6}).toFile(output);
    const size=fs.statSync(output).size;if(size>300000)throw Error(code+': over 300 KB character budget');
    console.log(`${code}: ${meta.width} x ${meta.height}, ${size} bytes, alpha preserved`);
  }
})();
