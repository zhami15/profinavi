const masters=[
{name:'Tunuk Nails',cat:'nails',district:'Vefa Center · Байтик Баатыра 98',rating:'4.9',experience:'Опыт 5 лет',avatar:'assets/tunuk-new.png'},
{name:'Adel Beauty',cat:'nails',district:'Нижний Джал',rating:'4.8',experience:'Опыт 4 года',avatar:'assets/adel-new.png'},
{name:'Alya Lashes',cat:'lashes',district:'5 микрорайон, дом 2',rating:'4.7',experience:'Опыт 6 лет',avatar:'assets/alya-new.png'},
{name:'Mira Brows',cat:'brows',district:'Asia Mall',rating:'4.9',experience:'Опыт 3 года',avatar:'assets/mira-new.png'},
{name:'Nursaule Nails',cat:'nails',district:'Asia Mall',rating:'4.8',experience:'Опыт 4 года',avatar:'assets/nursaule-new.png'},
{name:'Diana Nail Art',cat:'nails',district:'Токтоналиева 52',rating:'4.9',experience:'Опыт 5 лет',avatar:'assets/diana-new.png'},
{name:'Valeria Nails',cat:'nails',district:'Аламедин Grand',rating:'4.8',experience:'Опыт 5 лет',avatar:'assets/valeria-new.png'},
{name:'Marina Nails',cat:'nails',district:'Район Карла Маркса',rating:'4.9',experience:'Опыт 8 лет',avatar:'assets/marina-new.png'},
{name:'Nina Nails',cat:'nails',district:'5 микрорайон, дом 2',rating:'4.9',experience:'Опыт 11 лет',avatar:'assets/nina-new.png'},
{name:'Nellinails Studio',cat:'nails',district:'Куйбышева 93',rating:'4.8',experience:'Студия маникюра',avatar:'assets/nellinails-new.png'},
{name:'Bogdan Nails',cat:'nails',district:'Бишкек',rating:'4.7',experience:'Индивидуальная запись',avatar:'assets/bogdan-new.png'}];
const snapIdeas=[
{master:0,cat:'nails',title:'Milky french',service:'Маникюр с покрытием',price:'от 1000 сом',photo:'assets/work-01.jpg'},
{master:1,cat:'nails',title:'Pink clean nails',service:'Маникюр и дизайн',price:'от 1200 сом',photo:'assets/work-02.jpg'},
{master:2,cat:'lashes',title:'Wet effect lashes',service:'Наращивание ресниц',price:'от 1500 сом',photo:'assets/work-03.jpg'},
{master:3,cat:'brows',title:'Soft brows',service:'Ламинирование бровей',price:'от 1200 сом',photo:'assets/work-04.jpg'},
{master:5,cat:'nails',title:'Nail art',service:'Маникюр с дизайном',price:'от 1300 сом',photo:'assets/work-05.jpg'},
{master:6,cat:'nails',title:'French nails',service:'Френч',price:'от 1400 сом',photo:'assets/work-06.jpg'},
{master:4,cat:'nails',title:'Long oval',service:'Маникюр на длинные ногти',price:'от 1500 сом',photo:'assets/work-07.jpg'},
{master:8,cat:'nails',title:'Clean manicure',service:'Чистый маникюр',price:'от 1000 сом',photo:'assets/work-08.jpg'},
{master:9,cat:'nails',title:'Soft nude',service:'Маникюр однотонный',price:'от 1000 сом',photo:'assets/work-09.jpg'},
{master:10,cat:'nails',title:'Glossy nails',service:'Маникюр с покрытием',price:'от 1100 сом',photo:'assets/work-10.jpg'},
{master:2,cat:'lashes',title:'Natural volume',service:'Ресницы 2D',price:'от 1600 сом',photo:'assets/work-11.jpg'},
{master:3,cat:'brows',title:'Brow styling',service:'Коррекция и окрашивание',price:'от 900 сом',photo:'assets/work-12.jpg'}];
const getFavs=()=>JSON.parse(localStorage.getItem('pn_favs')||'[]');
const setFavs=v=>localStorage.setItem('pn_favs',JSON.stringify(v));
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
 syncMasterIdentityForWorks();
 const own=getMasterFeedWorks().map((x,i)=>({
   master:0,
   cat:x.cat||'nails',
   title:x.title||'Новая работа',
   service:x.service||'Работа мастера',
   price:x.price||'',
   photo:x.photo,
   custom:true,
   customIndex:i,
   workKey:x.id||`master:${i}`
 }));
 return [...own.reverse(), ...snapIdeas.map((x,i)=>({...x,i,workKey:`snap:${i}`}))];
}
function fileToWorkDataURL(file){
 return new Promise((resolve,reject)=>{
   const reader=new FileReader();
   reader.onload=()=>resolve(reader.result);
   reader.onerror=reject;
   reader.readAsDataURL(file);
 });
}
async function addMasterWorks(files){
 if(!hasMasterAccount()||!files?.length)return;
 const feed=getMasterFeedWorks();
 const profile=getMasterProfileForWorks();
 const profileWorks=Array.isArray(profile.works)?[...profile.works]:[];

 for(const file of [...files]){
   if(!file.type.startsWith('image/'))continue;
   const photo=await fileToWorkDataURL(file);
   const id='work_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);
   feed.push({
     id,
     photo,
     title:'Моя работа',
     service:'Работа мастера',
     cat:'nails',
     createdAt:new Date().toISOString()
   });
   profileWorks.unshift(photo);
 }
 saveMasterFeedWorks(feed);
 localStorage.setItem(MASTER_PROFILE_KEY,JSON.stringify({...profile,works:profileWorks}));
 renderSnap(document.querySelector('[data-filter].active')?.dataset.filter||'all');
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
 box.innerHTML=activeWorks.map((x,visibleIndex)=>{
   const m=masters[x.master]||masters[0];
   return `<button class="works-grid-item" onclick="openWorksViewer(${visibleIndex})" aria-label="${x.service||'Работа'}, ${m.name}">
     <img src="${x.photo}" alt="Работа ${m.name}" loading="lazy">
   </button>`;
 }).join('');
}
function openWorksViewer(index){
 const viewer=document.getElementById('worksViewer'),list=document.getElementById('worksViewerList'); if(!viewer||!list)return;
 const fav=getFavWorks();
 list.innerHTML=activeWorks.map((x)=>{
  const m=masters[x.master]||masters[0],k=x.workKey||`snap:${x.i}`,saved=fav.includes(k);
  return `<article class="works-viewer-slide">
  <img class="works-viewer-photo" src="${x.photo}" alt="Работа ${m.name}">
  <div class="works-viewer-info">
   <button class="works-viewer-master" onclick="openProfile(${x.master})"><img src="${m.avatar}" alt="${m.name}"><span><b>${m.name}</b><small>${m.district||''}</small></span></button>
   <div class="works-viewer-service" onclick="openProfile(${x.master})"><span>${x.service||'Работа мастера'}</span>${x.price?`<b>${x.price}</b>`:''}</div>
   <button class="works-viewer-like ${saved?'saved':''}" onclick="event.stopPropagation();toggleWork('${k}');this.classList.toggle('saved');this.textContent=this.classList.contains('saved')?'♥':'♡'">${saved?'♥':'♡'}</button>
  </div>
 </article>`}).join('');
 viewer.classList.add('open');viewer.setAttribute('aria-hidden','false');document.body.classList.add('viewer-open');
 requestAnimationFrame(()=>{const slide=list.children[index];slide?.scrollIntoView({block:'start'});});
}
function closeWorksViewer(){const viewer=document.getElementById('worksViewer');viewer?.classList.remove('open');viewer?.setAttribute('aria-hidden','true');document.body.classList.remove('viewer-open')}
function renderFavorites(tab='masters'){const box=document.getElementById('favoritePageContent');if(!box)return;document.querySelectorAll('[data-fav-tab]').forEach(b=>b.classList.toggle('active',b.dataset.favTab===tab));if(tab==='masters'){const ids=getFavs();box.innerHTML=ids.length?`<div class="favorite-page-list">${ids.map(i=>{const m=masters[i];return m?`<article class="favorite-page-master" onclick="openProfile(${i})"><img src="${m.avatar}"><div><h2>${m.name}</h2><p>★ ${m.rating} · ${m.experience}</p><small>⌖ ${m.district}</small></div><button onclick="event.stopPropagation();toggleMaster(${i})">♥</button></article>`:''}).join('')}</div>`:empty('Нет сохранённых мастеров','Нажмите сердечко на карточке мастера.')}else{const keys=getFavWorks();box.innerHTML=keys.length?`<div class="favorite-page-works">${keys.map(k=>{if(k.startsWith('snap:')){const x=snapIdeas[+k.split(':')[1]],m=x&&masters[x.master];if(!x||!m)return'';return `<article onclick="openProfile(${x.master})"><div class="fav-work-visual">${x.emoji}<button onclick="event.stopPropagation();toggleWork('${k}')">♥</button></div><b>${x.title}</b><small>${m.name}</small></article>`}const [mi,gi]=k.split(':').map(Number),m=masters[mi];if(!m)return'';return `<article onclick="openProfile(${mi})"><div class="fav-work-visual"><img src="${m.avatar}"><button onclick="event.stopPropagation();toggleWork('${k}')">♥</button></div><b>Работа мастера</b><small>${m.name}</small></article>`}).join('')}</div>`:empty('Нет сохранённых работ','Сохраняйте фото работ сердечком.')}}
function empty(h,p){return `<div class="favorite-page-empty"><span>♡</span><h2>${h}</h2><p>${p}</p></div>`}
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderSnap(b.dataset.filter)});
document.querySelectorAll('[data-fav-tab]').forEach(b=>b.onclick=()=>renderFavorites(b.dataset.favTab));
document.getElementById('worksViewerClose')?.addEventListener('click',closeWorksViewer);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeWorksViewer()});
setupMasterWorksAdd();renderSnap();renderFavorites();
