// ===== HOME =====
async function home(){const n=(await DB.all('recruits')).filter(elig).length;
$('#m').innerHTML=`<h1>THE LEDGER<br><u>LEAGUE</u></h1><div class=sprs>${spr('book','fl')}${spr('coin','fl b')}${spr('trophy','fl c')}${spr('star','fl d')}</div><p class=tag2>Know your people.</p>
<p class=mu style="max-width:560px">Match ${N} recruit photos to their names. Drag a photo onto a name, or tap a photo and then a name. Fewer misses means more points: 100 first try, then 60, 30, 10.</p>
<p class=mu style="max-width:560px">Bonuses: +${CFG.COMBO_B} for every ${CFG.COMBO} matches in a row, +${CFG.PERF} for a flawless round, and up to +${CFG.SPEED.max} for speed (timer on).</p>
<div class=row><input type=text id=nm placeholder="Display name" maxlength=24 value="${esc(S.name)}" aria-label="Display name"></div>
<div class=row><label><input type=checkbox id=tm ${S.timer?'checked':''}> Timer and speed bonus</label><label><input type=checkbox id=sn ${S.sound?'checked':''}> Sound</label></div>
<div class=row>${n>=N?'<button class="btn go" data-a=start>PRESS START</button>':`<div><b>Not enough recruits yet.</b><br><span class=mu>${n} active, ${N} needed. Add recruits in <a href="#/admin">Admin</a>.</span></div>`}<a class="btn s" href="#/board" style="text-decoration:none">View leaderboard</a></div>`}
// ===== GAME =====
async function start(){const rs=(await DB.all('recruits')).filter(elig);if(rs.length<N)return toast('Need at least '+N+' active recruits');
const pick=shuf(rs).slice(0,N);G={id:uid(),names:shuf(pick),photos:shuf(pick),log:[],sel:null,flash:null,t0:0,cd:3,timer:S.timer,done:false};location.hash='#/play';if(location.hash=='#/play')route()}
function play(){if(!G||G.done)return start();draw();if(G.cd>0){if(!G.cdr){G.cdr=1;cdown()}return}iv=setInterval(tick,250)}
const tick=()=>{if(!G||!G.t0)return;const s=(performance.now()-G.t0)/1e3,e=$('#tm'),p=$('#spd'),k=CFG.SPEED;if(e)e.textContent=fmt(s);if(p)p.textContent='+'+Math.round(k.max*clamp((k.zero-s)/(k.zero-k.full),0,1))};
function cdown(){const o=document.createElement('div');o.className='cdo';document.body.append(o);let n=3;const st=()=>{if(n>0){o.innerHTML='<b>'+n+'</b>';beep(440,.1);n--;setTimeout(st,700)}else{o.innerHTML='<b class=go>GO!</b>';tune([523,659,784],70);G.cd=0;G.t0=performance.now();iv=setInterval(tick,250);setTimeout(()=>o.remove(),600)}};st()}
function popAt(sid,txt,cl){const s=document.querySelector(`[data-a=slot][data-id="${sid}"]`);if(!s)return;const r=s.getBoundingClientRect(),e=document.createElement('div');e.className='pop '+cl;e.innerHTML=(cl=='ok'?spr('coin'):'')+txt;e.style.left=(r.left+r.width/2)+'px';e.style.top=r.top+'px';document.body.append(e);setTimeout(()=>e.remove(),900)}
function banner(t){const e=document.createElement('div');e.className='bnr';e.textContent=t;document.body.append(e);setTimeout(()=>e.remove(),1100)}
function draw(){const c=calc(G.log,0,0),ok=new Set(G.log.filter(e=>e.ok).map(e=>e.r));
$('#m').innerHTML=`<div class=bar><div><b>Score</b><span>${c.total}</span></div><div><b>Matched</b><span>${c.m}/${N}</span></div><div><b>Streak</b><span>${c.st}${c.st>=3?spr('star','mini'):''}</span></div>${G.timer?'<div><b>Time</b><span id=tm>0:00</span></div><div><b>Speed</b><span id=spd>+'+CFG.SPEED.max+'</span></div>':''}</div><div class=seg>${Array.from({length:N},(_,i)=>`<i class="${i<c.m?'on':''}"></i>`).join('')}</div>
<p class=hint>${G.sel?'Now tap a name.':'Drag a photo onto a name, or tap a photo, then a name.'} Next combo bonus in ${CFG.COMBO-c.st%CFG.COMBO} ${G.timer?'· Speed bonus active':''}</p>
<div class=g><div class=sls>${G.names.map(r=>{const d=ok.has(r.id),f=G.flash&&G.flash.sid==r.id;return`<button class="sl ${d?'ok':''} ${f?'bad':''}" data-a=slot data-id="${r.id}">${d?`<img class=ph src="${r.portrait}" alt="">`:f?`<img class="ph ghost" src="${G.flash.img}" alt="">`:'<span class=ph></span>'}<span class=nm>${esc(r.name)}</span>${d?'<i class=ck>✓</i>':''}</button>`}).join('')}</div>
<div class=pool>${G.photos.filter(r=>!ok.has(r.id)).map(r=>`<button class="pc ${G.sel==r.id?'sel':''}" draggable=true data-a=pic data-id="${r.id}" aria-label="Recruit photo"><img src="${r.portrait}" alt="" loading=lazy draggable=false></button>`).join('')}</div></div>
<div class=row><button class="btn s" data-a=restart>Restart round</button></div>`}
function attempt(rid,sid){if(!G||G.done||G.cd>0||G.log.some(e=>e.ok&&(e.r==rid||e.s==sid)))return;const b=calc(G.log,0,0),ok=rid==sid;
G.log.push({r:rid,s:sid,ok,t:Math.round(performance.now()-G.t0)});G.sel=null;const a=calc(G.log,0,0);
let pop;if(ok){const cb=a.combo>b.combo;tune(cb?[523,659,784,1047]:[660,880],cb?70:90);pop=[sid,'+'+(a.base-b.base),'ok'];if(cb)setTimeout(()=>banner('COMBO x'+a.st+'  +'+CFG.COMBO_B),250);G.flash=null}else{beep(150,.25,'sawtooth');navigator.vibrate?.(60);G.flash={sid,img:G.photos.find(p=>p.id==rid).portrait};pop=[sid,'MISS','no']}
draw();popAt(...pop);if(!ok){$('#m').classList.add('shk');setTimeout(()=>$('#m')?.classList.remove('shk'),350)}if(!ok)setTimeout(()=>{G.flash=null;if(location.hash=='#/play'&&!G.done)draw()},550);
if(a.done){G.done=true;G.secs=(performance.now()-G.t0)/1e3;setTimeout(victory,700)}}
// ===== VICTORY =====
function victory(){clearInterval(iv);const c=calc(G.log,G.secs,G.timer);G.c=c;
const ach=[[c.first==N,'Perfect Match','10 first-try matches'],[G.secs<=CFG.QUICK,'Quick Fingers','Finished within '+CFG.QUICK+'s'],[c.mx>=5,'On a Roll','5 in a row'],[c.perfect>0,'Eagle Eye','Flawless round']].filter(a=>a[0]);
$('#m').innerHTML=`${spr('trophy','tro')}<p class=mu>Round complete</p><div class=rank>${rankOf(c.total)}</div><div class=big id=big>0</div>
<p>${fmt(G.secs)} · ${c.first}/${N} first try · best streak ${c.mx}</p>
<table style="max-width:420px"><tr><td>Matches</td><td class=n>${c.base}</td></tr><tr><td>Combo bonus</td><td class=n>+${c.combo}</td></tr><tr><td>Perfect round</td><td class=n>+${c.perfect}</td></tr><tr><td>Speed bonus${G.timer?'':' (timer off)'}</td><td class=n>+${c.speed}</td></tr><tr><th>Total</th><th class=n>${c.total}</th></tr></table>
<div style="margin:16px 0">${ach.map(a=>`<span class="tg ach" title="${a[2]}">${spr('star','mini')} ${a[1]}</span>`).join('')||'<span class=mu>No achievements this time.</span>'}</div>
<div class=row><input type=text id=pn placeholder="Display name" maxlength=24 value="${esc(S.name)}"><button class=btn data-a=submit id=sb>Submit score</button><button class="btn s" data-a=start>Play again</button><a class="btn s" href="#/board" style="text-decoration:none">View leaderboard</a></div>`;
tune([523,659,784,1047,784,1047],110);let t0=performance.now();(function f(t){const k=clamp((t-t0)/1200,0,1);$('#big').textContent=Math.round(c.total*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f)})(t0);
if(c.total>=800||c.perfect)for(let i=0;i<50;i++){const e=document.createElement('i');e.className='cf';e.style.cssText=`left:${Math.random()*100}%;background:${['#F07B64','#D5EF77','#253B80'][i%3]};animation-delay:${Math.random()*.6}s`;document.body.append(e);setTimeout(()=>e.remove(),3400)}}
async function submit(){const name=$('#pn').value.trim().slice(0,24);if(!name)return toast('Enter a display name');
const c=calc(G.log,G.secs,G.timer);if(!c.done||c.total!=G.c.total)return toast('Score failed validation');if(G.sub)return toast('This round was already submitted');
const b=$('#sb');b.disabled=true;S.name=name;S.pid=S.pid||uid();await DB.put('meta',{id:'player',pid:S.pid,name});
try{await DB.put('results',{id:G.id,pid:S.pid,name,score:c.total,first:c.first,wrong:c.wrong,secs:G.secs,streak:c.mx,bonus:{combo:c.combo,perfect:c.perfect,speed:c.speed},date:Date.now(),log:G.log});G.sub=1;toast('Score submitted');location.hash='#/board'}
catch(e){b.disabled=false;toast('Score not saved: '+e.message+'. Tap Submit to retry.')}}
// ===== LEADERBOARD =====
let bq='';async function board(){const rs=await DB.all('results'),P={};
for(const r of rs){const p=P[r.pid]||(P[r.pid]={pid:r.pid,name:r.name,best:0,games:0,secs:1e9,streak:0});p.games++;p.name=r.name;p.best=Math.max(p.best,r.score);p.secs=Math.min(p.secs,r.secs);p.streak=Math.max(p.streak,r.streak)}
const L=Object.values(P).sort((a,b)=>b.best-a.best||a.secs-b.secs),top=L.slice(0,3),q=bq.toLowerCase(),rest=L.slice(3).filter(p=>p.name.toLowerCase().includes(q));
const pd=(p,i)=>p?`<div class="p${i+1}">${spr(i?'coin':'trophy','mini')}<span class=mu>#${i+1}</span><b>${p.best}</b>${esc(p.name)}<br><small class=mu>${fmt(p.secs)}</small></div>`:'<div></div>';
$('#m').innerHTML=`<h2>Leaderboard</h2><p class=mu>Ranked by highest single-round score. Shared across all players.</p>
${L.length?`<div class=pod>${pd(top[1],1)}${pd(top[0],0)}${pd(top[2],2)}</div><input type=search id=bs placeholder="Search player" value="${esc(bq)}" aria-label="Search player">
<table><tr><th>#</th><th>Player</th><th class=n>Best</th><th class=n>Games</th><th class=n>Best time</th><th class=n>Streak</th></tr>${rest.map(p=>`<tr class="${p.pid==S.pid?'me':''}"><td>${L.indexOf(p)+1}</td><td>${esc(p.name)}</td><td class=n>${p.best}</td><td class=n>${p.games}</td><td class=n>${fmt(p.secs)}</td><td class=n>${p.streak}</td></tr>`).join('')}</table>`:'<p><b>No scores yet.</b> <a href="#/">Play a round</a> and submit yours.</p>'}`;
$('#bs')?.addEventListener('input',e=>{bq=e.target.value;board().then(()=>{const i=$('#bs');i.focus();i.setSelectionRange(99,99)})})}
