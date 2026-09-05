const masters=window.PNCloneMasters();
window.masters=masters;
const secondaryEsc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const snapIdeas=[];
const getFavs=()=>JSON.parse(localStorage.getItem('pn_favs')||'[]');
const setFavs=v=>{localStorage.setItem('pn_favs',JSON.stringify(v));if(window.PNData&&window.PNAuth)PNAuth.currentUser().then(u=>{if(!u)return;PNData.listLegacyFavorites().then(old=>{const a=new Set(v.map(Number)),b=new Set(old.map(Number));[...a].filter(x=>!b.has(x)).forEach(x=>PNData.setLegacyFavorite(x,true).catch(()=>{}));[...b].filter(x=>!a.has(x)).forEach(x=>PNData.setLegacyFavorite(x,false).catch(()=>{}))}).catch(()=>{})}).catch(()=>{})};
const getFavWorks=()=>JSON.parse(localStorage.getItem('pn_fav_works')||'[]');
const setFavWorks=v=>localStorage.setItem('pn_fav_works',JSON.stringify(v));
function openProfile(i){location.href=`profile.html?id=${i}`}
function toggleMaster(i){const a=getFavs();const p=a.indexOf(i);p>=0?a.splice(p,1):a.push(i);setFavs(a);renderFavorites(document.querySelector('[data-fav-tab].active')?.dataset.favTab||'masters')}
function toggleWork(k){const a=getFavWorks();const p=a.indexOf(k);p>=0?a.splice(p,1):a.push(k);setFavWorks(a);renderSnap(document.querySelector('[data-filter].active')?.dataset.filter||'all');renderFavorites(document.querySelector('[data-fav-tab].active')?.dataset.favTab||'works')}

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
 return masters.filter(Boolean).flatMap(m=>(m.gallery||[]).filter(photo=>photo&&photo!=='assets/service-placeholder.svg').map((photo,i)=>({master:m.id,cat:m.cat||'nails',title:(m.services?.length?m.services[i%m.services.length]?.name:'Работа мастера')||'Работа мастера',service:(m.services?.length?m.services[i%m.services.length]?.name:'Работа мастера')||'Работа мастера',price:(m.services?.length?m.services[i%m.services.length]?.price:'')||'',photo,workKey:`${m.id}:${i}`})));
}
async function addMasterWorks(files){
 if(!hasMasterAccount()||!files?.length)return;
 if(!window.PNData?.uploadMasterMedia)return alert('Хранилище изображений не загрузилось. Обновите страницу.');
 const feed=getMasterFeedWorks();
 const profile=getMasterProfileForWorks();
 const profileWorks=Array.isArray(profile.works)?[...profile.works]:[];
 try{
  for(const file of [...files]){
    if(!String(file.type||'').startsWith('image/'))continue;
    const photo=await PNData.uploadMasterMedia(file,'work');
    const id='work_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);
    feed.push({id,photo,title:'Моя работа',service:'Работа мастера',cat:'nails',createdAt:new Date().toISOString()});
    profileWorks.unshift(photo);
  }
  const next={...profile,works:profileWorks};
  saveMasterFeedWorks(feed);
  localStorage.setItem(MASTER_PROFILE_KEY,JSON.stringify(next));
  await PNData.saveMasterProfile(next);
  await PNData.replaceMasterWorks(profileWorks);
  renderSnap(document.querySelector('[data-filter].active')?.dataset.filter||'all');
 }catch(e){alert('Не удалось сохранить работу: '+e.message)}
}
function setupMasterWorksAdd(){
 const btn=document.getElementById('worksAddBtn');
 const input=document.getElementById('worksAddInput');
 if(!btn||!input)return;
 if(!hasMasterAccount()){
   btn.classList.add('hidden');
   return;
 }
 btn.classList.remove('hidden');
 btn.onclick=()=>input.click();
 input.onchange=async()=>{
   const files=input.files;
   await addMasterWorks(files);
   input.value='';
 };
}

