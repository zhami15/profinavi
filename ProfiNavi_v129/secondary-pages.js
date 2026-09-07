const masters=window.PNCloneMasters();
window.masters=masters;
const secondaryEsc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const snapIdeas=[];
const getFavs=()=>JSON.parse(localStorage.getItem('pn_favs')||'[]');
const setFavs=v=>{localStorage.setItem('pn_favs',JSON.stringify(v));if(window.PNData&&window.PNAuth)PNAuth.currentUser().then(u=>{if(!u)return;PNData.listLegacyFavorites().then(old=>{const a=new Set(v.map(Number)),b=new Set(old.map(Number));[...a].filter(x=>!b.has(x)).forEach(x=>PNData.setLegacyFavorite(x,true).catch(()=>{}));[...b].filter(x=>!a.has(x)).forEach(x=>PNData.setLegacyFavorite(x,false).catch(()=>{}))}).catch(()=>{})}).catch(()=>{})};
let savedWorkIds=new Set();
const getFavWorks=()=>[...savedWorkIds].map(id=>`work:${id}`);
const isWorkSaved=workId=>!!workId&&savedWorkIds.has(String(workId));
const setWorkSavedState=(workId,on)=>{const id=String(workId||'');if(!id)return;if(on)savedWorkIds.add(id);else savedWorkIds.delete(id)};
function legacySavedWorkIds(){
 try{
  const raw=JSON.parse(localStorage.getItem('pn_fav_works')||'[]');
  if(!Array.isArray(raw))return[];
  const ids=[];
  raw.map(String).forEach(k=>{
   if(k.startsWith('work:')){const id=k.slice(5);if(id)ids.push(id);return}
   const m=k.match(/^(\d+):(\d+)$/);if(!m)return;
   const workId=masters[Number(m[1])]?.workItems?.[Number(m[2])]?.id;if(workId)ids.push(String(workId));
  });
  return [...new Set(ids)];
 }catch(e){return[]}
}
function openProfile(i){location.href=`profile.html?id=${i}`}
function toggleMaster(i){const a=getFavs();const p=a.indexOf(i);p>=0?a.splice(p,1):a.push(i);setFavs(a);renderFavorites(document.querySelector('[data-fav-tab].active')?.dataset.favTab||'masters')}
function workFavKey(x){return x?.workId?`work:${x.workId}`:String(x?.workKey||'')}
function setWorkCount(workId,count){if(!workId)return;const n=Math.max(0,Number(count)||0);masters.filter(Boolean).forEach(m=>(m.workItems||[]).forEach(w=>{if(String(w.id)===String(workId))w.likesCount=n}));activeWorks.forEach(x=>{if(String(x.workId)===String(workId))x.likesCount=n})}
async function toggleWork(k,workId,button){
 const id=String(workId||'');
 if(!id||!window.PNData?.setWorkLike||!window.PNAuth)return alert('Эту работу пока нельзя сохранить. Обновите страницу.');
 let user=null;try{user=await PNAuth.currentUser()}catch(e){}if(!user){alert('Чтобы поставить лайк и сохранить работу, войдите как клиент.');return}
 const turningOn=!isWorkSaved(id);
 try{
  const result=await PNData.setWorkLike(id,turningOn);
  setWorkSavedState(id,turningOn);
  setWorkCount(id,result.likesCount);
  if(button){button.classList.toggle('saved',turningOn);const heart=button.querySelector('.works-like-heart');if(heart)heart.textContent=turningOn?'♥':'♡';const n=button.querySelector('.works-like-count');if(n)n.textContent=String(result.likesCount)}
  renderFavorites(document.querySelector('[data-fav-tab].active')?.dataset.favTab||'works');
 }catch(e){alert('Не удалось сохранить работу: '+e.message)}
}

const MASTER_SESSION_KEY='pn_master_session';
const MASTER_PROFILE_KEY='pn_master_profile_0';
const MASTER_FEED_WORKS_KEY='pn_master_feed_works';

