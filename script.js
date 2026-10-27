(function(){
const $=s=>document.querySelector(s);

/* ================= SOUND  ================= */
const Snd=(function(){
  let ctx=null,master=null,nbuf=null,muted=false,drone=null;
  try{muted=localStorage.getItem('lr_mute')==='1';}catch(e){}
  function init(){
    if(!ctx){
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return;
      ctx=new AC();
      master=ctx.createGain();master.gain.value=muted?0:.7;master.connect(ctx.destination);
      nbuf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
      const d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    }
    if(ctx.state==='suspended')ctx.resume();
  }
  function ok(){return ctx&&!muted;}
  function tone(f,d,type,v,to,delay){
    if(!ok())return;
    const t=ctx.currentTime+(delay||0),o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type||'square';o.frequency.setValueAtTime(f,t);
    if(to)o.frequency.exponentialRampToValueAtTime(to,t+d);
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(v||.2,t+.008);
    g.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(g);g.connect(master);o.start(t);o.stop(t+d+.03);
  }
  function noise(d,v,f,delay,fto,type){
    if(!ok())return;
    const t=ctx.currentTime+(delay||0),s=ctx.createBufferSource(),fl=ctx.createBiquadFilter(),g=ctx.createGain();
    s.buffer=nbuf;s.loop=true;
    fl.type=type||'bandpass';fl.frequency.setValueAtTime(f,t);fl.Q.value=1.2;
    if(fto)fl.frequency.exponentialRampToValueAtTime(fto,t+d);
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(v,t+.01);
    g.gain.exponentialRampToValueAtTime(.0001,t+d);
    s.connect(fl);fl.connect(g);g.connect(master);s.start(t);s.stop(t+d+.03);
  }
  return{
    init,
    isMuted:()=>muted,
    setMuted(m){
      muted=m;try{localStorage.setItem('lr_mute',m?'1':'0');}catch(e){}
      if(master)master.gain.value=m?0:.7;
    },
    click(){tone(660,.06,'square',.15);tone(990,.09,'square',.15,0,.06);},
    doorSlide(){noise(.9,.3,250,0,1600);tone(90,.9,'sawtooth',.08,160);},
    clang(){
      noise(.5,.55,2500,0,600);
      tone(180,.5,'square',.3,55);
      tone(1250,.35,'triangle',.22,420);
      tone(740,.3,'square',.1,300);
    },
    start(){[392,523,659].forEach((f,i)=>tone(f,.12,'square',.14,0,i*.08));},
    warn(){tone(880,.1,'square',.14);tone(880,.1,'square',.14,0,.17);},
    copStep(){tone(95,.08,'triangle',.28,50);noise(.05,.12,420,0,0,'lowpass');},
    lockTick(p){tone(1100+p*12,.035,'square',.07);},
    busted(){tone(220,.35,'sawtooth',.25,70);tone(160,.35,'square',.15,60,.02);noise(.2,.2,900,0,200);},
    unlock(){
      tone(1500,.05,'square',.18);tone(2200,.1,'square',.18,0,.06);
      noise(.06,.3,3000);
      noise(.9,.18,500,.25,180);tone(130,.9,'sawtooth',.1,60,.25);
    },
    go(){tone(440,.09,'square',.15);tone(880,.18,'square',.15,0,.1);},
    jump(){tone(280,.18,'square',.15,720);},
    land(){tone(115,.09,'triangle',.28,55);noise(.06,.12,350,0,0,'lowpass');},
    step(){tone(125+Math.random()*30,.05,'triangle',.1,70);},
    bump(){tone(130,.2,'sawtooth',.35,45);tone(70,.25,'sine',.5,30);noise(.18,.35,600,0,120);},
    siren(hi,p){
      p=p||0;const f=(hi?640:450)+p*340;
      tone(f,.2+(1-p)*.15,'sawtooth',.05+p*.06,f*.9);
      tone(f*1.414,.16,'square',.02+p*.04,0,.02);
      if(p>.6)tone(1900+p*700,.045,'square',.06+(p-.6)*.2);
    },
    heart(p){
      p=p||0;const v=Math.min(1,.8+p*.2);
      tone(64,.14,'sine',v,34);tone(128,.09,'triangle',.22+p*.15,60);noise(.09,.3+p*.2,170,0,0,'lowpass');
      const d=.16+(1-p)*.04;
      tone(58,.17,'sine',v*.85,32,d);tone(116,.08,'triangle',.18+p*.12,55,d);noise(.08,.22,150,d,0,'lowpass');
    },
    droneStart(){
      if(!ok()||drone)return;
      const t=ctx.currentTime,o1=ctx.createOscillator(),o2=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain(),lfo=ctx.createOscillator(),lg=ctx.createGain();
      o1.type='sawtooth';o2.type='sawtooth';o1.frequency.value=55;o2.frequency.value=58.5;
      f.type='lowpass';f.frequency.value=260;f.Q.value=3;
      g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.08,t+.6);
      lfo.frequency.value=3;lg.gain.value=.025;
      lfo.connect(lg);lg.connect(g.gain);o1.connect(f);o2.connect(f);f.connect(g);g.connect(master);
      o1.start(t);o2.start(t);lfo.start(t);
      drone={o1,o2,f,g,lfo,lg};
    },
    droneSet(p){
      if(!drone||!ctx)return;const t=ctx.currentTime;
      drone.o1.frequency.setTargetAtTime(55+p*65,t,.2);drone.o2.frequency.setTargetAtTime(58.5+p*70,t,.2);
      drone.f.frequency.setTargetAtTime(240+p*1500,t,.2);
      drone.g.gain.setTargetAtTime(.07+p*.13,t,.2);
      drone.lfo.frequency.setTargetAtTime(3+p*10,t,.2);drone.lg.gain.setTargetAtTime(.02+p*.05,t,.2);
    },
    droneStop(){
      if(!drone||!ctx)return;const d=drone;drone=null;
      d.g.gain.cancelScheduledValues(ctx.currentTime);d.g.gain.setTargetAtTime(.0001,ctx.currentTime,.08);
      setTimeout(()=>{try{d.o1.stop();d.o2.stop();d.lfo.stop();}catch(e){}},600);
    },
    exitOpen(){[523,659,784,1047].forEach((f,i)=>tone(f,.12,'square',.14,0,i*.09));noise(.4,.15,1200,0,300);},
    fanfare(){
      [[523,.12,0],[523,.12,.14],[523,.12,.28],[659,.2,.42],[784,.2,.64],[1047,.5,.86]]
        .forEach(n=>{tone(n[0],n[1],'square',.15,0,n[2]);tone(n[0]/2,n[1],'triangle',.12,0,n[2]);});
    },
    pop(){noise(.1,.22,1800,0,600);tone(900,.07,'square',.08,300);}
  };
})();

const sndBtn=$('#snd');
function syncSndBtn(){sndBtn.textContent=Snd.isMuted()?'OFF':'ON';sndBtn.style.opacity=Snd.isMuted()?'.65':'1';}
syncSndBtn();
sndBtn.addEventListener('click',e=>{
  e.stopPropagation();Snd.init();
  Snd.setMuted(!Snd.isMuted());syncSndBtn();
  if(!Snd.isMuted())Snd.click();
  sndBtn.blur();
});
sndBtn.addEventListener('pointerdown',e=>e.stopPropagation());

['pointerdown','keydown','touchstart'].forEach(t=>addEventListener(t,()=>Snd.init(),{passive:true}));

const PAL={d:'#1b2a6b',u:'#2f5fd0',b:'#ffd23f',s:'#f4bf94',e:'#1a1a2e',B:'#2a2a38',p:'#1b2a6b',o:'#0f0f1a',h:'#ff6fb5',H:'#ff9fd2',a:'#5b8cff',A:'#ffb866',k:'#e0600a',W:'#ff9a2e',y:'#ffd23f',Y:'#c98f00',R:'#ffffff',M:'#7a2a40',m:'#a62445',f:'#ffffff',z:'#e0a98a',U:'#6f6779',c:'#b9803f',C:'#7a4e22',w:'#8b5a2b',V:'#d2a15c',g:'#7a8095',G:'#4a4f66',L:'#aeb4cc',S:'#d8d2da',T:'#a79fae',P:'#ff4f8b',X:'#2f2c38'};
function spr(rows){
  const w=rows[0].length,h=rows.length,c=document.createElement('canvas');
  c.width=w;c.height=h;c.className='px';
  const x=c.getContext('2d');
  rows.forEach((row,j)=>{for(let i=0;i<w;i++){const ch=row[i];if(ch!=='.'&&PAL[ch]){x.fillStyle=PAL[ch];x.fillRect(i,j,1,1);}}});
  c.style.width='calc('+w+' * var(--su, var(--u)))';
  c.style.height='calc('+h+' * var(--su, var(--u)))';
  return c;
}
const COP_BODY=[
"...dddddd...","..dddddddd..","..dddbbddd..",".dddddddddd.","..ssssssss..","..sesssses..","..ssssssss..","...ssssss...",
".aauuuuuuaa.",".aauuuuuuaa.",".aauubbuuaa.",".aauuuuuuaa.",".ssBBBBBBss.",".ssppppppss.","...pppppp..."];
const COP_LEG_A=["...ppp.ppp..","...ppp.ppp..","...ppp.ppp..","..oooo.oooo."];
const COP_LEG_B=["...pppppp...","...pppppp...","...pppppp...","...oooooo..."];
const PRI_BODY=[".....hhhhhh.....","....hhHHhhhh....","...hhHHhhhhhh...","...PhhhhhhhhP...","...hhPhhhhPhh...","...hhhhssshhh...","...PseesseesP...","....sResseRs....","....ssssssUs....","....sssmmsss....","......ssss......","...AAWWWWWWAA...","...AAWWWWWWAA...","...AAWWWWWWAA...","...ssWWWWWWss...","...ssWWWWWWss..."];
const PRI_LEG_A=["....WWW..WWW....","....WWW..WWW....","...oooo..oooo..."];
const PRI_LEG_B=["......WWWW......","......WWWW......",".....oooooo....."];
const KEY=["..yyyy......",".yY..yyyyyyy",".yY..yyyyyyy","..yyyy..y.yy"];

function pair(body,a,b){return [spr(body.concat(a)),spr(body.concat(b))];}
function mountPair(parent,pr){pr[0].classList.add('on');parent.appendChild(pr[0]);parent.appendChild(pr[1]);return pr;}
const walkers=[];
function addWalker(pr){walkers.push(pr);}
let wf=0;
setInterval(()=>{wf^=1;walkers.forEach(pr=>{pr[0].classList.toggle('on',wf===0);pr[1].classList.toggle('on',wf===1);});},150);

// sprites
const copPair=pair(COP_BODY,COP_LEG_A,COP_LEG_B);mountPair($('#copIn'),copPair);addWalker(copPair);
$('#key').appendChild(spr(KEY));
//  runner
const runPair=pair(PRI_BODY,PRI_LEG_A,PRI_LEG_B);mountPair($('#runnerIn'),runPair);addWalker(runPair);

// navigation
const pages={p1:$('#p1'),p2:$('#p2'),p3:$('#p3'),p4:$('#p4')};
const fade=$('#fade');
let cur='p1';
function show(id){for(const k in pages)pages[k].classList.toggle('active',k===id);cur=id;}
function go(id,cb){fade.classList.add('on');setTimeout(()=>{show(id);cb&&cb();fade.classList.remove('on');},300);}

// game
const p2=$('#p2'),gate=$('#gate'),cop=$('#cop'),copIn=$('#copIn'),bang=$('#bang'),warnL=$('#warnL'),warnR=$('#warnR');
const fill=$('#fill'),pct=$('#pct'),statusEl=$('#status'),keyEl=$('#key');
const FILL=26,DRAIN=60,CYCLE=4000;
let state='idle',progress=0,holding=false,caught=false,cycleStart=0,raf=0,lastTs=0,vw=innerWidth,copW=100,lastMsg='';
let warnedIdx=-1,copStepAcc=0,lockAcc=0;
function measure(){vw=p2.clientWidth||innerWidth;copW=cop.getBoundingClientRect().width||100;}
addEventListener('resize',()=>{if(cur==='p2')measure();});
function setStatus(t,c){const k=t+c;if(k===lastMsg)return;lastMsg=k;statusEl.textContent=t;statusEl.className='status '+(c||'');}
function updateHud(){const p=Math.max(0,Math.min(100,progress));fill.style.width=p+'%';pct.textContent=Math.floor(p)+'%';keyEl.style.setProperty('--rot',(p*0.9)+'deg');}
function startGame(){
  progress=0;holding=false;caught=false;state='play';lastMsg='';
  warnedIdx=-1;copStepAcc=0;lockAcc=0;
  gate.classList.remove('open');p2.classList.remove('caught','holding','win');
  cop.style.visibility='hidden';
  measure();
  const now=performance.now();cycleStart=now-2400;lastTs=now;
  updateHud();setStatus('HOLD THE DOOR!','');
  Snd.start();
  cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);
}
function tick(ts){
  if(state!=='play')return;
  const dt=Math.min(.05,Math.max(0,(ts-lastTs)/1000));lastTs=ts;
  const el=ts-cycleStart,idx=Math.floor(el/CYCLE),t=el-idx*CYCLE,dir=idx%2===0?1:-1;
  let danger=false,warn=false,visible=false;
  if(t<500){warn=true;}
  else if(t<2100){
    const p=(t-500)/1600,x=dir>0?-copW+p*(vw+copW):vw-p*(vw+copW);
    cop.style.transform='translate3d('+x+'px,0,0)';visible=true;
    const mid=x+copW/2;danger=mid>0&&mid<vw;
  }
  // sfx
  if(warn&&warnedIdx!==idx){warnedIdx=idx;Snd.warn();}
  if(visible){copStepAcc+=dt;if(copStepAcc>=.2){copStepAcc=0;Snd.copStep();}}else copStepAcc=.2;

  copIn.classList.toggle('flip',dir<0);
  cop.style.visibility=visible?'visible':'hidden';
  bang.classList.toggle('on',danger);
  warnL.classList.toggle('on',warn&&dir>0);
  warnR.classList.toggle('on',warn&&dir<0);

  let isCaught=false;
  if(holding){
    if(danger){
      if(!caught){progress-=8;caught=true;Snd.busted();if(navigator.vibrate)try{navigator.vibrate(80)}catch(e){}}
      progress-=DRAIN*dt;isCaught=true;
    }else{caught=false;progress+=FILL*dt;
      lockAcc+=dt;if(lockAcc>=.16){lockAcc=0;Snd.lockTick(progress);}
    }
  }else caught=false;
  progress=Math.max(0,Math.min(100,progress));
  p2.classList.toggle('caught',isCaught);
  p2.classList.toggle('holding',holding&&!isCaught);
  if(isCaught)setStatus('BUSTED! LET GO!','bad');
  else if(danger)setStatus('COP PASSING! STAY STILL!','warn2');
  else if(warn)setStatus('COP INCOMING!','warn2');
  else if(holding)setStatus('PICKING THE LOCK...','ok');
  else setStatus('HOLD THE DOOR!','');
  updateHud();
  if(progress>=100){win();return;}
  raf=requestAnimationFrame(tick);
}
function win(){
  state='unlock';holding=false;progress=100;updateHud();
  p2.classList.remove('caught','holding');p2.classList.add('win');
  bang.classList.remove('on');warnL.classList.remove('on');warnR.classList.remove('on');
  setStatus('CLICK! UNLOCKED!','ok');
  gate.classList.add('open');
  Snd.unlock();
  if(navigator.vibrate)try{navigator.vibrate([60,40,60])}catch(e){}
  setTimeout(()=>go('p3',startRun),1500);
}
function setHold(v){
  if(state!=='play'){holding=false;return;}
  holding=v;
  if(v)Snd.tickStart&&Snd.tickStart();
  if(!v)p2.classList.remove('holding');
}
p2.addEventListener('pointerdown',e=>{e.preventDefault();setHold(true);});
addEventListener('pointerup',()=>setHold(false));
addEventListener('pointercancel',()=>setHold(false));
addEventListener('blur',()=>setHold(false));
document.addEventListener('mouseleave',()=>setHold(false));
document.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{if(cur!=='p2')return;if(e.code==='Space'||e.code==='Enter'||e.code==='ArrowDown'){e.preventDefault();if(!e.repeat)setHold(true);}});
addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Enter'||e.code==='ArrowDown')setHold(false);});

