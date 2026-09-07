const sharp=require('C:/Users/freecar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs=require('node:fs');
const inputs={
  "17": "C:\\Users\\freecar\\.codex\\generated_images\\01a06fc8-dd44-7a90-9733-5ddac5181836\\exec-2af89a02-c9fa-469b-85df-6ed2ade44979.png",
  "25": "C:\\Users\\freecar\\.codex\\generated_images\\01a06fc8-dd44-7a90-9733-5ddac5181836\\exec-52057fc8-596f-4e00-bb8e-ab78af09ca5f.png",
  "28": "C:\\Users\\freecar\\.codex\\generated_images\\01a06fc8-dd44-7a90-9733-5ddac5181836\\exec-e221106e-7570-45a8-9abb-84afa51f3da8.png",
  "39": "C:\\Users\\freecar\\.codex\\generated_images\\01a06fc8-dd44-7a90-9733-5ddac5181836\\exec-3ed2fed3-3133-48a8-acc1-fdc8e1543cdc.png",
  "43": "C:\\Users\\freecar\\.codex\\generated_images\\01a06fc8-dd44-7a90-9733-5ddac5181836\\exec-ffe67f3f-f743-40d1-b01f-20b6924d45c7.png",
  "47": "C:\\Users\\freecar\\.codex\\generated_images\\01a06fc8-dd44-7a90-9733-5ddac5181836\\exec-ecd85a02-e7c2-456c-af27-cddaf077ff63.png"
};
(async()=>{fs.mkdirSync('assets/characters/v4',{recursive:true});const layers=[];let i=0;for(const [code,input] of Object.entries(inputs)){const output='assets/characters/v4/'+code+'.webp';await sharp(input).trim().resize(640,640,{fit:'inside',withoutEnlargement:true}).webp({quality:84,alphaQuality:100}).toFile(output);const meta=await sharp(output).metadata();if(!meta.hasAlpha)throw Error('Missing alpha '+code);console.log(code,meta.width,meta.height,fs.statSync(output).size);layers.push({input:await sharp(output).resize(290,310,{fit:'contain',background:'#e6e9e7'}).png().toBuffer(),left:(i%3)*300,top:Math.floor(i/3)*310});i++;}await sharp({create:{width:900,height:620,channels:3,background:'#e6e9e7'}}).composite(layers).png().toFile('.verification/characters-v4.png');})();
