const masters=window.PNCloneMasters();
window.masters=masters;
const masterWorkSets=window.PN_MASTER_WORK_SETS.map(x=>[...x]);
try{
 const cp=JSON.parse(localStorage.getItem('pn_master_profile_0')||'null');
 if(cp && masters[0]){
  if(cp.name) masters[0].name=cp.name;
  if(cp.area||cp.address) masters[0].district=[cp.area,cp.address].filter(Boolean).join(' · ');
  if(cp.experience) masters[0].experience=cp.experience;
  if(cp.about) masters[0].desc=cp.about;
  if(cp.avatar) masters[0].avatar=cp.avatar;
  if(Number.isFinite(Number(cp.lat))) masters[0].lat=Number(cp.lat);
  if(Number.isFinite(Number(cp.lng))) masters[0].lng=Number(cp.lng);
  if(Array.isArray(cp.works)&&cp.works.length) masters[0].gallery=cp.works;
 }
}catch(e){}


function getServiceOffer(masterIndex, serviceIndex, service){
 const offers={
  '0:0':{type:'discount',label:'Знакомство с мастером',discount:20},
  '1:1':{type:'discount',label:'Студентам до 24 лет',discount:25},
  '4:0':{type:'discount',label:'Скидка мамам',discount:15},
  '5:0':{type:'model',label:'Ищу моделей'}
 };
 const offer=offers[`${masterIndex}:${serviceIndex}`]||null;
 const raw=parseInt(String(service.price||'').replace(/\D/g,''),10)||0;
 if(!offer) return {price:service.price,raw,oldPrice:null,discount:null,label:null,isModel:false};
 if(offer.type==='model') return {price:'0 сом',raw:0,oldPrice:null,discount:null,label:offer.label,isModel:true};
 const oldPrice=Math.round(raw/(1-offer.discount/100)/50)*50;
 return {price:service.price,raw,oldPrice:`${oldPrice} сом`,discount:offer.discount,label:offer.label,isModel:false};
}
function serviceOfferMarkup(offer){
 if(!offer.label) return '';
 if(offer.isModel) return `<span class="service-promo-badge model-badge">${offer.label}</span>`;
 return `<span class="service-promo-badge">${offer.label}</span><span class="discount-percent">-${offer.discount}%</span>`;
}



const CLIENT_MASTER_REVIEWS=[];