// corridor run 
const p3=$('#p3'),track=$('#track'),crun=$('#crun'),crunY=$('#crunY'),fill3=$('#fill3'),pct3=$('#pct3'),st3=$('#st3'),exitDoor=$('#exitDoor');
const corrPair=pair(PRI_BODY,PRI_LEG_A,PRI_LEG_B);mountPair($('#crunIn'),corrPair);
const CHAIR=["....ww......","....wwwwwwww","....ww......","....ww......","....ww......","....wwwwwwww","wwwwww......","wVVVVw......"];
const CRATE=["CCCCCCCCCC","CCccccccCC","CcCccccCcC","CccCccCccC","CcccCCcccC","CcccCCcccC","CccCccCccC","CcCccccCcC","CCccccccCC","CCCCCCCCCC"];
const BIN=[".GGGGGG.","GLLLLLLG",".gLgggG.",".gLgggG.",".GGGGGG.",".gLgggG.",".gLgggG.",".gLgggG.",".gLgggG.",".GGGGGG."];
const OBT={chair:{rows:CHAIR,w:12,h:8},crate:{rows:CRATE,w:10,h:10},bin:{rows:BIN,w:8,h:10}};
const OBS=[['chair',70],['crate',126],['bin',182],['chair',238],['crate',294],['bin',350],['chair',406],['crate',462],['bin',518]]
  .map(a=>({t:a[0],x:a[1],w:OBT[a[0]].w,h:OBT[a[0]].h}));
