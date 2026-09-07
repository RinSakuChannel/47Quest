(() => {
  const key='47quest-motion';
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  let mode='auto';
  try { mode=JSON.parse(localStorage.getItem(key)) || 'auto'; } catch {}
  const originals=new WeakMap();
  const reduced=()=>mode==='calm'||(mode!=='full'&&preference.matches);
  function apply(){
    document.documentElement.dataset.motionMode=mode;
    for(const sheet of document.styleSheets){
      let rules;try{rules=sheet.cssRules;}catch{continue;}
      for(const rule of rules){
        if(!rule.media)continue;
        const original=originals.get(rule)||rule.media.mediaText;
        if(!original.includes('prefers-reduced-motion'))continue;
        originals.set(rule,original);
        rule.media.mediaText=mode==='full'?'not all':mode==='calm'?'all':original;
      }
    }
  }
  window.QUEST_MOTION={reduced,get mode(){return mode;},set(value){
    mode=['auto','full','calm'].includes(value)?value:'auto';
    try{localStorage.setItem(key,JSON.stringify(mode));}catch{}
    apply();
  }};
  preference.addEventListener('change',apply);
  apply();
})();
