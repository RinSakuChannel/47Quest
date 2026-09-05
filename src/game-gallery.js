(() => {
  const names=Object.fromEntries(window.PREFECTURE_DATA.map(p=>[p.code,p.name]));
  const all=window.QUEST_FEATURED_GAMES;
  let cleanup=[];let current='';
  const stop=()=>{cleanup.forEach(fn=>fn());cleanup=[];};
  const close=()=>{stop();document.querySelector('#player').hidden=true;document.querySelector('#result').hidden=true;};
  const launch=code=>{
    stop();current=code;document.querySelector('#result').hidden=true;document.querySelector('#player').hidden=false;
    document.querySelector('#game-title').textContent=`${names[code]||code}・${all.definitions[code].title}`;
    const field=document.querySelector('#field');field.replaceChildren();
    all.start({field,pref:{code},sound(){},registerCleanup(fn){cleanup.push(fn);},updateHud(score,goal,time){document.querySelector('#hud').textContent=`${Math.ceil(time)}秒`;},finish(success,result){stop();document.querySelector('#result').hidden=false;document.querySelector('#record').textContent=`${'★'.repeat(result.stars)}　${result.score}点`;}});
  };
  document.querySelector('#status').textContent=`47都道府県から 遊びたいゲームをえらぼう。この広場は操作確認用の無音プレビューです。音や学習つきで遊ぶにはホームへ。`;
  for(const [code,def] of Object.entries(all.definitions).sort(([a],[b])=>a.localeCompare(b))){
    const button=document.createElement('button');const pref=document.createElement('span');pref.textContent=names[code]||code;
    const title=document.createElement('b');title.textContent=def.title;const caption=document.createElement('span');caption.textContent=def.command;
    button.append(pref,title,caption);button.addEventListener('click',()=>launch(code));document.querySelector('#gallery').append(button);
  }
  document.querySelector('#back').addEventListener('click',close);document.querySelector('#return').addEventListener('click',close);document.querySelector('#again').addEventListener('click',()=>launch(current));
})();
