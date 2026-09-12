const sharp=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs=require('node:fs');
const vm=require('node:vm');
(async()=>{
 fs.mkdirSync('.verification',{recursive:true});
 const sandbox={window:{}};
 vm.runInNewContext(fs.readFileSync('src/character-art.js','utf8'),sandbox);
 const layers=[];
 for(let n=1;n<=47;n++){
  const code=String(n).padStart(2,'0'),x=((n-1)%8)*180,y=Math.floor((n-1)/8)*205;
  layers.push({input:await sharp(sandbox.window.CHARACTER_ART[code]).resize(170,175,{fit:'contain',background:'#f8f5de'}).png().toBuffer(),left:x+5,top:y});
  layers.push({input:Buffer.from(`<svg width="180" height="30"><text x="90" y="22" text-anchor="middle" font-size="20">${code}</text></svg>`),left:x,top:y+175});
 }
 await sharp({create:{width:1440,height:1230,channels:3,background:'#f8f5de'}}).composite(layers).png().toFile('.verification/characters-audit.png');
})();
