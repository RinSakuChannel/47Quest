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
    definitions[code]={title,command,lesson,demo:icon,goal:3,time:45,acts:['まずは やってみよう！','こつを つかんできた？','あと少し！ 記録にちょうせん']};games[code]=factory;
  }
  function create(code,ctx){
    const canvas=document.createElement('canvas');canvas.className='rg-canvas';canvas.width=1000;canvas.height=600;canvas.tabIndex=0;
    canvas.setAttribute('aria-label',definitions[code].lesson);ctx.world.append(canvas);
    const c=canvas.getContext('2d');
    let pointer={x:500,y:300,down:false},previous={...pointer};let done=false,celebrate=0,interacted=false;
    const effects=[];
    const api={get phase(){return ctx.model.phase;},get time(){return ctx.model.elapsed;},
      random,clamp,dist,
      win(x=500,y=300){if(celebrate>0)return;ctx.hit();celebrate=.7;for(let i=0;i<12;i++)effects.push({x,y,vx:random(-160,160),vy:random(-250,-80),life:.7});},
      miss:ctx.miss,tell:ctx.tell,
      circle(x,y,r,color='#ffd65f'){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();},
      box(x,y,w,h,color='#fff9e4'){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,Math.min(16,w/2,h/2));c.fill();},
      line(points,color='#50776e',width=8){if(!points.length)return;c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();},
      text(s,x,y,size=28,color='#173e51'){c.fillStyle=color;c.font=`900 ${size}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(s,x,y);},
      icon(s,x,y,size=70){this.text(s,x,y,size);},
      target(x,y,r=42){c.strokeStyle='#d6a221';c.lineWidth=6;c.setLineDash([10,8]);c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();c.setLineDash([]);},
    };
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
      if(celebrate>0){api.box(300,230,400,100,'#fff6c9');api.text('できた！ ＋1',500,280,45);}
    }};
  }

  register('01','ころがせ！雪像工房','雪玉をころがして 大きくしよう','雪の山を通って雪玉を大きくし、右の雪像へはこぼう。','⛄',a=>{
    let ball={x:110,y:430},r=24;const piles=Array.from({length:6},(_,i)=>({x:220+i*85,y:random(170,420),used:false}));
    return {input(k,p){if(k==='move'&&p.down&&dist(p,ball)<130){const travel=Math.min(20,dist(p,ball));ball.x+=(p.x-ball.x)*.3;ball.y+=(p.y-ball.y)*.3;for(const snow of piles)if(!snow.used&&dist(snow,ball)<70){snow.used=true;r+=8;}}if(k==='up'&&ball.x>810&&r>=56)a.win();},
      draw(){a.box(0,0,1000,600,'#dceff5');piles.forEach(p=>{if(!p.used)a.icon('❄',p.x,p.y,75);});a.target(875,380,75);a.icon('⛄',875,270,95);a.circle(ball.x,ball.y,r,'#fff');a.text(`${Math.round(r)} / 56`,ball.x,ball.y-70,24);a.text('雪の上を ころころ → 雪像へ',500,540);}};
  });
  register('03','わんこそば 盛りつけリレー','おして そそぐ・はなして とめる','器の黄色い線までそばを注ごう。押している間だけ注げるよ。','🍜',a=>{
    let fill=0,target=random(45,75),held=false;
    return {input(k){if(k==='down')held=true;if(k==='up'){held=false;if(Math.abs(fill-target)<12)a.win();else{fill=0;a.miss();}}if(k==='cancel'){held=false;fill=0;}},step(dt){if(held)fill=Math.min(110,fill+dt*25);},draw(){a.icon('🥢',500,110,85);a.box(300,250,400,240,'#c65444');a.box(320,470-Math.min(fill,100)*2,360,Math.max(2,Math.min(fill,100)*2),'#e8cf8c');a.line([{x:290,y:470-target*2},{x:710,y:470-target*2}],'#ffd345',9);if(held)a.line([{x:500,y:150},{x:500,y:465-fill*2}],'#e8cf8c',18);a.text('おす → 黄色で はなす',500,540);}};
  });
  register('04','たなばた そよかぜ便','スワイプで かざりを とばそう','飾りを上や横へ払って、光る枝へ届けよう。風で軌道が変わるよ。','🎋',a=>{
    let p={x:180,y:420},v={x:0,y:0};const goal={x:780,y:random(150,350)};
    return {input(k,q,prev){if(k==='move'&&q.down&&dist(q,p)<160){v.x=(q.x-prev.x)*10;v.y=(q.y-prev.y)*10;}},step(dt){p.x=clamp(p.x+v.x*dt,40,960);p.y=clamp(p.y+v.y*dt,60,490);v.x*=Math.exp(-dt*1.5);v.y*=Math.exp(-dt*1.5);if(dist(p,goal)<60)a.win();},draw(){a.line([{x:820,y:500},{x:820,y:80}],'#599357',16);a.line([{x:650,y:goal.y},{x:870,y:goal.y}],'#599357');a.target(goal.x,goal.y);a.icon('🎐',p.x,p.y,90);a.text('かざりを 払って 枝へ！',500,550);}};
  });
  register('05','かまくら 建築隊','雪をつんで 屋根をつくろう','雪ブロックを光る場所へ置こう。入口をあけて灯りをともそう。','🛖',a=>{
    const slots=[{x:330,y:380},{x:670,y:380},{x:370,y:260},{x:630,y:260},{x:500,y:190}];let i=0,block={x:120,y:420},drag=false;
    return {input(k,p){if(k==='down'&&dist(p,block)<90)drag=true;if(k==='move'&&drag)block={x:p.x,y:p.y};if(k==='up'&&drag){drag=false;if(dist(block,slots[i])<85){i++;if(i===slots.length)a.win();block={x:120,y:420};}else block={x:120,y:420};}if(k==='cancel')drag=false;},draw(){a.box(0,0,1000,600,'#deebef');slots.slice(0,i).forEach(s=>a.box(s.x-70,s.y-50,140,100,'#fff'));if(slots[i])a.target(slots[i].x,slots[i].y,65);a.box(block.x-65,block.y-45,130,90,'#fff');a.icon('🕯',500,420,70);a.text('入口をのこして 雪のおうち',500,550);}};
  });
  register('06','さくらんぼ ふたごの引っ越し','２つを いっしょに 穴へ！','片方を動かすと、もう片方も軸に引かれるよ。２つとも輪に入れよう。','🍒',a=>{
    const p=[{x:200,y:340},{x:330,y:340}],goals=[{x:680,y:240},{x:810,y:300}];let held=-1;
    return {input(k,q){if(k==='down')held=p.findIndex(v=>dist(v,q)<65);if(k==='move'&&held>=0){p[held]={x:q.x,y:q.y};const other=p[1-held],d=dist(other,p[held]);if(d>150){other.x+=(p[held].x-other.x)*(d-150)/d;other.y+=(p[held].y-other.y)*(d-150)/d;}}if(k==='up'){held=-1;if(p.every((v,i)=>dist(v,goals[i])<65))a.win();}if(k==='cancel')held=-1;},draw(){goals.forEach(g=>a.target(g.x,g.y,65));a.line(p,'#6c9148',10);p.forEach((v,i)=>{a.circle(v.x,v.y,45,i?'#ef795b':'#d74755');a.text(i+1,v.x,v.y,30,'#fff');});goals.forEach((g,i)=>a.text(i+1,g.x,g.y,26));a.text('片方をつかむと もう片方もついてくる',500,540,26);}};
  });
  register('07','あかべこ 鈴ならし','左右で くびを ささえよう','頭が真ん中になるよう左右を押そう。真ん中で鈴がたまるよ。','🔔',a=>{
    let tilt=random(-.5,.5),steady=0;
    return {step(dt,p){tilt+=Math.sin(a.time*2)*dt*.35;if(p.down)tilt+=(p.x<500?-1:1)*dt*.8;tilt*=Math.exp(-dt*.12);tilt=clamp(tilt,-1,1);if(Math.abs(tilt)<.2)steady+=dt;if(steady>4)a.win();},draw(){a.box(280,270,440,170,'#d9584a');a.line([{x:500,y:310},{x:500+tilt*180,y:170}],'#ae4639',35);a.circle(500+tilt*180,170,70,'#e47759');a.icon('🔔',500+tilt*180,180,65);a.box(200,480,600,22,'#ddd');a.box(200,480,Math.max(1,steady/4*600),22,'#f5c94e');a.text('← 左をおす　　　　右をおす →',500,550);}};
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
  register('16','ほたるいか 光の追跡','光をおいかけて あみを運ぼう','光る群れを指の網で追いかけよう。消えても進んだ方向を覚えてね。','✨',a=>{
    let caught=0;const offset=random(0,6);
    const target=()=>({x:500+Math.sin(a.time*.55+offset)*270,y:290+Math.sin(a.time*.9)*120});
    return {step(dt,p){if(p.down&&dist(p,target())<100)caught+=dt;if(caught>4)a.win();},draw(){a.box(0,0,1000,600,'#203e61');const t=target();if(Math.sin(a.time*2)>-.3)a.icon('🦑',t.x,t.y,85);a.text(`${caught.toFixed(1)} / 4`,500,75,32,'#fff');a.text('光の進む方向へ 指をうごかそう',500,540,27,'#fff');}};
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
  register('23','しゃちほこ 水はね消火','反射板をかたむけて 水をあてよう','指を上下して反射板を傾けよう。水の線を右の火へ合わせて！','💦',a=>{
    let tilt=0,putOut=0;const y=random(130,430);
    return {input(k,p){if(p.down)tilt=clamp((p.y-300)/200,-1,1);},step(dt){if(Math.abs(300+tilt*230-y)<45)putOut+=dt;if(putOut>2.5)a.win();},draw(){a.icon('🐟',150,300,85);a.line([{x:190,y:300},{x:480,y:300}],'#61b7db',15);a.line([{x:450,y:250+tilt*30},{x:510,y:350-tilt*30}],'#dcae45',18);a.line([{x:480,y:300},{x:860,y:300+tilt*230}],'#61b7db',13);a.icon('🔥',860,y,80);a.text('上下にうごかして 水を火へ！',500,540);}};
  });
  register('24','真珠 ぱかっと探検','貝がひらいたら 真珠をとろう','開いた貝の真珠をつかみ、上へ引こう。閉じる前に取り出してね。','🦪',a=>{
    let held=false,pearl={x:500,y:310};const offset=random(0,2);const open=()=>Math.sin(a.time*1.1+offset)>.05;
    return {input(k,p){if(k==='down'&&open()&&dist(p,pearl)<70)held=true;if(k==='move'&&held){pearl={x:p.x,y:p.y};if(pearl.y<150)a.win();}if(k==='up'||k==='cancel'){held=false;pearl={x:500,y:310};}},step(){if(held&&!open()){held=false;pearl={x:500,y:310};a.tell('貝がひらいたら もう一度');}},draw(){a.icon('🦪',500,340,230);if(open()){a.circle(pearl.x,pearl.y,32,'#fff');a.text('いまだ！ ↑',500,100,36);}else{a.box(375,250,250,70,'#a99cba');a.text('まってね',500,100);}a.text('真珠をつかんで 上へ！',500,540);}};
  });
  register('25','びわこ 左右オール','左右をこいで ゴールへ！','左と右を交互にタップして舟を進めよう。曲がったら片方で向きを戻そう。','🚣',a=>{
    let x=500,y=460,heading=0;
    return {input(k,p){if(k==='down'){heading=clamp(heading+(p.x<500?.16:-.16),-.8,.8);x+=Math.sin(heading)*45;y-=Math.cos(heading)*28;if(y<100&&Math.abs(x-500)<200)a.win();if(x<130||x>870){x=500;y=Math.min(460,y+50);heading=0;a.tell('左右を 交互に！');}}},draw(){a.box(100,0,800,600,'#b4e0e7');a.line([{x:300,y:90},{x:700,y:90}],'#ebbc4f',12);a.icon('🚣',x,y,90);a.text('左をおす　　　　右をおす',500,550,30);}};
  });
  register('26','扇で さくらの舞台','扇をひらいて 花びらを送ろう','押す長さで風が強くなるよ。花びらを上の輪まで舞い上げよう。','🪭',a=>{
    let petal={x:500,y:430},vy=0,power=0;
    return {step(dt,p){power=clamp(power+(p.down?dt*1.5:-dt*2),0,1);vy+=(75-power*190)*dt;petal.y=clamp(petal.y+vy*dt,70,440);if(petal.y>=440)vy=0;if(petal.y<120&&Math.abs(vy)<100)a.win();},draw(){a.target(500,100,60);a.icon('🌸',petal.x,petal.y,65);a.icon('🪭',500,485,90+power*50);a.text('長くおすと 強い風！',500,560);}};
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
  register('35','ふぐ ぷくぷく水路','輪にあわせて 大きさを変えよう','押すとふくらむ、離すと縮むよ。輪の中で同じ大きさを保とう。','🐡',a=>{
    const target=random(45,90);let r=30,match=0;
    return {step(dt,p){r=clamp(r+(p.down?45:-32)*dt,25,110);if(Math.abs(r-target)<12)match+=dt;else match=Math.max(0,match-dt*.2);if(match>2.5)a.win();},draw(){a.box(0,0,1000,600,'#d6edf0');a.target(500,300,target);a.icon('🐡',500,300,r*2);a.text(`${match.toFixed(1)} / 2.5`,500,100,32);a.text('おすと ぷくっ　離すと しゅー',500,545);}};
  });
  register('36','阿波おどり 大行列','左右の足で リズムをきざもう','下の輪に足あとが入ったら、同じ側をタップ。踊りの仲間を増やそう！','👣',a=>{
    let notes=[],spawn=0,count=0,next=0;
    return {input(k,p){if(k!=='down')return;const side=p.x<500?0:1;const n=notes.find(n=>n.side===side&&Math.abs(n.y-430)<80);if(n){notes.splice(notes.indexOf(n),1);count++;if(count>=6)a.win();}else a.tell('輪にきたら タップ！');},step(dt){spawn-=dt;if(spawn<=0){notes.push({side:next++%2,y:70});spawn=1.1;}notes.forEach(n=>n.y+=dt*170);notes=notes.filter(n=>n.y<550);},draw(){[300,700].forEach(x=>a.target(x,430,75));notes.forEach(n=>a.icon('👣',n.side?700:300,n.y,65));a.text(`踊る仲間 ${count} / 6`,500,40);a.text('左の足　　　　　　右の足',500,570);}};
  });
  register('38','みかん船 波のおとどけ','逆の波で 船をささえよう','船が傾いたら反対側を押そう。みかんを落とさず港まで運ぼう。','⛵',a=>{
    let tilt=0,travel=0;const cargo=[-60,0,60];
    return {step(dt,p){tilt+=Math.sin(a.time*1.7)*dt*.5;if(p.down)tilt+=(p.x<500?-.7:.7)*dt;tilt=clamp(tilt,-1,1);if(p.down&&Math.abs(tilt)<.5)travel+=dt;if(travel>6)a.win();if(Math.abs(tilt)>.95){tilt*=.5;a.tell('傾いたら 反対をおそう');}},draw(){a.box(0,330,1000,270,'#9bd4e1');a.line([{x:280,y:350-tilt*130},{x:720,y:350+tilt*130}],'#ad784c',35);cargo.forEach(x=>a.icon('🍊',500+x,310+tilt*x*.6,55));a.text(`港まで ${Math.max(0,6-travel).toFixed(1)}`,500,100,32);a.text('← 左の波　　　　　　右の波 →',500,540,26);}};
  });
  register('39','かつお 糸のかけひき','引く・ゆるめるで つり上げよう','押すと引く、離すと糸がゆるむよ。赤くなったら離して切れないように！','🎣',a=>{
    let tension=.3,progress=0;
    return {step(dt,p){tension=clamp(tension+dt*(p.down?.35:-.5)+Math.sin(a.time*2)*dt*.08,0,1);if(p.down&&tension<.88)progress+=dt*.18;if(tension>=1){progress=Math.max(0,progress-.2);tension=.3;a.tell('赤くなったら はなそう！');}if(progress>=1)a.win();},draw(){const fish={x:700-progress*420,y:390-progress*150};a.icon('🎣',220,140,90);a.line([{x:250,y:160},fish],tension>.8?'#da624f':'#88a6a0',6);a.icon('🐟',fish.x,fish.y,100);a.box(200,480,600,28,'#ddd');a.box(200,480,Math.max(1,tension*600),28,tension>.8?'#da624f':'#7cb899');a.text('引く → 赤くなる前に ゆるめる',500,555,26);}};
  });
  register('40','めんたいこ 二段ジャンプ','タップで 波をとびこそう','タップでジャンプ。空中でもう一度押すと高く飛べるよ。','🌊',a=>{
    let y=410,vy=0,jumps=0,obstacle=950,passed=0;
    return {input(k){if(k==='down'&&jumps<2){vy=-290;jumps++;}},step(dt){vy+=dt*650;y+=vy*dt;if(y>=410){y=410;vy=0;jumps=0;}obstacle-=dt*190;if(obstacle<280&&obstacle>180&&y>335){obstacle=950;a.tell('波の前で ジャンプ！');}if(obstacle<80){passed++;obstacle=950;if(passed===3)a.win();}},draw(){a.box(0,450,1000,150,'#a8dadd');a.icon('🌊',obstacle,415,95);a.box(180,y-35,100,60,'#e68175');a.circle(248,y-15,6,'#36414d');a.text(`波 ${passed} / 3`,500,90);a.text('タップ！ 空中でもう一回 タップ！',500,550,25);}};
  });
  register('41','器の くるくる絵付け','回る器へ 筆をあてよう','押している間、器に線がつくよ。青い帯を一周描き、次の帯へ移ろう。','🖌',a=>{
    let angle=0;const painted=[new Set(),new Set()];
    return {step(dt,p){angle+=dt*1.2;if(p.down){const row=Math.abs(p.y-230)<65?0:Math.abs(p.y-370)<65?1:-1;if(row>=0)painted[row].add(Math.floor(angle%(Math.PI*2)/(Math.PI*2)*24));}if(painted.every(s=>s.size===24))a.win();},draw(){a.box(230,130,540,330,'#fff');[230,370].forEach((y,row)=>{a.line([{x:245,y},{x:755,y}],'#c7e0e8',40);painted[row].forEach(i=>a.box(245+i*21,y-20,20,40,'#48859f'));});a.icon('🖌',500+Math.sin(angle)*230,300,70);a.text('上の帯と下の帯を おして塗ろう',500,540);}};
  });
  register('42','カステラ おすそわけ','人数にあわせて 切り分けよう','縦にスワイプして切ろう。３人なら２本の切れ目で３つに分けるよ。','🍰',a=>{
    const people=Math.random()<.5?3:4;let cuts=[],start=null;
    return {input(k,p){if(k==='down')start={...p};if(k==='up'&&start){if(Math.abs(p.y-start.y)>130&&p.x>200&&p.x<800&&cuts.every(x=>Math.abs(x-p.x)>55)){cuts.push(p.x);if(cuts.length===people-1)a.win();}start=null;}if(k==='cancel')start=null;},draw(){a.box(200,190,600,210,'#f2d989');a.box(200,190,600,40,'#b58244');cuts.forEach(x=>a.line([{x,y:190},{x,y:400}],'#fff9e9',10));a.text(`${people}人で たべよう！`,500,100,36);a.text(`縦にスーッと切る　${cuts.length+1} / ${people} 切れ`,500,520);}};
  });
  register('43','火の国 水路づくり','石をおいて 水を道へ！','石を光るところへ動かすと、水が熱い岩へ流れるよ。全部冷やそう。','💧',a=>{
    const slots=[{x:320,y:180},{x:520,y:290},{x:750,y:390}];let i=0,stone={x:100,y:460},held=false;
    return {input(k,p){if(k==='down'&&dist(p,stone)<75)held=true;if(k==='move'&&held)stone={x:p.x,y:p.y};if(k==='up'&&held){held=false;if(slots[i]&&dist(stone,slots[i])<70){i++;if(i===3)a.win();}stone={x:100,y:460};}if(k==='cancel')held=false;},draw(){a.line([{x:150,y:70},...slots.slice(0,i)],'#71bdd5',28);slots.forEach((s,n)=>{a.circle(s.x,s.y,60,n<i?'#82bdaf':'#dc8854');if(n===i)a.target(s.x,s.y,70);});a.circle(stone.x,stone.y,45,'#89968b');a.text('石で水の向きをかえて 岩を冷やす',500,550,26);}};
  });
  register('44','温泉たまご 湯かげん係','お湯をまぜて ちょうどよく！','左は熱いお湯、右は冷たい水。黄色い温度に合わせて卵を温めよう。','🥚',a=>{
    let temp=.25,cooked=0;
    return {step(dt,p){if(p.down)temp+=dt*(p.x<500?.28:-.28);temp=clamp(temp-dt*.025,0,1);if(temp>.4&&temp<.7)cooked+=dt;if(cooked>5)a.win();},draw(){a.box(180,210,640,230,'#badeda');a.icon('🥚',500,310,120);a.box(200,100,600,30,'#d6dcce');a.box(440,90,180,50,'#ffe491');a.circle(200+temp*600,115,18,'#d8654a');a.text(`温まり ${cooked.toFixed(1)} / 5`,500,475);a.text('熱いお湯　　　　　　冷たい水',500,550,28);}};
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
