(function () {
  'use strict';
  // Original creature voices: pitch gestures, syllable rhythm and vocal texture.
  // No samples or melodies from existing games are used.
  const voices = [
    ['キュルルーン',680,1.65,3,'sine'],['リンキュッ',440,1.8,2,'triangle'],['ドンガブ',155,.62,3,'sawtooth'],
    ['ヒュリリ',720,1.25,4,'sine'],['ホウポッ',220,.8,2,'triangle'],['チリチリン',820,1.45,4,'sine'],
    ['ベコォン',140,.68,2,'sawtooth'],['メロロン',300,1.2,3,'triangle'],['シュキーン',540,2.1,2,'sawtooth'],
    ['ドゥルマッ',120,1.45,3,'square'],['パリキュ',490,.75,2,'triangle'],['ポコラッ',350,1.6,3,'square'],
    ['ジュワモッ',180,1.8,2,'sawtooth'],['スイリュ',610,.65,3,'sine'],['ムスボン',160,1.2,2,'triangle'],
    ['ピリリィ',920,.7,4,'sine'],['キララオ',560,1.5,3,'triangle'],['グォルル',95,.65,3,'sawtooth'],
    ['プルリュ',410,.7,4,'sine'],['ヤッホル',330,1.7,3,'triangle'],['クワリャ',270,1.45,2,'square'],
    ['チャピピ',760,.85,3,'sine'],['シャチガウ',135,1.9,2,'sawtooth'],['パルルン',630,.72,4,'sine'],
    ['プカボゥ',205,1.5,3,'triangle'],['ヒラリィ',880,.6,3,'sine'],['タコポン',240,1.8,4,'square'],
    ['コロロウ',500,.65,2,'triangle'],['キュイホ',570,1.3,2,'sine'],['ミカポル',375,1.65,3,'triangle'],
    ['ザザルッ',150,1.55,4,'sawtooth'],['マガリュ',290,.6,3,'sine'],['モモピュ',700,1.35,2,'sine'],
    ['モミシャ',460,.7,3,'triangle'],['プクプゥ',190,1.8,3,'sine'],['ヤットリ',520,1.5,4,'square'],
    ['ウドロォ',115,1.7,3,'triangle'],['ミカプカ',320,.65,4,'sine'],['カツギャ',165,2,2,'sawtooth'],
    ['メンタボ',230,.7,3,'square'],['チリポーン',980,.55,2,'sine'],['カスポフ',280,1.4,2,'triangle'],
    ['ゴロヴァ',85,1.3,4,'sawtooth'],['プシュポ',390,1.85,2,'sine'],['マンギュ',600,.8,3,'triangle'],
    ['イモグル',130,.72,4,'square'],['コロルリ',740,.65,4,'sine'],
  ];
  let active = [];
  let spokenAudio;
  function stop() { if(spokenAudio){spokenAudio.pause();spokenAudio.removeAttribute('src');spokenAudio=null;} window.speechSynthesis?.cancel(); active.forEach(node => { try { node.stop(); } catch {} }); active = []; }
  function play(context, code, volume, destination = context.destination) {
    stop();
    const personality = window.QUEST_PERSONALITIES?.[String(code).padStart(2,'0')];
    if (personality && window.Audio && volume > 0) {
      spokenAudio = new window.Audio(`./assets/sounds/voices/${String(code).padStart(2,'0')}.wav`);
      spokenAudio.volume=Math.max(0,Math.min(1,volume));
      spokenAudio.play().catch(()=>{});
      return;
    }
    if (personality && window.speechSynthesis && window.SpeechSynthesisUtterance) {
      if (volume <= 0) return;
      const speech = new window.SpeechSynthesisUtterance(personality.line);
      speech.lang='ja-JP'; speech.rate=personality.rate; speech.pitch=personality.pitch;
      speech.volume=Math.max(0,Math.min(1,volume));
      const japanese=window.speechSynthesis.getVoices().filter(v=>/^ja(-|_)/i.test(v.lang));
      if(japanese.length) speech.voice=japanese[(Number(code)-1)%japanese.length];
      window.speechSynthesis.speak(speech);
      return;
    }
    const voice = voices[Number(code)-1];
    if (!voice || volume <= 0) return;
    const [, base, slide, syllables, wave] = voice;
    const start = context.currentTime + .015;
    for (let i=0;i<syllables;i++) {
      const when=start+i*.145, duration=i===syllables-1?.32:.14;
      const oscillator=context.createOscillator(), gain=context.createGain(), filter=context.createBiquadFilter();
      oscillator.type=wave;
      const pitch=base*(1+(i%2)*.23);
      oscillator.frequency.setValueAtTime(pitch,when);
      oscillator.frequency.exponentialRampToValueAtTime(pitch*slide,when+duration*.65);
      oscillator.frequency.exponentialRampToValueAtTime(pitch*.82,when+duration);
      filter.type='lowpass';filter.frequency.value=wave==='sine'?4200:1700;
      gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(.15*volume,when+.018);gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
      oscillator.connect(filter).connect(gain).connect(destination);
      oscillator.start(when);oscillator.stop(when+duration+.02);active.push(oscillator);
      oscillator.onended=()=>{oscillator.disconnect();filter.disconnect();gain.disconnect();active=active.filter(node=>node!==oscillator);};
    }
  }
  window.QUEST_CHARACTER_CRIES={voices,play,stop};
}());
