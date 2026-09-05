(() => {
  const names=Object.fromEntries(window.PREFECTURE_DATA.map(p=>[p.code,p.name]));
  const all=window.QUEST_FEATURED_GAMES;
  let cleanup=[];let current='';
  let context,bgm,se,timer=0;
  const volume=()=>{if(!context)return;const v=(Number(document.querySelector('#volume').value)/100)**2;bgm.gain.setTargetAtTime(v*.65,context.currentTime,.02);se.gain.setTargetAtTime(v,context.currentTime,.02);};
  const sound=event=>{if(context)window.QUEST_AUDIO.effect(context,se,current,event);};
  const audio=()=>{try{context ||=new(window.AudioContext||window.webkitAudioContext)();if(!bgm){bgm=context.createGain();se=context.createGain();bgm.connect(context.destination);se.connect(context.destination);}context.resume();volume();let step=0,at=context.currentTime+.05;const schedule=()=>{while(at<context.currentTime+.15){window.QUEST_AUDIO.music(context,bgm,'game',step++,at);at+=60/118/2;}};schedule();timer=setInterval(schedule,80);}catch{/* silent play still works */}};
  document.querySelector('#volume').addEventListener('input',volume);
  const stop=()=>{cleanup.forEach(fn=>fn());cleanup=[];clearInterval(timer);timer=0;};
  const close=()=>{stop();document.querySelector('#player').hidden=true;document.querySelector('#result').hidden=true;};
  const launch=code=>{
    stop();current=code;document.querySelector('#result').hidden=true;document.querySelector('#player').hidden=false;
    document.querySelector('#game-title').textContent=`${names[code]||code}・${all.definitions[code].title}`;
    const field=document.querySelector('#field');field.replaceChildren();
    audio();
    all.start({field,pref:{code},sound,registerCleanup(fn){cleanup.push(fn);},updateHud(score,goal,time){document.querySelector('#hud').textContent=`${Math.ceil(time)}秒`;},finish(success,result){stop();sound('win');if(context)window.QUEST_CHARACTER_CRIES?.play(context,code,.4,se);document.querySelector('#result').hidden=false;document.querySelector('#friend').src=window.CHARACTER_ART?.[code]||`./assets/characters/${code}.png`;document.querySelector('#record').textContent=`${'★'.repeat(result.stars)}　${result.score}点`;}});
  };
  document.querySelector('#status').textContent=`47都道府県から 遊びたいゲームをえらぼう。場所や文字も覚える冒険はホームから！`;
  for(const [code,def] of Object.entries(all.definitions).sort(([a],[b])=>a.localeCompare(b))){
    const button=document.createElement('button');const pref=document.createElement('span');pref.textContent=names[code]||code;
    const title=document.createElement('b');title.textContent=def.title;const caption=document.createElement('span');caption.textContent=def.command;
    button.append(pref,title,caption);button.addEventListener('click',()=>launch(code));document.querySelector('#gallery').append(button);
  }
  document.querySelector('#back').addEventListener('click',close);document.querySelector('#return').addEventListener('click',close);document.querySelector('#again').addEventListener('click',()=>launch(current));
})();