function hasMasterAccount(){
 try{return !!JSON.parse(localStorage.getItem(MASTER_SESSION_KEY)||'null')}catch(e){return !!localStorage.getItem(MASTER_SESSION_KEY)}
}
function getMasterFeedWorks(){
 try{
   const x=JSON.parse(localStorage.getItem(MASTER_FEED_WORKS_KEY)||'[]');
   return Array.isArray(x)?x:[];
 }catch(e){return []}
}
function saveMasterFeedWorks(items){
 localStorage.setItem(MASTER_FEED_WORKS_KEY,JSON.stringify(items));
}
function getMasterProfileForWorks(){
 try{return JSON.parse(localStorage.getItem(MASTER_PROFILE_KEY)||'{}')||{}}catch(e){return {}}
}
function syncMasterIdentityForWorks(){
 if(!hasMasterAccount())return;
 const p=getMasterProfileForWorks();
 if(masters[0]){
   if(p.name)masters[0].name=p.name;
   if(p.avatar)masters[0].avatar=p.avatar;
   if(p.area)masters[0].district=p.area;
 }
}
function allFeedWorks(){
 return masters.filter(Boolean).flatMap(m=>{
  const backend=Array.isArray(m.workItems)&&m.workItems.length?m.workItems.map((w,i)=>({photo:w.image_url,workId:w.id,likesCount:Number(w.likesCount)||0,i})):(m.gallery||[]).map((photo,i)=>({photo,workId:null,likesCount:0,i}));
  return backend.filter(x=>x.photo&&x.photo!=='assets/service-placeholder.svg').map(x=>({master:m.id,cat:m.cat||'nails',title:'Работа мастера',photo:x.photo,workId:x.workId,likesCount:x.likesCount,workKey:x.workId?`work:${x.workId}`:`${m.id}:${x.i}`}));
 });
}
function cropMasterWorkFile(file,index,total){
 return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{
   const ov=document.createElement('div');ov.className='works-crop-overlay';
   ov.innerHTML=`<div class="works-crop-editor"><header><button class="works-crop-cancel" type="button">Отмена</button><b>Размер фото</b><button class="works-crop-done" type="button">${index+1<total?'Далее':'Опубликовать'}</button></header><div class="works-crop-stage"><canvas width="720" height="720" aria-label="Кадрирование фотографии"></canvas><span class="works-crop-grid"></span></div><div class="works-crop-controls"><span>−</span><input class="works-crop-zoom" type="range" min="1" max="3" value="1" step="0.01" aria-label="Масштаб фотографии"><span>＋</span><small>Перемещайте фото пальцем. Для масштаба используйте жест двумя пальцами или ползунок.</small></div></div>`;
   document.body.appendChild(ov);document.body.classList.add('works-cropping');
   const canvas=ov.querySelector('canvas'),ctx=canvas.getContext('2d'),slider=ov.querySelector('.works-crop-zoom');
   const CSS_SIZE=360,OUT=1600,base=Math.max(CSS_SIZE/img.naturalWidth,CSS_SIZE/img.naturalHeight);let zoom=1,ox=0,oy=0,pointers=new Map(),lastOne=null,pinch=null;
   const clamp=()=>{const dw=img.naturalWidth*base*zoom,dh=img.naturalHeight*base*zoom;ox=Math.max(-(dw-CSS_SIZE)/2,Math.min((dw-CSS_SIZE)/2,ox));oy=Math.max(-(dh-CSS_SIZE)/2,Math.min((dh-CSS_SIZE)/2,oy))};
   const draw=()=>{clamp();ctx.clearRect(0,0,720,720);ctx.save();ctx.scale(2,2);const dw=img.naturalWidth*base*zoom,dh=img.naturalHeight*base*zoom;ctx.drawImage(img,(CSS_SIZE-dw)/2+ox,(CSS_SIZE-dh)/2+oy,dw,dh);ctx.restore()};
   const setZoom=(z)=>{zoom=Math.max(1,Math.min(3,z));slider.value=String(zoom);draw()};
   slider.oninput=()=>setZoom(Number(slider.value)||1);
   canvas.onwheel=e=>{e.preventDefault();setZoom(zoom*(e.deltaY<0?1.08:.92))};
   canvas.onpointerdown=e=>{canvas.setPointerCapture?.(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)lastOne={x:e.clientX,y:e.clientY};if(pointers.size===2){const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);pinch={distance:d,zoom}}};
   canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1&&lastOne){ox+=e.clientX-lastOne.x;oy+=e.clientY-lastOne.y;lastOne={x:e.clientX,y:e.clientY};draw()}else if(pointers.size===2&&pinch){const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);setZoom(pinch.zoom*(d/Math.max(1,pinch.distance)))}};
   const endPointer=e=>{pointers.delete(e.pointerId);if(pointers.size===1){const a=[...pointers.values()][0];lastOne={...a}}else lastOne=null;if(pointers.size<2)pinch=null};canvas.onpointerup=endPointer;canvas.onpointercancel=endPointer;
   const close=()=>{URL.revokeObjectURL(url);ov.remove();document.body.classList.remove('works-cropping')};
   ov.querySelector('.works-crop-cancel').onclick=()=>{close();reject(new DOMException('Отменено','AbortError'))};
   ov.querySelector('.works-crop-done').onclick=()=>{const out=document.createElement('canvas');out.width=OUT;out.height=OUT;const c=out.getContext('2d'),ratio=OUT/CSS_SIZE,dw=img.naturalWidth*base*zoom*ratio,dh=img.naturalHeight*base*zoom*ratio;c.drawImage(img,(OUT-dw)/2+ox*ratio,(OUT-dh)/2+oy*ratio,dw,dh);out.toBlob(blob=>{if(!blob){close();reject(new Error('Не удалось обработать фотографию'));return}const baseName=(file.name||'work').replace(/\.[^.]+$/,'');const edited=new File([blob],`${baseName}-profinavi.jpg`,{type:'image/jpeg',lastModified:Date.now()});close();resolve(edited)},'image/jpeg',.92)};
   draw();
  };
  img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Не удалось открыть фотографию'))};img.src=url;
 });
}
async function editMasterWorkFiles(files){const valid=[...files].filter(f=>String(f.type||'').startsWith('image/'));const result=[];for(let i=0;i<valid.length;i++)result.push(await cropMasterWorkFile(valid[i],i,valid.length));return result}
async function addMasterWorks(files){
 if(!hasMasterAccount()||!files?.length)return;
 if(!window.PNData?.uploadMasterMedia||!window.PNData?.addMasterWork)return alert('Хранилище изображений не загрузилось. Обновите страницу.');
 const feed=getMasterFeedWorks(),profile=getMasterProfileForWorks(),profileWorks=Array.isArray(profile.works)?[...profile.works]:[];
 try{
  for(const file of [...files]){
    if(!String(file.type||'').startsWith('image/'))continue;
    const photo=await PNData.uploadMasterMedia(file,'work'),row=await PNData.addMasterWork(photo);
    feed.unshift({id:row.id,photo,title:'Моя работа',cat:'nails',createdAt:row.created_at||new Date().toISOString()});profileWorks.unshift(photo);
  }
  const next={...profile,works:profileWorks};saveMasterFeedWorks(feed);localStorage.setItem(MASTER_PROFILE_KEY,JSON.stringify(next));await PNData.saveMasterProfile(next);
  if(window.PNRanking?.hydrate)await PNRanking.hydrate(masters);await syncWorkLikesFromBackend();renderSnap(document.querySelector('[data-filter].active')?.dataset.filter||'all');
 }catch(e){alert('Не удалось сохранить работу: '+e.message)}
}
function setupMasterWorksAdd(){
 const btn=document.getElementById('worksAddBtn'),input=document.getElementById('worksAddInput');if(!btn||!input)return;
 if(!hasMasterAccount()){btn.classList.add('hidden');return}btn.classList.remove('hidden');btn.onclick=()=>input.click();
 input.onchange=async()=>{const files=input.files;input.value='';if(!files?.length)return;try{const edited=await editMasterWorkFiles(files);await addMasterWorks(edited)}catch(e){if(e?.name!=='AbortError')alert('Не удалось обработать фотографию: '+e.message)}};
}
async function syncWorkLikesFromBackend(){
 if(!window.PNData?.listMyWorkLikes||!window.PNAuth){savedWorkIds.clear();return[]}
 let user=null;try{user=await PNAuth.currentUser()}catch(e){}if(!user){savedWorkIds.clear();return[]}
 try{
  const db=new Set((await PNData.listMyWorkLikes()).map(String));
  for(const id of legacySavedWorkIds())if(!db.has(id)){const result=await PNData.setWorkLike(id,true);setWorkCount(id,result.likesCount);db.add(id)}
  savedWorkIds=db;
  localStorage.removeItem('pn_fav_works');
  return getFavWorks();
 }catch(e){console.warn('work favorites sync',e);return getFavWorks()}
}
let activeWorks=[];
function renderSnap(filter='all'){
 const box=document.getElementById('pageSnapGrid'); if(!box)return;
 activeWorks=allFeedWorks().filter(x=>filter==='all'||x.cat===filter);
 box.innerHTML=activeWorks.length?activeWorks.map((x,visibleIndex)=>{const m=masters[x.master];if(!m)return'';return `<button class="works-grid-item" onclick="openWorksViewer(${visibleIndex})" aria-label="Работа ${secondaryEsc(m.name)}"><img src="${secondaryEsc(x.photo)}" alt="Работа ${secondaryEsc(m.name)}" loading="lazy"></button>`}).join(''):`<div class="favorite-page-empty" style="grid-column:1/-1"><span>✦</span><h2>Пока нет работ</h2><p>Работы опубликованных мастеров появятся здесь.</p></div>`;
}
function openWorksViewer(index){
 const viewer=document.getElementById('worksViewer'),list=document.getElementById('worksViewerList'); if(!viewer||!list)return;
 list.innerHTML=activeWorks.map((x)=>{
  const m=masters[x.master],k=workFavKey(x),saved=isWorkSaved(x.workId);if(!m)return '';
  return `<article class="works-viewer-slide">
  <img class="works-viewer-photo" src="${secondaryEsc(x.photo)}" alt="Работа ${secondaryEsc(m.name)}">
  <div class="works-viewer-info">
   <button class="works-viewer-master" onclick="openProfile(${x.master})"><img src="${secondaryEsc(m.avatar)}" alt="${secondaryEsc(m.name)}"><span><b>${secondaryEsc(m.name)}</b><small>${secondaryEsc(m.district||'')}</small></span></button>
   <button class="works-viewer-like ${saved?'saved':''}" onclick="event.stopPropagation();toggleWork('${k}','${secondaryEsc(x.workId||'')}',this)" aria-label="Лайк и сохранить работу"><span class="works-like-heart">${saved?'♥':'♡'}</span><span class="works-like-count">${Math.max(0,Number(x.likesCount)||0)}</span></button>
  </div>
 </article>`}).join('');
 viewer.classList.add('open');viewer.setAttribute('aria-hidden','false');document.body.classList.add('viewer-open');
 requestAnimationFrame(()=>{const slide=list.children[index];slide?.scrollIntoView({block:'start'});});
}
function closeWorksViewer(){const viewer=document.getElementById('worksViewer');viewer?.classList.remove('open');viewer?.setAttribute('aria-hidden','true');document.body.classList.remove('viewer-open')}
function renderFavorites(tab='masters'){
 const box=document.getElementById('favoritePageContent');if(!box)return;document.querySelectorAll('[data-fav-tab]').forEach(b=>b.classList.toggle('active',b.dataset.favTab===tab));
 if(tab==='masters'){
  const ids=getFavs();box.innerHTML=ids.length?`<div class="favorite-page-list">${ids.map(i=>{const m=masters[i];return m?`<article class="favorite-page-master" onclick="openProfile(${i})"><img src="${secondaryEsc(m.avatar)}"><div><h2>${secondaryEsc(m.name)}</h2><p>${secondaryEsc(window.PNRanking?.ratingLabel?window.PNRanking.ratingLabel(m):('★ '+m.rating))}${m.experience?' · '+secondaryEsc(m.experience):''}</p><small>⌖ ${secondaryEsc(m.district)}</small></div><button onclick="event.stopPropagation();toggleMaster(${i})">♥</button></article>`:''}).join('')}</div>`:empty('Нет сохранённых мастеров','Нажмите сердечко на карточке мастера.');return;
 }
 const keys=getFavWorks(),feed=allFeedWorks();box.innerHTML=keys.length?`<div class="favorite-page-works">${keys.map(k=>{const x=feed.find(w=>workFavKey(w)===k);if(x){const m=masters[x.master];if(!m)return'';return `<article onclick="openProfile(${x.master})"><div class="fav-work-visual"><img src="${secondaryEsc(x.photo)}" alt="Работа ${secondaryEsc(m.name)}"><button onclick="event.stopPropagation();toggleWork('${k}','${secondaryEsc(x.workId||'')}',this)">♥</button></div><b>Работа мастера</b><small>${secondaryEsc(m.name)}</small></article>`}const parts=k.split(':').map(Number),m=masters[parts[0]];if(!m)return'';return `<article onclick="openProfile(${parts[0]})"><div class="fav-work-visual"><img src="${secondaryEsc(m.avatar)}"><button onclick="event.stopPropagation();toggleWork('${k}','',this)">♥</button></div><b>Работа мастера</b><small>${secondaryEsc(m.name)}</small></article>`}).join('')}</div>`:empty('Нет сохранённых работ','Сохраняйте фото работ сердечком.');
}
function empty(h,p){return `<div class="favorite-page-empty"><span>♡</span><h2>${h}</h2><p>${p}</p></div>`}
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderSnap(b.dataset.filter)});
document.querySelectorAll('[data-fav-tab]').forEach(b=>b.onclick=()=>renderFavorites(b.dataset.favTab));
document.getElementById('worksViewerClose')?.addEventListener('click',closeWorksViewer);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeWorksViewer()});
setupMasterWorksAdd();renderSnap();renderFavorites();

window.addEventListener('DOMContentLoaded',()=>window.PNBackendSync?.hydrateClientFavorites?.().catch(()=>{}));


async function pnHydrateSecondaryDirectory(){
 try{
  if(!window.PNRanking?.hydrate)return;
  await window.PNRanking.hydrate(masters);
  await syncWorkLikesFromBackend();
  renderFavorites(document.querySelector('[data-fav-tab].active')?.dataset.favTab||'masters');
  renderSnap(document.querySelector('[data-filter].active')?.dataset.filter||'all');
 }catch(e){console.warn('secondary directory sync',e)}
}
window.addEventListener('DOMContentLoaded',()=>setTimeout(pnHydrateSecondaryDirectory,70));
