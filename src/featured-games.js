(function () {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const definitions = {
    '02': { title:'りんごの ごほうび収穫祭', command:'かごを うごかして キャッチ', goal:8, time:20, gesture:'左右へドラッグ', variation:'りんごの位置・風の揺れ・金色の出現順が変わる', lesson:'指に合わせて、かごが動くよ。', demo:'🍎　↓　🧺', acts:['りんごを キャッチ','風でゆれるよ','金のりんごは 3点'] },
    '12': { title:'らっかせい工場 おおいそがし', command:'つかんで おなじ箱へ', goal:8, time:20, gesture:'つかんで仕分け', variation:'品物の種類・出現間隔・レーン位置が変わる', lesson:'絵が同じ箱へ運ぼう。', demo:'🥜 → 📦 ← 🍃', acts:['絵が同じ箱へ','流れが速くなるよ','金は 3点'] },
    '37': { title:'のびーる！うどん食堂', command:'上にひっぱって、黄色で はなす', goal:5, time:20, gesture:'上へ引いて離す', variation:'注文の長さ・成功帯・大盛りのタイミングが変わる', lesson:'もち手が黄色い帯に入ったら、指をはなそう。', demo:'↑　〰️　🍜', acts:['黄色で はなす','長い注文がくるよ','大もりは 2点'] },
  };
  // Pure round rules shared by the UI and regression tests.
  function round(goal, duration = 20) {
    return { elapsed:0, score:0, streak:0, best:0, misses:0,
      tick(dt) { this.elapsed += clamp(dt,0,.1); return this.elapsed >= duration; },
      hit(points=1) { this.score += points; this.best = Math.max(this.best,++this.streak); },
      miss() { this.misses++; this.streak=0; },
      get stars() { return this.score >= goal*3 ? 3 : this.score >= goal*2 ? 2 : this.score >= goal ? 1 : 0; },
      get phase() { return Math.min(2,Math.floor(this.elapsed/(duration/3))); },
    };
  }
  const node = (tag, cls, text='') => { const n=document.createElement(tag);n.className=cls;n.textContent=text;return n; };
  function start(options) {
    const {field,pref,sound,finish,updateHud,registerCleanup,runMeta={}}=options;
    const def=definitions[pref.code]; if(!def)return false;
    field.className=`game-field featured-game featured-${pref.code}`;
    const intro=node('div','fg-intro');
    intro.innerHTML=`<div class="fg-demo" aria-hidden="true">${def.demo}</div><strong>${def.command}</strong><span class="fg-intro-note">${def.lesson}</span><button type="button" class="fg-start">スタート</button>`;
    const practiceButton=node('button','fg-practice','まず練習する');intro.append(practiceButton);
    let practicing=false,practiceDone=false;
    practiceButton.addEventListener('click',()=>{practicing=true;intro.querySelector('.fg-start').click();});
    field.append(intro);
    const stopGuide=window.QUEST_GESTURE_GUIDE?.mount(intro.querySelector('.fg-demo'),pref.code)||(()=>{});
    registerCleanup(stopGuide);
    let alive=true, raf=0; const cleanups=[];
    registerCleanup(()=>{alive=false;cancelAnimationFrame(raf);cleanups.forEach(fn=>fn());});
    intro.querySelector('.fg-start').addEventListener('click',()=>{
      stopGuide();intro.remove();sound('tap');
      const model=round(def.goal,def.time);
      model.playTime=0;
      const practiceBadge=node('span','fg-practice-badge','練習：まず１回できればOK');practiceBadge.hidden=!practicing;
      field.append(practiceBadge);
      const world=node('div','fg-world'); const banner=node('strong','fg-banner',def.acts[0]);
      const status=node('div','fg-status'); const feedback=node('div','fg-feedback');feedback.setAttribute('role','status');
      const buddyArt=window.CHARACTER_ART?.[runMeta.buddyCode];
      const buddy=buddyArt?node('button','fg-buddy'):null;
      if(buddy){buddy.type='button';buddy.dataset.characterCode=runMeta.buddyCode;buddy.setAttribute('aria-label','応援している仲間の声を聞く');const img=node('img','');img.src=buddyArt;img.alt='';buddy.append(img);field.append(buddy);}
      const progress=node('div','fg-star-track');progress.setAttribute('role','progressbar');progress.setAttribute('aria-label','クリアまでの進み具合');progress.setAttribute('aria-valuemin','0');progress.setAttribute('aria-valuemax',String(def.goal));
      progress.innerHTML='<i></i>';
      const end=node('button','fg-bank','本番へ');end.hidden=true;
      end.addEventListener('click',()=>{
        if(practicing&&practiceDone){practicing=false;practiceBadge.remove();model.elapsed=0;model.score=0;model.streak=0;model.best=0;model.misses=0;lastPhase=-1;feedbackTime=0;feedback.textContent='';sound('pop');return;}
      });
      field.append(world,banner,status,feedback,end,progress);
      world.addEventListener('pointerdown',()=>sound('action'));
      world.addEventListener('pointermove',event=>{if(event.buttons)sound('motion');});
      world.addEventListener('pointerup',()=>sound('release'));
      let feedbackTime=0, lastPhase=-1, completionQueued=false;
      const tell=(text)=>{
        feedbackTime=1.2;
        if(field.classList.contains('has-regional-canvas')){
          feedback.textContent='';
          banner.textContent=text;
          banner.classList.add('is-feedback');
        }else feedback.textContent=text;
      };
      const ctx={world,model,cleanups,sound,tell,get practicing(){return practicing;},
        point(e){const r=world.getBoundingClientRect();return {x:clamp((e.clientX-r.left)/r.width*100,0,100),y:clamp((e.clientY-r.top)/r.height*100,0,100)};},
        hit(points=1){
          if(practicing){practiceDone=true;practiceBadge.textContent='できた！ 本番にすすもう';end.textContent='本番へ →';sound('good');return;}
          model.hit(points);sound(model.streak%3===0?'combo':'good');
          if(buddy&&!window.QUEST_MOTION?.reduced()){
            const image=buddy.querySelector('img');image.getAnimations().forEach(a=>a.cancel());
            image.animate([{transform:'scale(.92)'},{transform:'translateY(-3px) scale(.9)',offset:.5},{transform:'none'}],{duration:400});
          }
          tell(model.score>=def.goal?'できた':model.streak>=3?`${model.streak}れんぞく`:`あと ${Math.max(0,def.goal-model.score)}`);
          if(model.score>=def.goal&&!completionQueued){
            completionQueued=true;
            const completionTimer=setTimeout(()=>complete(true),480);
            cleanups.push(()=>clearTimeout(completionTimer));
          }
          if(!(window.QUEST_MOTION?.reduced()??window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)){
            status.getAnimations().forEach(animation=>animation.cancel());
            status.animate([{scale:'1'},{scale:'1.04',offset:.3},{scale:'1'}],{duration:280,easing:'ease-out'});
          }
        },
        miss(){if(!practicing)model.miss();sound('tap');tell('もういちど。'+def.command);},
      };
      const game=engines[pref.code](ctx);
      if(world.querySelector('.rg-canvas'))field.classList.add('has-regional-canvas');
      function complete(success=model.score>=def.goal){
        if(!alive)return; alive=false;cancelAnimationFrame(raf);
        const stars=success?Math.min(3,1+Number(model.misses===0)+Number(model.elapsed<=def.time*.58)):0;
        finish(success,{stars,maxStreak:model.best,misses:model.misses,score:model.score,timeLeft:Math.max(0,def.time-model.elapsed)});
      }
      let last=performance.now();
      function loop(now){
        if(!alive)return;
        const dt=document.hidden?0:Math.min(.05,Math.max(0,(now-last)/1000));last=now;
        if(!practicing&&model.tick(dt)){complete(model.score>=def.goal);return;}
        if(lastPhase!==model.phase){lastPhase=model.phase;if(feedbackTime<=0)banner.textContent=def.acts[lastPhase];sound('pop');}
        if(!practiceDone||!practicing){const step=dt*(practicing?.75:1);model.playTime+=step;game.update(step);}
        if(!alive)return;
        if(feedbackTime>0){feedbackTime-=dt;if(feedbackTime<=0){feedback.textContent='';banner.classList.remove('is-feedback');banner.textContent=def.acts[model.phase];}}
        const remaining=Math.max(0,def.time-model.elapsed);
        progress.style.setProperty('--score-ratio',String(Math.min(1,model.score/def.goal)));
        progress.setAttribute('aria-valuenow',String(Math.min(def.goal,model.score)));
        status.textContent=model.score>=def.goal?'できた':`${model.score} / ${def.goal}　あと ${Math.max(0,def.goal-model.score)}`;
        end.hidden=!practicing||!practiceDone;
        if(practicing)status.textContent=practiceDone?'できた！ 本番へすすもう':'時間は気にせず、操作してみよう';
        progress.hidden=practicing;
        updateHud(model.score,def.goal,practicing?null:remaining);
        raf=requestAnimationFrame(loop);
      }
      raf=requestAnimationFrame(loop);
    },{once:true});
    return true;
  }

  function orchard(ctx){
    const {world,model}=ctx;
    world.innerHTML='<div class="fg-orchard-tree"><i></i><i></i><i></i></div><div class="fg-grass"></div>';
    const basket=node('div','fg-basket','');basket.setAttribute('aria-label','りんごを受けるかご');world.append(basket);
    const guide=node('span','fg-control-tip','← 指をうごかす →');world.append(guide);
    let x=50,target=50,spawn=.1,serial=0;const fruits=[];
    const move=e=>{target=clamp(ctx.point(e).x,9,91);};
    world.addEventListener('pointerdown',e=>{world.setPointerCapture(e.pointerId);move(e);});
    world.addEventListener('pointermove',move);
    world.tabIndex=0;world.setAttribute('aria-label','左右キーでもかごを動かせます');
    world.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();target=clamp(target+(e.key==='ArrowLeft'?-9:9),9,91);}});
    const add=()=>{const gold=model.phase===2&&serial++%3===0;const n=node('i',`fg-apple${gold?' is-gold':''}`);n.setAttribute('aria-label',gold?'金のりんご':'りんご');world.append(n);fruits.push({n,x:12+Math.random()*76,y:4,speed:15+Math.random()*5,wave:Math.random()*6,gold});};
    return {update(dt){
      x+=(target-x)*Math.min(1,dt*18);basket.style.left=`${x}%`;
      spawn-=dt;if(spawn<=0){spawn=model.phase===0?1.3:1;add();}
      for(const f of [...fruits]){
        f.y+=f.speed*dt;
        const fx=clamp(f.x+(model.phase>0?Math.sin(model.elapsed*1.6+f.wave)*8:0),6,94);
        f.n.style.left=`${fx}%`;f.n.style.top=`${f.y}%`;f.n.style.rotate=`${Math.sin(f.y*.08)*15}deg`;
        if(f.y>=78&&f.y<=88&&Math.abs(fx-x)<13){ctx.hit(f.gold?3:1);f.n.remove();fruits.splice(fruits.indexOf(f),1);basket.classList.toggle('is-full',model.score%2===0);}
        else if(f.y>102){f.n.remove();fruits.splice(fruits.indexOf(f),1);model.streak=0;}
      }
    }};
  }

  function factory(ctx){
    const {world,model}=ctx;
    const parcelArt=kind=>kind
      ? '<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M14 67C0 28 35 8 68 10C75 45 55 74 14 67Z" fill="#74ad65" stroke="#366c48" stroke-width="4"/><path d="M8 74L59 23M28 54L25 34M39 43L57 46" fill="none" stroke="#d5e9a4" stroke-width="3" stroke-linecap="round"/></svg>'
      : '<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M20 9C42 0 52 21 48 31C45 40 69 40 70 56C72 77 42 82 33 64C27 52 14 55 9 40C4 24 9 15 20 9Z" fill="#dfb879" stroke="#966337" stroke-width="4"/><path d="M20 18L33 43L54 68M12 32L37 21M23 48L47 35M37 63L65 52" fill="none" stroke="#b78547" stroke-width="3" stroke-linecap="round"/></svg>';
    world.append(node('div','fg-conveyor'));
    const bins=[0,1].map(i=>{const b=node('div',`fg-bin fg-bin-${i}`);b.innerHTML=`<b>${parcelArt(i)}</b><span>${i?'はっぱ':'らっかせい'}</span>`;world.append(b);return b;});
    const items=[];let spawn=0,serial=0;
    function add(){
      const kind=Math.random()<.65?0:1;const gold=model.phase===2&&kind===0&&serial%3===0;
      const n=node('button',`fg-parcel${gold?' is-gold':''}`);n.innerHTML=parcelArt(kind);
      n.setAttribute('aria-label',kind?'葉っぱを葉の箱へ':'落花生を落花生の箱へ');
      const o={n,kind,gold,x:5,y:33+(serial++%2)*12,drag:false};items.push(o);world.append(n);
      n.addEventListener('pointerdown',e=>{o.drag=true;n.setPointerCapture(e.pointerId);n.classList.add('is-held');ctx.sound('tap');});
      n.addEventListener('pointermove',e=>{if(!o.drag)return;const p=ctx.point(e);o.x=p.x;o.y=p.y;position();});
      function position(){n.style.left=`${o.x}%`;n.style.top=`${o.y}%`;}
      const reset=()=>{o.drag=false;o.x=clamp(o.x,10,85);o.y=36;n.classList.remove('is-held');position();};
      n.addEventListener('pointercancel',reset);
      n.addEventListener('pointerup',e=>{
        if(!o.drag)return;const p=ctx.point(e);const correct=Math.abs(p.x-(kind?74:26))<23&&p.y>=65;
        if(correct){ctx.hit(gold?3:1);n.remove();items.splice(items.indexOf(o),1);}
        else{ctx.miss();reset();}
      });
      n.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();if((e.key==='ArrowLeft'?0:1)===kind){ctx.hit(gold?3:1);n.remove();items.splice(items.indexOf(o),1);}else ctx.miss();}});
      position();
    }
    return {update(dt){spawn-=dt;if(spawn<=0&&items.length<5){add();spawn=model.phase===0?2.2:1.4;}
      for(const o of [...items])if(!o.drag){o.x+=dt*(model.phase===0?5:6.5);o.n.style.left=`${o.x}%`;if(o.x>96){o.x=5;ctx.tell('取りのがしても またくるよ');}}
    }};
  }

  function kitchen(ctx){
    const {world,model}=ctx;
    const order=node('div','fg-order');const zone=node('div','fg-noodle-zone');
    const noodle=node('div','fg-noodle');const bowl=node('div','fg-bowl','うどん');
    const grip=node('button','fg-grip','ここを ひっぱる ↑');
    grip.setAttribute('aria-label','麺のもち手。上にドラッグ。キーボードはスペース長押しで伸ばして離す');
    world.append(order,zone,noodle,bowl,grip);
    let wanted=40,current=0,drag=false,key=false,cooldown=0;
    function next(){wanted=30+Math.random()*(model.phase===0?15:35);order.textContent=model.phase===2?'注文：大もり！ 黄色で はなしてね':'注文：この長さ！ 黄色で はなしてね';zone.style.top=`${80-wanted-8}%`;zone.style.height='16%';current=0;draw();}
    function draw(){noodle.style.height=`${Math.max(3,current)}%`;grip.style.top=`${80-current}%`;grip.classList.toggle('is-ready',Math.abs(current-wanted)<=8);}
    function release(){if(!drag)return;drag=false;key=false;
      if(Math.abs(current-wanted)<=8){ctx.hit(model.phase===2?2:1);ctx.tell('つるるん！ できあがり！');cooldown=.6;grip.disabled=true;noodle.classList.add('is-served');}
      else{ctx.miss();current=0;draw();}
    }
    grip.addEventListener('pointerdown',e=>{if(cooldown)return;drag=true;grip.setPointerCapture(e.pointerId);ctx.sound('tap');});
    grip.addEventListener('pointermove',e=>{if(!drag)return;current=clamp(80-ctx.point(e).y,0,70);draw();});
    grip.addEventListener('pointerup',release);
    grip.addEventListener('pointercancel',()=>{drag=false;key=false;current=0;draw();});
    grip.addEventListener('keydown',e=>{if((e.code==='Space'||e.code==='Enter')&&!cooldown){e.preventDefault();drag=true;key=true;}});
    grip.addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();release();}});
    grip.addEventListener('blur',()=>{if(key){drag=false;key=false;current=0;draw();}});
    next();
    return {update(dt){if(key){current=Math.min(70,current+dt*23);draw();}if(cooldown>0){cooldown-=dt;if(cooldown<=0){grip.disabled=false;noodle.classList.remove('is-served');next();}}}};
  }
  const engines={'02':orchard,'12':factory,'37':kitchen};
  for (const [code,definition] of Object.entries(window.QUEST_REGIONAL_GAMES?.definitions || {})) {
    definitions[code]=definition;
    engines[code]=ctx=>window.QUEST_REGIONAL_GAMES.create(code,ctx);
  }
  window.QUEST_FEATURED_GAMES={definitions,start,round};
})();
