(function () {
  'use strict';

  const rows = [
    ['01','course','ゆきだまスラローム','旗を じゅんばんに ぬけ！','ゆきみち',3,8],
    ['02','catch','りんごキャッチ','りんごだけ キャッチ！','りんご',4,8],
    ['03','reaction','わんこそばリレー','「はい！」で タップ！','わんこそば',3,8],
    ['04','flick','たなばた風送り','かざりを 星へ とばせ！','たなばた',3,8],
    ['05','reveal','かまくら灯りさがし','雪をどけて 灯りをさがせ！','かまくら',3,8],
    ['06','connect','さくらんぼつなぎ','おなじ色を つなげ！','さくらんぼ',3,9],
    ['07','balance','あかべこゆらゆら','まんなかを まもれ！','あかべこ',4,8],
    ['08','maze','メロンころころ','かべに当てず ゴールへ！','メロン',3,9],
    ['09','pullshot','いちごロケット','ひっぱって かごへ とばせ！','いちご',2,8],
    ['10','mash','だるま起こし','れんだで だるまを おこせ！','だるま',12,7],
    ['11','flip','せんべい返し','きつね色で ひっくり返せ！','せんべい',3,8],
    ['12','sort','らっかせい見分け隊','見本と おなじなら「おなじ」！','らっかせい',4,9],
    ['13','ringbuild','もんじゃ土手づくり','すきまを ぜんぶ ふさげ！','もんじゃ',4,9],
    ['14','steer','しらす波のり','群れを あみに みちびけ！','しらす',3,8],
    ['15','stack','おにぎり積み','まんなかで 落として つめ！','おにぎり',4,9],
    ['16','memory','ほたるいか光みち','光った順に おせ！','ほたるいか',2,10],
    ['17','feather','金ぱく風乗せ','そっと 器まで はこべ！','金ぱく',3,9],
    ['18','scrub','きょうりゅう発掘','こすって 化石を だせ！','化石',3,8],
    ['19','bounce','ぶどうバウンド','落とさず 房へ もどせ！','ぶどう',4,9],
    ['20','road','りんご急便','岩をよけて とどけ！','山道',3,8],
    ['21','flap','鵜のぼり','タップで 輪を くぐれ！','長良川',3,8],
    ['22','rhythm','お茶つみリズム','左右の葉を リズムで つめ！','お茶',5,9],
    ['23','lane','しゃちほこスライダー','レーンを きりかえろ！','しゃちほこ',4,8],
    ['24','circle','真珠みがき','くるくる みがいて 光らせろ！','真珠',3,8],
    ['25','slalom','びわこボート','浮標の あいだを ぬけ！','びわ湖',3,8],
    ['26','match','舞う扇かざり','おなじ模様へ おけ！','扇',4,9],
    ['27','multitimer','たこ焼きくるり','焼けた玉から 返せ！','たこ焼き',5,9],
    ['28','drawroute','コウノトリ風便','巣まで 風の道を えがけ！','コウノトリ',4,9],
    ['29','throw','しかせんべい大作戦','あいた場所へ なげろ！','鹿',3,8],
    ['30','chaincatch','みかんころがし','つぎつぎ 受けて つなげ！','みかん',5,8],
    ['31','dodge','砂丘そりすべり','岩を よけきれ！','砂丘',4,8],
    ['32','outline','まが玉みがき','形から はみださず なぞれ！','まが玉',4,9],
    ['33','care','もも育て','ほしい天気を えらべ！','桃',4,9],
    ['34','redirect','もみじ流し','水の向きを かえろ！','もみじ',4,9],
    ['35','size','ふぐ輪くぐり','輪と おなじ大きさに！','ふぐ',3,8],
    ['36','sequence','阿波おどりステップ','矢印の順に おどれ！','阿波おどり',2,10],
    ['37','hold','うどん のびのび','線のあいだで はなせ！','うどん',3,8],
    ['38','wave','みかん船キャッチ','波をうごかし 船へ おとせ！','みかん船',3,9],
    ['39','timing','かつお一本釣り','引いた瞬間に つり上げろ！','かつお',3,8],
    ['40','jump','めんたいこジャンプ','タップで 波を とびこせ！','明太子',3,8],
    ['41','catchsort','有田焼キャッチ','色の台で やさしく受けろ！','有田焼',4,9],
    ['42','slide','カステラ窯入れ','すべらせて 線で とめろ！','カステラ',3,9],
    ['43','safe','火の国ステップ','安全な岩だけ すすめ！','火の国',4,9],
    ['44','match','湯の花 三色めぐり','光るお湯へ 湯の花石をはこぼう','湯の花',4,8],
    ['45','peel','マンゴーかくれんぼ','葉をめくって さがせ！','マンゴー',3,8],
    ['46','pull','さつまいもロープ','矢印の向きへ ひっぱれ！','さつまいも',3,9],
    ['47','freedodge','なみのり リング','岩をよけて 輪をぬけ！','沖縄の海',4,8],
  ];

  // どのゲームも長引かせず、最大20秒で次の冒険へ進む。
  const catalog = Object.fromEntries(rows.map(([code, mode, title, command, motif, goal, time]) => [code, {
    code, mode, title, command, motif, goal, time: 20,
  }]));
  for (const [code, definition] of Object.entries(window.QUEST_FEATURED_GAMES?.definitions || {})) {
    Object.assign(catalog[code], definition);
  }
  const family = {
    course:'route', maze:'route', circle:'route', slalom:'route', drawroute:'route', outline:'route',
    catch:'catch', chaincatch:'catch', catchsort:'catch',
    reaction:'timing', flip:'timing', timing:'timing',
    flick:'release', pullshot:'release', throw:'release', wave:'release', slide:'release', pull:'release',
    reveal:'discover', scrub:'discover', safe:'discover', pop:'discover', peel:'discover',
    connect:'puzzle', sort:'puzzle', ringbuild:'puzzle', match:'puzzle', multitimer:'puzzle', care:'puzzle', redirect:'puzzle',
    balance:'meter', feather:'meter', mash:'meter', size:'meter', hold:'meter',
    steer:'action', stack:'action', bounce:'action', road:'action', flap:'action', lane:'action', dodge:'action', jump:'action', freedodge:'action',
    memory:'sequence', rhythm:'sequence', sequence:'sequence',
  };

  const familyHint = {
    route: 'マークを指でつかんで、光る順番へ動かそう',
    catch: '指を左右に動かして、落ちてくるものを受けよう',
    timing: '動きや合図をよく見て、ちょうどいい時にタップしよう',
    release: 'アイテムを指で動かし、ねらって指をはなそう',
    discover: '気になる場所をタップしたり、指でこすって探そう',
    puzzle: '同じ色や形を見つけて、タップやドラッグでそろえよう',
    meter: '動きを見ながら、長押しや指の移動でぴったり合わせよう',
    action: '画面をタップ・ドラッグして、障害物をよけよう',
    sequence: '光や矢印を見て、同じ順番でタップしよう',
  };

  const make = (tag, className, text = '') => {
    const node = document.createElement(tag); node.className = className; node.textContent = text; return node;
  };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function start({ field, pref, updateHud, finish, sound, registerCleanup, runMeta = {} }) {
    if (window.QUEST_FEATURED_GAMES?.start({field,pref,updateHud,finish,sound,registerCleanup,runMeta})) return;
    const config = catalog[pref.code];
    if (!config) return;
    field.className = `game-field rapid-field rapid-${config.mode}`;
    field.style.setProperty('--game-color', pref.color);
    const intro = make('div', 'micro-intro');
    intro.innerHTML = `
      <strong>${config.command}</strong>
      <small>${familyHint[family[config.mode]]}</small>
      <em class="micro-intro-challenge"><b>${runMeta.challenge?.icon || '✨'} ボーナス</b>${runMeta.challenge?.label || 'ラッキーマークを見つけよう'}</em>
      <span aria-hidden="true">${pref.symbol}</span>
      <button type="button" class="micro-start-button">わかった！ はじめる</button>`;
    field.append(intro);
    let alive = true; let score = 0; let streak = 0; let maxStreak = 0; let misses = 0; let timeLeft = config.time; let bonusTime = 0; let bonusCollected = false; let raf = 0; let finaleStarted = false; const timeouts = [];
    const playStatus = make('div', 'micro-play-status');
    const streakLabel = make('strong', 'micro-streak', 'さあ いこう！');
    const progressPips = make('span', 'micro-progress-pips');
    const pips = Array.from({ length: config.goal }, () => make('i', ''));
    pips.forEach((pip) => progressPips.append(pip));
    playStatus.append(streakLabel, progressPips);
    const later = (fn, delay) => { const id = setTimeout(() => alive && fn(), delay); timeouts.push(id); return id; };
    const burst = (x = 50, y = 50, glyph = '✦') => {
      const node = make('i', 'micro-burst', glyph); node.style.left = `${x}%`; node.style.top = `${y}%`; field.append(node); later(() => node.remove(), 520);
    };
    const performanceResult = () => {
      const challengeId = runMeta.challenge?.id;
      const challengeWon = challengeId === 'combo' ? maxStreak >= 3
        : challengeId === 'clean' ? misses === 0
          : challengeId === 'speed' ? timeLeft >= 15
            : false;
      return { stars: Math.min(3, 1 + Number(challengeWon) + Number(bonusCollected)), maxStreak, misses, timeLeft, challengeWon, bonusCollected };
    };
    const spawnLucky = () => {
      if (!alive || finaleStarted || bonusCollected || score >= config.goal) return;
      const lucky = make('button', 'micro-lucky', '★');
      const luckyCopy = make('span', 'micro-lucky-copy', 'ラッキー！');
      lucky.style.left = `${16 + Math.random() * 68}%`;
      lucky.style.top = `${28 + Math.random() * 42}%`;
      lucky.setAttribute('aria-label', 'ラッキースター。タップすると時間が3秒増える');
      lucky.addEventListener('click', () => {
        if (bonusCollected) return;
        bonusCollected = true; bonusTime += 3; sound('bonus');
        lucky.classList.add('is-collected'); luckyCopy.textContent = '＋3秒・星ボーナス';
        burst(Number.parseFloat(lucky.style.left), Number.parseFloat(lucky.style.top), '🌟');
        later(() => { lucky.remove(); luckyCopy.remove(); }, 520);
      });
      field.append(lucky, luckyCopy);
      later(() => { if (!bonusCollected) { lucky.classList.add('is-leaving'); luckyCopy.remove(); later(() => lucky.remove(), 280); } }, 2600);
    };
    const startFinale = () => {
      if (finaleStarted || !alive) return;
      finaleStarted = true;
      finish(true, performanceResult());
    };
    const hit = (amount = 1, point) => {
      score = Math.min(config.goal, score + amount); streak += 1; maxStreak = Math.max(maxStreak, streak); sound(streak >= 3 ? 'combo' : 'good');
      field.classList.remove('micro-hit'); void field.offsetWidth; field.classList.add('micro-hit');
      pips.forEach((pip, index) => pip.classList.toggle('is-filled', index < score));
      streakLabel.textContent = score >= config.goal ? 'クリア！' : streak >= 3 ? `${streak}コンボ！` : ['いいね！', 'ナイス！'][score % 2];
      streakLabel.classList.remove('is-pop'); void streakLabel.offsetWidth; streakLabel.classList.add('is-pop');
      if (streak > 0 && streak % 3 === 0) { field.classList.remove('is-fever'); void field.offsetWidth; field.classList.add('is-fever'); }
      burst(point?.x, point?.y, score >= config.goal ? '★' : streak >= 3 ? '🌟' : '✦'); updateHud(score, config.goal, timeLeft);
      if (score >= config.goal) later(startFinale, 180);
    };
    const miss = () => { misses += 1; streak = 0; streakLabel.textContent = 'おしい！ もう一回'; streakLabel.classList.remove('is-pop'); void streakLabel.offsetWidth; streakLabel.classList.add('is-pop'); sound('wrong'); field.classList.remove('micro-miss'); void field.offsetWidth; field.classList.add('micro-miss'); };
    const clock = () => {
      const started = performance.now();
      const loop = (now) => {
        if (!alive) return; const left = config.time + bonusTime - (now - started) / 1000; timeLeft = left; updateHud(score, config.goal, left);
        if (score >= config.goal) return; if (left <= 0) return finish(false, performanceResult()); raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    };
    const ctx = { field, pref, config, hit, miss, clock, sound, later, burst, get score() { return score; } };
    let started = false;
    const begin = () => {
      if (!alive || started) return;
      started = true;
      sound('tap');
      intro.classList.add('is-gone');
      later(() => { intro.remove(); field.append(playStatus); engines[family[config.mode]](ctx); later(spawnLucky, 1500 + Math.random() * 1700); }, 260);
    };
    intro.querySelector('.micro-start-button').addEventListener('click', begin);
    registerCleanup(() => { alive = false; cancelAnimationFrame(raf); timeouts.forEach(clearTimeout); });
  }

  function routeEngine(ctx) {
    const { field, config, pref } = ctx; const mode = config.mode; const count = config.goal + 1;
    let points;
    if (mode === 'circle') points = Array.from({ length: count }, (_, i) => ({ x: 50 + Math.cos(i / (count - 1) * Math.PI * 2) * 24, y: 49 + Math.sin(i / (count - 1) * Math.PI * 2) * 30 }));
    else if (mode === 'outline') points = [{x:30,y:28},{x:65,y:22},{x:72,y:50},{x:52,y:76},{x:30,y:28}];
    else if (mode === 'maze') points = [{x:14,y:72},{x:34,y:34},{x:55,y:67},{x:82,y:28}];
    else points = Array.from({ length: count }, (_, i) => ({ x: 14 + i * 72 / Math.max(1,count-1), y: 24 + ((i % 2) ? 50 : 8) + (Math.random()-.5)*10 }));
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('class','micro-route-line'); svg.setAttribute('viewBox','0 0 100 100');
    const path = document.createElementNS('http://www.w3.org/2000/svg','polyline'); path.setAttribute('points',points.map(p=>`${p.x},${p.y}`).join(' ')); svg.append(path); field.append(svg);
    if (mode === 'maze') [{x:45,y:46,w:13,h:8},{x:66,y:58,w:12,h:8}].forEach(w=>{const wall=make('i','micro-wall');Object.assign(wall.style,{left:`${w.x}%`,top:`${w.y}%`,width:`${w.w}%`,height:`${w.h}%`});field.append(wall);});
    const nodes = points.map((p,i)=>{const n=make('b',`micro-check ${i===0?'is-done':i===1?'is-next':''}`,i===0?'出':String(i));n.style.left=`${p.x}%`;n.style.top=`${p.y}%`;field.append(n);return n;});
    const token=make('div','micro-drag-token',pref.symbol); token.style.left=`${points[0].x}%`;token.style.top=`${points[0].y}%`;field.append(token);
    let dragging=false,index=1;
    const move=e=>{if(!dragging)return;const r=field.getBoundingClientRect();const p={x:clamp((e.clientX-r.left)/r.width*100,3,97),y:clamp((e.clientY-r.top)/r.height*100,8,92)};token.style.left=`${p.x}%`;token.style.top=`${p.y}%`;if(points[index]&&distance(p,points[index])<9){nodes[index].classList.remove('is-next');nodes[index].classList.add('is-done');ctx.hit(1,p);index++;nodes[index]?.classList.add('is-next');}};
    token.addEventListener('pointerdown',e=>{dragging=true;token.setPointerCapture(e.pointerId);move(e);});token.addEventListener('pointermove',move);token.addEventListener('pointerup',()=>dragging=false);ctx.clock();
  }

  function catchEngine(ctx) {
    const { field, config, pref }=ctx; const sorted=config.mode==='catchsort'; const chain=config.mode==='chaincatch';
    const catcher=make('div','micro-catcher',sorted?'🔵　🔴':'🧺');field.append(catcher);const items=[];let last=performance.now(),spawn=.25,combo=0,raf;
    const move=e=>{const r=field.getBoundingClientRect();catcher.style.left=`${clamp((e.clientX-r.left)/r.width*100,7,93)}%`;};field.addEventListener('pointerdown',move);field.addEventListener('pointermove',e=>(e.buttons||e.pointerType==='touch')&&move(e));
    const add=()=>{const good=Math.random()>.2;const side=Math.random()>.5;const glyph=sorted?(side?'🔴':'🔵'):(good?pref.symbol:'💨');const n=make('i',`micro-fall ${good?'':'is-bad'}`,glyph);n.dataset.side=side?'right':'left';n.style.left=`${8+Math.random()*84}%`;field.append(n);items.push({n,y:-12,speed:54+Math.random()*30,good,side});};
    const loop=now=>{const dt=Math.min(.04,(now-last)/1000);last=now;spawn+=dt;if(spawn>.52){spawn=0;add();}const cr=catcher.getBoundingClientRect();items.slice().forEach(o=>{o.y+=o.speed*dt;o.n.style.top=`${o.y}%`;const r=o.n.getBoundingClientRect();if(r.bottom>cr.top&&r.left<cr.right&&r.right>cr.left){const sideOk=!sorted||((r.left+r.width/2)<(cr.left+cr.width/2))===!o.side;if(o.good&&sideOk){combo++;ctx.hit(chain&&combo>=3?2:1,{x:(r.left+r.width/2-field.getBoundingClientRect().left)/field.clientWidth*100,y:80});}else{combo=0;ctx.miss();}o.n.remove();items.splice(items.indexOf(o),1);}else if(o.y>105){combo=0;o.n.remove();items.splice(items.indexOf(o),1);}});if(ctx.score<config.goal)raf=requestAnimationFrame(loop);};raf=requestAnimationFrame(loop);ctx.later(()=>cancelAnimationFrame(raf),config.time*1000+200);ctx.clock();
  }

  function timingEngine(ctx) {
    const { field, config, pref }=ctx; const reaction=config.mode==='reaction';
    if(config.mode==='flip'){
      const rack=make('div','micro-timer-rack');const note=make('strong','micro-judgement','色がついたら 返せ！');field.append(rack,note);
      for(let i=0;i<5;i++){
        const pan=make('button','micro-cook','○');let ready=false;
        const heat=()=>{ready=false;pan.textContent='○';pan.classList.remove('is-ready');ctx.later(()=>{ready=true;pan.textContent=pref.symbol;pan.classList.add('is-ready');},650+Math.random()*1500);};
        pan.addEventListener('click',()=>{if(ready){pan.animate([{transform:'rotateY(0)'},{transform:'rotateY(180deg)'}],{duration:260});ctx.hit();heat();}else{note.textContent='まだ白い！';ctx.miss();}});rack.append(pan);heat();
      }
      ctx.clock();return;
    }
    const stage=make('div','micro-timing-stage');const target=make('i','micro-timing-target');const marker=make('b','micro-timing-marker',pref.symbol);const button=make('button','micro-action-button',reaction?'まだ…':'ここ！');const note=make('strong','micro-judgement','');stage.append(target,marker);field.append(stage,button,note);
    let position=0,direction=1,ready=!reaction,targetX=50,last=performance.now(),raf;
    const reset=()=>{targetX=22+Math.random()*56;target.style.left=`${targetX}%`;if(reaction){ready=false;button.textContent='まだ…';ctx.later(()=>{ready=true;button.textContent='はい！';field.classList.add('is-ready');},650+Math.random()*900);}};reset();
    button.addEventListener('click',()=>{if(reaction){if(ready){note.textContent='ナイス！';ctx.hit();field.classList.remove('is-ready');reset();}else{note.textContent='まだ！';ctx.miss();}return;}const gap=Math.abs(position-targetX);if(gap<11){note.textContent=gap<4?'ぴったり！':'いいね！';ctx.hit();}else{note.textContent='おしい！';ctx.miss();}reset();});
    const loop=now=>{const dt=Math.min(.04,(now-last)/1000);last=now;position+=direction*(reaction?0:58+ctx.score*8)*dt;if(position>100){position=100;direction=-1;}if(position<0){position=0;direction=1;}marker.style.left=`${reaction?50:position}%`;if(ctx.score<config.goal)raf=requestAnimationFrame(loop);};raf=requestAnimationFrame(loop);ctx.later(()=>cancelAnimationFrame(raf),config.time*1000+200);ctx.clock();
  }

  function releaseEngine(ctx) {
    const { field, config, pref }=ctx;
    if(config.mode==='wave'){
      const boat=make('div','micro-release-target','⛵');const wave=make('div','micro-release-item',pref.symbol);const hint=make('span','micro-release-hint','左右へ 大きく ゆらせ！');field.append(boat,wave,hint);
      boat.style.left='78%';boat.style.top='42%';wave.style.left='25%';wave.style.top='65%';let dragging=false,lastX=0,anchorX=0,lastDirection=0;
      const move=e=>{if(!dragging)return;const r=field.getBoundingClientRect(),x=clamp((e.clientX-r.left)/r.width*100,8,92);wave.style.left=`${x}%`;const delta=x-anchorX;if(Math.abs(delta)>=10){const direction=Math.sign(delta);if(lastDirection&&direction!==lastDirection){ctx.hit();boat.animate([{transform:'translate(-50%,-50%) rotate(-8deg)'},{transform:'translate(-50%,-50%) rotate(8deg)'}],{duration:220});}lastDirection=direction;anchorX=x;}lastX=x;};
      wave.addEventListener('pointerdown',e=>{dragging=true;lastX=Number.parseFloat(wave.style.left);anchorX=lastX;lastDirection=0;wave.setPointerCapture(e.pointerId);});wave.addEventListener('pointermove',move);wave.addEventListener('pointerup',()=>dragging=false);wave.addEventListener('pointercancel',()=>dragging=false);ctx.clock();return;
    }
    const item=make('div','micro-release-item',pref.symbol);const target=make('div','micro-release-target',config.mode==='pull'?'⬆':'◎');const hint=make('span','micro-release-hint','');field.append(target,item,hint);
    let dragging=false,start={x:18,y:58},direction=0,startedAt=0,last={x:18,y:58};
    const reset=()=>{
      start={x:15+Math.random()*12,y:38+Math.random()*35};
      if(config.mode==='pull')start={x:50,y:50};
      if(config.mode==='pullshot')start={x:68,y:58};
      last={...start};item.style.left=`${start.x}%`;item.style.top=`${start.y}%`;target.style.left=`${66+Math.random()*20}%`;target.style.top=`${28+Math.random()*45}%`;target.textContent='◎';
      if(config.mode==='pull'){direction=Math.floor(Math.random()*4);target.textContent=['→','↓','←','↑'][direction];hint.textContent='矢印へ ひっぱる';}
      else if(config.mode==='pullshot')hint.textContent='左へ ためて はなす！';
      else if(config.mode==='throw'){target.style.top=`${18+Math.random()*24}%`;hint.textContent='右上へ すばやく なげる！';}
      else if(config.mode==='flick')hint.textContent='星へ すばやく はらう！';
      else if(config.mode==='slide')hint.textContent='線の上で ぴたり！';
    };reset();
    const move=e=>{if(!dragging)return;const r=field.getBoundingClientRect();last={x:clamp((e.clientX-r.left)/r.width*100,5,95),y:clamp((e.clientY-r.top)/r.height*100,10,90)};item.style.left=`${last.x}%`;if(config.mode!=='slide')item.style.top=`${last.y}%`;};
    item.addEventListener('pointerdown',e=>{dragging=true;startedAt=performance.now();item.setPointerCapture(e.pointerId);move(e);});item.addEventListener('pointermove',move);item.addEventListener('pointerup',()=>{
      if(!dragging)return;dragging=false;const dx=last.x-start.x,dy=last.y-start.y,elapsed=performance.now()-startedAt;let good=false;
      if(config.mode==='pull')good=[dx>18,dy>18,dx<-18,dy<-18][direction];
      else if(config.mode==='pullshot')good=dx<-20&&Math.abs(dy)<24;
      else if(config.mode==='throw')good=dx>20&&dy<-12&&elapsed<900;
      else if(config.mode==='flick'){
        const tx=Number.parseFloat(target.style.left)-start.x,ty=Number.parseFloat(target.style.top)-start.y;
        good=Math.hypot(dx,dy)>28&&elapsed<650&&(dx*tx+dy*ty)/(Math.max(1,Math.hypot(dx,dy))*Math.max(1,Math.hypot(tx,ty)))>.72;
      }
      else if(config.mode==='slide')good=Math.abs(last.x-Number.parseFloat(target.style.left))<10;
      if(good)ctx.hit();else ctx.miss();item.animate([{transform:'translate(-50%,-50%) scale(1.2)'},{transform:'translate(-50%,-50%) scale(.7)'}],{duration:220});reset();
    });item.addEventListener('pointercancel',()=>{dragging=false;reset();});ctx.clock();
  }

  function discoverEngine(ctx) {
    const { field, config, pref }=ctx;
    if(config.mode==='scrub'){
      const fossil=make('div','micro-scrub');
      fossil.innerHTML='<span>🦴</span><span>🦕</span><span>🦴</span>';
      const cover=document.createElement('canvas');cover.className='micro-scrub-cover';cover.setAttribute('aria-label','土を指でこすって化石を発掘する場所');
      const hint=make('strong','micro-scrub-hint','指のところだけ けずれるよ');
      const progress=make('span','micro-scrub-progress','発掘 0%');
      field.append(fossil,cover,hint,progress);
      let drawing=false,last=null,milestone=0,lastDustAt=0;const visited=new Set();const columns=18,rows=10;
      const rect=()=>cover.getBoundingClientRect();
      const paint=()=>{
        const box=rect(),dpr=Math.min(2,window.devicePixelRatio||1);cover.width=Math.max(1,Math.round(box.width*dpr));cover.height=Math.max(1,Math.round(box.height*dpr));
        const brush=cover.getContext('2d');brush.setTransform(dpr,0,0,dpr,0,0);brush.fillStyle='#b8875d';brush.fillRect(0,0,box.width,box.height);
        brush.fillStyle='rgba(255,224,171,.22)';for(let i=0;i<90;i++){const x=(i*83)%Math.max(1,box.width),y=(i*47)%Math.max(1,box.height);brush.beginPath();brush.arc(x,y,2+(i%4),0,Math.PI*2);brush.fill();}
      };
      paint();
      const erase=e=>{
        if(!drawing)return;const box=rect(),x=clamp(e.clientX-box.left,0,box.width),y=clamp(e.clientY-box.top,0,box.height),brush=cover.getContext('2d'),dpr=Math.min(2,window.devicePixelRatio||1);
        const from=last||{x,y},steps=Math.max(1,Math.ceil(Math.hypot(x-from.x,y-from.y)/16));brush.save();brush.setTransform(dpr,0,0,dpr,0,0);brush.globalCompositeOperation='destination-out';
        for(let step=0;step<=steps;step++){const px=from.x+(x-from.x)*step/steps,py=from.y+(y-from.y)*step/steps;const glow=brush.createRadialGradient(px,py,8,px,py,35);glow.addColorStop(0,'rgba(0,0,0,1)');glow.addColorStop(.72,'rgba(0,0,0,.95)');glow.addColorStop(1,'rgba(0,0,0,0)');brush.fillStyle=glow;brush.beginPath();brush.arc(px,py,35,0,Math.PI*2);brush.fill();
          const gx=Math.floor(px/box.width*columns),gy=Math.floor(py/box.height*rows);for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){const cx=gx+ox,cy=gy+oy;if(cx>=0&&cx<columns&&cy>=0&&cy<rows)visited.add(cy*columns+cx);}}
        brush.restore();last={x,y};const amount=Math.min(1,visited.size/(columns*rows));progress.textContent=`発掘 ${Math.round(amount*100)}%`;hint.classList.add('is-hidden');
        if(performance.now()-lastDustAt>70){lastDustAt=performance.now();ctx.burst((e.clientX-field.getBoundingClientRect().left)/field.clientWidth*100,(e.clientY-field.getBoundingClientRect().top)/field.clientHeight*100,'·');ctx.sound('draw');}
        const milestones=[.25,.5,.75];while(milestone<milestones.length&&amount>=milestones[milestone]){fossil.children[milestone]?.classList.add('is-found');milestone++;ctx.hit();}
      };
      cover.addEventListener('pointerdown',e=>{drawing=true;last=null;cover.setPointerCapture(e.pointerId);erase(e);});cover.addEventListener('pointermove',erase);cover.addEventListener('pointerup',()=>{drawing=false;last=null;});cover.addEventListener('pointercancel',()=>{drawing=false;last=null;});ctx.clock();return;
    }
    if(config.mode==='pop'){let spawned=0;const add=()=>{if(spawned++>14)return;const b=make('button','micro-bubble',Math.random()>.45?'♨️':pref.symbol);b.style.left=`${10+Math.random()*80}%`;b.style.top=`${24+Math.random()*58}%`;b.style.setProperty('--drift',`${(Math.random()-.5)*3}rem`);b.addEventListener('click',()=>{ctx.hit(1,{x:Number.parseFloat(b.style.left),y:Number.parseFloat(b.style.top)});b.classList.add('is-popped');ctx.later(()=>b.remove(),180);});field.append(b);ctx.later(()=>b.remove(),1900);ctx.later(add,360+Math.random()*260);};add();ctx.clock();return;}
    if(config.mode==='safe'){
      const grid=make('div','micro-discovery-grid');field.append(grid);
      const cells=Array.from({length:9},()=>make('button','micro-cover','？'));
      const path=Array.from({length:9},(_,i)=>i).sort(()=>Math.random()-.5).slice(0,config.goal);
      const replay=make('button','micro-memory-replay','もう一度見る');field.append(replay);let expected=0,memorizing=true;
      cells.forEach((b,index)=>{
        b.addEventListener('click',()=>{
          if(memorizing||b.disabled)return;
          if(index===path[expected]){
            b.disabled=true;b.textContent=String(expected+1);b.classList.add('is-found');expected++;ctx.hit();
          }else{
            b.classList.add('is-empty');ctx.miss();ctx.later(()=>b.classList.remove('is-empty'),260);
          }
        });
        grid.append(b);
      });
      const showPath=()=>{memorizing=true;replay.disabled=true;path.forEach((index,step)=>{if(!cells[index].disabled){cells[index].textContent=String(step+1);cells[index].classList.add('is-found');}});ctx.later(()=>{memorizing=false;replay.disabled=false;cells.forEach(b=>{if(!b.disabled){b.textContent='？';b.classList.remove('is-found');}});},1250);};
      replay.addEventListener('click',showPath);showPath();
      ctx.clock();return;
    }
    const grid=make('div','micro-discovery-grid');field.append(grid);const targets=new Set(Array.from({length:config.goal},(_,i)=>i));const order=Array.from({length:9},(_,i)=>i).sort(()=>Math.random()-.5);const targetButtons=[];
    const reveal=(b,value)=>{if(b.disabled)return;b.disabled=true;if(targets.has(value)){b.textContent=pref.symbol;b.classList.add('is-found');ctx.hit();}else{b.textContent='・';b.classList.add('is-empty');}};
    for(let i=0;i<9;i++){
      const b=make('button',`micro-cover ${config.mode==='peel'?'is-leaf':''}`,config.mode==='peel'?'🍃':'？');const value=order[i];
      if(config.mode==='peel'){
        let start=null;b.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY};b.setPointerCapture(e.pointerId);});
        b.addEventListener('pointerup',e=>{if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>22)reveal(b,value);start=null;});
      }else b.addEventListener('click',()=>reveal(b,value));
      if(targets.has(value))targetButtons.push(b);
      grid.append(b);
    }
    targetButtons.forEach((button,index)=>ctx.later(()=>{button.classList.add('is-peeking');ctx.later(()=>button.classList.remove('is-peeking'),420);},280+index*120));
    ctx.clock();
  }

  function puzzleEngine(ctx) {
    const { field, config, pref }=ctx;
    if(config.mode==='care'){const plant=make('div','micro-plant',pref.symbol);const prompt=make('strong','micro-prompt','☀️');const sun=make('button','micro-choice','☀️');const rain=make('button','micro-choice','🌧️');field.append(plant,prompt,sun,rain);let wanted='☀️';const next=()=>{wanted=Math.random()>.5?'☀️':'🌧️';prompt.textContent=`つぎは ${wanted}`;};[sun,rain].forEach(b=>b.addEventListener('click',()=>{if(b.textContent===wanted){ctx.hit();plant.style.transform=`scale(${1+ctx.score*.12})`;}else ctx.miss();next();}));next();ctx.clock();return;}
    if(config.mode==='multitimer'){const rack=make('div','micro-timer-rack');field.append(rack);for(let i=0;i<6;i++){const b=make('button','micro-cook','○');let ready=false;const cook=()=>{ready=false;b.textContent='○';b.classList.remove('is-ready');ctx.later(()=>{ready=true;b.textContent=pref.symbol;b.classList.add('is-ready');},500+Math.random()*1800);};b.addEventListener('click',()=>{if(ready){ctx.hit();cook();}else ctx.miss();});rack.append(b);cook();}ctx.clock();return;}
    if(config.mode==='redirect'){const row=make('div','micro-arrow-row');field.append(row);for(let i=0;i<config.goal;i++){const b=make('button','micro-arrow','↑');let turns=Math.floor(Math.random()*4);const chars=['↑','→','↓','←'];b.textContent=chars[turns];b.addEventListener('click',()=>{turns=(turns+1)%4;b.textContent=chars[turns];if(turns===1&&!b.classList.contains('is-done')){b.classList.add('is-done');ctx.hit();}});row.append(b);}ctx.clock();return;}
    if(config.mode==='sort'){
      const reference=make('div','micro-sort-reference');reference.innerHTML='<span>おてほん</span><b>🥜</b>';
      const question=make('p','micro-sort-question','この絵は おなじ？');
      const piece=make('div','micro-sort-card','🥜');
      const same=make('button','micro-choice micro-sort-choice','✓ おなじ');
      const different=make('button','micro-choice micro-sort-choice','× ちがう');
      field.append(reference,question,piece,same,different);
      const otherFoods=['🌰','🥔','🍪'];let isSame=true;
      const next=()=>{isSame=Math.random()>.45;piece.textContent=isSame?'🥜':otherFoods[Math.floor(Math.random()*otherFoods.length)];piece.animate([{transform:'translate(-50%,-50%) scale(.72) rotate(-8deg)'},{transform:'translate(-50%,-50%) scale(1.08) rotate(3deg)'},{transform:'translate(-50%,-50%) scale(1)'}],{duration:320,easing:'ease-out'});};
      const answer=(pickedSame)=>{if(pickedSame===isSame){question.textContent='せいかい！ つぎは？';ctx.hit();}else{question.textContent='おしい！ 見本をよく見よう';ctx.miss();}next();};
      same.addEventListener('click',()=>answer(true));different.addEventListener('click',()=>answer(false));next();ctx.clock();return;
    }
    if(config.mode==='ringbuild'){
      const board=make('div','micro-puzzle-board');field.append(board);let expected=1;
      const pieces=Array.from({length:config.goal},(_,i)=>{
        const b=make('button',`micro-piece color-${['coral','sun','mint','sky'][i%4]}`,String(i+1));
        b.addEventListener('click',()=>{if(b.classList.contains('is-done'))return;if(Number(b.textContent)===expected){b.classList.add('is-done');expected++;ctx.hit();}else ctx.miss();});return b;
      });
      pieces.sort(()=>Math.random()-.5).forEach(b=>board.append(b));ctx.clock();return;
    }
    const board=make('div','micro-puzzle-board');field.append(board);let selected=null,locked=false;const colors=['coral','sun','mint','sky'];
    for(let i=0;i<config.goal*2;i++){
      const key=i%config.goal;const hidden=config.mode==='match';const b=make('button',`micro-piece color-${colors[key%4]}`,hidden?'？':String(key+1));b.dataset.key=String(key);
      b.addEventListener('click',()=>{
        if(locked||b.classList.contains('is-done')||b===selected)return;if(hidden)b.textContent=pref.symbol;
        if(!selected){selected=b;b.classList.add('is-selected');return;}
        if(selected.dataset.key===b.dataset.key){selected.classList.add('is-done');b.classList.add('is-done');selected.classList.remove('is-selected');selected=null;ctx.hit();}
        else{
          const previous=selected;previous.classList.remove('is-selected');selected=null;ctx.miss();
          if(hidden){locked=true;ctx.later(()=>{previous.textContent='？';b.textContent='？';locked=false;},420);}
        }
      });board.append(b);
    }
    Array.from(board.children).sort(()=>Math.random()-.5).forEach(n=>board.append(n));ctx.clock();
  }

  function meterEngine(ctx) {
    const { field, config, pref }=ctx;
    if(config.mode==='mash'){const actor=make('button','micro-mash',pref.symbol);const meter=make('div','micro-meter');field.append(actor,meter);let taps=0;actor.addEventListener('click',()=>{taps+=1;ctx.hit(1,{x:Number.parseFloat(actor.style.left)||50,y:Number.parseFloat(actor.style.top)||46});meter.style.setProperty('--fill',`${ctx.score/config.goal*100}%`);actor.animate([{transform:'translate(-50%,-50%) scale(.84) rotate(-7deg)'},{transform:'translate(-50%,-50%) scale(1.12) rotate(4deg)'},{transform:'translate(-50%,-50%) scale(1)'}],{duration:180,easing:'ease-out'});if(taps%3===0&&ctx.score<config.goal){actor.style.left=`${25+Math.random()*50}%`;actor.style.top=`${30+Math.random()*35}%`;}});ctx.clock();return;}
    if(config.mode==='balance'||config.mode==='feather'){const track=make('div','micro-balance-track');const safe=make('i','micro-safe-zone');const token=make('b','micro-balance-token',pref.symbol);track.append(safe,token);field.append(track);let pos=25+Math.random()*50,target=50,held=0,last=performance.now(),raf;const move=e=>{const r=field.getBoundingClientRect();target=clamp((e.clientX-r.left)/r.width*100,4,96);};field.addEventListener('pointerdown',move);field.addEventListener('pointermove',e=>(e.buttons||e.pointerType==='touch')&&move(e));const loop=now=>{const dt=Math.min(.04,(now-last)/1000);last=now;pos+=(target-pos)*dt*(config.mode==='feather'?1.4:3)+(Math.random()-.5)*dt*10;token.style.left=`${pos}%`;if(Math.abs(pos-50)<12){held+=dt;if(held>=1){held=0;ctx.hit();}}else held=Math.max(0,held-dt);if(ctx.score<config.goal)raf=requestAnimationFrame(loop);};raf=requestAnimationFrame(loop);ctx.later(()=>cancelAnimationFrame(raf),config.time*1000+200);ctx.clock();return;}
    if(config.mode==='hold'){
      const meter=make('div','micro-meter');const goal=make('i','micro-meter-goal');const button=make('button','micro-hold','おして ためる');const note=make('strong','micro-judgement','黄色のところで はなす！');meter.append(goal);field.append(meter,button,note);let holding=false,value=0,last=performance.now(),raf;
      const reset=()=>{value=0;meter.style.setProperty('--fill','0%');};
      button.addEventListener('pointerdown',e=>{e.preventDefault();holding=true;button.setPointerCapture(e.pointerId);note.textContent='黄色のところで はなす！';});
      const stop=()=>{if(!holding)return;holding=false;if(value>=58&&value<=78){note.textContent='ぴったり！';ctx.hit();}else{note.textContent='おしい！';ctx.miss();}reset();};
      button.addEventListener('pointerup',stop);button.addEventListener('pointercancel',stop);
      const loop=now=>{const dt=Math.min(.04,(now-last)/1000);last=now;if(holding){value=Math.min(100,value+48*dt);meter.style.setProperty('--fill',`${value}%`);if(value>=100)stop();}if(ctx.score<config.goal)raf=requestAnimationFrame(loop);};raf=requestAnimationFrame(loop);ctx.later(()=>cancelAnimationFrame(raf),config.time*1000+200);ctx.clock();return;
    }
    const machine=make('div','micro-size-machine');const zone=make('i','micro-size-zone');const value=make('b','micro-size-value',pref.symbol);const hold=make('button','micro-hold','長押し');machine.append(zone,value);field.append(machine,hold);let size=18,target=48,holding=false,last=performance.now(),raf;const reset=()=>{size=18;target=38+Math.random()*40;zone.style.setProperty('--target',`${target}%`);};hold.addEventListener('pointerdown',e=>{e.preventDefault();holding=true;hold.setPointerCapture(e.pointerId);});const stop=()=>{if(!holding)return;holding=false;if(Math.abs(size-target)<9)ctx.hit();else ctx.miss();reset();};hold.addEventListener('pointerup',stop);hold.addEventListener('pointercancel',stop);reset();const loop=now=>{const dt=Math.min(.04,(now-last)/1000);last=now;if(holding)size=Math.min(92,size+45*dt);value.style.setProperty('--size',`${size}%`);if(ctx.score<config.goal)raf=requestAnimationFrame(loop);};raf=requestAnimationFrame(loop);ctx.later(()=>cancelAnimationFrame(raf),config.time*1000+200);ctx.clock();
  }

  function actionEngine(ctx) {
    const { field, config, pref }=ctx;
    if(config.mode==='stack'){const base=make('div','micro-stack-base');const block=make('button','micro-stack-block',pref.symbol);field.append(base,block);let x=10,dir=1,last=performance.now(),raf;block.addEventListener('click',()=>{const gap=Math.abs(x-50);if(gap<24){ctx.hit();base.style.height=`${14+ctx.score*12}%`;}else ctx.miss();x=10;});const loop=now=>{const dt=Math.min(.04,(now-last)/1000);last=now;x+=dir*75*dt;if(x>88){x=88;dir=-1;}if(x<12){x=12;dir=1;}block.style.left=`${x}%`;if(ctx.score<config.goal)raf=requestAnimationFrame(loop);};raf=requestAnimationFrame(loop);ctx.later(()=>cancelAnimationFrame(raf),config.time*1000+200);ctx.clock();return;}
    if(config.mode==='lane'){const runner=make('button','micro-runner',pref.symbol);field.append(runner);let lane=1;runner.style.top=`${27+lane*25}%`;runner.addEventListener('click',()=>{lane=(lane+1)%3;runner.style.top=`${27+lane*25}%`;});const spawn=()=>{const gemLane=Math.floor(Math.random()*3);const o=make('i','micro-lane-gem','✦');o.style.top=`${27+gemLane*25}%`;field.append(o);o.animate([{left:'105%'},{left:'-10%'}],{duration:1500,easing:'linear'});ctx.later(()=>{if(o.isConnected){gemLane===lane?ctx.hit():ctx.miss();o.remove();}if(ctx.score<config.goal)spawn();},1450);};spawn();ctx.clock();return;}
    if(config.mode==='jump'||config.mode==='flap'){const hero=make('button','micro-jumper',pref.symbol);const floor=make('i','micro-floor');field.append(floor,hero);let vy=0,y=70,last=performance.now(),raf,gateOpen=false,cleared=false;hero.addEventListener('click',()=>{if(config.mode==='flap'||y>=74)vy=config.mode==='flap'?-44:-62;if(gateOpen&&!cleared){cleared=true;gateOpen=false;ctx.hit();}});const spawn=()=>{cleared=false;const hoop=make('i','micro-hoop');hoop.style.top=config.mode==='flap'?`${28+Math.random()*40}%`:'62%';field.append(hoop);hoop.animate([{left:'105%'},{left:'-10%'}],{duration:1700,easing:'linear'});ctx.later(()=>{gateOpen=true;hoop.classList.add('is-near');},1050);ctx.later(()=>{gateOpen=false;if(!cleared)ctx.miss();hoop.remove();if(ctx.score<config.goal)spawn();},1650);};spawn();const loop=now=>{const dt=Math.min(.04,(now-last)/1000);last=now;vy+=95*dt;y=clamp(y+vy*dt,15,78);if(y>=78)vy=0;hero.style.top=`${y}%`;if(ctx.score<config.goal)raf=requestAnimationFrame(loop);};raf=requestAnimationFrame(loop);ctx.later(()=>cancelAnimationFrame(raf),config.time*1000+200);ctx.clock();return;}
    if(config.mode==='bounce'){const paddle=make('div','micro-paddle');const ball=make('i','micro-ball',pref.symbol);field.append(paddle,ball);let x=50,y=28,vx=48,vy=76,last=performance.now(),raf;const move=e=>{const r=field.getBoundingClientRect();paddle.style.left=`${clamp((e.clientX-r.left)/r.width*100,10,90)}%`;};field.addEventListener('pointerdown',move);field.addEventListener('pointermove',e=>(e.buttons||e.pointerType==='touch')&&move(e));const loop=now=>{const dt=Math.min(.04,(now-last)/1000);last=now;x+=vx*dt;y+=vy*dt;if(x<4||x>96)vx*=-1;if(y<10)vy=Math.abs(vy);const pr=paddle.getBoundingClientRect(),br=ball.getBoundingClientRect();if(vy>0&&br.bottom>=pr.top&&br.left<pr.right&&br.right>pr.left){vy=-Math.abs(vy);ctx.hit();}if(y>86){y=28;vy=76;ctx.miss();}ball.style.left=`${x}%`;ball.style.top=`${y}%`;if(ctx.score<config.goal)raf=requestAnimationFrame(loop);};raf=requestAnimationFrame(loop);ctx.later(()=>cancelAnimationFrame(raf),config.time*1000+200);ctx.clock();return;}
    if(config.mode==='road'){
      const hero=make('div','micro-steer-hero',pref.symbol);field.append(hero);const lanes=[24,50,76];let lane=1,last=performance.now(),spawn=.4,raf;const obstacles=[];hero.style.left=`${lanes[lane]}%`;hero.style.top='80%';
      field.addEventListener('pointerdown',e=>{const r=field.getBoundingClientRect();lane=(e.clientX-r.left)<r.width/2?Math.max(0,lane-1):Math.min(2,lane+1);hero.style.left=`${lanes[lane]}%`;});
      const add=()=>{const obstacleLane=Math.floor(Math.random()*3),n=make('i','micro-rock','◆');n.style.left=`${lanes[obstacleLane]}%`;field.append(n);obstacles.push({n,lane:obstacleLane,y:5,hit:false});};
      const loop=now=>{const dt=Math.min(.04,(now-last)/1000);last=now;spawn+=dt;if(spawn>.9){spawn=0;add();}obstacles.slice().forEach(o=>{o.y+=62*dt;o.n.style.top=`${o.y}%`;if(!o.hit&&o.y>70&&o.y<91&&o.lane===lane){o.hit=true;ctx.miss();o.n.remove();obstacles.splice(obstacles.indexOf(o),1);}else if(o.y>100){ctx.hit();o.n.remove();obstacles.splice(obstacles.indexOf(o),1);}});if(ctx.score<config.goal)raf=requestAnimationFrame(loop);};
      raf=requestAnimationFrame(loop);ctx.later(()=>cancelAnimationFrame(raf),config.time*1000+200);ctx.clock();return;
    }
    if(config.mode==='dodge'){
      const hero=make('div','micro-steer-hero',pref.symbol);field.append(hero);const rocks=[];let last=performance.now(),spawn=.3,survived=0,raf;
      const move=e=>{const r=field.getBoundingClientRect();hero.style.left=`${clamp((e.clientX-r.left)/r.width*100,6,94)}%`;hero.style.top=`${clamp((e.clientY-r.top)/r.height*100,15,88)}%`;};field.addEventListener('pointerdown',move);field.addEventListener('pointermove',e=>(e.buttons||e.pointerType==='touch')&&move(e));
      const loop=now=>{const dt=Math.min(.04,(now-last)/1000);last=now;spawn+=dt;survived+=dt;if(spawn>.52){spawn=0;const n=make('i','micro-rock','◆');n.style.top=`${12+Math.random()*76}%`;field.append(n);rocks.push({n,x:105,speed:50+Math.random()*28});}if(survived>1.15){survived=0;ctx.hit();}const hr=hero.getBoundingClientRect();rocks.slice().forEach(o=>{o.x-=o.speed*dt;o.n.style.left=`${o.x}%`;const r=o.n.getBoundingClientRect();if(r.left<hr.right&&r.right>hr.left&&r.top<hr.bottom&&r.bottom>hr.top){ctx.miss();o.n.remove();rocks.splice(rocks.indexOf(o),1);}else if(o.x<-10){o.n.remove();rocks.splice(rocks.indexOf(o),1);}});if(ctx.score<config.goal)raf=requestAnimationFrame(loop);};
      raf=requestAnimationFrame(loop);ctx.later(()=>cancelAnimationFrame(raf),config.time*1000+200);ctx.clock();return;
    }
    const hero=make('div','micro-steer-hero',pref.symbol);field.append(hero);const objects=[];let last=performance.now(),spawn=.2,spawnIndex=0,raf;const move=e=>{const r=field.getBoundingClientRect();hero.style.left=`${clamp((e.clientX-r.left)/r.width*100,5,95)}%`;hero.style.top=`${clamp((e.clientY-r.top)/r.height*100,14,88)}%`;};field.addEventListener('pointerdown',move);field.addEventListener('pointermove',e=>(e.buttons||e.pointerType==='touch')&&move(e));const add=()=>{const good=config.mode==='steer'||spawnIndex++%3!==2;const n=make('i',good?'micro-hoop':'micro-rock',good?'':'◆');n.style.top=`${16+Math.random()*68}%`;field.append(n);objects.push({n,x:105,good});};const loop=now=>{const dt=Math.min(.04,(now-last)/1000);last=now;spawn+=dt;if(spawn>.62){spawn=0;add();}const hr=hero.getBoundingClientRect();objects.slice().forEach(o=>{o.x-=48*dt;o.n.style.left=`${o.x}%`;const r=o.n.getBoundingClientRect();if(r.left<hr.right&&r.right>hr.left&&r.top<hr.bottom&&r.bottom>hr.top){o.good?ctx.hit():ctx.miss();o.n.remove();objects.splice(objects.indexOf(o),1);}else if(o.x<-10){o.n.remove();objects.splice(objects.indexOf(o),1);}});if(ctx.score<config.goal)raf=requestAnimationFrame(loop);};raf=requestAnimationFrame(loop);ctx.later(()=>cancelAnimationFrame(raf),config.time*1000+200);ctx.clock();
  }

  function sequenceEngine(ctx) {
    const { field, config }=ctx;
    if(config.mode==='rhythm'){
      const pads=make('div','micro-sequence-pads');const copy=make('p','micro-sequence-copy','光った葉を タップ！');field.append(pads,copy);const buttons=[0,1].map((_,i)=>{const b=make('button',`micro-seq color-${i?'mint':'sun'}`,i?'右':'左');pads.append(b);return b;});let active=-1,answered=true;
      const beat=()=>{if(active>=0&&!answered)ctx.miss();active=Math.floor(Math.random()*2);answered=false;buttons.forEach((b,i)=>b.classList.toggle('is-lit',i===active));ctx.sound('pop');ctx.later(beat,620);};
      buttons.forEach((b,i)=>b.addEventListener('click',()=>{if(!answered&&i===active){answered=true;buttons[i].classList.remove('is-lit');ctx.hit();}else ctx.miss();}));beat();ctx.clock();return;
    }
    if(config.mode==='sequence'){
      const arrows=['↑','→','↓','←'];const pads=make('div','micro-sequence-pads');const copy=make('p','micro-sequence-copy','矢印と おなじ！');field.append(pads,copy);let wanted=0;
      const buttons=arrows.map((arrow,i)=>{const b=make('button',`micro-seq color-${['coral','sun','mint','sky'][i]}`,arrow);b.addEventListener('click',()=>{if(i===wanted){ctx.hit();next();}else ctx.miss();});pads.append(b);return b;});
      const next=()=>{wanted=Math.floor(Math.random()*4);copy.textContent=`つぎは ${arrows[wanted]}`;buttons.forEach((b,i)=>b.classList.toggle('is-lit',i===wanted));};next();ctx.clock();return;
    }
    const count=4;const pads=make('div','micro-sequence-pads');const copy=make('p','micro-sequence-copy','よく見てね');const replay=make('button','micro-memory-replay','もう一度見る');field.append(pads,copy,replay);const buttons=Array.from({length:count},(_,i)=>{const b=make('button',`micro-seq color-${['coral','sun','mint','sky'][i]}`,String(i+1));pads.append(b);return b;});let seq=[],input=0,locked=true,round=0,clockStarted=false;
    const show=()=>{locked=true;replay.disabled=true;input=0;seq=Array.from({length:2+Math.min(round,1)},()=>Math.floor(Math.random()*count));copy.textContent='よく見てね';seq.forEach((v,i)=>ctx.later(()=>{buttons[v].classList.add('is-lit');ctx.sound('pop');ctx.later(()=>buttons[v].classList.remove('is-lit'),320);},450+i*650));ctx.later(()=>{locked=false;replay.disabled=false;copy.textContent='同じ順で タップ';if(!clockStarted){clockStarted=true;ctx.clock();}},450+seq.length*650);};
    replay.addEventListener('click',show);buttons.forEach((b,i)=>b.addEventListener('click',()=>{if(locked)return;b.classList.add('is-lit');ctx.later(()=>b.classList.remove('is-lit'),150);if(i===seq[input]){input++;if(input===seq.length){round++;ctx.hit();ctx.later(show,450);}}else{ctx.miss();input=0;copy.textContent='もう一度 見よう';}}));show();
  }

  const engines = { route:routeEngine, catch:catchEngine, timing:timingEngine, release:releaseEngine, discover:discoverEngine, puzzle:puzzleEngine, meter:meterEngine, action:actionEngine, sequence:sequenceEngine };
  window.QUEST_MICROGAMES = { catalog, start };
})();
