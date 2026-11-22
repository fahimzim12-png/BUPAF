// ===== EVENTS =====
document.addEventListener('click',async e=>{const t=e.target.closest('[data-a]');if(!t)return;const a=t.dataset.a,id=t.dataset.id;
if(a=='start')start();else if(a=='pic'){G.sel=G.sel==id?null:id;draw()}else if(a=='slot'){if(G.sel)attempt(G.sel,id);else toast('Pick a photo first')}
else if(a=='restart'){if(confirm('Restart this round? Your progress will be lost.')){G=null;start()}}else if(a=='submit')submit();
else if(a=='login'){const t=$('#pw').value.trim();if(!t)return toast('Enter the admin token');sessionStorage.setItem('bupaf_tok',t);
try{await api('/api/upload',{method:'POST',auth:1,body:new FormData()})}catch(e){if(e.message!='No image provided'){sessionStorage.removeItem('bupaf_tok');return toast(e.message)}}A.auth=true;admin()}
else if(a=='logout'){sessionStorage.removeItem('bupaf_tok');A.auth=false;admin()}
else if(a=='tab'){A.tab=id;A.E=null;admin()}else if(a=='del'){if(confirm('Delete this recruit permanently?')){await DB.del('recruits',id);admin()}}
else if(a=='rmsample'){if(confirm('Remove all sample recruits?')){for(const r of await DB.all('recruits'))if(r.sample)await DB.del('recruits',r.id);admin()}}
else if(a=='retry'){A.Q.filter(x=>x.st=='fail'&&x.get).forEach(x=>x.st='pending');runQ()}else if(a=='sel'){t.checked?A.sel.add(id):A.sel.delete(id);impTab()}
else if(a=='selall'){A.staged.forEach(s=>A.sel.add(s.id));impTab()}else if(a=='apprsel')approve([...A.sel]);else if(a=='apprall'){if(!A.tpl.cal&&!confirm('Template is not calibrated. Approve anyway?'))return;approve(A.staged.map(s=>s.id))}
else if(a=='discard'){if(A.sel.size&&confirm('Discard '+A.sel.size+' staged posters?')){for(const i of A.sel)await DB.del('staged',i);A.sel.clear();admin()}}
else if(a=='crop')openEd(id);else if(a=='calib'){if(A.staged[0])openEd(A.staged[0].id)}else if(a=='closeEd'){A.E=null;$('#edh').innerHTML=''}
else if(a=='saveone'){const s=A.staged.find(x=>x.id==A.E.id);s.crop=structuredClone(A.E.t);await mk(s);if(!s.ok)await ocrItem(s);await DB.put('staged',s);A.E=null;admin()}
else if(a=='savetpl'){A.tpl={id:'template',...structuredClone(A.E.t),cal:true};await DB.put('meta',A.tpl);toast('Applying template and re-reading names…');for(const s of A.staged)if(!s.crop){await mk(s);if(!s.ok)await ocrItem(s);await DB.put('staged',s)}A.E=null;admin()}
else if(a=='rselall'){document.querySelectorAll('[data-a=rsel]').forEach(c=>{c.checked=true;A.rsel.add(c.dataset.id)});t.nextElementSibling.textContent='Delete selected ('+A.rsel.size+')'}
else if(a=='rdelsel'){if(A.rsel.size&&confirm('Delete '+A.rsel.size+' recruits and their original posters?')){await wipe([...A.rsel]);A.rsel.clear();admin()}}
else if(a=='wipeall'){if(prompt('This deletes ALL recruits and original posters. Type DELETE to confirm')=='DELETE'){await wipe();toast('Everything deleted');admin()}}
else if(a=='clearq'){if(confirm('Clear the review queue?')){for(const s of await DB.all('staged'))await DB.del('staged',s.id);A.sel.clear();A.Q=[];A.seen=new Set();admin()}}
else if(a=='wipescores')alert('To reset the leaderboard, run this in the D1 console (bupaf-db):\n\nDELETE FROM scores;')
else if(a=='openrec')openEdRec($('#tsel').value);
else if(a=='recropall'){if(!confirm('Re-crop all recruits (except ones with their own crop) from the stored posters?'))return;A.tpl={id:'template',...structuredClone(A.E.t),cal:true};await DB.put('meta',A.tpl);const rocr=$('#rocr').checked;toast('Re-cropping…');const n=await recrop(null,A.E.t);A.E=null;
if(rocr){const u=(await DB.all('recruits')).filter(r=>!r.sample&&!r.verified&&r.posterId).map(r=>r.id);if(u.length)return repair(u)}admin();toast(n+' portraits updated')}
else if(a=='recropone'){const t=A.E.t,id=A.E.id;await recrop([id],t,1);A.E=null;admin();toast('Portrait updated')}
else if(a=='conf'){const s=A.staged.find(x=>x.id==id);if(!s.name.trim())return toast('Type a name first');s.ok=true;await DB.put('staged',s);impTab()}
else if(a=='reocr'){const s=A.staged.find(x=>x.id==id);toast('Reading name…');s.ok=false;await ocrItem(s);await DB.put('staged',s);impTab()}
else if(a=='repair')repair();else if(a=='rerec')repair([id]);
else if(a=='confrec'){const r=await DB.get('recruits',id);if(!(r.name||'').trim())return toast('Type a name first');r.verified=true;r.needsReview=false;await DB.put('recruits',r);admin()}
else if(a=='pv'){const r=await DB.get('recruits',id),p=await getPoster(r);if(!p)return toast('Original poster not found');const b=await createImageBitmap(p.blob),n=r.nreg||A.tpl.n,u=cv(b,n,480,Math.max(24,Math.round(480*n.h*b.height/(n.w*b.width)))).toDataURL('image/jpeg',.7);b.close();$('#pv-'+id).innerHTML=`<img src="${u}" alt="Name region" style="max-width:100%;border-radius:8px;margin-top:6px">`}
else if(a=='bk')backup()});
document.addEventListener('change',async e=>{const t=e.target,a=t.dataset.a,id=t.dataset.id;
if(t.id=='tm')S.timer=t.checked;else if(t.id=='sn')S.sound=t.checked;else if(t.id=='nm')S.name=t.value.trim();else if(t.id=='nrf'){A.nr=t.checked;admin()}
else if(a=='rsel'){t.checked?A.rsel.add(id):A.rsel.delete(id);const b=document.querySelector('[data-a=rdelsel]');if(b)b.textContent='Delete selected ('+A.rsel.size+')'}
else if(a=='act'){const r=await DB.get('recruits',id);r.active=t.checked;await DB.put('recruits',r);admin()}
else if(a=='rn'){const r=await DB.get('recruits',id),v=t.value.trim();if(!v)return admin();r.name=v;r.verified=true;r.needsReview=false;r.nameSrc='manual';await DB.put('recruits',r);toast('Name saved')}
else if(a=='sn'){const s=A.staged.find(x=>x.id==id);s.name=t.value;s.ok=!!t.value.trim();await DB.put('staged',s);impTab()}});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset.a=='rg'){const[a,b]=t.dataset.k.split('.');A.E.t[a][b]=+t.value;edDraw()}});
document.addEventListener('dragstart',e=>{const p=e.target.closest('[data-a=pic]');if(p){G.sel=null;G.drag=p.dataset.id;e.dataTransfer.setData('text/plain',G.drag)}});
document.addEventListener('dragover',e=>{const s=e.target.closest('[data-a=slot]');if(s&&G?.drag){e.preventDefault();s.classList.add('dr')}});
document.addEventListener('dragleave',e=>e.target.closest?.('[data-a=slot]')?.classList.remove('dr'));
document.addEventListener('drop',e=>{const s=e.target.closest('[data-a=slot]');if(s&&G?.drag){e.preventDefault();const r=G.drag;G.drag=null;attempt(r,s.dataset.id)}});
addEventListener('unhandledrejection',e=>{e.preventDefault();toast(e.reason?.message||'Something went wrong');if(!A.auth&&location.hash=='#/admin')admin()});
init();
