// 47Quest character actors are code-drawn, layered SVGs. The former raster
// cut-outs remain as source history, but are not used by the game or public build.
(function () {
  'use strict';

  const marks = ['北','林','椀','星','灯','桜','福','瓜','苺','達','焼','豆','鉄','海','米','光','金','骨','葡','山','鵜','茶','鯱','珠','湖','扇','蛸','翼','鹿','蜜','砂','玉','桃','楓','河','踊','麺','船','鰹','波','器','菓','火','湯','果','芋','珊'];
  const accents = ['#e45f57','#de7b42','#5e9e78','#4d91a7','#8e72b8','#d89a27','#cf657f','#397d85'];
  const forms = ['round','pear','bean','drop','tall','soft'];
  const ornaments = ['sprout','ears','horns','crown','fin','ribbon','antenna','crest'];
  const motionByCode = {
    '01':'weight','02':'spring','03':'spring','04':'drift','05':'weight','06':'sway','07':'weight','08':'weight','09':'spring','10':'weight',
    '11':'weight','12':'spring','13':'sway','14':'drift','15':'weight','16':'drift','17':'drift','18':'weight','19':'sway','20':'weight',
    '21':'drift','22':'sway','23':'weight','24':'drift','25':'drift','26':'sway','27':'spring','28':'drift','29':'weight','30':'spring',
    '31':'drift','32':'sway','33':'spring','34':'drift','35':'spring','36':'sway','37':'spring','38':'drift','39':'spring','40':'spring',
    '41':'weight','42':'soft','43':'weight','44':'soft','45':'sway','46':'spring','47':'drift'
  };
  const bodyPaths = {
    round:'M48 113C48 55 82 30 110 30s62 25 62 83c0 62-25 94-62 94s-62-32-62-94Z',
    pear:'M55 142C55 92 80 79 86 50c5-23 43-23 49 0 7 29 30 42 30 92 0 42-22 65-55 65s-55-23-55-65Z',
    bean:'M48 121C43 73 67 37 108 34c45-3 70 30 64 74-5 40-7 83-58 96-39 10-62-35-66-83Z',
    drop:'M110 25c11 31 56 63 56 116 0 42-23 66-56 66s-56-24-56-66c0-53 45-85 56-116Z',
    tall:'M67 178C50 139 62 54 89 31c12-10 31-10 43 0 27 23 38 108 21 147-14 34-72 34-86 0Z',
    soft:'M48 126c0-52 28-92 62-92s62 40 62 92c0 53-18 81-62 81s-62-28-62-81Z'
  };

  function shade(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    const channel = shift => Math.max(0, Math.min(255, (n >> shift & 255) + amount));
    return `#${[16,8,0].map(shift => channel(shift).toString(16).padStart(2,'0')).join('')}`;
  }

  function ornament(type, accent, deep) {
    const common = `fill="${accent}" stroke="${deep}" stroke-width="5" stroke-linejoin="round"`;
    return ({
      sprout:`<g class="actor-ornament"><path d="M108 43C91 21 68 20 63 38c17 8 31 8 45 5Z" ${common}/><path d="M112 43c13-25 37-29 46-12-12 13-28 16-46 12Z" ${common}/><path d="M110 48V27" fill="none" stroke="${deep}" stroke-width="6" stroke-linecap="round"/></g>`,
      ears:`<g class="actor-ornament"><path d="M74 59 55 13c28 3 42 18 48 39M146 59l19-46c-28 3-42 18-48 39" ${common}/></g>`,
      horns:`<g class="actor-ornament"><path d="M84 55C62 47 51 25 65 13c3 17 15 24 31 26M136 55c22-8 33-30 19-42-3 17-15 24-31 26" fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round"/></g>`,
      crown:`<g class="actor-ornament"><path d="m75 48 7-36 27 24 27-24 8 36Z" ${common}/><circle cx="82" cy="12" r="6" fill="#ffe17a"/><circle cx="109" cy="34" r="6" fill="#ffe17a"/><circle cx="136" cy="12" r="6" fill="#ffe17a"/></g>`,
      fin:`<g class="actor-ornament"><path d="M88 47c7-32 25-44 44-39l-5 43Z" ${common}/><path d="M164 112c26-14 38-1 36 17-16 1-27-4-37-11Z" ${common}/></g>`,
      ribbon:`<g class="actor-ornament"><path d="M110 43C90 22 66 25 69 47c13 10 27 8 41-4Zm0 0c20-21 44-18 41 4-13 10-27 8-41-4Z" ${common}/><circle cx="110" cy="43" r="12" fill="#ffe9ba" stroke="${deep}" stroke-width="4"/></g>`,
      antenna:`<g class="actor-ornament"><path d="M98 48C94 25 78 18 70 29M122 48c4-23 20-30 28-19" fill="none" stroke="${deep}" stroke-width="6" stroke-linecap="round"/><circle cx="68" cy="28" r="10" fill="${accent}"/><circle cx="152" cy="28" r="10" fill="${accent}"/></g>`,
      crest:`<g class="actor-ornament"><path d="M77 49c3-28 21-43 33-43 12 0 30 15 33 43-12-7-23-10-33-10s-21 3-33 10Z" ${common}/><path d="m90 31 20-18 20 18" fill="none" stroke="#fff1b6" stroke-width="6" stroke-linecap="round"/></g>`
    })[type];
  }

  function actorSvg(code, options = {}) {
    const number = Number(code);
    const pref = window.PREFECTURE_DATA?.find?.(item => item.code === code);
    const base = pref?.color || ['#8fc8ee','#79d2b0','#f4a38f','#f1b56f'][number % 4];
    const accent = accents[(number - 1) % accents.length];
    const deep = shade(base, -72);
    const light = shade(base, 38);
    const form = forms[(number - 1) % forms.length];
    const ornamentType = ornaments[(number - 1) % ornaments.length];
    const mark = marks[number - 1];
    const id = `actor-${code}-${options.instance || 'art'}`;
    const expression = options.expression || 'happy';
    return `<svg class="quest-actor-svg" viewBox="0 0 220 240" role="presentation" focusable="false" aria-hidden="true">
      <defs><linearGradient id="${id}-body" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${light}"/><stop offset=".58" stop-color="${base}"/><stop offset="1" stop-color="${shade(base,-26)}"/></linearGradient><radialGradient id="${id}-shine" cx="30%" cy="22%" r="70%"><stop stop-color="#fff" stop-opacity=".58"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      <ellipse class="actor-shadow" cx="110" cy="216" rx="58" ry="12" fill="#173e51" opacity=".18"/>
      ${ornament(ornamentType, accent, deep)}
      <g class="actor-tail"><path d="M164 139c35-12 43 12 25 28-10 9-21 6-28-1" fill="none" stroke="${deep}" stroke-width="14" stroke-linecap="round"/><path d="M187 151c8-6 17-5 21 3-5 9-14 13-23 10Z" fill="${accent}" stroke="${deep}" stroke-width="4"/></g>
      <g class="actor-arm actor-arm-left"><path d="M61 113c-28 3-36 23-29 42" fill="none" stroke="${deep}" stroke-width="19" stroke-linecap="round"/><circle cx="33" cy="157" r="11" fill="${accent}" stroke="${deep}" stroke-width="4"/></g>
      <g class="actor-arm actor-arm-right"><path d="M159 113c28 3 36 23 29 42" fill="none" stroke="${deep}" stroke-width="19" stroke-linecap="round"/><circle cx="187" cy="157" r="11" fill="${accent}" stroke="${deep}" stroke-width="4"/></g>
      <path class="actor-body" d="${bodyPaths[form]}" fill="url(#${id}-body)" stroke="${deep}" stroke-width="7"/><path d="${bodyPaths[form]}" fill="url(#${id}-shine)"/>
      <g class="actor-feet"><path d="M72 196c-13 5-18 18-8 23h34c5-11-4-21-26-23Z" fill="${deep}"/><path d="M148 196c13 5 18 18 8 23h-34c-5-11 4-21 26-23Z" fill="${deep}"/></g>
      <g class="actor-face"><g class="actor-eye actor-eye-left"><ellipse cx="87" cy="94" rx="16" ry="19" fill="#fffdf4" stroke="${deep}" stroke-width="4"/><circle class="actor-pupil" cx="90" cy="98" r="7" fill="#173e51"/><path class="actor-lid" d="M72 96q15 12 30 0" fill="none" stroke="${deep}" stroke-width="6" stroke-linecap="round"/></g><g class="actor-eye actor-eye-right"><ellipse cx="133" cy="94" rx="16" ry="19" fill="#fffdf4" stroke="${deep}" stroke-width="4"/><circle class="actor-pupil" cx="136" cy="98" r="7" fill="#173e51"/><path class="actor-lid" d="M118 96q15 12 30 0" fill="none" stroke="${deep}" stroke-width="6" stroke-linecap="round"/></g><circle cx="69" cy="121" r="11" fill="${accent}" opacity=".42"/><circle cx="151" cy="121" r="11" fill="${accent}" opacity=".42"/><path class="actor-mouth actor-mouth-neutral" d="M91 119q19 18 38 0" fill="none" stroke="${deep}" stroke-width="7" stroke-linecap="round"/><path class="actor-mouth actor-mouth-joy" d="M88 117q22 31 44 0c-7 29-37 31-44 0Z" fill="#fffdf4" stroke="${deep}" stroke-width="6" stroke-linejoin="round"/><path class="actor-mouth actor-mouth-sad" d="M91 137q19-17 38 0" fill="none" stroke="${deep}" stroke-width="7" stroke-linecap="round"/></g>
      <g class="actor-badge"><circle cx="110" cy="164" r="28" fill="#fff7d8" stroke="${accent}" stroke-width="6"/><text x="110" y="174" text-anchor="middle" font-family="system-ui,sans-serif" font-size="26" font-weight="900" fill="${deep}">${mark}</text></g><g class="actor-sparkles" fill="#fff7c4"><path d="m48 70 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z"/><path d="m173 76 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/></g>
    </svg>`;
  }

  function markup(pref, className = '', expression = 'happy') {
    const instance = `${pref.code}-${Math.random().toString(36).slice(2,8)}`;
    return `<span class="quest-actor ${className}" data-actor-code="${pref.code}" data-actor-motion="${motionByCode[pref.code] || 'sway'}" data-expression="${expression}">${actorSvg(pref.code,{instance,expression})}</span>`;
  }

  const art = {};
  for (let number = 1; number <= 47; number++) {
    const code = String(number).padStart(2, '0');
    art[code] = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(actorSvg(code,{instance:`asset-${code}`}))}`;
  }
  window.CHARACTER_ART = art;
  window.QUEST_CHARACTER_ACTORS = { markup, svg:actorSvg, motion:motionByCode };
})();
