// ===== CONFIG (edit here) =====
const N=10,CFG={PTS:[100,60,30,10],COMBO:3,COMBO_B:30,PERF:300,SPEED:{max:100,full:60,zero:240},QUICK:90,BATCH:5,OCR_MIN:60,MAXFILE:15e6,
RANKS:[[0,'Stranger'],[400,'Acquaintance'],[800,'Forum Insider'],[1100,'Recruit Master'],[1350,'Accounting Forum Legend']]}; // max possible = 1000+90+300+100 = 1490
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID(),clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const shuf=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const sha=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');
let tt;const toast=t=>{document.querySelector('.toast')?.remove();const e=document.createElement('div');e.className='toast';e.textContent=t;document.body.append(e);clearTimeout(tt);tt=setTimeout(()=>e.remove(),2200)};
// ===== STORAGE LAYER =====
// recruits + scores -> Cloudflare Worker (bupaf-api) + D1.  Images -> ImageKit (uploaded through the Worker).
// staged posters, player id and template settings stay in this browser (IndexedDB).
const API='https://bupaf-api.fahimzim12.workers.dev';
const tok=()=>sessionStorage.getItem('bupaf_tok')||'';
async function api(p,o={}){const h={};if(o.json)h['Content-Type']='application/json';if(o.auth)h.Authorization='Bearer '+tok();let r;
try{r=await fetch(API+p,{method:o.method||'GET',headers:h,body:o.json?JSON.stringify(o.json):o.body})}catch(e){throw Error('Cannot reach the server')}
let j=null;try{j=await r.json()}catch(e){}
if(r.status==401){sessionStorage.removeItem('bupaf_tok');A.auth=false;throw Error('Wrong or missing admin token')}
if(!r.ok)throw Error(j?.error||'Server error '+r.status);return j}
const upImg=async(blob,name)=>{const f=new FormData();f.append('file',blob,name);return(await api('/api/upload',{method:'POST',auth:1,body:f})).image_url};
async function fit(b){if(b.size<=4.8e6)return b;const bm=await createImageBitmap(b);let s=Math.min(1,3200/Math.max(bm.width,bm.height)),q=.9,o;
for(let i=0;i<6;i++){const c=document.createElement('canvas');c.width=Math.round(bm.width*s);c.height=Math.round(bm.height*s);c.getContext('2d').drawImage(bm,0,0,c.width,c.height);o=await new Promise(r=>c.toBlob(r,'image/jpeg',q));if(o.size<=4.8e6)break;s*=.8;q=Math.max(.7,q-.05)}bm.close();return o}
const RC=new Map(),jp=s=>{try{return JSON.parse(s||'{}')}catch(e){return{}}};
const getPoster=async r=>{if(!r.posterUrl)return null;try{const x=await fetch(r.posterUrl);if(!x.ok)return null;return{blob:await x.blob()}}catch(e){return null}};
const hasPoster=h=>[...RC.values()].some(r=>!r.deleted&&r.posterId===h);
const CLOUD={
recruits:{async all(){const rows=await api('/api/recruits');RC.clear();for(const x of rows)RC.set(x.id,{...jp(x.data_json),id:x.id,name:x.name,role:x.role||'',portrait:x.image_url});return[...RC.values()].filter(r=>!r.deleted)},
async get(id){if(!RC.has(id))await this.all();const r=RC.get(id);return r&&!r.deleted?r:undefined},
async put(r){if((r.portrait||'').startsWith('data:'))r.portrait=await upImg(await(await fetch(r.portrait)).blob(),'portrait-'+r.id+'.jpg');
const{id,name,role,portrait,...d}=r;await api('/api/recruits',{method:'POST',auth:1,json:{id,name,role:role||'',image_url:portrait,data:d}});RC.set(id,r)},
async del(id){const r=await this.get(id);if(r)await this.put({...r,deleted:true})}},
results:{async all(){return(await api('/api/scores')).map(x=>{const d=jp(x.data_json);return{...d,id:x.id,name:x.player_name,score:x.score,pid:d.pid||x.player_name,secs:d.secs??0,streak:d.streak??0,date:d.date||Date.parse(x.created_at+'Z')}})},
async put(r){const{id,name,score,...d}=r;await api('/api/scores',{method:'POST',json:{id,player_name:name,score,data:d}})},
async get(){return undefined},async del(){}}};
const L=(()=>{let p;const o=()=>p||(p=new Promise((res,rej)=>{const r=indexedDB.open('ledger',1);r.onupgradeneeded=()=>['recruits','posters','staged','results','meta'].forEach(s=>r.result.createObjectStore(s,{keyPath:'id'}));r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
const tx=async(s,m,f)=>{const d=await o();return new Promise((res,rej)=>{const t=d.transaction(s,m);const q=f(t.objectStore(s));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error)})};
return{all:s=>tx(s,'readonly',o=>o.getAll()),get:(s,k)=>tx(s,'readonly',o=>o.get(k)),put:(s,v)=>tx(s,'readwrite',o=>o.put(v)),del:(s,k)=>tx(s,'readwrite',o=>o.delete(k))}})();
const DB={all:s=>CLOUD[s]?CLOUD[s].all():L.all(s),get:(s,k)=>CLOUD[s]?CLOUD[s].get(k):L.get(s,k),put:(s,v)=>CLOUD[s]?CLOUD[s].put(v):L.put(s,v),del:(s,k)=>CLOUD[s]?CLOUD[s].del(k):L.del(s,k)};
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
route()}
addEventListener('hashchange',route);
function route(){clearInterval(iv);const r=location.hash.slice(2);Promise.resolve(({play,board,admin}[r]||home)()).catch(e=>{if(r=='admin'&&!A.auth)return admin();$('#m').innerHTML='<h2>Could not load</h2><p class=mu>'+esc(e.message)+'</p><button class=btn onclick=route()>Retry</button>'})}
