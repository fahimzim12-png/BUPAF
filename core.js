// ===== CONFIG (edit here) =====
const N=10,CFG={PTS:[100,60,30,10],COMBO:3,COMBO_B:30,PERF:300,SPEED:{max:100,full:60,zero:240},QUICK:90,BATCH:5,OCR_MIN:60,MAXFILE:15e6,
RANKS:[[0,'Stranger'],[400,'Acquaintance'],[800,'Forum Insider'],[1100,'Recruit Master'],[1350,'Accounting Forum Legend']]}; // max possible = 1000+90+300+100 = 1490
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID(),clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const shuf=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const sha=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');
let tt;const toast=t=>{document.querySelector('.toast')?.remove();const e=document.createElement('div');e.className='toast';e.textContent=t;document.body.append(e);clearTimeout(tt);tt=setTimeout(()=>e.remove(),2200)};
// ===== STORAGE LAYER (IndexedDB, local to this browser). Swap this object for Supabase calls to go cloud. =====
const DB=(()=>{let p;const o=()=>p||(p=new Promise((res,rej)=>{const r=indexedDB.open('ledger',1);r.onupgradeneeded=()=>['recruits','posters','staged','results','meta'].forEach(s=>r.result.createObjectStore(s,{keyPath:'id'}));r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
const tx=async(s,m,f)=>{const d=await o();return new Promise((res,rej)=>{const t=d.transaction(s,m);const q=f(t.objectStore(s));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error)})};
return{all:s=>tx(s,'readonly',o=>o.getAll()),get:(s,k)=>tx(s,'readonly',o=>o.get(k)),put:(s,v)=>tx(s,'readwrite',o=>o.put(v)),del:(s,k)=>tx(s,'readwrite',o=>o.delete(k))}})();
// ===== SCORING: pure function of the attempt log =====
function calc(log,secs,timer){const att={};let st=0,mx=0,base=0,combo=0,first=0,wrong=0,m=0;
for(const e of log){att[e.r]=(att[e.r]||0)+1;if(e.ok){const a=att[e.r];base+=CFG.PTS[a-1]??0;if(a==1)first++;m++;st++;mx=Math.max(mx,st);if(st%CFG.COMBO==0)combo+=CFG.COMBO_B}else{wrong++;st=0}}
const done=m==N,perfect=done&&first==N&&wrong==0?CFG.PERF:0,S=CFG.SPEED,speed=done&&timer?Math.round(S.max*clamp((S.zero-secs)/(S.zero-S.full),0,1)):0;
return{base,combo,perfect,speed,total:base+combo+perfect+speed,first,wrong,mx,m,st,done}}
const rankOf=s=>CFG.RANKS.filter(r=>s>=r[0]).pop()[1];
// ===== STATE =====
const S={timer:true,sound:true,name:'',pid:null};let G=null,A={rsel:new Set(),tab:'rec',auth:false,q:'',Q:[],seen:new Set(),run:false,sel:new Set(),E:null,tpl:null,staged:[]},iv;
const beep=(f,d=.12,ty='square')=>{if(!S.sound)return;try{const c=new (window.AudioContext||webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.type=ty;o.frequency.value=f;g.gain.value=.05;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+d)}catch(e){}};
// ----- pixel sprites (drawn from text grids, no image files needed) -----
const PX=(rows,pal)=>'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${rows[0].length} ${rows.length}' shape-rendering='crispEdges'>${rows.map((r,y)=>[...r].map((c,x)=>pal[c]?`<rect x='${x}' y='${y}' width='1' height='1' fill='${pal[c]}'/>`:'').join('')).join('')}</svg>`);
const GOLD={o:'#8a6a1c',y:'#F5C842',h:'#fff3b0'};
const SPR={coin:PX(['..oooo..','.oyyyho.','oyyyyyyo','oyyoyyyo','oyyoyyyo','oyyyyyyo','.oyyyyo.','..oooo..'],GOLD),
trophy:PX(['.oooooooo.','oyyyyyyyyo','oyhyyyyyyo','.oyyyyyyo.','..oyyyyo..','...oyyo...','....oo....','....oo....','...oyyo...','..oooooo..'],GOLD),
star:PX(['...o...','..oyo..','ooyyyoo','.oyhyo.','..oyyo.','.oyoyo.','.o...o.'].map(r=>r.padEnd(7,'.')),GOLD),
book:PX(['bbbbbbbbbb','bBBBBBBBBl','bBwwwwwBBl','bBBBBBBBBl','bBwwwwwBBl','bBBBBBBBBl','bBwwwwBBBl','bBBBBBBBBl','bbbbbbbbbb','.llllllll.'],{b:'#253B80',B:'#3a56a8',l:'#D5EF77',w:'#fff'})};
const spr=(k,c='')=>`<img class="spr ${c}" src="${SPR[k]}" alt="">`;
const elig=r=>r.active&&r.name&&r.name.trim()&&!r.needsReview,cand=r=>!r.sample&&!r.verified&&r.posterId&&!r.ocrDone;
const tune=(a,gap=90)=>a.forEach((f,i)=>setTimeout(()=>beep(f,.1),i*gap));
const fmt=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
async function init(){const p=await DB.get('meta','player');if(p){S.name=p.name||'';S.pid=p.pid}
A.tpl=(await DB.get('meta','template'))||{id:'template',p:{x:.1,y:.1,w:.8},n:{x:.1,y:.75,w:.8,h:.1},cal:false};
if(!(await DB.get('meta','seeded'))){const C=['#253B80','#F07B64','#D5EF77'],T=['#fff','#fff','#253B80'];
['Aria Rahman','Bilal Hasan','Chowdhury Nila','Dipto Sarker','Eshita Karim','Farhan Islam','Gulshan Ara','Hasib Mia','Ishrat Jahan','Jubayer Ahmed','Kamrul Hossain','Labonno Das','Mahin Khan','Nusrat Sultana'].forEach((n,i)=>{const ini=n.split(' ').map(x=>x[0]).join('');
DB.put('recruits',{id:uid(),name:'Sample '+n,sample:true,active:true,created:Date.now(),portrait:'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 400'><rect fill='${C[i%3]}' width='320' height='400'/><circle cx='160' cy='150' r='62' fill='#fff' opacity='.85'/><path d='M50 400a110 120 0 0 1 220 0z' fill='#fff' opacity='.85'/><text x='160' y='170' text-anchor='middle' font-size='54' font-family='sans-serif' font-weight='800' fill='${T[i%3]}'>${ini}</text></svg>`)})});
await DB.put('meta',{id:'seeded'})}
route()}
addEventListener('hashchange',route);
function route(){clearInterval(iv);const r=location.hash.slice(2);({play,board,admin}[r]||home)()}
