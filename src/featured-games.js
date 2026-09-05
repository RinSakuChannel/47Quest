(function () {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const definitions = {
    '02': { title:'りんごの ごほうび収穫祭', command:'かごを うごかして キャッチ！', goal:8, time:45, lesson:'かごを 左右にうごかそう。金のりんごは３点！', demo:'🍎　↓　🧺', acts:['りんごが おちてくるよ','そよかぜが ふいてきた！','金のりんごの 収穫祭！'] },
    '12': { title:'らっかせい工場 おおいそがし', command:'つかんで おなじ絵の箱へ！', goal:8, time:45, lesson:'らっかせいは豆の箱へ。葉っぱは葉の箱へ はこぼう！', demo:'🥜 → 📦 ← 🍃', acts:['つかんで 箱へはこぼう','２つずつ ながれてくるよ','金のらっかせいも 登場！'] },
    '37': { title:'のびーる！うどん食堂', command:'麺を 上にひっぱって はなそう！', goal:5, time:45, lesson:'もち手を上へひっぱろう。黄色い帯の中ではなすと できあがり！', demo:'↑　〰️　🍜', acts:['うどん食堂 かいてん！','ながーい注文も きたよ','大もりの 注文です！'] },
  };
  // Pure round rules shared by the UI and regression tests.
  function round(goal, duration = 45) {
    return { elapsed:0, score:0, streak:0, best:0, misses:0,
      tick(dt) { this.elapsed += clamp(dt,0,.1); return this.elapsed >= duration && this.score >= goal; },
      hit(points=1) { this.score += points; this.best = Math.max(this.best,++this.streak); },
      miss() { this.misses++; this.streak=0; },
      get stars() { return this.score >= goal*3 ? 3 : this.score >= goal*2 ? 2 : this.score >= goal ? 1 : 0; },
      get phase() { return Math.min(2,Math.floor(this.elapsed/15)); },
    };
  }
  const node = (tag, cls, text='') => { const n=document.createElement(tag);n.className=cls;n.textContent=text;return n; };
  function start(options) {
    const {field,pref,sound,finish,updateHud,registerCleanup,runMeta={}}=options;
    const def=definitions[pref.code]; if(!def)return false;
    field.className=`game-field featured-game featured-${pref.code}`;
    const intro=node('div','fg-intro');
    intro.innerHTML=`<p>あそびかた</p><strong>${def.lesson}</strong><div class="fg-demo" aria-hidden="true">${def.demo}</div><span>45秒あそべるよ！　★ ${def.goal}点　★★ ${def.goal*2}点　★★★ ${def.goal*3}点</span><button type="button">あそぶ！</button>`;
    field.append(intro);
    let alive=true, raf=0; const cleanups=[];
    registerCleanup(()=>{alive=false;cancelAnimationFrame(raf);cleanups.forEach(fn=>fn());});
    intro.querySelector('button').addEventListener('click',()=>{
      intro.remove();sound('tap');
      const model=round(def.goal,def.time);
      const world=node('div','fg-world'); const banner=node('strong','fg-banner',def.acts[0]);
      const status=node('div','fg-status'); const feedback=node('div','fg-feedback');feedback.setAttribute('role','status');
      const end=node('button','fg-bank','ここで おわる →');end.hidden=true;
      end.addEventListener('click',()=>{if(model.score>=def.goal)complete();});
      field.append(world,banner,status,feedback,end);
      let feedbackTime=0, lastPhase=-1;
      const tell=(text)=>{feedback.textContent=text;feedbackTime=1.2;};
      const ctx={world,model,cleanups,sound,tell,
        point(e){const r=world.getBoundingClientRect();return {x:clamp((e.clientX-r.left)/r.width*100,0,100),y:clamp((e.clientY-r.top)/r.height*100,0,100)};},
        hit(points=1){model.hit(points);sound(model.streak%3===0?'combo':'good');tell(points>1?`＋${points}！ おおあたり！`:model.streak>=3?`${model.streak}れんぞく！`:'やった！ ＋1');},
        miss(){model.miss();sound('wrong');tell('だいじょうぶ！ もういちど');},
      };
      const game=engines[pref.code](ctx);
      function complete(){
        if(!alive)return; alive=false;cancelAnimationFrame(raf);
        const challengeWon=runMeta.challenge?.id==='combo'?model.best>=3:runMeta.challenge?.id==='clean'?model.misses===0:runMeta.challenge?.id==='speed'?model.score>=def.goal*2:false;
        finish(true,{stars:model.stars,maxStreak:model.best,misses:model.misses,score:model.score,timeLeft:Math.max(0,def.time-model.elapsed),challengeWon});
      }
      let last=performance.now();
      function loop(now){
        if(!alive)return;
        const dt=document.hidden?0:Math.min(.05,Math.max(0,(now-last)/1000));last=now;
        if(model.tick(dt)){complete();return;}
        if(lastPhase!==model.phase){lastPhase=model.phase;banner.textContent=def.acts[lastPhase];sound('pop');}
        game.update(dt);
        if(!alive)return;
        if(feedbackTime>0){feedbackTime-=dt;if(feedbackTime<=0)feedback.textContent='';}
        const remaining=Math.max(0,def.time-model.elapsed);
        const nextGoal=def.goal*(Math.min(2,model.stars)+1);
        status.textContent=`${'★'.repeat(model.stars)}${'☆'.repeat(3-model.stars)}　${model.score}点${model.stars<3?` ／ つぎの星まで ${nextGoal-model.score}点`:'　３つ星！ どこまで のばせる？'}`;
        if(remaining===0)banner.textContent='あせらず れんしゅう！ あと'+Math.max(0,def.goal-model.score)+'点';
        end.hidden=model.score<def.goal;
        updateHud(model.score,def.goal,remaining);
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
    world.append(node('div','fg-conveyor'));
    const bins=['🥜','🍃'].map((glyph,i)=>{const b=node('div',`fg-bin fg-bin-${i}`);b.innerHTML=`<b>${glyph}</b><span>${i?'はっぱ':'らっかせい'}</span>`;world.append(b);return b;});
    const items=[];let spawn=0,serial=0;
    function add(){
      const kind=Math.random()<.65?0:1;const gold=model.phase===2&&kind===0&&serial%3===0;
      const n=node('button',`fg-parcel${gold?' is-gold':''}`,kind?'🍃':'🥜');
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
