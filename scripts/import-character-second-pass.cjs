const sharp=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs=require('node:fs');
const inputs={
  "19": "C:/Users/freecar/.codex/generated_images/01a06fc8-dd44-7a90-9733-5ddac5181836/exec-da4d6be0-fb78-4b05-84bb-08ec2c0b33da.png",
  "22": "C:\\Users\\freecar\\.codex\\generated_images\\01a06fc8-dd44-7a90-9733-5ddac5181836\\exec-a68b8f77-b585-4e9e-bb1e-6892456bf890.png",
  "31": "C:\\Users\\freecar\\.codex\\generated_images\\01a06fc8-dd44-7a90-9733-5ddac5181836\\exec-60cf96dd-dacc-44de-ac58-beccfb4ca532.png",
  "04": "C:\\Users\\freecar\\.codex\\generated_images\\01a06fc8-dd44-7a90-9733-5ddac5181836\\exec-203a80f0-4961-4609-b9ef-596009df2c49.png"
};
(async()=>{const layers=[];let i=0;for(const [code,input] of Object.entries(inputs)){const meta=await sharp(input).metadata();const stats=await sharp(input).stats();console.log(code,meta.hasAlpha,stats.channels.map(c=>[c.min,c.max]));if(!meta.hasAlpha||stats.channels[3].min!==0)throw Error('Missing transparent pixels '+code);const output='assets/characters/v4/'+code+'.webp';await sharp(input).trim().resize(640,640,{fit:'inside',withoutEnlargement:true}).webp({quality:84,alphaQuality:100}).toFile(output);layers.push({input:await sharp(output).resize(240,300,{fit:'contain',background:'#e6e9e7'}).png().toBuffer(),left:i*240,top:0});i++;}await sharp({create:{width:960,height:300,channels:3,background:'#e6e9e7'}}).composite(layers).png().toFile('.verification/characters-second-pass.png');})();
