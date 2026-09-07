(function () {
  'use strict';
  // Only drawing, coordinates and round bookkeeping are shared here.
  // Each county factory owns its own simulation, input and victory rules.
  const games = {};
  const definitions = {};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const random=(a,b)=>a+Math.random()*(b-a);
  function register(code,title,command,lesson,icon,factory){
    definitions[code]={title,command,lesson,demo:icon,goal:3,time:25,acts:['まずは やってみよう！','こつを つかんできた？','あと少し！ 記録にちょうせん']};games[code]=factory;
  }
  function create(code,ctx){
    const canvas=document.createElement('canvas');canvas.className='rg-canvas';
    // Render the logical 1000×600 board at device-pixel density so copy stays sharp.
    const pixelRatio=Math.min(2,window.devicePixelRatio||1); canvas.width=1000*pixelRatio; canvas.height=600*pixelRatio; canvas.style.aspectRatio='5 / 3'; canvas.tabIndex=0;
    canvas.setAttribute('aria-label',definitions[code].lesson);ctx.world.append(canvas);
    const c=canvas.getContext('2d'); c.setTransform(pixelRatio,0,0,pixelRatio,0,0);
    const mascot=new Image();if(window.CHARACTER_ART?.[code])mascot.src=window.CHARACTER_ART[code];
    let pointer={x:500,y:300,down:false},previous={...pointer};let done=false,celebrate=0,interacted=false;
    const effects=[];
    const api={get phase(){return ctx.model.phase;},get time(){return ctx.model.elapsed;},
      random,clamp,dist,
      win(x=500,y=300){if(celebrate>0)return;ctx.hit(3);celebrate=.32;for(let i=0;i<18;i++)effects.push({x,y,vx:random(-190,190),vy:random(-280,-90),life:.7});},
      miss:ctx.miss,tell:ctx.tell,
      circle(x,y,r,color='#ffd65f'){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();},
      box(x,y,w,h,color='#fff9e4'){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,Math.min(16,w/2,h/2));c.fill();},
      line(points,color='#50776e',width=8){if(!points.length)return;c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();},
      text(s,x,y,size=28,color='#173e51'){c.fillStyle=color;c.font=`900 ${size}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(s,x,y);},
      icon(s,x,y,size=70){this.text(s,x,y,size);},
      mascot(x,y,size=130){if(mascot.complete&&mascot.naturalWidth){const scale=size/Math.max(mascot.naturalWidth,mascot.naturalHeight),w=mascot.naturalWidth*scale,h=mascot.naturalHeight*scale;c.drawImage(mascot,x-w/2,y-h/2,w,h);}else this.icon('🐟',x,y,size*.65);},
      winterScene(progress){
        const sky=c.createLinearGradient(0,0,0,600);sky.addColorStop(0,'#183657');sky.addColorStop(1,'#789aaa');c.fillStyle=sky;c.fillRect(0,0,1000,600);
        this.circle(835,95,40,'#fff3c9');
        for(let i=0;i<9;i++){const x=i*135-30,y=345+(i%3)*20;this.line([{x,y:y+100},{x,y:y-80}],'#26485e',10);this.line([{x:x-35,y},{x,y:y-65},{x:x+35,y}],'#426579',17);}
        c.fillStyle='#e5f3f5';c.beginPath();c.ellipse(500,605,710,155,0,0,Math.PI*2);c.fill();
        const snow=c.createRadialGradient(445,245,20,510,330,220);snow.addColorStop(0,'#fff');snow.addColorStop(.65,'#e9f4f5');snow.addColorStop(1,'#9cb8c9');
        c.save();c.globalAlpha=.2+progress*.8;c.fillStyle=snow;c.beginPath();c.ellipse(500,355,195,205,0,Math.PI,Math.PI*2);c.lineTo(695,463);c.quadraticCurveTo(500,500,305,463);c.closePath();c.fill();c.restore();
        const glow=c.createRadialGradient(500,405,8,500,405,90);glow.addColorStop(0,'#ffe795');glow.addColorStop(1,'#e7a44000');c.fillStyle=glow;c.fillRect(410,315,180,180);
        this.box(458,360,84,115,'#674831');this.box(468,372,64,90,'#eab663');this.circle(500,404,10,'#fff3af');
        for(let i=0;i<45;i++){const x=(i*137+Math.sin(aTime()+i)*14)%1000,y=(i*97+aTime()*22)%520;this.circle(x,y,1+i%3,'#ffffffaa');}
      },
      target(x,y,r=42){c.strokeStyle='#d6a221';c.lineWidth=6;c.setLineDash([10,8]);c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();c.setLineDash([]);},
    };
    function aTime(){return ctx.model.elapsed;}
    let game=games[code](api);
    function event(e,kind){
      const r=canvas.getBoundingClientRect();previous={...pointer};pointer={x:clamp((e.clientX-r.left)/r.width*1000,0,1000),y:clamp((e.clientY-r.top)/r.height*600,0,600),down:kind==='down'?true:kind==='up'||kind==='cancel'?false:pointer.down};
      if(kind==='down'){canvas.setPointerCapture(e.pointerId);interacted=true;}
      if(celebrate>0)return;
      game.input?.(kind,pointer,previous);
    }
    for(const [eventName,kind] of [['pointerdown','down'],['pointermove','move'],['pointerup','up'],['pointercancel','cancel']])canvas.addEventListener(eventName,e=>event(e,kind));
    canvas.addEventListener('blur',()=>{pointer.down=false;game.input?.('cancel',pointer,previous);});
    ctx.cleanups.push(()=>{done=true;});
    return {update(dt){
      if(done)return;
      if(celebrate>0){celebrate-=dt;if(celebrate<=0){game=games[code](api);pointer.down=false;}}
      else if(interacted)game.step?.(dt,pointer);
      c.clearRect(0,0,1000,600);c.fillStyle='#f7f5dc';c.fillRect(0,0,1000,600);
      game.draw();
      for(const e of effects){e.life-=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;e.vy+=600*dt;if(e.life>0)api.circle(e.x,e.y,5,'#efad31');}
      for(let i=effects.length-1;i>=0;i--)if(effects[i].life<=0)effects.splice(i,1);
      // Keep the board visible: the banner owns success copy, particles mark the action.
    }};
  }

  register('01','ころがせ！雪像工房','雪玉をころがして 大きくしよう','雪の山を通って雪玉を大きくし、右の雪像へはこぼう。','⛄',a=>{
    let ball={x:110,y:430},r=24;const piles=Array.from({length:6},(_,i)=>({x:220+i*85,y:random(170,420),used:false}));
    return {input(k,p){if(k==='move'&&p.down&&dist(p,ball)<130){const travel=Math.min(20,dist(p,ball));ball.x+=(p.x-ball.x)*.3;ball.y+=(p.y-ball.y)*.3;for(const snow of piles)if(!snow.used&&dist(snow,ball)<70){snow.used=true;r+=8;}}if(k==='up'&&ball.x>810&&r>=56)a.win();},
      draw(){a.box(0,0,1000,600,'#dceff5');piles.forEach(p=>{if(!p.used)a.icon('❄',p.x,p.y,75);});a.target(875,380,75);a.icon('⛄',875,270,95);a.circle(ball.x,ball.y,r,'#fff');a.text(`${Math.round(r)} / 56`,ball.x,ball.y-70,24);a.text('雪の上を ころころ → 雪像へ',500,540);}};
  });
  register('03','わんこそば おかわり大行列','空いたおわんへ そばを届けよう！','「おかわり」のおわんをタップ！ 食べているお客さんは待ってあげよう。','🍜',a=>{
    const guests=Array.from({length:3},(_,i)=>({x:220+i*280,wait:i*.65,eating:0,bounce:0}));let served=0;
    return {input(k,p){if(k!=='down')return;const g=guests.find(g=>Math.abs(p.x-g.x)<115&&p.y>150&&p.y<480);if(!g)return;
      if(g.eating<=0){g.eating=random(1.1,1.8);g.wait=0;g.bounce=.35;served++;a.tell('はい、どうぞ！');if(served>=5)a.win(g.x,320);}else a.tell('もぐもぐ中！ 空いたおわんへ');},
      step(dt){for(const g of guests){g.bounce=Math.max(0,g.bounce-dt);if(g.eating>0)g.eating-=dt;else{g.wait+=dt;if(g.wait>5-a.phase*.5){g.wait=0;a.miss();a.tell('こっちも おかわり！');}}}},
      draw(){a.box(0,0,1000,600,'#f3dfba');a.box(40,345,920,150,'#be7950');a.text(`お届け ${served} / 5`,500,55,32);
        for(const g of guests){const hop=Math.sin(g.bounce/.35*Math.PI)*14;const ready=g.eating<=0;
          a.circle(g.x,210-hop,65,ready?'#ffdc81':'#f1bd8e');a.circle(g.x-22,203-hop,6,'#513828');a.circle(g.x+22,203-hop,6,'#513828');a.text(ready?'◡':'～',g.x,235-hop,32);
          a.box(g.x-108,95,216,53,ready?'#fff6cc':'#ead7bd');a.text(ready?'おかわり！':'もぐもぐ',g.x,122,26);
          a.circle(g.x,360,76,ready?'#ffdd65':'#a94635');a.circle(g.x,350,60,ready?'#643c2e':'#eac484');if(!ready)a.icon('🍜',g.x,340-hop,85);else a.text('タップ',g.x,350,25,'#fff');
          a.box(g.x-80,458,160,12,'#ead8bd');a.box(g.x-80,458,Math.max(1,160*(ready?1-g.wait/(5-a.phase*.5):1)),12,ready?'#d79f35':'#74a883');}
        a.text('空いた おわんを タップ！',500,550,30);}};
  });
  register('04','たなばた そよかぜ便','スワイプで かざりを とばそう','飾りを上や横へ払って、光る枝へ届けよう。風で軌道が変わるよ。','🎋',a=>{
    let p={x:180,y:420},v={x:0,y:0};const goal={x:780,y:random(150,350)};
    return {input(k,q,prev){if(k==='move'&&q.down&&dist(q,p)<160){v.x=(q.x-prev.x)*10;v.y=(q.y-prev.y)*10;}},step(dt){p.x=clamp(p.x+v.x*dt,40,960);p.y=clamp(p.y+v.y*dt,60,490);v.x*=Math.exp(-dt*1.5);v.y*=Math.exp(-dt*1.5);if(dist(p,goal)<60)a.win();},draw(){a.line([{x:820,y:500},{x:820,y:80}],'#599357',16);a.line([{x:650,y:goal.y},{x:870,y:goal.y}],'#599357');a.target(goal.x,goal.y);a.icon('🎐',p.x,p.y,90);a.text('かざりを 払って 枝へ！',500,550);}};
  });
  register('05','かまくら 建築隊','青い雪ブロックを 光る場所へ！','左の青い雪ブロックをつかもう。光る丸まで運ぶと、かまくらができるよ。','🧊 → 🛖',a=>{
    const slots=[{x:390,y:390},{x:610,y:390},{x:420,y:285},{x:580,y:285},{x:500,y:195}];let i=0,block={x:150,y:395},drag=false;
    const reset=()=>{block={x:150,y:395};};
    return {input(k,p){if(k==='down'&&dist(p,block)<105)drag=true;if(k==='move'&&drag)block={x:p.x,y:p.y};if(k==='up'&&drag){drag=false;if(dist(block,slots[i])<90){i++;a.tell(i===slots.length?'かまくら できた！':`あと ${slots.length-i}こ！`);if(i===slots.length)a.win();reset();}else{a.tell('光る丸へ はこぼう');reset();}}if(k==='cancel'){drag=false;reset();}},draw(){
      if(a.winterScene)a.winterScene(i/slots.length);else a.box(0,0,1000,600,'#dcebf0');
      a.box(45,255,210,250,'#b9dce8');a.text('① つかむ',150,285,28,'#173e51');
      slots.slice(0,i).forEach((s,n)=>{a.box(s.x-72,s.y-50,144,100,n%2?'#d7eaf0':'#edf8fa');a.line([{x:s.x-60,y:s.y-39},{x:s.x+55,y:s.y-39}],'#fff',6);a.line([{x:s.x-60,y:s.y+42},{x:s.x+55,y:s.y+42}],'#a9c6d3',4);});
      if(slots[i]){a.target(slots[i].x,slots[i].y,70);a.text('② ここへ',slots[i].x,slots[i].y-100,25,'#9b741c');}
      a.box(block.x-68,block.y-47,136,94,drag?'#8ed5ef':'#a8e1f4');a.line([{x:block.x-61,y:block.y-40},{x:block.x+61,y:block.y-40},{x:block.x+61,y:block.y+40},{x:block.x-61,y:block.y+40},{x:block.x-61,y:block.y-40}],'#287da2',7);a.text('雪',block.x,block.y,30,'#173e51');
      a.text(`できた ${i} / 5　入口は あけておこう`,500,550,28);if(a.mascot)a.mascot(840,390,170);
    }};
  });
  register('06','さくらんぼ ふたごの引っ越し','２つを いっしょに 穴へ！','片方を動かすと、もう片方も軸に引かれるよ。２つとも輪に入れよう。','🍒',a=>{
    const p=[{x:200,y:340},{x:330,y:340}],goals=[{x:680,y:240},{x:810,y:300}];let held=-1;
    return {input(k,q){if(k==='down')held=p.findIndex(v=>dist(v,q)<65);if(k==='move'&&held>=0){p[held]={x:q.x,y:q.y};const other=p[1-held],d=dist(other,p[held]);if(d>150){other.x+=(p[held].x-other.x)*(d-150)/d;other.y+=(p[held].y-other.y)*(d-150)/d;}}if(k==='up'){held=-1;if(p.every((v,i)=>dist(v,goals[i])<65))a.win();}if(k==='cancel')held=-1;},draw(){goals.forEach(g=>a.target(g.x,g.y,65));a.line(p,'#6c9148',10);p.forEach((v,i)=>{a.circle(v.x,v.y,45,i?'#ef795b':'#d74755');a.text(i+1,v.x,v.y,30,'#fff');});goals.forEach((g,i)=>a.text(i+1,g.x,g.y,26));a.text('片方をつかむと もう片方もついてくる',500,540,26);}};
  });
  register('07','あかべこ 鈴キャッチ','鈴の下へ すばやく動こう！','左右から落ちる鈴を、あかべこの頭で受け止めよう。風で落ち方が変わるよ。','🔔',a=>{
    let head=500,caught=0,bell={x:random(150,850),y:70,vx:random(-45,45),vy:120};
    const next=()=>{bell={x:random(120,880),y:55,vx:random(-65,65),vy:random(115,155)};};
    return {input(k,p){if(k==='down'||(k==='move'&&p.down))head=clamp(p.x,120,880);},step(dt){bell.x+=bell.vx*dt;bell.y+=bell.vy*dt;bell.vy+=80*dt;if(bell.x<70||bell.x>930)bell.vx*=-1;if(bell.y>410&&bell.y<500&&Math.abs(bell.x-head)<105){caught++;a.tell('リン！');if(caught>=5)a.win(head,420);else next();}else if(bell.y>550){a.miss();next();}},draw(){a.box(0,0,1000,600,'#f3e6cf');a.icon('🔔',bell.x,bell.y,58);a.box(head-120,420,240,80,'#d9584a');a.circle(head,400,72,'#e47759');a.text(`鈴 ${caught} / 5`,500,70,34);a.text('鈴の下を タップして受ける！',500,550,27);}};
  });
  register('08','メロン 網目スタンプ','空いているところで タップ！','回るメロンに網目をつけよう。まだ線がない面でタップしてね。','🍈',a=>{
    let angle=0;const marked=new Set();
    return {input(k){if(k==='down'){const index=Math.floor(((angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2)/(Math.PI*2)*8);if(!marked.has(index)){marked.add(index);if(marked.size===8)a.win();}else a.tell('まだ線のない面を ねらおう');}},step(dt){angle+=dt*.65;},draw(){a.circle(500,280,170,'#aaca77');for(let i=0;i<8;i++){const t=i*Math.PI/4-angle,x=500+Math.cos(t)*130,y=280+Math.sin(t)*130;a.circle(x,y,29,marked.has(i)?'#eaf3c5':'#86a459');a.text(marked.has(i)?'✳':'・',x,y,36);}a.text('▼',680,280,45,'#e47742');a.text(`${marked.size} / 8　右の面にスタンプ`,500,520);}};
  });
  register('09','いちご ケーキロケット','ひっぱって いちごを 飛ばそう','いちごを左下へひっぱって離そう。点線の先のケーキをねらおう。','🍓',a=>{
    const origin={x:180,y:400},goal={x:780,y:300};let p={...origin},v=null,drag=false;
    return {input(k,q){if(k==='down'&&dist(q,p)<90&&!v)drag=true;if(k==='move'&&drag)p={x:clamp(q.x,40,180),y:clamp(q.y,400,530)};if(k==='up'&&drag){drag=false;v={x:(origin.x-p.x)*4,y:(origin.y-p.y)*4};p={...origin};}if(k==='cancel'){drag=false;p={...origin};}},step(dt){if(!v)return;p.x+=v.x*dt;p.y+=v.y*dt;v.y+=240*dt;if(dist(p,goal)<85){a.win();v=null;}else if(p.y>560||p.x>980){p={...origin};v=null;a.tell('もう少し ひっぱってみよう');}},draw(){a.icon('🎂',goal.x,goal.y,145);a.target(goal.x,goal.y,85);if(drag){const vx=(origin.x-p.x)*4,vy=(origin.y-p.y)*4;for(let t=0;t<2;t+=.12)a.circle(origin.x+vx*t,origin.y+vy*t+120*t*t,4,'#9c9c73');a.line([p,origin],'#8f6750',8);}a.icon('🍓',p.x,p.y,70);a.text('左下へひっぱる → はなす',500,565);}};
  });
  register('10','だるま てこの大仕事','支えをうごかして だるまを起こせ','三角の支えをだるまの近くへ動かし、板の左を下へ押そう。','🔴',a=>{
    let pivot=400,lift=0;
    return {input(k,p){if(k==='move'&&p.down&&p.y>390)pivot=clamp(p.x,300,760);if(k==='down'&&p.x<250&&p.y<390){lift+=Math.max(2,(pivot-250)/45);if(lift>70)a.win();}},draw(){a.line([{x:150,y:360+lift},{x:820,y:360-lift}],'#a5815b',24);a.text('▲',pivot,420,90,'#609e9a');a.icon('🔴',790,280-lift,110);a.text('① 支えを右へ　② 左の板をおす',500,540,26);a.target(180,350,60);}};
  });
  register('11','せんべい 両面こんがり','表も 裏も こんがり焼こう','タップで裏返すよ。両方の面が黄色になったら右のお皿へ運ぼう。','🍘',a=>{
    let sides=[0,0],side=0,p={x:430,y:300},drag=false;
    return {input(k,q,prev){if(k==='down'&&dist(q,p)<130){drag=true;}if(k==='move'&&drag){p={x:q.x,y:q.y};}if(k==='up'&&drag){drag=false;if(p.x>720){if(sides.every(v=>v>=.55&&v<1.3))a.win();else{a.tell('両面を 黄色にしよう');p={x:430,y:300};}}else{side=1-side;p={x:430,y:300};}}if(k==='cancel'){drag=false;p={x:430,y:300};}},step(dt){if(!drag&&p.x<700){sides[side]+=dt*.13;if(sides[side]>1.3){sides=[0,0];a.miss();}}},draw(){a.box(210,170,430,290,'#596b66');a.circle(830,310,110,'#fff');a.text('お皿',830,470);a.circle(p.x,p.y,90,sides[side]<.55?'#fff0c5':sides[side]<1.05?'#e8ac4b':'#9d602c');a.text(side?'うら':'おもて',p.x,p.y,30);sides.forEach((v,i)=>{a.box(200+i*320,70,250,25,'#ddd');a.box(200+i*320,70,Math.max(1,Math.min(1,v)*250),25,v>=.55?'#dfab3f':'#f4e6b7');});a.text('タップで返す → 両面焼けたらお皿へ',500,550,25);}};
  });
  register('13','もんじゃ 土手レスキュー','ひびわれを ふさごう','丸い土手のひびをタップして修理しよう。汁がたまるまで守って！','🥘',a=>{
    let gaps=new Set([0,3]),timer=0,filled=0;const points=Array.from({length:8},(_,i)=>({x:500+Math.cos(i*Math.PI/4)*190,y:290+Math.sin(i*Math.PI/4)*150}));
    return {input(k,p){if(k==='down'){const i=points.findIndex(q=>dist(p,q)<70);if(i>=0)gaps.delete(i);}},step(dt){timer+=dt;if(timer>2.2){timer=0;gaps.add(Math.floor(random(0,8)));}if(gaps.size===0)filled+=dt;if(filled>5)a.win();},draw(){a.circle(500,290,160,'#e9ce87');points.forEach((p,i)=>{a.circle(p.x,p.y,45,gaps.has(i)?'#f3f1df':'#ae7e48');if(gaps.has(i))a.text('！',p.x,p.y,45,'#d94c3d');});a.text(`${Math.floor(filled)} / 5`,500,290,48);a.text('汁がもれないよう ひびをおして修理！',500,540,26);}};
  });
  register('14','しらす 群れの道案内','影で 群れを あみへ！','指の影からしらすが逃げるよ。左からそっと追って右の網へ。','🐟',a=>{
    const fish=Array.from({length:8},()=>({x:random(220,420),y:random(160,440)}));
    return {step(dt,p){for(const f of fish){if(p.down&&dist(f,p)<230){const d=Math.max(1,dist(f,p));f.x=clamp(f.x+(f.x-p.x)/d*dt*100,40,930);f.y=clamp(f.y+(f.y-p.y)/d*dt*100,110,470);}if(f.x>810)f.x=860;}if(fish.every(f=>f.x>810))a.win();},draw(){a.box(0,0,1000,600,'#d5eef4');a.box(810,90,150,400,'#89c7c5');a.text('あみ',885,70);fish.forEach(f=>a.icon('🐟',f.x,f.y,45));a.text('群れの左がわを おしてみよう →',500,550,26);}};
  });
  register('15','おにぎり にぎにぎ工房','お米をよせて 海苔を巻こう','散らばるご飯を真ん中へ寄せよう。集まったら下の海苔を重ねて！','🍙',a=>{
    const grains=Array.from({length:12},()=>({x:random(130,870),y:random(140,400)}));let nori={x:160,y:490},drag=false;
    return {input(k,p){if(k==='down'&&dist(p,nori)<80)drag=true;if(k==='move'&&p.down){if(drag)nori={x:p.x,y:p.y};else for(const g of grains)if(dist(g,p)<85){g.x+=(500-g.x)*.35;g.y+=(280-g.y)*.35;}}if(k==='up'){drag=false;if(grains.every(g=>dist(g,{x:500,y:280})<125)&&dist(nori,{x:500,y:280})<110)a.win();}if(k==='cancel')drag=false;},draw(){a.target(500,280,125);grains.forEach(g=>a.circle(g.x,g.y,26,'#fff'));a.box(nori.x-50,nori.y-35,100,70,'#315d45');a.text('お米を真ん中へ → 海苔を重ねよう',500,555,26);}};
  });
  register('16','ほたるいか 消える光','光った場所を おぼえてタップ！','一瞬だけ光るほたるいかを見つけよう。暗くなっても、いた場所を覚えてタップ！','✨',a=>{
    const spots=Array.from({length:6},(_,i)=>({x:220+(i%3)*280,y:190+Math.floor(i/3)*210}));let target=Math.floor(random(0,6)),age=0,caught=0;
    const next=()=>{let n;do n=Math.floor(random(0,6));while(n===target);target=n;age=0;};
    return {input(k,p){if(k!=='down'||age<.35)return;const picked=spots.findIndex(s=>dist(s,p)<85);if(picked===target){caught++;a.tell('みつけた！');if(caught>=4)a.win(spots[target].x,spots[target].y);else next();}else if(picked>=0){a.miss();a.tell('光った場所は どこかな？');}},step(dt){age+=dt;if(age>2.1)next();},draw(){a.box(0,0,1000,600,'#173754');spots.forEach((s,i)=>{a.circle(s.x,s.y,72,'#244d68');a.text('？',s.x,s.y,42,'#6e91a4');if(i===target&&age<.8){a.circle(s.x,s.y,78,'#d8f5c1');a.icon('🦑',s.x,s.y,82);}});a.text(`発見 ${caught} / 4`,500,65,34,'#fff');a.text(age<.8?'光った！ よく見て！':'消えた場所を タップ！',500,550,29,'#fff');}};
  });
  register('17','金ぱく そっと着地','そっと 器へ おろそう','金箔をゆっくり運ぼう。速く動かすとしわになるよ。右の器へ置いてね。','✨',a=>{
    let foil={x:180,y:220},held=false,crease=0;
    return {input(k,p,prev){if(k==='down'&&dist(p,foil)<100)held=true;if(k==='move'&&held){crease=clamp(crease+(dist(p,prev)>60?.12:-.03),0,1);foil={x:p.x,y:p.y};}if(k==='up'){held=false;if(dist(foil,{x:780,y:330})<100&&crease<.8)a.win();else if(crease>=.8){crease=0;foil={x:180,y:220};a.tell('ゆっくり もういちど');}}if(k==='cancel')held=false;},draw(){a.circle(780,330,120,'#466f83');a.target(780,330,90);a.box(foil.x-65,foil.y-55,130,110,'#efd060');a.text(crease>.6?'ゆっくり！':'そーっと',foil.x,foil.y-90,26);a.text('金ぱくを つかんで 右の器へ',500,540);}};
  });
  register('18','化石 ごしごし研究所','土をこすって 骨をつなごう','こすった場所だけ土がとれるよ。骨が見えたら真ん中の骨格へ運ぼう。','🦴',a=>{
    const bones=[{x:190,y:200},{x:500,y:350},{x:790,y:210}],dust=new Set(Array.from({length:200},(_,i)=>i));let carried=-1,placed=0;
    return {input(k,p){if(k==='down')carried=bones.findIndex(b=>!b.done&&dist(b,p)<65&&!dust.has(Math.floor(b.y/40)*20+Math.floor(b.x/50)));if(k==='move'&&p.down){if(carried>=0){bones[carried].x=p.x;bones[carried].y=p.y;}else for(const i of [...dust])if(dist({x:(i%20)*50+25,y:Math.floor(i/20)*40+20},p)<80)dust.delete(i);}if(k==='up'&&carried>=0){if(p.y>450){bones[carried].done=true;placed++;if(placed===3)a.win();}carried=-1;}if(k==='cancel')carried=-1;},draw(){a.box(0,0,1000,600,'#e9d9b1');bones.filter(b=>!b.done).forEach(b=>a.icon('🦴',b.x,b.y,75));dust.forEach(i=>a.box((i%20)*50,Math.floor(i/20)*40,50,40,'#b98a58'));a.box(250,450,500,90,'#fff7d8');a.text(`骨格へ はこぶ　${placed} / 3`,500,495);}};
  });
  register('19','ぶどう おひさま回転台','枝をまわして 日をあてよう','枝を指で回そう。上の光に近いぶどうが熟れるよ。全部紫にしよう。','🍇',a=>{
    let angle=0;const ripe=[0,0,0,0];
    return {input(k,p){if(k==='move'&&p.down)angle=Math.atan2(p.y-300,p.x-500);},step(dt){for(let i=0;i<4;i++){const t=angle+i*Math.PI/2;if(Math.sin(t)<-.6)ripe[i]+=dt;}if(ripe.every(v=>v>1.4))a.win();},draw(){a.icon('☀',500,70,70);for(let i=0;i<4;i++){const t=angle+i*Math.PI/2,x=500+Math.cos(t)*180,y=300+Math.sin(t)*160;a.line([{x:500,y:300},{x,y}],'#627745');a.circle(x,y,50,ripe[i]>1.4?'#9760ad':'#a0bd72');}a.text('光の下で じっくり熟そう',500,550);}};
  });
  register('20','山道 りんご橋づくり','橋をのばして 谷をわたろう','押して橋を伸ばし、向こう岸の黄色いところで離そう。','🌉',a=>{
    const width=random(220,430);let length=0,held=false,car=160,rolling=false;
    return {input(k){if(k==='down'&&!rolling){held=true;length=0;}if(k==='up'&&held){held=false;if(Math.abs(length-width)<45)rolling=true;else{length=0;a.miss();}}if(k==='cancel')held=false;},step(dt){if(held)length=Math.min(600,length+dt*120);if(rolling){car+=dt*160;if(car>300+width)a.win();}},draw(){a.box(0,320,300,220,'#97b67a');a.box(300+width,320,700-width,220,'#97b67a');a.box(280+width,300,45,30,'#ffdc5b');a.box(300,300,Math.max(1,length),20,'#aa7d51');a.icon('🛒',car,270,65);a.text('押すと橋がのびる → 黄色で離す',500,570,26);}};
  });
  register('21','鵜の 川もぐり','魚をとって 水面へもどろう','指で鵜を潜らせよう。魚をとったら上の水面へ戻って息つぎ！','🐦',a=>{
    let bird={x:150,y:100},fish={x:random(500,850),y:random(300,430)},has=false,air=10;
    return {input(k,p){if(k==='move'&&p.down){bird={x:p.x,y:p.y};if(dist(bird,fish)<65)has=true;if(has&&bird.y<140)a.win();}},step(dt){if(bird.y>140)air-=dt;else air=10;if(air<=0){bird={x:150,y:100};air=10;has=false;a.tell('水面で 息つぎしよう');}},draw(){a.box(0,140,1000,400,'#a0dbe8');a.icon('🐦',bird.x,bird.y,75);if(!has)a.icon('🐟',fish.x,fish.y,65);a.text(`息 ${Math.ceil(air)}　魚をとって ↑ もどる`,500,555,26);}};
  });
  register('22','お茶の 新芽つみ','葉の先を つまんで引こう','明るい新芽を上へ引こう。根元ではなく、小さい先端の葉を選んでね。','🌱',a=>{
    const buds=Array.from({length:5},(_,i)=>({x:150+i*175,y:random(180,300),done:false}));let selected=-1,from=0;
    return {input(k,p){if(k==='down'){selected=buds.findIndex(b=>!b.done&&dist(b,p)<55);from=p.y;}if(k==='move'&&p.down&&selected>=0&&from-p.y>65){buds[selected].done=true;selected=-1;if(buds.every(b=>b.done))a.win();}if(k==='up'||k==='cancel')selected=-1;},draw(){buds.forEach(b=>{a.line([{x:b.x,y:470},{x:b.x,y:b.y}],'#589356',15);a.icon('🌿',b.x,370,85);if(!b.done)a.icon('🌱',b.x,b.y,60);});a.text('小さい新芽を つまんで ↑ 引く',500,540);}};
  });
  register('23','しゃちほこ 屋根の水鉄砲','火をねらって はなせ！','火を指でねらい、はなして水玉を発射！ 動く火を３つ消そう。','💦',a=>{
    let aim={x:815,y:300},held=false,shots=[],cleared=0,t=0;const fires=Array.from({length:3},(_,i)=>({x:650+i*120,y:160+i*120,phase:random(0,6),out:false}));
    return {input(k,p){if(k==='down')held=true;if(held)aim={x:clamp(p.x,350,950),y:clamp(p.y,80,480)};if(k==='up'&&held){held=false;const angle=Math.atan2(aim.y-320,aim.x-165);shots.push({x:165,y:320,vx:Math.cos(angle)*950,vy:Math.sin(angle)*950});}if(k==='cancel')held=false;},
      step(dt){t+=dt;for(const s of shots){s.x+=s.vx*dt;s.y+=s.vy*dt;for(const f of fires){const fy=f.y+Math.sin(t*1.3+f.phase)*(12+a.phase*10);if(!f.out&&dist(s,{x:f.x,y:fy})<53){f.out=true;s.x=1100;cleared++;a.tell('ジュッ！ 消えた！');if(cleared===3)a.win(f.x,fy);break;}}}shots=shots.filter(s=>s.x<1050&&s.y>0&&s.y<600);},
      draw(){a.box(0,0,1000,600,'#dcecf3');a.box(575,145,390,355,'#eee1bf');for(let i=0;i<3;i++)a.line([{x:550,y:220+i*115},{x:780,y:135+i*115},{x:970,y:220+i*115}],'#467775',19);
        if(a.mascot)a.mascot(140,350,200);else a.icon('🐟',130,345,110);a.text(`消火 ${cleared} / 3`,500,55,32);for(const f of fires){const fy=f.y+Math.sin(t*1.3+f.phase)*(12+a.phase*10);a.icon(f.out?'✨':'🔥',f.x,fy,f.out?45:75+Math.sin(t*8)*5);}
        if(held){a.line([{x:165,y:320},aim],'#8dbdc7',3);a.target(aim.x,aim.y,28);}for(const s of shots){a.line([{x:s.x-s.vx*.025,y:s.y-s.vy*.025},s],'#62bfdc',14);a.circle(s.x,s.y,12,'#f4ffff');}a.text('火をねらう → はなして発射！',500,550,29);}};
  });
  register('24','真珠 ぱかっと探検','貝がひらいたら 真珠をとろう','開いた貝の真珠をつかみ、上へ引こう。閉じる前に取り出してね。','🦪',a=>{
    let held=false,pearl={x:500,y:310};const offset=random(0,2);const open=()=>Math.sin(a.time*1.1+offset)>.05;
    return {input(k,p){if(k==='down'&&open()&&dist(p,pearl)<70)held=true;if(k==='move'&&held){pearl={x:p.x,y:p.y};if(pearl.y<150)a.win();}if(k==='up'||k==='cancel'){held=false;pearl={x:500,y:310};}},step(){if(held&&!open()){held=false;pearl={x:500,y:310};a.tell('貝がひらいたら もう一度');}},draw(){a.icon('🦪',500,340,230);if(open()){a.circle(pearl.x,pearl.y,32,'#fff');a.text('いまだ！ ↑',500,100,36);}else{a.box(375,250,250,70,'#a99cba');a.text('まってね',500,100);}a.text('真珠をつかんで 上へ！',500,540);}};
  });
  register('25','びわこ 左右オール','左右をこいで ゴールへ！','左と右を交互にタップして舟を進めよう。曲がったら片方で向きを戻そう。','🚣',a=>{
    let x=500,y=460,heading=0;
    return {input(k,p){if(k==='down'){heading=clamp(heading+(p.x<500?.16:-.16),-.8,.8);x+=Math.sin(heading)*45;y-=Math.cos(heading)*28;if(y<100&&Math.abs(x-500)<200)a.win();if(x<130||x>870){x=500;y=Math.min(460,y+50);heading=0;a.tell('左右を 交互に！');}}},draw(){a.box(100,0,800,600,'#b4e0e7');a.line([{x:300,y:90},{x:700,y:90}],'#ebbc4f',12);a.icon('🚣',x,y,90);a.text('左をおす　　　　右をおす',500,550,30);}};
  });
  register('26','扇で さくらジャグリング','花びらの下を タップ！','落ちる花びらの下をタップして風を送ろう。光る輪へ３回届けよう！','🪭',a=>{
    let petal={x:500,y:360,vx:0,vy:0},fan=500,gust=0,caught=0;let goal={x:random(250,750),y:145};
    return {input(k,p){if(k!=='down')return;fan=clamp(p.x,100,900);gust=.4;if(Math.abs(petal.x-fan)<220){petal.vy=-340;petal.vx=clamp((petal.x-fan)*2,-260,260);}else a.tell('花びらの下に 風を送ろう');},
      step(dt){gust=Math.max(0,gust-dt);petal.vy+=260*dt;petal.x=clamp(petal.x+petal.vx*dt,70,930);petal.y+=petal.vy*dt;if(petal.x<=70||petal.x>=930)petal.vx*=-.8;
        if(dist(petal,goal)<68){caught++;a.tell('ふわっ！ 輪を通った！');if(caught===3)a.win(goal.x,goal.y);goal={x:random(200,800),y:random(135,230)};petal={x:500,y:380,vx:0,vy:0};}
        if(petal.y>480){petal.y=480;petal.vy=0;petal.vx=0;}if(petal.y<55){petal.y=55;petal.vy=30;}},
      draw(){a.box(0,0,1000,600,'#f9e7e5');for(let i=0;i<6;i++)a.line([{x:80+i*170,y:110},{x:80+i*170,y:460}],'#efd2ce',3);a.text(`花の舞 ${caught} / 3`,500,55,32);a.target(goal.x,goal.y,68);a.text('ここへ',goal.x,goal.y-85,25);a.icon('🌸',petal.x,petal.y,75);
        if(gust>0)for(let i=-1;i<=1;i++)a.line([{x:fan+i*32,y:460},{x:fan+i*55,y:460-(1-gust/.4)*230}],'#83b6b3',5);a.icon('🪭',fan,490,70+gust*70);a.text('花びらの下を タップして あおごう！',500,565,27);}};
  });
  register('27','たこやき 三つの手しごと','生地 → 具 → 返す！','穴をタップして生地と具を入れよう。黄色になったら返して完成！','🐙',a=>{
    const pans=Array.from({length:4},(_,i)=>({x:300+i%2*380,y:200+Math.floor(i/2)*230,stage:0,heat:0}));let served=0;
    return {input(k,p){if(k!=='down')return;const pan=pans.find(v=>dist(v,p)<100);if(!pan)return;if(pan.stage<2)pan.stage++;else if(pan.heat>=2){served++;pan.stage=0;pan.heat=0;if(served===4)a.win();}else a.tell('黄色になるまで まとう');},step(dt){pans.forEach(p=>{if(p.stage===2)p.heat+=dt;});},draw(){a.box(140,65,720,475,'#5a625e');pans.forEach(p=>{a.circle(p.x,p.y,90,p.stage===0?'#303c38':p.stage===1?'#f2ddb0':p.heat<2?'#eacba3':'#e9a844');a.text(p.stage===0?'生地':p.stage===1?'具':p.heat<2?'焼いてる':'返す！',p.x,p.y,28,p.stage===0?'#fff':'#563e30');});a.text(`できた ${served} / 4`,500,570);}};
  });
  register('28','コウノトリ 風の道','上むきの風を えがこう','鳥の下から上へ線を描くと浮かぶよ。右の巣まで風で案内しよう。','🕊',a=>{
    let bird={x:100,y:300},vy=0;const strokes=[];
    return {input(k,p,prev){if(k==='move'&&p.down){strokes.push({x:p.x,y:p.y,life:1});if(dist(bird,p)<180&&p.y<prev.y)vy=-110;}},step(dt){bird.x+=dt*55;vy+=dt*45;bird.y+=vy*dt;strokes.forEach(s=>s.life-=dt);if(bird.x>830&&bird.y>160&&bird.y<400)a.win();if(bird.y>520||bird.y<40||bird.x>970){bird={x:100,y:300};vy=0;a.tell('鳥の下から 上へ 風をかこう');}},draw(){a.icon('🪹',880,330,100);strokes.filter(s=>s.life>0).forEach(s=>a.circle(s.x,s.y,8,'#b7dbca'));a.icon('🕊',bird.x,bird.y,85);a.text('下から上へ スーッと風をかこう',500,560,27);}};
  });
  register('29','しかの おじぎ食堂','おじぎした鹿に せんべい！','頭を下げている鹿へせんべいをドラッグ。みんなに一枚ずつ配ろう。','🦌',a=>{
    const deer=Array.from({length:3},(_,i)=>({x:220+i*280,done:false,offset:i*1.7}));let snack={x:500,y:470},held=false;
    return {input(k,p){if(k==='down'&&dist(p,snack)<70)held=true;if(k==='move'&&held)snack={x:p.x,y:p.y};if(k==='up'&&held){held=false;const d=deer.find(d=>!d.done&&dist(snack,{x:d.x,y:250})<105&&Math.sin(a.time*1.4+d.offset)>.1);if(d){d.done=true;if(deer.every(v=>v.done))a.win();}else a.tell('おじぎの ときに どうぞ');snack={x:500,y:470};}if(k==='cancel')held=false;},draw(){deer.forEach(d=>{const bow=Math.sin(a.time*1.4+d.offset)>.1;a.icon('🦌',d.x,bow?270:220,115);a.text(d.done?'ありがとう！':bow?'どうぞ！':'まってね',d.x,100,25);});a.icon('🍘',snack.x,snack.y,65);a.text('せんべいをつかんで 鹿へ',500,555);}};
  });
  register('30','みかん 出荷スイッチ','レバーで あいてる箱へ！','真ん中をタップすると分かれ道が切り替わるよ。左右の箱へ３個ずつ！','🍊',a=>{
    let branch=0,y=80,bins=[0,0];
    return {input(k){if(k==='down')branch=1-branch;},step(dt){y+=dt*120;if(y>430){bins[branch]=Math.min(3,bins[branch]+1);y=80;if(bins.every(v=>v===3))a.win();}},draw(){a.line([{x:500,y:80},{x:500,y:260},{x:branch?760:240,y:440}],'#a38252',20);const x=y<260?500:500+(branch?1:-1)*(y-260)*1.45;a.icon('🍊',x,y,60);[240,760].forEach((x,i)=>{a.box(x-100,440,200,85,'#d6b37a');a.text(`${bins[i]} / 3`,x,480);});a.text('タップで 切りかえ！',500,570);}};
  });
  register('31','砂丘 ジャンプ工房','砂をもって そりを飛ばそう','砂山を上に引いてジャンプ台を作り、左のそりをタップして出発！','🛷',a=>{
    let height=70,p={x:130,y:420},flying=false,v={x:0,y:0};const goal=random(650,850);
    return {input(k,q){if(k==='move'&&q.down&&!flying)height=clamp(450-q.y,30,220);if(k==='down'&&q.x<230&&!flying){flying=true;v={x:260,y:-height*1.7};}},step(dt){if(!flying)return;p.x+=v.x*dt;p.y+=v.y*dt;v.y+=dt*220;if(p.y>=430&&v.y>0){if(Math.abs(p.x-goal)<100)a.win();else{flying=false;p={x:130,y:420};a.tell('砂山の高さを かえてみよう');}}},draw(){a.box(0,440,1000,160,'#e6c58a');a.line([{x:170,y:440},{x:340,y:440-height},{x:440,y:440}],'#cfae70',30);a.target(goal,420,90);a.icon('🛷',p.x,p.y,70);a.text('砂山を上下 → 左のそりをタップ',500,555,26);}};
  });
  register('32','まが玉 糸とおし','穴に 糸をとおそう','赤い糸の先をつかんで、光る穴へ順番に通そう。','🧵',a=>{
    const holes=[{x:250,y:200},{x:550,y:360},{x:800,y:180}];let tip={x:100,y:450},i=0,path=[{x:100,y:450}],held=false;
    return {input(k,p){if(k==='down'&&dist(p,tip)<85)held=true;if(k==='move'&&held){tip={x:p.x,y:p.y};if(holes[i]&&dist(tip,holes[i])<38){path.push({...holes[i]});i++;if(i===3)a.win();}}if(k==='up'||k==='cancel')held=false;},draw(){holes.forEach((p,n)=>{a.circle(p.x,p.y,65,'#7ab99e');a.circle(p.x,p.y,23,'#f7f5dc');if(n===i)a.target(p.x,p.y,38);});a.line([...path,tip],'#df6460',10);a.circle(tip.x,tip.y,22,'#c83c49');a.text('赤い先をつかんで 穴へ通す',500,550);}};
  });
  register('33','もも ふんわり着地','クッションで やさしく受けよう','指のクッションを桃の下へ。受けたら下へゆっくり動かして衝撃を吸おう。','🍑',a=>{
    let y=80,v=0,caught=false,soft=0,pad=430;const x=random(260,740);
    return {step(dt,p){pad=clamp(p.y,180,490);if(!caught){v+=dt*90;y+=v*dt;if(p.down&&Math.abs(p.x-x)<100&&y>pad-50){caught=true;soft=0;}}else{y=pad-45;soft+=dt;if(soft>1.5&&pad>410)a.win();}if(y>550){y=80;v=0;a.tell('桃の下で クッションをおそう');}},draw(){a.icon('🍑',x,y,85);a.box(x-95,pad,190,40,'#dcabc8');a.line([{x:100,y:530},{x:900,y:530}],'#a5b38b',10);a.text('桃の下でおす → ゆっくり下へ',500,570,26);}};
  });
  register('34','もみじ 水門の旅','水門をひらいて 舟を通そう','赤い水門をタップして開こう。舟が通ると水が減るので次の門へ！','🍁',a=>{
    const gates=[false,false,false];let x=100;
    return {input(k,p){if(k==='down'){const i=[300,550,800].findIndex(x=>Math.abs(p.x-x)<70);if(i>=0)gates[i]=!gates[i];}},step(dt){const next=[300,550,800].findIndex(g=>g>x);if(next<0||gates[next]||[300,550,800][next]-x>35)x+=dt*85;if(x>920)a.win();},draw(){a.box(50,180,900,200,'#b0dce0');[300,550,800].forEach((g,i)=>{a.box(g-15,gates[i]?80:180,30,200,gates[i]?'#77b49b':'#d78664');a.text(gates[i]?'ひらいた':'おす',g,440,24);});a.icon('🍁',x,285,60);a.text('舟の前の 水門をひらこう',500,545);}};
  });
  register('35','ふぐ ぷくぷく水路','門にあわせて 大・小をきりかえ！','タップでふぐが大きくなるよ。大きい門と小さい門を見て、通る前に姿を切り替えよう。','🐡',a=>{
    let big=false,x=150,passed=0;let gate={x:760,big:Math.random()<.5};
    const next=()=>{x=150;gate={x:random(680,830),big:Math.random()<.5};};
    return {input(k){if(k==='down')big=!big;},step(dt){x+=dt*(125+passed*18);if(x>gate.x-15){if(big===gate.big){passed++;a.tell(gate.big?'大きく通過！':'小さく通過！');if(passed>=4)a.win(gate.x,300);else next();}else{x=150;a.miss();a.tell(gate.big?'大きくなって！':'小さくなって！');}}},draw(){a.box(0,0,1000,600,'#d6edf0');const gap=gate.big?180:90;a.box(gate.x-18,80,36,220-gap/2,'#557f88');a.box(gate.x-18,300+gap/2,36,220-gap/2,'#557f88');a.text(gate.big?'大':'小',gate.x,55,34);a.icon('🐡',x,300,big?150:76);a.text(`門 ${passed} / 4　タップで ${big?'小さく':'大きく'}`,500,550,27);}};
  });
  register('36','阿波おどり 大行列','左右の足で リズムをきざもう','下の輪に足あとが入ったら、同じ側をタップ。踊りの仲間を増やそう！','👣',a=>{
    let notes=[],spawn=0,count=0,next=0;
    return {input(k,p){if(k!=='down')return;const side=p.x<500?0:1;const n=notes.find(n=>n.side===side&&Math.abs(n.y-430)<80);if(n){notes.splice(notes.indexOf(n),1);count++;if(count>=6)a.win();}else a.tell('輪にきたら タップ！');},step(dt){spawn-=dt;if(spawn<=0){notes.push({side:next++%2,y:70});spawn=1.1;}notes.forEach(n=>n.y+=dt*170);notes=notes.filter(n=>n.y<550);},draw(){[300,700].forEach(x=>a.target(x,430,75));notes.forEach(n=>a.icon('👣',n.side?700:300,n.y,65));a.text(`踊る仲間 ${count} / 6`,500,40);a.text('左の足　　　　　　右の足',500,570);}};
  });
  register('38','みかん船 くぐれ波門','上下タップで 波門をくぐろう！','上か下をタップして船を動かそう。波のすき間を3つくぐって、みかんを港へ！','⛵',a=>{
    let boat={x:150,y:300},gateX=760,gapY=random(170,430),passed=0;
    const next=()=>{boat.x=150;gateX=random(700,850);gapY=random(160,440);};
    return {input(k,p){if(k==='down')boat.y=clamp(boat.y+(p.y<300?-95:95),105,495);},step(dt){boat.x+=dt*(135+passed*20);if(boat.x>gateX-15){if(Math.abs(boat.y-gapY)<90){passed++;a.tell('ざぶん！');if(passed>=3)a.win(gateX,gapY);else next();}else{a.miss();a.tell('波のすき間へ！');next();}}},draw(){a.box(0,0,1000,600,'#ccecf1');a.box(0,500,1000,100,'#83cad7');a.box(gateX-24,70,48,Math.max(10,gapY-90-70),'#67b5ce');a.box(gateX-24,gapY+90,48,510-(gapY+90),'#67b5ce');a.target(gateX,gapY,88);a.icon('⛵',boat.x,boat.y,105);a.text(`波門 ${passed} / 3`,500,55,34);a.text('画面の 上・下をタップ！',500,555,27);}};
  });
  register('39','かつお 糸のかけひき','引く・ゆるめるで つり上げよう','押すと引く、離すと糸がゆるむよ。赤くなったら離して切れないように！','🎣',a=>{
    let tension=.3,progress=0;
    return {step(dt,p){tension=clamp(tension+dt*(p.down?.35:-.5)+Math.sin(a.time*2)*dt*.08,0,1);if(p.down&&tension<.88)progress+=dt*.18;if(tension>=1){progress=Math.max(0,progress-.2);tension=.3;a.tell('赤くなったら はなそう！');}if(progress>=1)a.win();},draw(){const fish={x:700-progress*420,y:390-progress*150};a.icon('🎣',220,140,90);a.line([{x:250,y:160},fish],tension>.8?'#da624f':'#88a6a0',6);a.icon('🐟',fish.x,fish.y,100);a.box(200,480,600,28,'#ddd');a.box(200,480,Math.max(1,tension*600),28,tension>.8?'#da624f':'#7cb899');a.text('引く → 赤くなる前に ゆるめる',500,555,26);}};
  });
  register('40','めんたいこ 二段ジャンプ','タップで 波をとびこそう','タップでジャンプ。空中でもう一度押すと高く飛べるよ。','🌊',a=>{
    let y=410,vy=0,jumps=0,obstacle=950,passed=0;
    return {input(k){if(k==='down'&&jumps<2){vy=-290;jumps++;}},step(dt){vy+=dt*650;y+=vy*dt;if(y>=410){y=410;vy=0;jumps=0;}obstacle-=dt*190;if(obstacle<280&&obstacle>180&&y>335){obstacle=950;a.tell('波の前で ジャンプ！');}if(obstacle<80){passed++;obstacle=950;if(passed===3)a.win();}},draw(){a.box(0,450,1000,150,'#a8dadd');a.icon('🌊',obstacle,415,95);a.box(180,y-35,100,60,'#e68175');a.circle(248,y-15,6,'#36414d');a.text(`波 ${passed} / 3`,500,90);a.text('タップ！ 空中でもう一回 タップ！',500,550,25);}};
  });
  register('41','器の くるくる絵付け','光る模様が筆に来たら 上か下！','模様が右の筆に来た瞬間、同じ高さをタップ。回転がだんだん速くなるよ。','🖌',a=>{
    let angle=0,hits=0;const marks=Array.from({length:7},(_,i)=>({row:Math.random()<.5?0:1,offset:i/7*Math.PI*2,done:false}));
    const nearest=row=>marks.filter(m=>!m.done&&m.row===row).sort((m,n)=>Math.abs(Math.cos(angle+m.offset)-1)-Math.abs(Math.cos(angle+n.offset)-1))[0];
    return {input(k,p){if(k!=='down')return;const row=p.y<300?0:1,m=nearest(row);if(m&&Math.cos(angle+m.offset)>.82){m.done=true;hits++;a.tell('シュッ！');if(hits===marks.length)a.win(760,row?370:230);}else{a.miss();a.tell('光が筆に来たら！');}},step(dt){angle+=dt*(1.35+hits*.1);},draw(){a.box(220,120,560,350,'#fff');[230,370].forEach(y=>a.line([{x:245,y},{x:755,y}],'#d3e6ea',48));marks.forEach(m=>{if(m.done)return;const x=500+Math.cos(angle+m.offset)*245,y=(m.row?370:230)+Math.sin(angle+m.offset)*22;a.circle(x,y,22,Math.cos(angle+m.offset)>.82?'#ffd34f':'#4f8ba3');});a.icon('🖌',790,230,66);a.icon('🖌',790,370,66);a.text(`模様 ${hits} / ${marks.length}`,500,70,34);a.text('右で光ったら 上か下をタップ！',500,540,27);}};
  });
  register('42','カステラ おすそわけ','人数にあわせて 切り分けよう','縦にスワイプして切ろう。３人なら２本の切れ目で３つに分けるよ。','🍰',a=>{
    const people=Math.random()<.5?3:4;let cuts=[],start=null;
    return {input(k,p){if(k==='down')start={...p};if(k==='up'&&start){if(Math.abs(p.y-start.y)>130&&p.x>200&&p.x<800&&cuts.every(x=>Math.abs(x-p.x)>55)){cuts.push(p.x);if(cuts.length===people-1)a.win();}start=null;}if(k==='cancel')start=null;},draw(){a.box(200,190,600,210,'#f2d989');a.box(200,190,600,40,'#b58244');cuts.forEach(x=>a.line([{x,y:190},{x,y:400}],'#fff9e9',10));a.text(`${people}人で たべよう！`,500,100,36);a.text(`縦にスーッと切る　${cuts.length+1} / ${people} 切れ`,500,520);}};
  });
  register('43','火の国 水路づくり','石をおいて 水を道へ！','石を光るところへ動かすと、水が熱い岩へ流れるよ。全部冷やそう。','💧',a=>{
    const slots=[{x:320,y:180},{x:520,y:290},{x:750,y:390}];let i=0,stone={x:100,y:460},held=false;
    return {input(k,p){if(k==='down'&&dist(p,stone)<75)held=true;if(k==='move'&&held)stone={x:p.x,y:p.y};if(k==='up'&&held){held=false;if(slots[i]&&dist(stone,slots[i])<70){i++;if(i===3)a.win();}stone={x:100,y:460};}if(k==='cancel')held=false;},draw(){a.line([{x:150,y:70},...slots.slice(0,i)],'#71bdd5',28);slots.forEach((s,n)=>{a.circle(s.x,s.y,60,n<i?'#82bdaf':'#dc8854');if(n===i)a.target(s.x,s.y,70);});a.circle(stone.x,stone.y,45,'#89968b');a.text('石で水の向きをかえて 岩を冷やす',500,550,26);}};
  });
  register('44','温泉たまご 三色湯めぐり','光ったお湯へ 卵をはこぼう！','光る温泉を順番に見て、卵をドラッグ。熱・ぬる・冷のコースが毎回変わるよ。','🥚',a=>{
    const baths=[{x:230,color:'#ef8a65',name:'あつい'},{x:500,color:'#f2ce68',name:'ぬるい'},{x:770,color:'#7fc9dd',name:'つめたい'}];const route=Array.from({length:5},()=>Math.floor(random(0,3)));let egg={x:500,y:470},held=false,stage=0;
    return {input(k,p){if(k==='down'&&dist(p,egg)<90)held=true;if(k==='move'&&held)egg={x:p.x,y:p.y};if(k==='up'&&held){held=false;const hit=baths.findIndex(b=>dist(p,{x:b.x,y:270})<105);if(hit===route[stage]){stage++;a.tell('いい湯！');if(stage===route.length)a.win(p.x,p.y);}else if(hit>=0){a.miss();a.tell('光っているお湯へ！');}egg={x:500,y:470};}if(k==='cancel'){held=false;egg={x:500,y:470};}},draw(){a.box(0,0,1000,600,'#f4ecd8');baths.forEach((b,i)=>{a.circle(b.x,270,115,b.color);if(i===route[stage])a.target(b.x,270,125);a.text(b.name,b.x,270,25,'#173e51');});a.icon('🥚',egg.x,egg.y,90);a.text(`湯めぐり ${stage} / ${route.length}　光るお湯へ！`,500,550,27);}};
  });
  register('45','マンゴー 網の収穫','包んで くるっと ひねろう','下の網をマンゴーへ重ねよう。包んだら果実のまわりをくるっとなぞろう。','🥭',a=>{
    let net={x:250,y:450},wrapped=false,last=null,turn=0,held=false;
    return {input(k,p){if(k==='down'){held=true;last=Math.atan2(p.y-240,p.x-600);}if(k==='move'&&held){if(!wrapped){net={x:p.x,y:p.y};if(dist(net,{x:600,y:240})<80)wrapped=true;}else{const t=Math.atan2(p.y-240,p.x-600);if(last!==null){let d=t-last;while(d>Math.PI)d-=Math.PI*2;while(d< -Math.PI)d+=Math.PI*2;turn+=Math.abs(d);}last=t;if(turn>Math.PI*1.6)a.win();}}if(k==='up'||k==='cancel'){held=false;last=null;}},draw(){a.line([{x:600,y:50},{x:600,y:180}],'#729553',14);a.icon('🥭',600,250,140);if(wrapped)a.target(600,250,105);else{a.target(net.x,net.y,85);a.text('網',net.x,net.y);}a.text(wrapped?'包めた！ まわりを くるっと':'網をマンゴーへ 動かそう',500,540);}};
  });
  register('46','さつまいも 根っこ探検','根をたどって お芋をぬこう','光る根を指でたどろう。最後にお芋を上へ引くと抜けるよ。','🍠',a=>{
    const root=[{x:220,y:120},{x:390,y:250},{x:570,y:180},{x:730,y:360}];let i=0,potato={...root[3]},held=false;
    return {input(k,p){if((k==='move'&&p.down)||k==='down'){if(root[i]&&dist(p,root[i])<80)i++;if(i===4&&dist(p,potato)<90)held=true;if(held){potato={x:p.x,y:p.y};if(p.y<150)a.win();}}if(k==='up'||k==='cancel')held=false;},draw(){a.box(0,0,1000,600,'#d7b18b');a.line(root,'#af7752',20);a.line(root.slice(0,i),'#f3da9c',24);if(root[i])a.target(root[i].x,root[i].y,65);a.icon('🍠',potato.x,potato.y,100);a.text(i<4?'根を順番に たどろう':'お芋を 上へひっぱろう！',500,545);}};
  });
  register('47','沖縄 あわの海中探検','泡で息つぎ・輪を集めよう','指で泳ごう。輪を３つとって水面へ！ 泡に触れると息が戻るよ。','🤿',a=>{
    let diver={x:150,y:80},air=9;const rings=[{x:300,y:260,got:false},{x:700,y:400,got:false},{x:840,y:190,got:false}],bubbles=[{x:450,y:210},{x:630,y:330}];
    return {input(k,p){if(k==='move'&&p.down){diver={x:p.x,y:p.y};rings.forEach(r=>{if(dist(p,r)<60)r.got=true;});if(rings.every(r=>r.got)&&p.y<100)a.win();}},step(dt){if(diver.y>100)air-=dt;else air=9;if(bubbles.some(b=>dist(b,diver)<65))air=9;if(air<=0){diver={x:150,y:80};air=9;a.tell('泡にさわると 息がもどるよ');}},draw(){a.box(0,100,1000,500,'#99d8df');rings.forEach(r=>{if(!r.got)a.target(r.x,r.y,42);});bubbles.forEach(b=>a.circle(b.x,b.y,30,'#e6f8fa'));a.icon('🤿',diver.x,diver.y,65);a.text(`輪 ${rings.filter(r=>r.got).length} / 3　息 ${Math.ceil(air)}`,500,40);a.text('輪をとったら 水面へもどろう ↑',500,565,26);}};
  });
  window.QUEST_REGIONAL_GAMES={definitions,games,create};
})();
