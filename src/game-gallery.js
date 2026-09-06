(() => {
  const names=Object.fromEntries(window.PREFECTURE_DATA.map(p=>[p.code,p.name]));
  const all=window.QUEST_FEATURED_GAMES;
  let cleanup=[];let current='',galleryPage=0;
  let context,bgm,se,timer=0;
  const volume=()=>{if(!context)return;const music=(Number(document.querySelector('#bgm-volume').value)/100)**2;const effects=(Number(document.querySelector('#se-volume').value)/100)**2;bgm.gain.setTargetAtTime(music*.42,context.currentTime,.02);se.gain.setTargetAtTime(effects*.7,context.currentTime,.02);};
  const sound=event=>{if(context)window.QUEST_AUDIO.effect(context,se,current,event);};
  const audio=()=>{try{context ||=new(window.AudioContext||window.webkitAudioContext)();if(!bgm){bgm=context.createGain();se=context.createGain();bgm.connect(context.destination);se.connect(context.destination);}context.resume();volume();let step=0,at=context.currentTime+.05;const schedule=()=>{while(at<context.currentTime+.15){window.QUEST_AUDIO.music(context,bgm,'game',step++,at);at+=60/118/2;}};schedule();timer=setInterval(schedule,80);}catch{/* silent play still works */}};
  document.querySelectorAll('#bgm-volume,#se-volume').forEach(slider=>slider.addEventListener('input',()=>{window.QUEST_CHARACTER_CRIES?.stop();volume();}));
  const stop=()=>{window.QUEST_CHARACTER_CRIES?.stop();cleanup.forEach(fn=>fn());cleanup=[];clearInterval(timer);timer=0;};
  const voice=()=>{if(!context||!current)return;const level=Number(document.querySelector('#se-volume').value)/100;if(level<=0)return;window.QUEST_CHARACTER_CRIES?.play(context,current,Math.min(1,level*1.8),se);};
  const close=()=>{stop();document.querySelector('#player').hidden=true;document.querySelector('#result').hidden=true;};
  const launch=code=>{
    stop();current=code;document.querySelector('#result').hidden=true;document.querySelector('#player').hidden=false;
    document.querySelector('#game-title').textContent=`${names[code]||code}・${all.definitions[code].title}`;
    const field=document.querySelector('#field');field.replaceChildren();
    audio();
    all.start({field,pref:{code},sound,registerCleanup(fn){cleanup.push(fn);},updateHud(score,goal,time){document.querySelector('#hud').textContent=`${Math.ceil(time)}秒`;},finish(success,result){stop();sound('win');voice();document.querySelector('#result').hidden=false;const friend=document.querySelector('#friend');friend.src=window.CHARACTER_ART?.[code]||`./assets/characters/${code}.png`;friend.dataset.characterCode=code;document.querySelector('#record').textContent=`${'★'.repeat(result.stars)}　${result.score}点　「${window.QUEST_PERSONALITIES?.[code]?.line || ''}」`;}});
  };
  document.querySelector('#status').textContent=`47都道府県から 遊びたいゲームをえらぼう。場所や文字も覚える冒険はホームから！`;
  const entries=Object.entries(all.definitions).sort(([a],[b])=>a.localeCompare(b));
  const pageSize=()=>innerWidth<=600?6:innerWidth<=1000?9:12;
  const renderGallery=()=>{const size=pageSize(),pages=Math.ceil(entries.length/size);galleryPage=Math.max(0,Math.min(pages-1,galleryPage));const gallery=document.querySelector('#gallery');gallery.replaceChildren();
    for(const [code,def] of entries.slice(galleryPage*size,(galleryPage+1)*size)){const button=document.createElement('button');const pref=document.createElement('span');pref.textContent=names[code]||code;const title=document.createElement('b');title.textContent=def.title;const caption=document.createElement('span');caption.textContent=def.command;button.append(pref,title,caption);button.addEventListener('click',()=>launch(code));gallery.append(button);}
    document.querySelector('#gallery-page').textContent=`${galleryPage+1} / ${pages}`;document.querySelector('#gallery-prev').disabled=galleryPage===0;document.querySelector('#gallery-next').disabled=galleryPage===pages-1;};
  document.querySelector('#gallery-prev').addEventListener('click',()=>{galleryPage--;renderGallery();});document.querySelector('#gallery-next').addEventListener('click',()=>{galleryPage++;renderGallery();});addEventListener('resize',renderGallery);renderGallery();
  document.querySelector('#back').addEventListener('click',close);document.querySelector('#return').addEventListener('click',close);document.querySelector('#again').addEventListener('click',()=>launch(current));
  document.querySelector('#friend').addEventListener('click',voice);
})();
