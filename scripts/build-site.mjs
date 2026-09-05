import {mkdirSync,copyFileSync,readdirSync,statSync,existsSync,lstatSync,unlinkSync} from 'node:fs';
import {join,dirname} from 'node:path';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const root=process.cwd();const output=join(root,'build');
if(existsSync(output)&&lstatSync(output).isSymbolicLink())throw Error('Build output must not be a symlink');
const files=['index.html','games.html','styles.css',...readdirSync('src').filter(f=>/\.(js|css)$/.test(f)).map(f=>'src/'+f),'assets/images/japan-map-play.png'];
const artContext={window:{}};vm.runInNewContext(readFileSync('src/character-art.js','utf8'),artContext);
for(let i=1;i<=47;i++){const code=String(i).padStart(2,'0');files.push((artContext.window.CHARACTER_ART[code]||`assets/characters/${code}.png`).replace(/^\.\//,''),`assets/maps/frame-overlays/${code}.png`);}
let bytes=0;
for(const file of files){if(!existsSync(file))throw Error(`Missing required asset: ${file}`);const target=join(output,file);mkdirSync(dirname(target),{recursive:true});copyFileSync(file,target);bytes+=statSync(file).size;}
// Remove obsolete generated copies only. Source artwork is never removed.
const allowed=new Set(files.map(f=>join(output,f)));
function removeObsolete(directory){for(const item of readdirSync(directory,{withFileTypes:true})){const path=join(directory,item.name);if(item.isSymbolicLink())throw Error('Unexpected symlink in build output');if(item.isDirectory())removeObsolete(path);else if(!allowed.has(path))unlinkSync(path);}}
removeObsolete(output);
if(bytes>16*1024*1024)throw Error('Static site exceeds the 16 MiB size budget');
console.log(`Static build: ${files.length} files, ${(bytes/1024/1024).toFixed(2)} MiB. Original art, archives and development data excluded.`);
