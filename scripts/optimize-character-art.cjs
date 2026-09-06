const fs=require('node:fs');
const path=require('node:path');
const sharp=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

const directory=path.join(process.cwd(),'assets','characters','v3');
const targetBytes=220000;

(async()=>{
  for(let number=1;number<=47;number++){
    const code=String(number).padStart(2,'0');
    const file=path.join(directory,`${code}.webp`);
    if(!fs.existsSync(file))throw Error(`Missing ${file}`);
    const input=fs.readFileSync(file);
    const metadata=await sharp(input).metadata();
    if(!metadata.hasAlpha)throw Error(`${code} has no alpha channel`);
    let output=input;
    for(const quality of [84,80,76,72,68,64]){
      output=await sharp(input)
        .resize({width:1024,height:1024,fit:'inside',withoutEnlargement:true})
        .webp({quality,alphaQuality:100,effort:6})
        .toBuffer();
      if(output.length<=targetBytes)break;
    }
    fs.writeFileSync(file,output);
    console.log(`${code}: ${metadata.width}x${metadata.height} -> ${output.length} bytes`);
  }
})().catch(error=>{console.error(error);process.exit(1)});
