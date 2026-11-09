import {PRICES,START,COMPACT_TO,PER_TURN,MAX_SCALE,simulate,fmtK,money,message} from '../lib/sim.js';
import {LANG,T as TEXT} from './lang.js';

var $=function(i){return document.getElementById(i)};

export function initSim(){
  var events={},sel=$('s-model'),turn=$('s-turn');
  Object.keys(PRICES).forEach(function(m){sel.add(new Option(m,m))});
  var marks=[[200000,TEXT.sim.compactMark],[250000,'250K']];
  marks.forEach(function(m){var d=document.createElement('div');d.className='mark';d.style.left=(m[0]/MAX_SCALE*100)+'%';$('s-stack').appendChild(d)});
  var bars=[[TEXT.sim.instructions,'--c1'],[TEXT.sim.schemas,'--c4'],[TEXT.sim.history,'--c3']],els=[];
  bars.forEach(function(b,i){var e=document.createElement('i');e.style.background='var('+b[1]+')';$('s-stack').insertBefore(e,$('s-stack').children[i]||null);els.push(e);
    $('s-legend').insertAdjacentHTML('beforeend','<span><b style="background:var('+b[1]+')"></b>'+b[0]+'</span>')});
  [[0,'0'],[100000,'100K'],[200000,'200K'],[250000,'250K'],[350000,'350K']].forEach(function(s,i,a){
    var e=document.createElement('span');e.textContent=s[1];e.style.left=(s[0]/MAX_SCALE*100)+'%';
    if(i===0)e.style.transform='none';if(i===a.length-1)e.style.transform='translateX(-100%)';$('s-scale').appendChild(e)});
  function render(){
    var n=+turn.value,price=PRICES[sel.value],all=simulate(50,events,price),cur=all[n-1],max=0;
    all.forEach(function(a){if(a.cost>max)max=a.cost});
    $('s-n').textContent=n;
    [START.sys,cur.tools,cur.hist].forEach(function(v,i){els[i].style.width=(v/MAX_SCALE*100)+'%'});
    $('s-ctx').textContent=fmtK(cur.ctx);$('s-cost').textContent=money(cur.cost);$('s-total').textContent=money(cur.total);
    $('s-msg').textContent=message(cur,n,LANG);
    $('s-msg').className=(cur.ev||cur.ctx>=200000)?'alert':'';
    $('s-mcp').disabled=$('s-compact').disabled=n>=50;
    if(cur.hist<=COMPACT_TO+PER_TURN)$('s-compact').disabled=true;
    $('s-spark').innerHTML=all.map(function(a,i){return '<i class="'+(a.miss?'miss ':'')+(i>=n?'off':'')+'" style="height:'+Math.max(2,a.cost/max*100)+'%"></i>'}).join('');
  }
  function act(type){var n=+turn.value+1;if(n>50)return;Object.keys(events).forEach(function(k){if(+k>=n)delete events[k]});events[n]=type;turn.value=n;render()}
  turn.oninput=render;sel.onchange=render;
  $('s-mcp').onclick=function(){act('mcp')};$('s-compact').onclick=function(){act('compact')};
  $('s-reset').onclick=function(){events={};turn.value=1;render()};
  turn.value=22;render();
}

export function initGuess(){
  var D=TEXT.guess;
  var mode='known';
  function pick(w){var r=Math.random()*100,s=0;for(var i=0;i<w.length;i++){s+=w[i][1];if(r<s)return i}return 0}
  function render(){
    var d=D[mode],i=pick(d.words);
    $('g-text').textContent=d.text;$('g-word').textContent=d.words[i][0];$('g-msg').textContent=d.msg;
    $('g-bars').innerHTML=d.words.map(function(w,k){return '<div class="bar'+(k===i?' hl':'')+'"><span>'+w[0]+'</span><div class="t"><i style="width:'+w[1]+'%"></i></div><span>'+w[1]+'%</span></div>'}).join('');
  }
  function set(m){mode=m;$('g-known').setAttribute('aria-pressed',m==='known');$('g-unknown').setAttribute('aria-pressed',m==='unknown');render()}
  $('g-known').onclick=function(){set('known')};$('g-unknown').onclick=function(){set('unknown')};$('g-go').onclick=render;
  $('g-rates').innerHTML=[['Terra',34.5],['Astra',49.8],['GPT-6.1 Sol',51.9],['Luna',79.3]].map(function(r){return '<div class="bar"><span>'+r[0]+'</span><div class="t"><i style="width:'+r[1]+'%"></i></div><span>'+r[1]+'%</span></div>'}).join('');
  render();
}