function getClientEditableProfile(index){
 const m=masters[index];
 if(m?._backend)return {user_id:m.user_id,name:m.name,profileName:m.name,area:m.area,address:m.address,experience:m.experience,about:m.about||m.desc,avatar:m.avatar,cover:m.cover,strengths:m.strengths||[],payment:m.payment,locationInfo:m.locationInfo,scheduleType:m.scheduleType,workDays:m.workDays||[],openTime:m.openTime,closeTime:m.closeTime,lat:m.lat,lng:m.lng,rating:m.rating,reviewsCount:m.reviewsCount};
 if(index!==0) return {};
 try{return JSON.parse(localStorage.getItem('pn_master_profile_0')||'{}')||{}}catch(e){return {}}
}
function getClientEditableServices(index){
 if(index!==0) return null;
 try{const x=JSON.parse(localStorage.getItem('pn_master_services_0')||'null');return Array.isArray(x)?x:null}catch(e){return null}
}
function clientWorkSchedule(p){
 try{
   const cfg=JSON.parse(localStorage.getItem('pn_master_schedule_config')||'null');
   if(cfg&&cfg.start&&cfg.end){
     return `${cfg.days||'Ежедневно'}, ${cfg.start}–${cfg.end}`;
   }
 }catch(e){}
 const days=p.workDays||[];
 let dayLabel=p.scheduleType||'Ежедневно';
 if(dayLabel==='Выбрать дни') dayLabel=days.length?days.join('/ '):'Дни не выбраны';
 return `${dayLabel}, ${p.openTime||'10:00'}–${p.closeTime||'21:00'}`;
}
function clientReviewPhoto(src){
 const ov=document.createElement('div');ov.className='review-photo-viewer';
 ov.innerHTML=`<button class="review-viewer-close" type="button">×</button><img src="${src}" alt="Фото к отзыву">`;
 document.body.appendChild(ov);
 ov.querySelector('.review-viewer-close').onclick=()=>ov.remove();
 ov.onclick=e=>{if(e.target===ov)ov.remove()};
}
function clientReviewCard(r){
 return `<article class="review-card">
  <div class="review-top"><div><b>${r.name}</b></div><span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span></div>
  <small>${r.date||''}</small>
  ${r.service?`<div class="review-service"><span>Услуга</span><b>${r.service}</b></div>`:''}
  <p>${r.text||''}</p>
  ${r.photos&&r.photos.length?`<div class="review-photo-grid">${r.photos.slice(0,3).map(x=>`<img src="${x}" alt="Фото к отзыву" onclick="clientReviewPhoto('${x}')">`).join('')}</div>`:''}
 </article>`;
}
function allClientReviews(index){
 const m=masters[index];
 if(m?._backend || getClientEditableProfile(index).user_id){
  try{const rows=JSON.parse(localStorage.getItem(`pn_public_reviews_${index}`)||'[]');return Array.isArray(rows)?rows.map(r=>({...r,name:r.name||'Клиент ProfiNavi'})):[]}catch(e){return []}
 }
 try{return JSON.parse(localStorage.getItem('pn_verified_reviews')||'[]').filter(r=>r.verified && Number(r.masterId||0)===Number(index))}catch(e){return []}
}
function showClientAllReviews(){
 const m=masters[masterIndex], p=getClientEditableProfile(masterIndex), list=allClientReviews(masterIndex);
 const rating=Number(p.rating??m.rating??0);
 const reviewsCount=Number(p.reviewsCount??m.reviewsCount??0);
 const ov=document.createElement('div');ov.className='master-edit-profile-overlay';
 ov.innerHTML=`<div class="master-edit-profile-screen reviews-full-screen">
   <header class="edit-profile-head"><button class="edit-close" type="button">‹ Назад</button><b>Отзывы</b><span></span></header>
   <section class="reviews-full-summary">${list.length?`<strong>${rating.toFixed(1)}</strong><div class="rating-summary-star">★</div><span>${Number(m.reviewsCount||list.length)} отзывов</span>`:'<strong>—</strong><span>Пока нет отзывов</span>'}</section>
   <section class="reviews-full-list">${list.map(clientReviewCard).join('')}</section>
 </div>`;
 document.body.appendChild(ov);ov.querySelector('.edit-close').onclick=()=>ov.remove();
}
function openClientWork(src){
 const ov=document.createElement('div');ov.className='review-photo-viewer';
 ov.innerHTML=`<button class="review-viewer-close" type="button">×</button><img src="${src}" alt="Работа мастера">`;
 document.body.appendChild(ov);ov.querySelector('.review-viewer-close').onclick=()=>ov.remove();ov.onclick=e=>{if(e.target===ov)ov.remove()};
}
function syncedServiceCard(s,i,m,p){
 const old=Number(s.price)||parseInt(String(s.price||'').replace(/\D/g,''),10)||0;
 const newPrice=(s.newPrice!==undefined && s.newPrice!==null && String(s.newPrice)!=='')?Number(s.newPrice):null;
 const hasNew=Number.isFinite(newPrice) && newPrice>=0 && newPrice<old;
 const final=hasNew?newPrice:old;
 const discount=hasNew&&old>0?Math.round((old-final)/old*100):0;
 const promo=s.promo||s._promo||'';
 const img=s.image || 'assets/service-placeholder.svg';
 const serviceName=(s.name||'Услуга').replace(/'/g,"\\'");
 return `<article class="full-menu-card client-matching-service" id="service-${i}">
   <img src="${img}" alt="${s.image?(s.name||'Услуга'):'Нет фото'}">
   <div class="full-menu-info">
     <div class="service-offer-line">${promo?`<span class="service-promo-badge">${promo}</span>`:''}${discount?`<span class="discount-percent">-${discount}%</span>`:''}</div>
     <h3>${s.name||'Услуга'}</h3>
     <div class="service-price-row">${hasNew?`<strong class="promo-price">${final} сом</strong><span class="old-service-price">${old} сом</span>`:`<strong class="regular-price">${old} сом</strong>`}</div>
     <small>${s.time||''}</small>
   </div>
   <button class="service-book-btn profile-service-book" onclick="showBooking('${serviceName}')">Записаться</button>
 </article>`;
}

const params=new URLSearchParams(location.search);
let masterIndex=Number(params.get('id')||0);
const requestedServiceIndex=Number(params.get('service'));
const hasRequestedService=Number.isInteger(requestedServiceIndex)&&requestedServiceIndex>=0;
if(!Number.isInteger(masterIndex)||masterIndex<0) masterIndex=0;
const getFavs=()=>JSON.parse(localStorage.getItem('pn_favs')||'[]');
const setFavs=v=>localStorage.setItem('pn_favs',JSON.stringify(v));
function profileGallery(m){
 const images=(m.gallery||Array.from({length:9},()=>m.avatar)).slice(0,10);
 return images.map((src,j)=>`<button class="profile-grid-item" onclick="window.open('${src}','_blank')"><img src="${src}" alt="Работа ${j+1}"><span>${j<3?'✦':''}</span></button>`).join('');
}
function profileMenu(m){
 const list=m.services||[{name:'Основная услуга',desc:'',price:m.price,time:'1,5 ч.'}];
 return list.map((x,j)=>{
  const offer=getServiceOffer(masterIndex,j,x);
  const safeName=x.name.replace(/'/g,"\'");
  return `<article class="full-menu-card${hasRequestedService&&j===requestedServiceIndex?' requested-service':''}" id="service-${j}">
   <img src="${(m.gallery&&m.gallery[j%m.gallery.length])||m.avatar}" alt="${x.name}">
   <div class="full-menu-info"><div class="service-offer-line">${serviceOfferMarkup(offer)}</div><h3>${x.name}</h3>${x.desc?`<p>${x.desc}</p>`:''}<div class="service-price-row"><strong class="${offer.label?'promo-price':'regular-price'}">${offer.price}</strong>${offer.oldPrice?`<span class="old-service-price">${offer.oldPrice}</span>`:''}</div><small>${x.time}</small></div>
   <button class="service-book-btn profile-service-book" onclick="showBooking('${safeName}')">Записаться</button>
  </article>`;
 }).join('');
}
function toggleFav(){
 const favs=getFavs(); const pos=favs.indexOf(masterIndex);
 pos>=0?favs.splice(pos,1):favs.push(masterIndex); setFavs(favs); renderProfile();
}
function showBooking(service){
 const params=new URLSearchParams({master:String(masterIndex),service});
 location.href=`booking.html?${params.toString()}`;
}
function renderProfile(){
 const m=masters[masterIndex];
 if(!m){document.getElementById('profileContent').innerHTML='<div class="master-empty" style="padding:48px 20px;text-align:center">Загружаем профиль…</div>';return;}
 const fav=getFavs().includes(masterIndex);
 const p=getClientEditableProfile(masterIndex);
 const data=getClientEditableServices(masterIndex) || m.services || [{name:'Основная услуга',price:parseInt(String(m.price||'').replace(/\D/g,''),10)||0,time:'1,5 ч.'}];
 const gallery=(p.works&&p.works.length?p.works:m.gallery)||[m.avatar];
 const cover=p.cover||gallery[0]||p.avatar||m.avatar;
 const avatar=p.avatar||m.avatar;
 const name=p.name||m.name;
 const area=p.area || String(m.district||'').split('·')[0].trim();
 const rating=Number(p.rating??m.rating??0);
 const reviewsCount=Number(p.reviewsCount??m.reviewsCount??0);
 const about=p.about||m.desc||'';
 const strengths=(p.strengths&&p.strengths.length?p.strengths:['Аккуратность','Современный дизайн','Консультация']);
 const payment=p.payment||'Наличными и переводом';
 const address=p.address||m.district||'Бишкек';
 const reviewsList=allClientReviews(masterIndex);
 const reviews=reviewsCount;
 const ratingView=window.PNRanking?.ratingHtml?window.PNRanking.ratingHtml({...m,rating,reviewsCount:reviews}):(reviews?`★ ${rating.toFixed(1)}`:'Нет отзывов');

 document.title=`${name} — ProfiNavi`;
 document.getElementById('profileContent').innerHTML=`
  <div class="profile-screen client-exact-profile">
   <header class="profile-screen-head">
    <button class="profile-back" onclick="history.length>1?history.back():location.href='client.html'" aria-label="Назад">‹</button>
    <div class="profile-head-title"><img src="${avatar}" alt="${name}"><b>${name}</b></div>
    <button class="profile-head-fav ${fav?'saved':''}" onclick="toggleFav()" aria-label="Сохранить">${fav?'♥':'♡'}</button>
   </header>

   <section class="profile-cover" style="background-image:url('${cover}')"></section>

   <section class="profile-summary-card">
    <img class="profile-main-avatar" src="${avatar}" alt="Фото ${name}">
    <div class="profile-summary-main">
      <h1>${name}</h1>
      <p>${area?`Район: ${area}`:'Район не указан'}</p>
      <div class="profile-rating"><span>${ratingView}</span><button class="reviews-link" onclick="showClientAllReviews()">${reviews} отзывов</button></div>
    </div>
    <div class="profile-save-count"><button class="profile-big-heart ${fav?'saved':''}" onclick="toggleFav()">${fav?'♥':'♡'}</button><small>${m.saves+(fav?1:0)}<br>сохранений</small></div>
   </section>

   <nav class="profile-tabs" id="profileTabs">
    <button class="active" data-target="works">Работы</button>
    <button data-target="menu">Услуги</button>
    <button data-target="about">О мастере</button>
    <button data-target="reviews">Отзывы</button>
    <button data-target="salon">Адрес</button>
   </nav>

   <main class="profile-tab-content">
    <section id="works" class="profile-pane profile-section" data-pane="works">
      <div class="master-section-head inline-profile-head"><h2>Работы</h2></div>
      <div class="profile-gallery-grid">${gallery.map((x,i)=>`<button class="profile-grid-item master-work-simple" onclick="openClientWork('${x}')"><img src="${x}" alt="Работа ${i+1}"></button>`).join('')}</div>
    </section>

    <section id="menu" class="profile-pane profile-section" data-pane="menu">
      <div class="profile-pane-head inline-profile-head"><h2>Услуги</h2></div>
      <div class="full-menu-list">${data.map((s,i)=>syncedServiceCard(s,i,m,p)).join('')}</div>
    </section>

    <section id="about" class="profile-pane profile-section" data-pane="about">
      <div class="inline-profile-head"><h2>О мастере</h2></div>
      <div class="profile-info-block"><h3>Самопрезентация</h3><p>${about||'Мастер пока не добавил описание.'}</p></div>
      <div class="profile-info-block"><div class="inline-profile-head strengths-title"><h3>Сильные стороны</h3></div><div class="tag-cloud">${strengths.map(x=>`<span>${x}</span>`).join('')}</div></div>
    </section>

    <section id="reviews" class="profile-pane profile-section" data-pane="reviews">
      <div class="inline-profile-head"><h2>Отзывы</h2><button class="text-btn" onclick="showClientAllReviews()">Все отзывы</button></div>
      ${reviews?`<div class="reviews-score"><strong>${rating.toFixed(1)}</strong><div class="rating-summary-star">★</div><span>${reviews} отзывов</span></div>${reviewsList.slice(0,2).map(clientReviewCard).join('')}<button class="show-all-reviews" onclick="showClientAllReviews()">Показать все отзывы</button>`:'<div class="master-empty">Пока нет подтверждённых отзывов</div>'}
    </section>

    <section id="salon" class="profile-pane profile-section" data-pane="salon">
      <div class="inline-profile-head"><h2>Адрес и информация</h2></div>
      <div class="salon-photo" style="background-image:url('${gallery[1]||cover}')"></div>
      <h3>${name}</h3>
      <div class="access-list">
        <p>◷ ${clientWorkSchedule(p)}</p>
        <p>₸ ${payment}</p>
        ${p.locationInfo?`<p>ⓘ ${p.locationInfo}</p>`:''}
      </div>
      <div class="profile-map-wrap">
        <div id="profileLeafletMap" class="profile-leaflet-map" aria-label="Карта расположения мастера"></div>
        <div class="profile-map-caption"><b>📍 ${address}</b>${area?`<span>Район: ${area}</span>`:''}</div>
      </div>
    </section>
   </main>
  </div>`;

 bindTabs();
 initProfileMap({...m,name,district:address,avatar});

 if(hasRequestedService){
  requestAnimationFrame(()=>setTimeout(()=>{
   const target=document.getElementById(`service-${requestedServiceIndex}`)||document.getElementById('menu');
   if(target){
    if(target.id!=='menu') target.classList.add('requested-service');
    const offset=(document.querySelector('.profile-screen-head')?.offsetHeight||0)+(document.getElementById('profileTabs')?.offsetHeight||0)+16;
    const y=target.getBoundingClientRect().top+window.scrollY-offset;
    window.scrollTo({top:Math.max(0,y),behavior:'smooth'});
    document.querySelectorAll('#profileTabs button').forEach(btn=>btn.classList.toggle('active',btn.dataset.target==='menu'));
   }
  },120));
 }
}

let profileMapInstance=null;
function initProfileMap(m){
 const el=document.getElementById('profileLeafletMap');
 if(!el || typeof L==='undefined') return;
 if(profileMapInstance){ profileMapInstance.remove(); profileMapInstance=null; }
 profileMapInstance=L.map(el,{zoomControl:false,attributionControl:false,scrollWheelZoom:false,tap:true}).setView([m.lat,m.lng],15);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(profileMapInstance);
 const icon=L.divIcon({className:'profile-map-pin-shell',html:`<div class="profile-map-pin">${m.emoji||'✦'}</div>`,iconSize:[44,52],iconAnchor:[22,48]});
 L.marker([m.lat,m.lng],{icon}).addTo(profileMapInstance).bindPopup(`<b>${m.name}</b><br>${m.district}`);
 setTimeout(()=>profileMapInstance?.invalidateSize(),80);
}

function bindTabs(){
 const tabs=[...document.querySelectorAll('#profileTabs button')];
 tabs.forEach(btn=>btn.onclick=()=>{
  const target=document.getElementById(btn.dataset.target);
  if(target){
   const offset=(document.querySelector('.profile-screen-head')?.offsetHeight||0)+(document.getElementById('profileTabs')?.offsetHeight||0)+12;
   const y=target.getBoundingClientRect().top+window.scrollY-offset;
   window.scrollTo({top:y,behavior:'smooth'});
  }
 });
 const sections=[...document.querySelectorAll('.profile-section')];
 const setActive=()=>{
  const marker=window.scrollY+(document.querySelector('.profile-screen-head')?.offsetHeight||0)+(document.getElementById('profileTabs')?.offsetHeight||0)+40;
  let current=sections[0]?.id;
  sections.forEach(sec=>{ if(sec.offsetTop<=marker) current=sec.id; });
  tabs.forEach(btn=>btn.classList.toggle('active',btn.dataset.target===current));
 };
 window.addEventListener('scroll',setActive,{passive:true});
 setActive();
}
renderProfile();


window.addEventListener('storage',e=>{
  if(e.key && (e.key.startsWith('pn_master_') || e.key==='pn_bookings')){
    location.reload();
  }
});


async function pnRenderProfileAddressMap(){
  const el=document.getElementById('masterAddressMap'); if(!el||!window.PNMap)return;
  let m=null;
  try{
    const id=Number(new URLSearchParams(location.search).get('id')||localStorage.getItem('selectedMasterId')||0);
    m=(window.masters||[]).find(x=>Number(x.id)===id)||(window.masters||[])[id]||(window.masters||[])[0];
  }catch(e){m=(window.masters||[])[0]}
  await PNMap.render(el,m,15);
}
window.addEventListener('load',()=>setTimeout(pnRenderProfileAddressMap,150));
window.addEventListener('pageshow',()=>setTimeout(pnRenderProfileAddressMap,150));

async function pnHydratePublicProfile(){
 try{
  const id=Number(new URLSearchParams(location.search).get('id')||0);
  const b=await window.PNBackendSync?.hydratePublicMasterCache?.(id);
  if(b&&window.PNRanking?.fromBundle){const dynamic=window.PNRanking.fromBundle(b.profile,b.services,b.works,b.slots||[]);if(dynamic){masters[id]=dynamic;try{localStorage.setItem(`pn_dynamic_master_${id}`,JSON.stringify(dynamic))}catch(e){}}}
  if(id===0&&b){const cp=getClientEditableProfile(0);if(cp.name)masters[0].name=cp.name;if(cp.avatar)masters[0].avatar=cp.avatar;if(cp.area||cp.address)masters[0].district=[cp.area,cp.address].filter(Boolean).join(' · ');if(Number.isFinite(Number(cp.lat)))masters[0].lat=Number(cp.lat);if(Number.isFinite(Number(cp.lng)))masters[0].lng=Number(cp.lng);if(cp.rating)masters[0].rating=cp.rating;if(Array.isArray(cp.works)&&cp.works.length)masters[0].gallery=cp.works;}
  renderProfile();
 }catch(e){console.warn('public profile sync',e);renderProfile()}
}
window.addEventListener('DOMContentLoaded',()=>setTimeout(pnHydratePublicProfile,100));
