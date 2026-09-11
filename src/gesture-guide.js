/* Brief demonstrations, never a barrier to starting the game. */
(() => {
 const types={drag:['01','02','05','06','07','12','14','15','17','21','29','32','43','44','47'],tap:['03','08','11','13','16','23','26','27','30','34','35','40','41'],up:['04','22','24','28','31','37','46'],pull:['09'],hold:['10','20','39'],scrub:['18'],circle:['19','45'],alternate:['25','36','38'],down:['33','42']};
 const labels={drag:'つかんで動かす',tap:'タイミングよく押す',up:'上へ動かす',pull:'ひいて離す',hold:'押す・離す',scrub:'こすってみよう',circle:'くるっと回す',alternate:'左右・上下を押す',down:'下へ動かす'};
 function mount(host,code){
  const type=Object.keys(types).find(t=>types[t].includes(code));if(!type)return()=>{};
  host.replaceChildren();host.classList.add('fg-gesture-guide');host.removeAttribute('aria-hidden');host.setAttribute('aria-label',labels[type]);
  const canvas=document.createElement('canvas');canvas.width=440;canvas.height=100;canvas.style.cssText='display:block;width:220px;max-width:100%;height:50px;margin:auto';host.append(canvas);
  const c=canvas.getContext('2d');let frame=0,start=performance.now(),stopped=false;
  function paint(now){if(stopped||!host.isConnected)return;const reduced=window.QUEST_MOTION?.reduced(),elapsed=(now-start)/1000,p=reduced?.5:(elapsed%2)/2,t=(1-Math.cos(p*Math.PI*2))/2;
   c.setTransform(2,0,0,2,0,0);c.clearRect(0,0,220,50);c.lineWidth=2;c.lineCap='round';c.strokeStyle='#8baeb7';c.setLineDash([3,4]);c.beginPath();let x=110,y=20;
   if(type==='circle'){c.ellipse(110,20,32,12,0,0,Math.PI*2);x=110+Math.cos(p*Math.PI*2)*32;y=20+Math.sin(p*Math.PI*2)*12;}
   else if(type==='pull'){c.moveTo(135,8);c.lineTo(85,32);x=135-t*50;y=8+t*24;}
   else if(['up','down'].includes(type)||code==='38'){c.moveTo(110,8);c.lineTo(110,32);y=type==='up'?32-t*24:8+t*24;}
   else if(['drag','scrub','alternate'].includes(type)){c.moveTo(60,20);c.lineTo(160,20);x=60+t*100;}
   c.stroke();c.setLineDash([]);const pulse=type==='tap'||type==='hold'?1+Math.sin(p*Math.PI*2)*.2:1;c.fillStyle='#fbd55e';c.beginPath();c.arc(x,y,9*pulse,0,Math.PI*2);c.fill();c.strokeStyle='#244c5e';c.lineWidth=2;c.stroke();c.fillStyle='#244c5e';c.font='bold 12px sans-serif';c.textAlign='center';c.fillText(labels[type],110,48);if(!reduced&&elapsed<6)frame=requestAnimationFrame(paint);
  }
  frame=requestAnimationFrame(paint);return()=>{stopped=true;cancelAnimationFrame(frame);};
 }
 window.QUEST_GESTURE_GUIDE={mount,types};
})();
