(function(){
  'use strict';
  // Original procedural foley. Each prefecture has its own material and gesture.
  // Layer: source, start Hz, end Hz, seconds, amplitude, delay seconds.
  const recipes={
    '01':['雪をころがす',[['noise',380,210,.18,.12,0],['noise',1700,900,.04,.06,.12]]],
    '02':['りんごがかごへ落ちる',[['sine',160,75,.10,.16,0],['noise',1200,650,.035,.08,0]]],
    '03':['そばをそそぐ',[['noise',2200,850,.22,.07,0],['sine',580,230,.07,.07,.07],['sine',460,190,.08,.06,.15]]],
    '04':['七夕の紙と風',[['noise',4000,1700,.24,.045,0],['triangle',1400,1800,.06,.025,.04]]],
    '05':['雪ブロックを積む',[['noise',430,180,.12,.14,0],['sine',100,65,.1,.10,.015]]],
    '06':['さくらんぼの軸が弾む',[['sine',290,640,.12,.085,0],['sine',560,310,.1,.07,.08]]],
    '07':['赤べこの首と鈴',[['triangle',140,90,.045,.1,0],['sine',1600,1550,.28,.055,.02],['sine',2240,2210,.18,.022,.025]]],
    '08':['メロンの網目スタンプ',[['noise',720,350,.05,.12,0],['triangle',420,280,.07,.08,.01]]],
    '09':['いちごのゴム発射',[['sine',140,920,.19,.08,0],['noise',1800,500,.12,.055,.03]]],
    '10':['だるまの木のてこ',[['triangle',190,130,.065,.13,0],['noise',550,900,.12,.045,.035]]],
    '11':['せんべいが焼けて返る',[['noise',5600,3800,.24,.045,0],['noise',1600,1000,.04,.11,.1]]],
    '12':['落花生の殻が箱に当たる',[['noise',2300,1500,.028,.11,0],['triangle',820,570,.035,.055,.032],['noise',3100,2100,.024,.07,.07]]],
    '13':['もんじゃが鉄板で煮える',[['noise',3800,1300,.3,.045,0],['sine',320,150,.06,.05,.1],['sine',410,180,.05,.045,.21]]],
    '14':['しらすの群れの水しぶき',[['noise',1400,2900,.15,.055,0],['sine',980,530,.065,.04,.09]]],
    '15':['ご飯を握る',[['noise',800,360,.09,.07,0],['sine',140,95,.075,.08,.015],['noise',2100,1000,.035,.04,.1]]],
    '16':['ほたるいかの水中発光',[['sine',1300,2100,.15,.035,0],['sine',1900,1100,.12,.03,.08]]],
    '17':['薄い金箔が揺れる',[['noise',6200,3900,.16,.023,0],['sine',2800,2700,.18,.025,.04]]],
    '18':['土をこすり骨が出る',[['noise',1200,760,.14,.12,0],['triangle',520,450,.035,.035,.08]]],
    '19':['ぶどうの枝を回す',[['noise',650,1000,.09,.05,0],['sine',370,430,.10,.075,.035]]],
    '20':['木の橋がのびる',[['triangle',220,180,.055,.07,0],['triangle',270,210,.04,.055,.08],['noise',1100,700,.03,.05,.12]]],
    '21':['鵜が水に潜る',[['noise',900,240,.2,.085,0],['sine',650,170,.1,.07,.035]]],
    '22':['茶の新芽を摘む',[['noise',5100,2700,.028,.075,0],['triangle',950,650,.035,.055,.01]]],
    '23':['しゃちほこの噴水',[['noise',1100,3500,.23,.055,0],['sine',420,900,.1,.045,.05]]],
    '24':['貝が開き真珠が鳴る',[['noise',1300,800,.055,.07,0],['sine',2200,2170,.31,.04,.04]]],
    '25':['オールで水をこぐ',[['noise',650,1700,.26,.07,0],['sine',180,95,.14,.06,.07]]],
    '26':['扇を開く',[['noise',2700,5200,.1,.045,0],['triangle',730,580,.025,.04,.035],['triangle',960,700,.025,.04,.065]]],
    '27':['たこ焼きの生地と返し',[['noise',4700,2600,.2,.055,0],['sine',280,140,.065,.065,.04],['triangle',900,620,.035,.045,.14]]],
    '28':['上昇気流と羽ばたき',[['noise',600,1800,.30,.045,0],['noise',1600,650,.10,.04,.13]]],
    '29':['鹿の足音とせんべい',[['triangle',260,150,.06,.09,0],['noise',3200,1600,.04,.07,.065]]],
    '30':['みかんの分岐レバー',[['triangle',450,270,.035,.08,0],['sine',190,100,.09,.1,.06]]],
    '31':['砂が滑る',[['noise',2100,450,.27,.09,0],['noise',3500,2300,.04,.03,.18]]],
    '32':['勾玉に糸が通る',[['sine',1700,1660,.16,.035,0],['noise',4100,3300,.10,.02,.045]]],
    '33':['柔らかい桃を受ける',[['sine',180,65,.21,.10,0],['noise',600,260,.07,.035,.04]]],
    '34':['水門が開く',[['triangle',115,80,.16,.065,0],['noise',500,2200,.30,.055,.07]]],
    '35':['ふぐが膨らむ',[['sine',180,430,.25,.08,0],['noise',400,900,.2,.025,.03]]],
    '36':['阿波おどりの足拍子',[['sine',150,68,.12,.13,0],['noise',1700,1100,.035,.06,.06]]],
    '37':['うどんの弾力とすすり',[['sine',230,580,.2,.075,0],['noise',1500,380,.19,.05,.07]]],
    '38':['みかん船が波に揺れる',[['noise',450,1200,.35,.06,0],['triangle',160,120,.12,.04,.13]]],
    '39':['釣り糸とリール',[['triangle',1100,1700,.045,.035,0],['triangle',1350,1900,.04,.025,.06],['noise',2600,1300,.13,.04,.09]]],
    '40':['明太子が弾む',[['sine',200,850,.12,.095,0],['sine',510,230,.1,.055,.055]]],
    '41':['磁器の筆と澄んだ響き',[['noise',3200,2900,.17,.02,0],['sine',1850,1820,.36,.04,.02],['sine',3300,3280,.22,.015,.025]]],
    '42':['カステラを切る',[['noise',1400,550,.15,.065,0],['sine',125,90,.08,.055,.08]]],
    '43':['熱い岩へ水がかかる',[['noise',5700,1900,.32,.08,0],['noise',250,120,.13,.04,.04]]],
    '44':['温泉の泡',[['sine',360,140,.1,.06,0],['sine',520,200,.085,.055,.1],['noise',1800,750,.2,.025,.04]]],
    '45':['マンゴーの網と収穫',[['noise',2800,1600,.12,.035,0],['triangle',490,250,.05,.065,.09],['sine',150,90,.09,.055,.12]]],
    '46':['土から芋を抜く',[['noise',360,1200,.18,.09,0],['sine',95,370,.095,.075,.08]]],
    '47':['海中の泡と息つぎ',[['sine',700,250,.16,.06,0],['sine',1100,420,.12,.045,.07],['noise',800,1700,.25,.03,.03]]],
  };
  const noiseBuffers=new WeakMap(),lastEvents=new WeakMap();
  function layer(context,bus,layer,at,scale=1){
    const [type,start,end,duration,volume,delay=0]=layer,t=at+delay;
    let source,filter;
    if(type==='noise'){
      let buffer=noiseBuffers.get(context);
      if(!buffer){buffer=context.createBuffer(1,context.sampleRate,context.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.7;noiseBuffers.set(context,buffer);}
      source=context.createBufferSource();source.buffer=buffer;
      filter=context.createBiquadFilter();filter.type='bandpass';filter.Q.value=.7;filter.frequency.setValueAtTime(start,t);filter.frequency.exponentialRampToValueAtTime(end,t+duration);source.connect(filter);
    }else{source=context.createOscillator();source.type=type;source.frequency.setValueAtTime(start,t);source.frequency.exponentialRampToValueAtTime(end,t+duration);}
    const envelope=context.createGain();envelope.gain.setValueAtTime(0,t);envelope.gain.linearRampToValueAtTime(volume*scale,t+Math.min(.012,duration*.2));envelope.gain.exponentialRampToValueAtTime(.0001,t+duration);
    (filter||source).connect(envelope);envelope.connect(bus);source.start(t);source.stop(t+duration+.02);
    source.onended=()=>{source.disconnect();filter?.disconnect();envelope.disconnect();};
  }
  function effect(context,bus,code,event='action'){
    const recipe=recipes[code];if(!recipe)return false;
    let last=lastEvents.get(context);if(!last){last=new Map();lastEvents.set(context,last);}
    const now=context.currentTime,key=code+':'+event,interval=event==='motion'?.18:.045;
    if(now-(last.get(key)??-100)<interval)return true;last.set(key,now);
    const scale=event==='motion'?.25:event==='wrong'?.4:event==='win'?1:.65;
    recipe[1].forEach(l=>layer(context,bus,l,now,scale));
    if(event==='good'||event==='combo'||event==='win')recipe[1].filter(l=>l[0]!=='noise').forEach(l=>layer(context,bus,[l[0],l[1]*1.5,l[2]*1.5,l[3],l[4],l[5]+.12],now,scale*.7));
    return true;
  }
  const scenes={home:{bpm:106,density:1},map:{bpm:102,density:.8},writing:{bpm:78,density:.45},game:{bpm:118,density:1},location:{bpm:94,density:.65},review:{bpm:88,density:.5},reward:{bpm:112,density:1},collection:{bpm:90,density:.65},detail:{bpm:86,density:.6}};
  const melodies={
    home:[72,76,79,null,81,79,76,null,74,76,79,76,74,null,71,null,72,76,79,84,83,81,79,null,77,76,74,71,72,null,null,null],
    map:[72,null,76,79,81,null,79,null,76,74,72,null,74,76,79,null,81,79,76,null,77,76,74,null,72,74,76,71,72,null,null,null],
    writing:[72,null,null,76,null,null,79,null,76,null,null,null,74,null,null,null,72,null,76,null,77,null,null,76,74,null,null,71,72,null,null,null],
    game:[72,79,null,76,81,null,79,76,74,79,76,null,74,71,null,67,72,null,79,84,83,81,null,79,77,76,74,null,71,72,null,79],
    reward:[72,76,79,null,84,null,83,81,79,null,76,79,81,83,84,null,84,83,81,79,77,79,76,null,74,76,79,71,72,null,null,null],
  };
  const hz=n=>440*2**((n-69)/12);
  function music(context,bus,scene,step,at){
    const profile=scenes[scene]||scenes.home,d=60/profile.bpm/2,s=step%32;
    const melody=melodies[scene]||melodies[scene==='detail'||scene==='collection'?'writing':'map'];
    const note=melody[s];
    // Eight-bar harmony, plucked keys, soft bass, and restrained brushed percussion.
    if(note!==null){layer(context,bus,['sine',hz(note),hz(note),d*1.6,.045,0],at,profile.density);layer(context,bus,['sine',hz(note)*2,hz(note)*2,d*.55,.009,0],at,profile.density);}
    const roots=[48,45,53,55,48,45,53,55],root=roots[Math.floor(step/8)%8];
    if(s%4===0)layer(context,bus,['sine',hz(root),hz(root),d*2.8,.075,0],at,profile.density);
    if(s%8===2||s%8===6){const minor=root===45;[0,minor?3:4,7].forEach((v,i)=>layer(context,bus,['triangle',hz(root+12+v),hz(root+12+v),d*1.1,.013,i*.012],at,profile.density));}
    if(profile.density>.7){if(s%4===0)layer(context,bus,['sine',105,48,.12,.055,0],at);if(s%4===2)layer(context,bus,['noise',1900,1200,.085,.025,0],at);if(s%2===1)layer(context,bus,['noise',6500,5300,.035,.012,0],at);}
  }
  window.QUEST_AUDIO={recipes,scenes,effect,music};
})();