const EXIT_X=564,START_X=12,G=110,V0=59.3,SPEED=26,HW=2.5;
(function(){
  let h='';
  for(let i=0;i<35;i++)h+='<i class="lamp2" style="left:calc(var(--u)*'+(12+i*18)+')"></i>';
  for(let i=0;i<22;i++)h+='<div class="cdoor" data-n="'+String.fromCharCode(65+i%6)+(i+1)+'" style="left:calc(var(--u)*'+(22+i*24)+')"></div>';
  for(let i=0;i<60;i++)h+='<i class="arrow" style="left:calc(var(--u)*'+(10+i*10.5)+')"></i>';
  track.insertAdjacentHTML('beforeend',h);
  OBS.forEach(o=>{
    const d=document.createElement('div');d.className='obs';
    d.style.left='calc(var(--u)*'+(o.x-o.w/2)+')';
    d.appendChild(spr(OBT[o.t].rows));track.appendChild(d);
  });
})();
const coarse=matchMedia('(pointer:coarse)').matches||/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
if(coarse)p3.classList.add('touch');
p3.addEventListener('touchstart',()=>p3.classList.add('touch'),{passive:true,once:true});
let rstate='idle',px=START_X,py=0,pvx=0,pvy=0,onG=true,jumpBuf=0,coyote=0,keyL=false,keyR=false,jx=0,faceL=false,rlast=0,rt=0,blockT=0,exitT=0,uPx=16,lastMsg3='',legF=0,legsOn=false,rraf=0;
let stepAcc=0,sirenI=0,sirenFlip=0,heartI=0,shakeT=0,shakeAmp=0;
setInterval(()=>{
  if(!legsOn){corrPair[0].classList.add('on');corrPair[1].classList.remove('on');return;}
  legF^=1;corrPair[0].classList.toggle('on',legF===0);corrPair[1].classList.toggle('on',legF===1);
},110);
function setSt3(t,c){const k=t+c;if(k===lastMsg3)return;lastMsg3=k;st3.textContent=t;st3.className='status '+(c||'');}
function stopSiren(){clearTimeout(sirenI);clearTimeout(heartI);sirenI=0;heartI=0;Snd.droneStop();}
function runProg(){return Math.min(1,Math.max(0,px/EXIT_X));}
function sirenLoop(){
  if(rstate!=='run'){sirenI=0;return;}
  const p=runProg();sirenFlip^=1;Snd.siren(sirenFlip,p);
  sirenI=setTimeout(sirenLoop,440-p*270);
}
function heartLoop(){
  if(rstate!=='run'){heartI=0;return;}
  const p=runProg();Snd.heart(p);
  heartI=setTimeout(heartLoop,780-p*480);
}
function tryJump(){
  if(rstate!=='run')return;
  if(onG||coyote>0){pvy=V0;onG=false;coyote=0;jumpBuf=0;Snd.jump();}else jumpBuf=.14;
}
function measureRun(){
  const pr=document.createElement('div');pr.style.cssText='position:absolute;visibility:hidden;width:var(--u)';
  p3.appendChild(pr);uPx=pr.getBoundingClientRect().width||16;pr.remove();
}
function startRun(){
  rstate='run';px=START_X;py=0;pvx=0;pvy=0;onG=true;jumpBuf=0;jx=0;blockT=0;exitT=0;rt=0;legsOn=false;lastMsg3='';faceL=false;stepAcc=0;
  crun.style.opacity='1';crun.classList.remove('run','ouch');exitDoor.classList.remove('open');
  corrPair.forEach(c=>c.style.transform='');
  fill3.style.width='0%';pct3.textContent='0%';
  p3.classList.remove('go');void p3.offsetWidth;p3.classList.add('go');
  measureRun();
  Snd.go();
  stopSiren();sirenFlip=0;
  Snd.droneStart();sirenLoop();heartLoop();shakeT=0;p3.style.transform='';
  rlast=performance.now();cancelAnimationFrame(rraf);rraf=requestAnimationFrame(runTick);
}
function runTick(ts){
  if(rstate!=='run'&&rstate!=='exit')return;
  const dt=Math.min(.05,Math.max(0,(ts-rlast)/1000));rlast=ts;rt+=dt;
  if(rstate==='run'){
    let ax=jx;if(keyL)ax-=1;if(keyR)ax+=1;ax=Math.max(-1,Math.min(1,ax));
    pvx+=(ax*SPEED-pvx)*Math.min(1,dt*12);
    if(Math.abs(ax)<.01&&Math.abs(pvx)<.5)pvx=0;
    coyote=onG?.1:Math.max(0,coyote-dt);
    if(jumpBuf>0){jumpBuf-=dt;if(onG||coyote>0){pvy=V0;onG=false;coyote=0;jumpBuf=0;Snd.jump();}}
    const wasG=onG;
    let nx=px+pvx*dt,blocked=false;
    for(const o of OBS){
      const lim=HW+o.w/2-1;
      if(Math.abs(nx-o.x)<lim&&py<o.h-.4&&py>=o.h-2.2){py=o.h;pvy=Math.max(pvy,0);}
      else if(Math.abs(nx-o.x)<lim&&py<o.h-.4){
        nx=(px<o.x)?o.x-lim:o.x+lim;
        if(Math.abs(pvx)>2)blocked=true;
        pvx=0;
      }
    }
    px=Math.max(5,nx);
    pvy-=G*dt;py+=pvy*dt;
    let gy=0;
    for(const o of OBS){if(Math.abs(px-o.x)<HW+o.w/2-1)gy=Math.max(gy,o.h);}
    if(py<=gy&&pvy<=0){py=gy;pvy=0;onG=true;}else if(py>gy+.01)onG=false;
    if(!wasG&&onG)Snd.land();
    if(blocked){
      if(blockT<=0){
        Snd.bump();
        shakeT=.4;shakeAmp=wasG?7:14;   // getar lebih kuat kalau kena saat melompat
        if(navigator.vibrate)try{navigator.vibrate(wasG?[50]:[80,30,80])}catch(e){}
      }
      blockT=.9;
    }
    blockT=Math.max(0,blockT-dt);
    // steps
    if(onG&&Math.abs(pvx)>3){stepAcc+=dt;if(stepAcc>=.22){stepAcc=0;Snd.step();}}else stepAcc=.15;
    if(px>=EXIT_X){rstate='exit';exitT=0;pvx=0;exitDoor.classList.add('open');setSt3('ESCAPED!','ok');stopSiren();Snd.exitOpen();}
  }else{
    px+=14*dt;exitT+=dt;py=0;
    stepAcc+=dt;if(stepAcc>=.2){stepAcc=0;Snd.step();}
    crun.style.opacity=String(Math.max(0,1-exitT/.9));
  }
  if(shakeT>0){
    shakeT=Math.max(0,shakeT-dt);const a=shakeAmp*(shakeT/.4);
    p3.style.transform=shakeT>0?'translate('+((Math.random()-.5)*2*a)+'px,'+((Math.random()-.5)*2*a)+'px)':'';
  }
  if(rstate==='run')Snd.droneSet(Math.min(1,Math.max(0,px/EXIT_X)));
  const W=p3.clientWidth,trackW=640*uPx;
  const cam=Math.max(0,Math.min(trackW-W,px*uPx-W*.3));
  track.style.transform='translate3d('+(-cam)+'px,0,0)';
  crun.style.transform='translate3d('+((px-7.5)*uPx)+'px,0,0)';
  crunY.style.transform='translate3d(0,'+(-py*uPx)+'px,0)';
  if(pvx<-1)faceL=true;else if(pvx>1)faceL=false;
  corrPair.forEach(c=>c.style.transform=faceL?'scaleX(-1)':'');
  legsOn=rstate==='exit'||(onG&&Math.abs(pvx)>3);
  crun.classList.toggle('run',legsOn);
  crun.classList.toggle('ouch',blockT>.55);
  const prog=Math.min(1,px/EXIT_X);
  fill3.style.width=(prog*100)+'%';pct3.textContent=Math.floor(prog*100)+'%';
  if(rstate==='run'){
    if(blockT>0)setSt3('OUCH! JUMP OVER IT!','bad');
    else if(rt<4)setSt3(coarse?'STICK: MOVE - BUTTON: JUMP':'ARROWS/A-D MOVE - SPACE JUMP','warn2');
    else setSt3('RUN TO THE EXIT!','ok');
  }
  if(rstate==='exit'&&exitT>.9){rstate='done';stopSiren();p3.style.transform='';go('p4',startWin);return;}
  rraf=requestAnimationFrame(runTick);
}
// controls: keyboard
addEventListener('keydown',e=>{
  if(cur!=='p3')return;
  if(e.code==='ArrowLeft'||e.code==='KeyA'){keyL=true;e.preventDefault();}
  else if(e.code==='ArrowRight'||e.code==='KeyD'){keyR=true;e.preventDefault();}
  else if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW'||e.code==='Enter'){e.preventDefault();if(!e.repeat)tryJump();}
});
addEventListener('keyup',e=>{
  if(e.code==='ArrowLeft'||e.code==='KeyA')keyL=false;
  else if(e.code==='ArrowRight'||e.code==='KeyD')keyR=false;
});
addEventListener('blur',()=>{keyL=false;keyR=false;jx=0;});
// controls: touch joystick + jump button
const stick=$('#stick'),knob=$('#knob'),jumpb=$('#jumpb');
let stickId=null;
function stickMove(e){
  const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,R=r.width/2*.55;
  let dx=e.clientX-cx,dy=e.clientY-cy;const d=Math.hypot(dx,dy);
  if(d>R){dx=dx/d*R;dy=dy/d*R;}
  knob.style.transform='translate('+dx+'px,'+dy+'px)';
  const v=dx/R;jx=Math.abs(v)<.18?0:v;
}
function stickEnd(e){if(e.pointerId===stickId){stickId=null;jx=0;knob.style.transform='';}}
stick.addEventListener('pointerdown',e=>{e.preventDefault();stickId=e.pointerId;try{stick.setPointerCapture(e.pointerId)}catch(_){}stickMove(e);});
stick.addEventListener('pointermove',e=>{if(e.pointerId===stickId)stickMove(e);});
stick.addEventListener('pointerup',stickEnd);stick.addEventListener('pointercancel',stickEnd);
jumpb.addEventListener('pointerdown',e=>{e.preventDefault();tryJump();jumpb.classList.add('down');});
['pointerup','pointercancel','pointerleave'].forEach(t=>jumpb.addEventListener(t,()=>jumpb.classList.remove('down')));

function startWin(){
  state='win';
  Snd.fanfare();
  const r=$('#runner');r.style.animation='none';void r.offsetWidth;r.style.animation='';
}

let closing=false;
$('#play').addEventListener('click',()=>{
  if(closing)return;closing=true;
  Snd.init();Snd.click();
  const p1=$('#p1');p1.classList.add('closing');
  Snd.doorSlide();
  setTimeout(()=>{p1.classList.add('clang');Snd.clang();if(navigator.vibrate)try{navigator.vibrate(120)}catch(e){}},950);
  setTimeout(()=>go('p2',()=>{startGame();p1.classList.remove('closing','clang');closing=false;}),2000);
});
$('#again').addEventListener('click',()=>{Snd.init();Snd.click();go('p2',startGame);});
})();