let activeWorks=[];
function renderSnap(filter='all'){
 const box=document.getElementById('pageSnapGrid'); if(!box)return;
 activeWorks=allFeedWorks().filter(x=>filter==='all'||x.cat===filter);
 box.innerHTML=activeWorks.length?activeWorks.map((x,visibleIndex)=>{const m=masters[x.master];if(!m)return'';return `<button class="works-grid-item" onclick="openWorksViewer(${visibleIndex})" aria-label="${secondaryEsc(x.service||'Работа')}, ${secondaryEsc(m.name)}"><img src="${secondaryEsc(x.photo)}" alt="Работа ${secondaryEsc(m.name)}" loading="lazy"></button>`}).join(''):`<div class="favorite-page-empty" style="grid-column:1/-1"><span>✦</span><h2>Пока нет работ</h2><p>Работы опубликованных мастеров появятся здесь.</p></div>`;
}
function openWorksViewer(index){
 const viewer=document.getElementById('worksViewer'),list=document.getElementById('worksViewerList'); if(!viewer||!list)return;
 const fav=getFavWorks();
 list.innerHTML=activeWorks.map((x)=>{
  const m=masters[x.master],k=x.workKey||`snap:${x.i}`,saved=fav.includes(k);if(!m)return '';
  return `<article class="works-viewer-slide">
  <img class="works-viewer-photo" src="${secondaryEsc(x.photo)}" alt="Работа ${secondaryEsc(m.name)}">
  <div class="works-viewer-info">
   <button class="works-viewer-master" onclick="openProfile(${x.master})"><img src="${secondaryEsc(m.avatar)}" alt="${secondaryEsc(m.name)}"><span><b>${secondaryEsc(m.name)}</b><small>${secondaryEsc(m.district||'')}</small></span></button>
   <div class="works-viewer-service" onclick="openProfile(${x.master})"><span>${secondaryEsc(x.service||'Работа мастера')}</span>${x.price?`<b>${secondaryEsc(x.price)}</b>`:''}</div>
   <button class="works-viewer-like ${saved?'saved':''}" onclick="event.stopPropagation();toggleWork('${k}');this.classList.toggle('saved');this.textContent=this.classList.contains('saved')?'♥':'♡'">${saved?'♥':'♡'}</button>
  </div>
 </article>`}).join('');
 viewer.classList.add('open');viewer.setAttribute('aria-hidden','false');document.body.classList.add('viewer-open');
 requestAnimationFrame(()=>{const slide=list.children[index];slide?.scrollIntoView({block:'start'});});
}
function closeWorksViewer(){const viewer=document.getElementById('worksViewer');viewer?.classList.remove('open');viewer?.setAttribute('aria-hidden','true');document.body.classList.remove('viewer-open')}
function renderFavorites(tab='masters'){const box=document.getElementById('favoritePageContent');if(!box)return;document.querySelectorAll('[data-fav-tab]').forEach(b=>b.classList.toggle('active',b.dataset.favTab===tab));if(tab==='masters'){const ids=getFavs();box.innerHTML=ids.length?`<div class="favorite-page-list">${ids.map(i=>{const m=masters[i];return m?`<article class="favorite-page-master" onclick="openProfile(${i})"><img src="${secondaryEsc(m.avatar)}"><div><h2>${secondaryEsc(m.name)}</h2><p>${secondaryEsc(window.PNRanking?.ratingLabel?window.PNRanking.ratingLabel(m):('★ '+m.rating))}${m.experience?' · '+secondaryEsc(m.experience):''}</p><small>⌖ ${secondaryEsc(m.district)}</small></div><button onclick="event.stopPropagation();toggleMaster(${i})">♥</button></article>`:''}).join('')}</div>`:empty('Нет сохранённых мастеров','Нажмите сердечко на карточке мастера.')}else{const keys=getFavWorks();box.innerHTML=keys.length?`<div class="favorite-page-works">${keys.map(k=>{if(k.startsWith('snap:')){const x=snapIdeas[+k.split(':')[1]],m=x&&masters[x.master];if(!x||!m)return'';return `<article onclick="openProfile(${x.master})"><div class="fav-work-visual">${x.emoji}<button onclick="event.stopPropagation();toggleWork('${k}')">♥</button></div><b>${secondaryEsc(x.title)}</b><small>${secondaryEsc(m.name)}</small></article>`}const [mi,gi]=k.split(':').map(Number),m=masters[mi];if(!m)return'';return `<article onclick="openProfile(${mi})"><div class="fav-work-visual"><img src="${secondaryEsc(m.avatar)}"><button onclick="event.stopPropagation();toggleWork('${k}')">♥</button></div><b>Работа мастера</b><small>${secondaryEsc(m.name)}</small></article>`}).join('')}</div>`:empty('Нет сохранённых работ','Сохраняйте фото работ сердечком.')}}
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
  renderFavorites(document.querySelector('[data-fav-tab].active')?.dataset.favTab||'masters');
  renderSnap(document.querySelector('[data-filter].active')?.dataset.filter||'all');
 }catch(e){console.warn('secondary directory sync',e)}
}
window.addEventListener('DOMContentLoaded',()=>setTimeout(pnHydrateSecondaryDirectory,70));
