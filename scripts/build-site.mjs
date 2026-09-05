import {mkdirSync,copyFileSync,readdirSync,statSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
const root=process.cwd();const output=join(root,'build');
const files=['index.html','games.html','styles.css',...readdirSync('src').filter(f=>/\.(js|css)$/.test(f)).map(f=>'src/'+f),'assets/images/japan-map-play.png'];
for(let i=1;i<=47;i++){const code=String(i).padStart(2,'0');files.push(`assets/characters/${code}.png`,`assets/maps/frame-overlays/${code}.png`);}
let bytes=0;
for(const file of files){if(!existsSync(file))throw Error(`Missing required asset: ${file}`);const target=join(output,file);mkdirSync(dirname(target),{recursive:true});copyFileSync(file,target);bytes+=statSync(file).size;}
if(bytes>16*1024*1024)throw Error('Static site exceeds the 16 MiB size budget');
console.log(`Static build: ${files.length} files, ${(bytes/1024/1024).toFixed(2)} MiB. Original art, archives and development data excluded.`);