export function initPicker(){
  var T=TEXT.picker.tasks;
  var S=TEXT.picker.sizes;
  T.forEach(function(t,i){$('p-task').add(new Option(t[0],i))});
  S.forEach(function(s,i){$('p-size').add(new Option(s[0],i))});$('p-size').value=1;
  function render(){
    var t=T[+$('p-task').value],turns=S[+$('p-size').value][1],costs={},max=0;
    Object.keys(PRICES).forEach(function(m){var a=simulate(turns,{},PRICES[m]);costs[m]=a[a.length-1].total;if(costs[m]>max)max=costs[m]});
    $('p-model').textContent=t[1]+', effort '+t[2];$('p-why').textContent=t[3];$('p-claude').textContent=TEXT.picker.inClaude(t[4]);
    $('p-bars').innerHTML=Object.keys(PRICES).map(function(m){return '<div class="bar'+(m===t[1]?' hl':'')+'"><span>'+m.replace(/GPT-[\d.]+ /,'')+'</span><div class="t"><i style="width:'+(costs[m]/max*100)+'%"></i></div><span>'+money(costs[m])+'</span></div>'}).join('');
  }
  $('p-task').onchange=render;$('p-size').onchange=render;render();
}

export function initNav(){
  var root=document.documentElement,bar=$('progress');
  var links=[].slice.call(document.querySelectorAll('.toc-part a'));
  var seen={},heads=[];
  links.forEach(function(a){var id=decodeURIComponent(a.hash.slice(1)),h=$(id);if(h&&!seen[id]){seen[id]=1;heads.push(h)}});
  root.classList.add('js');
  // В песочнице и встроенном просмотре браузер игнорирует #якоря, поэтому скроллим сами
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href^="#"]');
    if(!a)return;
    var id=decodeURIComponent(a.getAttribute('href').slice(1)),h=$(id);
    if(!h)return;
    e.preventDefault();
    var box=a.closest('details');if(box)box.open=false;
    var calm=matchMedia('(prefers-reduced-motion:reduce)').matches;
    h.setAttribute('tabindex','-1');h.focus({preventScroll:true});
    h.scrollIntoView({behavior:calm?'auto':'smooth',block:'start'});
    try{history.pushState(null,'','#'+id)}catch(err){}
  });
  var ticking=false,current=null;
  function sync(){
    ticking=false;
    var max=root.scrollHeight-innerHeight,y=scrollY;
    bar.style.transform='scaleX('+(max>0?Math.min(1,y/max):0)+')';
    var line=120,now=heads[0];
    for(var i=0;i<heads.length;i++){if(heads[i].getBoundingClientRect().top<=line)now=heads[i];else break}
    if(now===current)return;
    current=now;
    links.forEach(function(a){var on=a.hash.slice(1)===encodeURIComponent(now.id)||decodeURIComponent(a.hash.slice(1))===now.id;
      if(on)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')});
    document.querySelectorAll('.toc-part').forEach(function(p){p.classList.toggle('open',!!p.querySelector('[aria-current]'))});
    var nav=document.querySelector('nav.toc'),on=nav.querySelector('[aria-current]');
    if(on){var n=nav.getBoundingClientRect(),o=on.getBoundingClientRect();
      if(o.top<n.top+60)nav.scrollTop-=n.top+60-o.top;else if(o.bottom>n.bottom-60)nav.scrollTop+=o.bottom-n.bottom+60}
  }
  function tick(){if(!ticking){ticking=true;requestAnimationFrame(sync)}}
  addEventListener('scroll',tick,{passive:true});addEventListener('resize',tick);addEventListener('load',tick);sync();
}

