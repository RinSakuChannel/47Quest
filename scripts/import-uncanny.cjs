// Format conversion only: preserve source pixels and alpha, no crop or resize.
const sharp=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs=require('node:fs');
(async()=>{
  const [code,source]=process.argv.slice(2);
  if(!/^\d{2}$/.test(code))throw Error('Two digit prefecture code required');
  const meta=await sharp(source).metadata();
  if(!meta.hasAlpha)throw Error('No alpha; request imagegen extraction');
  fs.mkdirSync('assets/characters/v3',{recursive:true});
  const out=`assets/characters/v3/${code}.webp`;
  let encoded;
  for(const quality of [85,80,75,70]){
    encoded=await sharp(source).webp({quality,alphaQuality:100,effort:4}).toBuffer();
    if(encoded.length<450000)break;
  }
  fs.writeFileSync(out,encoded);
  console.log(JSON.stringify({code,width:meta.width,height:meta.height,bytes:fs.statSync(out).size,out}));
})();
