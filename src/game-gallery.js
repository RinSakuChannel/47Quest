(() => {
  const prefectures=Object.fromEntries(window.PREFECTURE_DATA.map(p=>[p.code,p]));
  const names=Object.fromEntries(window.PREFECTURE_DATA.map(p=>[p.code,p.name]));
  const all=window.QUEST_FEATURED_GAMES;
  let cleanup=[];let current='',galleryPage=0;
  let context,bgm,se,timer=0;
  let soundEnabled=false;
  const muteButton=document.querySelector('#sound-toggle');
  muteButton.addEventListener('click',()=>{
    soundEnabled=!soundEnabled;
    muteButton.textContent=`音 ${soundEnabled?'ON':'OFF'}`;
    muteButton.setAttribute('aria-pressed',String(soundEnabled));
    window.QUEST_CHARACTER_CRIES?.stop();
    if(soundEnabled&&current&&!document.querySelector('#player').hidden&&!timer) audio();
    volume();
    if(!soundEnabled){clearInterval(timer);timer=0;context?.suspend();}
  });
  const volume=()=>{if(!context)return;const music=(Number(document.querySelector('#bgm-volume').value)/100)**2;const effects=(Number(document.querySelector('#se-volume').value)/100)**2;bgm.gain.setTargetAtTime((soundEnabled?music:0)*.42,context.currentTime,.02);se.gain.setTargetAtTime((soundEnabled?effects:0)*.7,context.currentTime,.02);};
  const sound=event=>{if(soundEnabled&&context)window.QUEST_AUDIO.effect(context,se,current,event);};
  const audio=()=>{if(!soundEnabled)return;try{context ||=new(window.AudioContext||window.webkitAudioContext)();if(!bgm){bgm=context.createGain();se=context.createGain();bgm.connect(context.destination);se.connect(context.destination);}context.resume();volume();let step=0,at=context.currentTime+.05;const schedule=()=>{while(at<context.currentTime+.15){window.QUEST_AUDIO.music(context,bgm,'game',step++,at);at+=60/118/2;}};schedule();timer=setInterval(schedule,80);}catch{/* silent play still works */}};
  document.querySelectorAll('#bgm-volume,#se-volume').forEach(slider=>slider.addEventListener('input',()=>{window.QUEST_CHARACTER_CRIES?.stop();volume();}));
  const stop=()=>{window.QUEST_CHARACTER_CRIES?.stop();cleanup.forEach(fn=>fn());cleanup=[];clearInterval(timer);timer=0;};
  const voice=()=>{if(!soundEnabled||!context||!current)return;const level=Number(document.querySelector('#se-volume').value)/100;if(level<=0)return;window.QUEST_CHARACTER_CRIES?.play(context,current,Math.min(1,level*1.8),se);};
  const close=()=>{stop();document.querySelector('#player').hidden=true;document.querySelector('#result').hidden=true;};
  const launch=code=>{
    stop();current=code;document.querySelector('#result').hidden=true;document.querySelector('#player').hidden=false;
    document.querySelector('#game-title').textContent=`${names[code]||code}・${all.definitions[code].title}`;
    const field=document.querySelector('#field');field.replaceChildren();
    audio();
    all.start({field,pref:{code},sound,registerCleanup(fn){cleanup.push(fn);},updateHud(score,goal,time){document.querySelector('#hud').textContent=time==null?'練習':`${Math.ceil(time)}秒`;},finish(success,result){stop();sound('win');document.querySelector('#result').hidden=false;const friend=document.querySelector('#friend');friend.innerHTML=`<img src="${window.CHARACTER_ART?.[code]||''}" alt="" />`;friend.dataset.characterCode=code;voice();document.querySelector('#record').textContent=`${'★'.repeat(result.stars)}　${result.score}点　「${window.QUEST_PERSONALITIES?.[code]?.line || ''}」`;}});
  };
  document.querySelector('#status').textContent=`47都道府県から 遊びたいゲームをえらぼう。場所や文字も覚える冒険はホームから！`;
  const entries=Object.entries(all.definitions).sort(([a],[b])=>a.localeCompare(b));
  const segmenter=typeof Intl?.Segmenter==='function'?new Intl.Segmenter('ja',{granularity:'word'}):null;
  const applyJapaneseBreaks=root=>{if(!segmenter)return;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const node of nodes){if(!/[ぁ-んァ-ヶ一-龠々]/.test(node.data)||node.data.trim().length<4)continue;const parts=[...segmenter.segment(node.data)];if(parts.length<2)continue;const fragment=document.createDocumentFragment();let previous='';parts.forEach((part,index)=>{if(index&&part.isWordLike&&[...part.segment.trim()].length>=2&&!/[ごお御]$/.test(previous.trim()))fragment.append(document.createElement('wbr'));fragment.append(part.segment);previous=part.segment});node.replaceWith(fragment)}};
  const pageSize=()=>innerWidth<=600?6:innerWidth<=1000?9:12;
  const renderGallery=()=>{const size=pageSize(),pages=Math.ceil(entries.length/size);galleryPage=Math.max(0,Math.min(pages-1,galleryPage));const gallery=document.querySelector('#gallery');gallery.replaceChildren();
    for(const [code,def] of entries.slice(galleryPage*size,(galleryPage+1)*size)){const button=document.createElement('button');button.style.setProperty('--card-color',prefectures[code]?.color||'#79d2b0');const art=document.createElement('span');art.className='gallery-character';const image=document.createElement('img');image.src=window.CHARACTER_ART?.[code]||'';image.alt='';art.append(image);const copy=document.createElement('span');copy.className='gallery-copy';const pref=document.createElement('span');pref.className='gallery-prefecture';pref.textContent=`${code}　${names[code]||code}`;const title=document.createElement('b');title.textContent=def.title;const caption=document.createElement('span');caption.className='gallery-command';caption.textContent=def.command;copy.append(pref,title,caption);button.append(art,copy);button.addEventListener('click',()=>launch(code));gallery.append(button);}
    applyJapaneseBreaks(gallery);document.querySelector('#gallery-page').textContent=`${galleryPage+1} / ${pages}`;document.querySelector('#gallery-prev').disabled=galleryPage===0;document.querySelector('#gallery-next').disabled=galleryPage===pages-1;};
  document.querySelector('#gallery-prev').addEventListener('click',()=>{galleryPage--;renderGallery();});document.querySelector('#gallery-next').addEventListener('click',()=>{galleryPage++;renderGallery();});addEventListener('resize',renderGallery);renderGallery();
  document.querySelector('#back').addEventListener('click',close);document.querySelector('#return').addEventListener('click',close);document.querySelector('#again').addEventListener('click',()=>launch(current));
  document.querySelector('#friend').addEventListener('click',voice);
})();
