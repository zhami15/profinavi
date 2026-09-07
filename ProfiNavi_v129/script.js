
(function cleanupLegacyClientUnreadV51(){
 try{
   localStorage.removeItem('pn_chat_unread');
   localStorage.removeItem('pn_client_chat_unread');
 }catch(e){}
})();


(function normalizeUnreadCountersV46(){
 for(const key of ['pn_master_chat_unread','pn_client_chat_unread']){
   try{
     const u=JSON.parse(localStorage.getItem(key)||'{}');
     let changed=false;
     Object.keys(u).forEach(k=>{
       if(!u[k]){delete u[k];changed=true}
       else if(u[k]!==1){u[k]=1;changed=true}
     });
     if(changed)localStorage.setItem(key,JSON.stringify(u));
   }catch(e){}
 }
})();

const masters=window.PNCloneMasters();
window.masters=masters;
function pnEscHtml(s){return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
const masterWorkSets=window.PN_MASTER_WORK_SETS.map(x=>[...x]);



function applyMasterProSyncToClientHome(){
 try{
   if(!Array.isArray(masters)||!masters[0])return;
   const master=masters[0];
   const p=JSON.parse(localStorage.getItem('pn_master_profile_0')||'null');

   if(p){
     if(p.name)master.name=p.name;
     if(p.avatar)master.avatar=p.avatar;
     if(p.area){
       master.area=p.area;
       master.district=p.address?`${p.area} · ${p.address}`:p.area;
     }else if(p.address){
       master.district=p.address;
     }
     if(p.address)master.address=p.address;
     if(Number.isFinite(Number(p.lat)))master.lat=Number(p.lat);
     if(Number.isFinite(Number(p.lng)))master.lng=Number(p.lng);
     if(p.about)master.desc=p.about;
     if(Array.isArray(p.works)){
       master.gallery=[...p.works];
       master.works=[...p.works];
     }
   }

   const saved=JSON.parse(localStorage.getItem('pn_master_services_0')||'null');
   if(Array.isArray(saved)){
     master.services=saved.map(x=>{
       const oldPrice=Number(x.price)||0;
       const newPrice=(x.newPrice!==undefined&&x.newPrice!==null&&String(x.newPrice)!=='')?Number(x.newPrice):null;
       const hasNew=Number.isFinite(newPrice)&&newPrice>=0&&newPrice<oldPrice;
       return {
         ...x,
         name:x.name||'Услуга',
         desc:x.desc||'',
         // IMPORTANT: keep the original price as the old price.
         // newPrice stays separate so client mode can calculate and show the discount.
         price:oldPrice,
         newPrice:hasNew?newPrice:null,
         time:x.time||'',
         image:x.image||'',
         _promo:x.promo||'',
         _discount:Number(x.discount)||0
       };
     });
     const first=master.services[0];
     if(first){
       master.service=first.name;
       const oldPrice=Number(first.price)||0;
       const newPrice=(first.newPrice!==undefined&&first.newPrice!==null)?Number(first.newPrice):null;
       master.price=`${Number.isFinite(newPrice)&&newPrice<oldPrice?newPrice:oldPrice} сом`;
     }
   }
 }catch(e){
   console.error('Master → client sync error',e);
 }
}
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


let current='all';let availabilityDate='';
const PN_HOME_CITIES={
 'Бишкек':{lat:42.8746,lng:74.5698,zoom:12},
 'Ош':{lat:40.5139,lng:72.8161,zoom:12},
 'Манас':{lat:40.9333,lng:72.9833,zoom:12},
 'Каракол':{lat:42.4907,lng:78.3936,zoom:12},
 'Нарын':{lat:41.4287,lng:75.9911,zoom:12},
 'Талас':{lat:42.5228,lng:72.2427,zoom:12},
 'Баткен':{lat:40.0626,lng:70.8194,zoom:12}
};
const PN_HOME_CITY_KEY='pn_home_city';
let selectedCity=PN_HOME_CITIES[localStorage.getItem(PN_HOME_CITY_KEY)]?localStorage.getItem(PN_HOME_CITY_KEY):'Бишкек';
function pnMasterCity(m){return String(m?.city||'Бишкек').trim()||'Бишкек'}
function pnMasterMatchesCity(m){return pnMasterCity(m)===selectedCity}
function pnMapUrl(){return `map.html?city=${encodeURIComponent(selectedCity)}`}
const masterAvailability={};
const quickDateMeta={};
function localDateKey(date){
 const y=date.getFullYear();
 const m=String(date.getMonth()+1).padStart(2,'0');
 const d=String(date.getDate()).padStart(2,'0');
 return `${y}-${m}-${d}`;
}
function setupQuickDates(){
 const buttons=[...document.querySelectorAll('.quick-date')];
 const weekday=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
 const availabilityPatterns=[[0,2,4,7,9],[1,3,5,8,10],[0,3,6,8,9]];
 const base=new Date();
 base.setHours(0,0,0,0);
 buttons.forEach((button,offset)=>{
  const date=new Date(base);
  date.setDate(base.getDate()+offset);
  const key=localDateKey(date);
  const title=offset===0?'Сегодня':offset===1?'Завтра':weekday[date.getDay()];
  const spoken=offset===0?'сегодня':offset===1?'завтра':`в ${weekday[date.getDay()].toLowerCase()}`;
  button.dataset.date=key;
  const titleEl=button.querySelector('b');
  const dateEl=button.querySelector('span');
  if(titleEl)titleEl.textContent=title;
  if(dateEl)dateEl.textContent=`${date.getDate()}/${date.getMonth()+1}`;
  button.querySelector('.today-discount-chip')?.remove();
  if(offset===0){
   const chip=document.createElement('em');
   chip.className='today-discount-chip';
   chip.textContent='Скидки';
   button.appendChild(chip);
  }
  quickDateMeta[key]={title,spoken,date};
  // Кнопка «Сегодня» с плашкой «Скидки» показывает только мастеров,
  // у которых хотя бы у одной услуги есть акция или предложение «Ищу моделей».
  if(offset===0){
   masterAvailability[key]=masters.reduce((ids,master,masterIndex)=>{
    const services=master.services||[{price:master.price}];
    const hasPromotion=services.some((service,serviceIndex)=>Boolean(getServiceOffer(masterIndex,serviceIndex,service).label));
    if(hasPromotion)ids.push(masterIndex);
    return ids;
   },[]);
  }else{
   masterAvailability[key]=availabilityPatterns[offset]||[];
  }
 });
}
setupQuickDates();

// Настоящая карта 2GIS MapGL.
// Ключ можно задать в localStorage через интерфейс сайта или в window.PROFINAVI_2GIS_KEY.
const TWO_GIS_KEY_STORAGE = 'pn_2gis_api_key';
let twoGisMap = null;
let twoGisMarkers = [];
let userLocationMarker = null;
let userLocation = null;


function distanceKm(lat1,lng1,lat2,lng2){
 const toRad=x=>x*Math.PI/180;
 const R=6371;
 const dLat=toRad(lat2-lat1), dLng=toRad(lng2-lng1);
 const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
 return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function distanceLabel(km){
 if(km<1) return `${Math.max(1,Math.round(km*1000))} м от вас`;
 return `${km.toFixed(km<10?1:0)} км от вас`;
}
function sortedMasters(list){
 const ranked=window.PNRanking?.rank?window.PNRanking.rank(list):list.slice();
 if(!userLocation)return ranked;
 // Keep marketplace rank primary; distance is only a tie-breaker for similar scores.
 return ranked.slice().sort((a,b)=>{
   const ds=Math.abs(Number(b.topScore||0)-Number(a.topScore||0));
   if(ds>=3)return Number(b.topScore||0)-Number(a.topScore||0);
   return distanceKm(userLocation.lat,userLocation.lng,a.lat,a.lng)-distanceKm(userLocation.lat,userLocation.lng,b.lat,b.lng);
 });
}
function renderUserLocationMarker(){
 if(!twoGisMap || !window.mapgl || !userLocation) return;
 userLocationMarker?.destroy?.();
 const el=document.createElement('div');
 el.className='user-location-marker';
 el.innerHTML='<span></span>';
 el.title='Вы здесь';
 userLocationMarker=new mapgl.Marker(twoGisMap,{coordinates:[userLocation.lng,userLocation.lat],icon:el});
}
function focusMapOnUserAndMasters(){
 if(!twoGisMap || !userLocation) return;
 const visible=masters.filter(m=>pnMasterMatchesCity(m)&&(current==='all'||m.cat===current));
 const points=[[userLocation.lng,userLocation.lat],...visible.map(m=>[m.lng,m.lat])];
 const lngs=points.map(p=>p[0]), lats=points.map(p=>p[1]);
 const bounds=[[Math.min(...lngs),Math.min(...lats)],[Math.max(...lngs),Math.max(...lats)]];
 if(typeof twoGisMap.fitBounds==='function') twoGisMap.fitBounds(bounds,{padding:70,duration:700});
 else { twoGisMap.setCenter?.([userLocation.lng,userLocation.lat],{duration:600}); twoGisMap.setZoom?.(13,{duration:600}); }
}
function requestUserLocation(){
 const status=document.getElementById('homeMapStatus');
 if(!navigator.geolocation){if(status)status.textContent='Геолокация не поддерживается';return;}
 navigator.geolocation.getCurrentPosition(pos=>{
  userLocation={lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy};
  localStorage.setItem('pn_user_location',JSON.stringify(userLocation));
  renderUserLocationMarker();
  focusMapOnUserAndMasters();
  applyMasterProSyncToClientHome();
render();
  if(status)status.textContent='Показываем мастеров рядом с вами';
 },err=>{
  if(status)status.textContent=err.code===1?'Разрешите геолокацию в браузере':`Показываем мастеров: ${selectedCity}`;
 },{enableHighAccuracy:true,timeout:15000,maximumAge:60000});
}

function get2GisKey(){
 return String(window.PROFINAVI_2GIS_KEY || localStorage.getItem(TWO_GIS_KEY_STORAGE) || '').trim();
}
function load2GisScript(){
 if(window.mapgl) return Promise.resolve();
 return new Promise((resolve,reject)=>{
  const existing=document.querySelector('script[data-2gis-mapgl]');
  if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return;}
  const script=document.createElement('script');
  script.dataset.gisMapgl='true';
  script.src='https://mapgl.2gis.com/api/js/v1';
  script.async=true;
  script.onload=resolve;
  script.onerror=reject;
  document.head.appendChild(script);
 });
}
function show2GisConnect(){
 document.getElementById('twoGisMap')?.classList.add('hidden');
 document.getElementById('mapConnect')?.classList.remove('hidden');
}
function show2GisError(message){
 const mapEl=document.getElementById('twoGisMap');
 if(!mapEl)return;
 mapEl.querySelector('.map-error')?.remove();
 const box=document.createElement('div');
 box.className='map-error';
 box.textContent=message;
 mapEl.appendChild(box);
}
async function init2GisMap(force=false){
 const mapEl=document.getElementById('twoGisMap');
 const connect=document.getElementById('mapConnect');
 if(!mapEl)return;
 const key=get2GisKey();
 if(!key){show2GisConnect();return;}
 if(twoGisMap && !force){mapEl.classList.remove('hidden');connect?.classList.add('hidden');return;}
 try{
  await load2GisScript();
  if(twoGisMap){twoGisMarkers.forEach(x=>x.destroy?.());twoGisMarkers=[];twoGisMap.destroy?.();twoGisMap=null;}
  connect?.classList.add('hidden');
  mapEl.classList.remove('hidden');
  mapEl.innerHTML='';
  twoGisMap = new mapgl.Map('twoGisMap', {
   center: [PN_HOME_CITIES[selectedCity].lng, PN_HOME_CITIES[selectedCity].lat],
   zoom: PN_HOME_CITIES[selectedCity].zoom,
   key
  });
  render2GisMarkers();
  renderUserLocationMarker();
 }catch(error){
  console.error('2GIS MapGL error',error);
  mapEl.classList.remove('hidden');
  connect?.classList.add('hidden');
  show2GisError('Карта 2GIS не загрузилась. Проверьте API‑ключ и разрешённый домен.');
 }
}
function render2GisMarkers(){
 if(!twoGisMap || !window.mapgl) return;
 twoGisMarkers.forEach(marker => marker.destroy?.());
 twoGisMarkers = [];
 masters.forEach((m,i)=>{
  if(!pnMasterMatchesCity(m) || (current !== 'all' && m.cat !== current)) return;
  const el=document.createElement('button');
  el.className='dg-marker';
  el.type='button';
  el.textContent=m.emoji;
  el.title=m.name;
  el.setAttribute('aria-label',`Открыть профиль ${m.name}`);
  el.onclick=(event)=>{event.stopPropagation();openProfile(i);};
  twoGisMarkers.push(new mapgl.Marker(twoGisMap, {
   coordinates: [m.lng, m.lat],
   icon: el
  }));
 });
}
function open2GisKeyModal(){
 const modal=document.getElementById('apiKeyModal');
 const input=document.getElementById('twoGisKeyInput');
 if(input)input.value=get2GisKey();
 modal?.classList.remove('hidden');
 setTimeout(()=>input?.focus(),50);
}
function close2GisKeyModal(){document.getElementById('apiKeyModal')?.classList.add('hidden')}
function save2GisKey(){
 const input=document.getElementById('twoGisKeyInput');
 const key=String(input?.value||'').trim();
 if(!key){input?.focus();return;}
 localStorage.setItem(TWO_GIS_KEY_STORAGE,key);
 close2GisKeyModal();
 init2GisMap(true);
}

const grid=document.getElementById('mastersGrid');const search=document.getElementById('searchInput');
const getFavs=()=>JSON.parse(localStorage.getItem('pn_favs')||'[]');
const setFavs=v=>{localStorage.setItem('pn_favs',JSON.stringify(v));if(window.PNData&&window.PNAuth)PNAuth.currentUser().then(u=>{if(!u)return;PNData.listLegacyFavorites().then(old=>{const a=new Set(v.map(Number)),b=new Set(old.map(Number));[...a].filter(x=>!b.has(x)).forEach(x=>PNData.setLegacyFavorite(x,true).catch(()=>{}));[...b].filter(x=>!a.has(x)).forEach(x=>PNData.setLegacyFavorite(x,false).catch(()=>{}))}).catch(()=>{})}).catch(()=>{})};
let pnSavedWorkIds=new Set();
const getFavWorks=()=>[...pnSavedWorkIds].map(id=>`work:${id}`);
const pnIsWorkSaved=id=>!!id&&pnSavedWorkIds.has(String(id));
function pnLegacySavedWorkIds(){try{const raw=JSON.parse(localStorage.getItem('pn_fav_works')||'[]');if(!Array.isArray(raw))return[];const ids=[];raw.map(String).forEach(k=>{if(k.startsWith('work:')){const id=k.slice(5);if(id)ids.push(id);return}const m=k.match(/^(\d+):(\d+)$/);if(!m)return;const id=masters[Number(m[1])]?.workItems?.[Number(m[2])]?.id;if(id)ids.push(String(id))});return[...new Set(ids)]}catch(e){return[]}};
async function pnSyncWorkFavorites(){if(!window.PNData?.listMyWorkLikes||!window.PNAuth){pnSavedWorkIds.clear();return}let user=null;try{user=await PNAuth.currentUser()}catch(e){}if(!user){pnSavedWorkIds.clear();return}try{const db=new Set((await PNData.listMyWorkLikes()).map(String));for(const id of pnLegacySavedWorkIds())if(!db.has(id)){await PNData.setWorkLike(id,true);db.add(id)}pnSavedWorkIds=db;localStorage.removeItem('pn_fav_works')}catch(e){console.warn('Work favorites sync:',e)}}
const getChats=()=>JSON.parse(localStorage.getItem('pn_chats')||'{}');
const setChats=v=>localStorage.setItem('pn_chats',JSON.stringify(v));
function getClientChatReads(){return JSON.parse(localStorage.getItem('pn_client_chat_read_at_v49')||'{}')}
function updateChatBadge(){
 const chats=getChats(),reads=getClientChatReads();
 const bookings=(JSON.parse(localStorage.getItem('pn_bookings')||'[]')||[]);
 const validIds=new Set((Array.isArray(bookings)?bookings:[]).map(b=>String(b.id)).filter(Boolean));

 const bookingUnread=[...validIds].filter(id=>{
   const msgs=chats[id]||[];
   const lastMaster=[...msgs].reverse().find(x=>x.from==='master');
   return !!(lastMaster && Number(lastMaster.ts||0)>Number(reads[id]||0));
 }).length;
 const supportUnread=localStorage.getItem('pn_support_unread')==='1'?1:0;
 const count=bookingUnread+supportUnread;

 const badge=document.getElementById('chatNavBadge');
 if(badge){
   badge.textContent=count?String(count):'';
   badge.classList.toggle('hidden',count===0);
 }
}
function updateStats(){
 const favs=getFavs();
 const chats=getChats();
 const fav=document.getElementById('favCount');
 const chat=document.getElementById('chatCount');
 if(fav)fav.textContent=favs.length;
 if(chat)chat.textContent=Object.keys(chats).length;
 if(typeof updateChatBadge==='function')updateChatBadge();
}
function galleryItems(m){
 const mi=masters.indexOf(m);
 const items=Array.isArray(m.workItems)&&m.workItems.length?m.workItems.map((w,j)=>({src:w.image_url,id:w.id,j})):(m.gallery||Array.from({length:6},()=>m.avatar)).map((src,j)=>({src,id:null,j}));
 return items.slice(0,10).map(x=>{const saved=pnIsWorkSaved(x.id);return `<div class="work-thumb" role="button" tabindex="0" onclick="event.stopPropagation();openProfile(${mi})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();openProfile(${mi})}"><img src="${pnEscHtml(x.src)}" alt="Работа ${pnEscHtml(m.name)} ${x.j+1}" loading="lazy">${x.id?`<button class="work-fav ${saved?'saved':''}" aria-label="Лайк и сохранить работу" onclick="event.stopPropagation();toggleWorkFav('${pnEscHtml(x.id)}')">${saved?'♥':'♡'}</button>`:''}</div>`}).join('');
}
function serviceItems(m){
 const list=m.services||[{name:m.cat==='lashes'?'Наращивание ресниц':'Основная услуга',desc:m.desc,price:m.price,time:'1,5 ч.'}];
 const mi=masters.indexOf(m);

 // For the editable ProfiNavi Pro master (index 0), client Home must use
 // exactly the same price source and calculation as profile.js.
 // No legacy/demo discount is mixed into saved Master Mode services.
 const isSyncedMaster = mi===0 && Array.isArray(list);

 const prepared=list.map((x,originalIndex)=>{
   const old=Number(x.price)||parseInt(String(x.price||'').replace(/\D/g,''),10)||0;
   const np=(x.newPrice!==undefined && x.newPrice!==null && String(x.newPrice)!=='') ? Number(x.newPrice) : null;
   const hasNew=Number.isFinite(np) && np>=0 && np<old;
   const finalPrice=hasNew ? np : old;
   const calculatedDiscount=hasNew && old>0 ? Math.round((old-finalPrice)/old*100) : 0;
   const promo=x.promo||x._promo||'';

   let label=promo;
   let discount=calculatedDiscount;
   let oldPrice=hasNew ? old : null;
   let hasDiscount=hasNew;

   // Keep demo offers only for untouched demo masters.
   if(!isSyncedMaster){
     const legacyOffer=getServiceOffer(mi,originalIndex,x);
     if(!hasNew && legacyOffer.label){
       label=promo||legacyOffer.label||'';
       discount=Number(legacyOffer.discount)||0;
       const legacyFinal=Number(String(legacyOffer.price||'').replace(/\D/g,''))||old;
       const legacyOld=legacyOffer.oldPrice?Number(String(legacyOffer.oldPrice).replace(/\D/g,'')):null;
       return {
         x,originalIndex,
         hasDiscount:!!legacyOld,
         finalPrice:legacyFinal,
         oldPrice:legacyOld,
         label,
         discount
       };
     }
   }

   return {x,originalIndex,hasDiscount,finalPrice,oldPrice,label,discount};
 }).sort((a,b)=>Number(b.hasDiscount)-Number(a.hasDiscount)||a.originalIndex-b.originalIndex);

 return prepared.map(({x,originalIndex,hasDiscount,finalPrice,oldPrice,label,discount})=>{
   const image=x.image||'assets/service-placeholder.svg';
   const hasOwnImage=!!x.image;

   return `<div class="service-preview" role="button" tabindex="0"
     onclick="event.stopPropagation();openServiceProfile(${mi},${originalIndex})"
     onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();openServiceProfile(${mi},${originalIndex})}">
     <div class="service-preview-image-wrap ${hasOwnImage?'':'no-service-image'}">
       <img src="${pnEscHtml(image)}" alt="${hasOwnImage?pnEscHtml(x.name):'Нет фото'}">
       ${oldPrice!==null && finalPrice<oldPrice && discount?`<span class="service-image-discount">-${discount}%</span>`:''}
     </div>

     <div class="service-preview-copy">
       <div class="service-offer-line">${label?`<span class="service-promo-badge">${pnEscHtml(label)}</span>`:''}</div>
       <b>${pnEscHtml(x.name||'Услуга')}</b>
       <p class="service-preview-desc">${pnEscHtml(x.desc||'')}</p>
       <div class="service-preview-price">
         <strong class="${hasDiscount?'promo-price':'regular-price'}">${finalPrice} сом</strong>
         ${oldPrice!==null?`<span class="old-service-price">${oldPrice} сом</span>`:''}
       </div>
       <small>◷ ${pnEscHtml(x.time||'')}</small>
     </div>
   </div>`;
 }).join('');
}

function masterMatchesQuickDate(m,i,dateKey){
 if(!dateKey)return true;
 if(m?._backend){
   const todayKey=localDateKey(new Date());
   if(dateKey===todayKey){
     return (m.services||[]).some(s=>Boolean(s.promo)||((s.newPrice!==null&&s.newPrice!==undefined)&&Number(s.newPrice)<Number(s.oldPrice||Infinity)));
   }
   return !!(m.slotMap?.[dateKey]?.length);
 }
 return (masterAvailability[dateKey]||[]).includes(i);
}
function openProfile(i){
 const id=Number(i);
 if(!Number.isFinite(id))return;
 window.location.href=`profile.html?id=${encodeURIComponent(id)}`;
}
function openServiceProfile(masterIndex,serviceIndex){
 const mi=Number(masterIndex),si=Number(serviceIndex);
 if(!Number.isFinite(mi)||!Number.isFinite(si))return;
 const params=new URLSearchParams({id:String(mi),service:String(si)});
 window.location.href=`profile.html?${params.toString()}#menu`;
}

function render(){
 applyMasterProSyncToClientHome();
 const q=(search?.value||'').toLowerCase().trim();const favs=getFavs();
 const data=sortedMasters(masters.filter((m,i)=>pnMasterMatchesCity(m)&&(current==='all'||m.cat===current)&&masterMatchesQuickDate(m,i,availabilityDate)&&`${m.name} ${m.district} ${m.desc}`.toLowerCase().includes(q)));
 document.getElementById('countText').textContent=`Найдено: ${data.length}`;
 grid.innerHTML=data.length?data.map((m)=>{const i=masters.indexOf(m);return `<article class="master-card" onclick="openProfile(${i})">
  <div class="master-card-head">
   <div class="master-identity"><img class="master-avatar" src="${pnEscHtml(m.avatar)}" alt="Фото ${pnEscHtml(m.name)}"><div><div class="name">${pnEscHtml(m.name)}</div><div class="master-stats"><span>${window.PNRanking?.ratingHtml?window.PNRanking.ratingHtml(m):('★ '+m.rating)}</span><span>Район: ${pnEscHtml(m.area||'не указан')}</span></div></div></div>
   <div class="save-wrap"><button class="fav-card" aria-label="Сохранить мастера" onclick="event.stopPropagation();toggleFav(${i})">${favs.includes(i)?'♥':'♡'}</button><small>${Number(m.saves)||0} сохранений</small></div>
  </div>
  <div class="works-carousel">${galleryItems(m)}</div>
  <div class="services-carousel">${serviceItems(m)}</div>
 </article>`}).join(''):`<div class="favorites-empty pn-directory-empty"><b>✦</b><h3>Пока нет мастеров</h3><p>Опубликованные мастера появятся здесь автоматически.</p></div>`;updateStats();
}
async function toggleFav(i){
 const id=Number(i),favs=getFavs(),pos=favs.indexOf(id),turningOn=pos<0;
 if(turningOn)favs.push(id);else favs.splice(pos,1);
 localStorage.setItem('pn_favs',JSON.stringify(favs));
 render();renderFavorites();
 try{
   const user=await window.PNAuth?.currentUser?.();
   if(!user)return;
   const result=await window.PNData?.setLegacyFavorite?.(id,turningOn);
   if(result&&masters[id]&&Number.isFinite(Number(result.savesCount))){masters[id].saves=Number(result.savesCount);try{localStorage.setItem(`pn_dynamic_master_${id}`,JSON.stringify(masters[id]))}catch(e){}}
   render();renderFavorites();
 }catch(e){
   console.warn('Favorite sync:',e);
   const currentFavs=getFavs(),idx=currentFavs.indexOf(id);
   if(turningOn&&idx>=0)currentFavs.splice(idx,1);
   if(!turningOn&&idx<0)currentFavs.push(id);
   localStorage.setItem('pn_favs',JSON.stringify(currentFavs));
   render();renderFavorites();
 }
}
async function toggleWorkFav(workId){const id=String(workId||'');if(!id||!window.PNData?.setWorkLike||!window.PNAuth)return;let user=null;try{user=await PNAuth.currentUser()}catch(e){}if(!user){alert('Чтобы поставить лайк и сохранить работу, войдите как клиент.');return}const on=!pnIsWorkSaved(id);try{const result=await PNData.setWorkLike(id,on);if(on)pnSavedWorkIds.add(id);else pnSavedWorkIds.delete(id);masters.filter(Boolean).forEach(m=>(m.workItems||[]).forEach(w=>{if(String(w.id)===id)w.likesCount=Number(result.likesCount)||0}));render();renderFavorites()}catch(e){alert('Не удалось сохранить работу: '+e.message)}}
document.querySelectorAll('.cat').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.cat').forEach(b=>b.classList.remove('active'));btn.classList.add('active');current=btn.dataset.category;render();render2GisMarkers();renderHomeLeafletMarkers();});
document.querySelectorAll('.quick-date').forEach(btn=>btn.addEventListener('click',()=>{
 const next=btn.dataset.date;
 availabilityDate=availabilityDate===next?'':next;
 document.querySelectorAll('.quick-date').forEach(b=>b.classList.toggle('active',b.dataset.date===availabilityDate));
 document.querySelector('.quick-date-filter')?.classList.toggle('filtered',Boolean(availabilityDate));
 render();
}));
search?.addEventListener('input',render);
document.getElementById('homeMapOpen')?.addEventListener('click',(event)=>{event.stopPropagation();window.location.href=pnMapUrl()});
const homeCitySelect=document.getElementById('homeCitySelect');
if(homeCitySelect){
 homeCitySelect.value=selectedCity;
 homeCitySelect.addEventListener('change',()=>{
   selectedCity=PN_HOME_CITIES[homeCitySelect.value]?homeCitySelect.value:'Бишкек';
   localStorage.setItem(PN_HOME_CITY_KEY,selectedCity);
   availabilityDate='';
   document.querySelectorAll('.quick-date').forEach(b=>b.classList.remove('active'));
   document.querySelector('.quick-date-filter')?.classList.remove('filtered');
   render();
   render2GisMarkers();
   renderHomeLeafletMarkers();
   const city=PN_HOME_CITIES[selectedCity];
   if(twoGisMap&&city){twoGisMap.setCenter?.([city.lng,city.lat]);twoGisMap.setZoom?.(city.zoom);}
 });
}
/* v87: home map uses Leaflet/OpenStreetMap only */
document.querySelectorAll('.pin').forEach(p=>p.onclick=()=>openProfile(Number(p.dataset.master)));
function openModal(id){document.getElementById(id).classList.remove('hidden')}function closeModal(id){document.getElementById(id).classList.add('hidden')}
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));document.querySelectorAll('.modal').forEach(m=>m.onclick=e=>{if(e.target===m)m.classList.add('hidden')});
document.getElementById('openAccount')?.addEventListener('click',()=>{openModal('accountModal')});
document.getElementById('clearTestData')?.addEventListener('click',()=>{
 const ok=confirm('Очистить тестовые записи и чаты?');
 if(!ok)return;

 localStorage.removeItem('pn_bookings');
 localStorage.removeItem('pn_booking');
 localStorage.removeItem('pn_chats');

 localStorage.removeItem('pn_client_chat_read_at_v49');
 localStorage.removeItem('pn_client_chat_read_at');
 localStorage.removeItem('pn_client_chat_unread');
 localStorage.removeItem('pn_master_chat_read_at_v49');
 localStorage.removeItem('pn_master_chat_read_at');
 localStorage.removeItem('pn_master_chat_unread');

 Object.keys(localStorage).forEach(key=>{
   if(key.startsWith('pn_chat_'))localStorage.removeItem(key);
 });

 try{renderUpcomingBooking()}catch(e){}
 try{if(typeof updateChatBadge==='function')updateChatBadge()}catch(e){}
 alert('Тестовые данные очищены.');
 closeModal('accountModal');
});

document.getElementById('openChats')?.addEventListener('click',()=>location.href='chats.html');
document.getElementById('bottomChats')?.addEventListener('click',()=>location.href='chats.html');
document.getElementById('accountChats')?.addEventListener('click',()=>location.href='chats.html');
document.getElementById('clearDemo')?.addEventListener('click',()=>{localStorage.removeItem('pn_favs');localStorage.removeItem('pn_fav_works');localStorage.removeItem('pn_chats');localStorage.removeItem('pn_bookings');localStorage.removeItem('pn_client_chat_unread');masters.forEach((_,i)=>localStorage.removeItem(`pn_chat_${i}`));render();renderUpcomingBooking();updateStats();});

function getBookings(){
 const list=JSON.parse(localStorage.getItem('pn_bookings')||'null');
 if(Array.isArray(list)) return list;
 const legacy=JSON.parse(localStorage.getItem('pn_booking')||'null');
 if(legacy){localStorage.setItem('pn_bookings',JSON.stringify([legacy]));localStorage.removeItem('pn_booking');return [legacy]}
 return [];
}
function saveBookings(list){localStorage.setItem('pn_bookings',JSON.stringify(list));renderUpcomingBooking()}
function bookingDateTime(b){
 const base=new Date(b?.date||'');
 if(Number.isNaN(base.getTime())) return null;
 const parts=String(b?.time||'00:00').split(':').map(Number);
 return new Date(base.getFullYear(),base.getMonth(),base.getDate(),parts[0]||0,parts[1]||0,0,0);
}
function isChatExpired(b){const dt=bookingDateTime(b);return dt?Date.now()>=dt.getTime()+72*60*60*1000:false}

function getBooking(){return getBookings()[0]||null}
function saveBooking(b){const list=getBookings();list.unshift(b);saveBookings(list)}
function updateBookingStatus(id,status){const list=getBookings();const b=list.find(x=>x.id===id);if(!b)return;b.status=status;saveBookings(list)}
function pnMasterForBooking(b){
 const id=Number(b?.master);
 let m=Number.isFinite(id)?masters[id]:null;
 if(!m&&Number.isFinite(id)){
  try{m=JSON.parse(localStorage.getItem(`pn_dynamic_master_${id}`)||'null')}catch(e){}
 }
 return m||{
  id:Number.isFinite(id)?id:0,
  name:b?.masterName||'Мастер ProfiNavi',
  avatar:'icon-192.png',
  district:'',
  rating:0,
  experience:''
 };
}
async function pnCancelClientBooking(id){
 const list=getBookings(),b=list.find(x=>String(x.id)===String(id));if(!b||b.status==='cancelled'||b.status==='completed'||b.status==='done')return;
 if(!confirm('Отменить эту запись?'))return;
 try{if(b.syncedToSupabase&&window.PNData)await PNData.updateBookingStatus(b.id,'cancelled');b.status='cancelled';b.cancelledAt=new Date().toISOString();localStorage.setItem('pn_bookings',JSON.stringify(list));renderUpcomingBooking();try{await pnHydrateClientData()}catch(_){}}catch(e){alert('Не удалось отменить запись: '+e.message)}
}
function renderUpcomingBooking(){
 const box=document.getElementById('upcomingBooking'); if(!box)return;
 const bookings=getBookings().slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
 if(!bookings.length){box.innerHTML=`<article class="booking-home-card empty"><div><p class="booking-home-kicker">Мои записи</p><h3 style="margin:0 0 5px">Пока нет ближайших записей</h3><p style="margin:0;color:#766b70">Можно записываться к разным мастерам и на несколько услуг.</p></div><div class="booking-home-empty-icon"><svg viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="15" rx="3"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/></svg></div></article>`;return}
 box.innerHTML=`<div class="booking-list-wrap"><div class="booking-list-title"><p class="booking-home-kicker">Мои записи</p><span>${bookings.length}</span></div>${bookings.map((b,idx)=>{
  const m=pnMasterForBooking(b);
  const confirmed=b.status==='confirmed'||b.status==='completed'||b.status==='done';
  const cancelled=b.status==='cancelled';
  const id=b.id||String(idx);
  const expired=isChatExpired(b);
  const statusText=cancelled?'Отменено':b.status==='completed'||b.status==='done'?'Завершено':expired?'Чат завершён':confirmed?'Подтверждено':'Ожидает подтверждения';
  const statusClass=cancelled?'cancelled':expired?'expired':confirmed?'confirmed':'pending';
  const chatAction=confirmed?`<a class="primary" href="chat.html?master=${b.master}&booking=${encodeURIComponent(id)}">${expired?'Посмотреть переписку':'Написать мастеру'}</a>`:'';
  const canCancel=!cancelled&&!['completed','done'].includes(b.status)&&bookingDateTime(b)&&bookingDateTime(b).getTime()>Date.now();
  const cancelAction=canCancel?`<button class="light" type="button" onclick="pnCancelClientBooking('${id}')">Отменить запись</button>`:'';
  return `<article class="booking-home-card booking-list-item"><span class="booking-status ${statusClass}">${statusText}</span><div class="booking-home-main"><img class="booking-home-avatar" src="${pnEscHtml(m.avatar)}" alt="${pnEscHtml(m.name)}"><div class="booking-home-info"><button class="booking-master-link" onclick="openProfile(${b.master})">${pnEscHtml(m.name)}</button><p><b>${pnEscHtml(b.dateText||'')} · ${pnEscHtml(b.time||'')}</b></p><p>${pnEscHtml(b.service||'Услуга')}</p></div></div>${chatAction||cancelAction?`<div class="booking-home-actions">${chatAction}${cancelAction}</div>`:''}<p class="booking-home-note">${cancelled?'Запись отменена. Выберите другое свободное время.':expired?'Прошло более 72 часов после записи. Чат закрыт для новых сообщений.':confirmed?'Запись подтверждена. Чат доступен в течение 72 часов после записи.':'Ожидаем подтверждения мастера. Чат откроется после подтверждения записи.'}</p></article>`
 }).join('')}</div>`;
}

// v137: startup rendering must never abort the rest of script.js.
// Real masters load asynchronously from Supabase; bookings can already exist locally.
try{render()}catch(e){console.error('Initial directory render:',e)}
try{renderUpcomingBooking()}catch(e){console.error('Initial booking render:',e)}
try{updateChatBadge()}catch(e){console.error('Initial chat badge render:',e)}

// Bottom tabs: Home / Search / Работы / Message
function setBottomActive(id){
 document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.remove('active'));
 document.getElementById(id)?.classList.add('active');
}
document.getElementById('bottomHome')?.addEventListener('click',()=>{
 setBottomActive('bottomHome');
 window.scrollTo({top:0,behavior:'smooth'});
});
document.getElementById('bottomSearch')?.addEventListener('click',()=>{window.location.href=pnMapUrl()});
document.getElementById('bottomSnap')?.addEventListener('click',()=>{window.location.href='snap.html'});
document.getElementById('bottomChats')?.addEventListener('click',()=>{setBottomActive('bottomChats');});

document.getElementById('bottomFavorites')?.addEventListener('click',()=>{window.location.href='favorites.html'});

const snapIdeas=[];
function renderSnap(filter='all'){
 const box=document.getElementById('snapGrid'); if(!box)return;
 const data=masters.filter(Boolean).flatMap(m=>(m.gallery||[]).filter(src=>src&&src!=='assets/service-placeholder.svg').map((photo,j)=>({master:m.id,cat:m.cat,title:(m.services?.length?m.services[j%m.services.length]?.name:'Работа мастера')||'Работа мастера',photo}))).filter(x=>filter==='all'||x.cat===filter);
 box.innerHTML=data.length?data.map((x,idx)=>{const m=masters[x.master];if(!m)return'';return `<div class="snap-item ${idx%3===0?'tall':''}" onclick="openProfile(${x.master})"><img src="${pnEscHtml(x.photo)}" alt="Работа ${pnEscHtml(m.name)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"><div class="snap-caption"><b>${pnEscHtml(x.title)}</b><span>${pnEscHtml(m.name)} · ${pnEscHtml(m.district||'')}</span></div></div>`}).join(''):`<div class="favorites-empty" style="grid-column:1/-1"><b>✦</b><h3>Пока нет работ</h3><p>Работы опубликованных мастеров появятся здесь.</p></div>`;
}
document.querySelectorAll('[data-snap-filter]').forEach(btn=>btn.addEventListener('click',()=>{
 document.querySelectorAll('[data-snap-filter]').forEach(b=>b.classList.remove('active'));
 btn.classList.add('active');
 renderSnap(btn.dataset.snapFilter);
}));


function renderFavorites(tab='masters'){
 const box=document.getElementById('favoritesContent'); if(!box)return;
 document.querySelectorAll('[data-favorite-tab]').forEach(b=>b.classList.toggle('active',b.dataset.favoriteTab===tab));
 if(tab==='masters'){
  const ids=getFavs();
  box.innerHTML=ids.length?`<div class="favorite-masters-list">${ids.map(i=>{const m=masters[i];if(!m)return'';return `<article class="favorite-master" onclick="openProfile(${i})"><img src="${pnEscHtml(m.avatar)}" alt="${pnEscHtml(m.name)}"><div><h3>${pnEscHtml(m.name)}</h3><p>${pnEscHtml(window.PNRanking?.ratingLabel?window.PNRanking.ratingLabel(m):('★ '+m.rating))}${m.experience?' · '+pnEscHtml(m.experience):''}</p><span>⌖ ${pnEscHtml(m.district||'')}</span></div><button onclick="event.stopPropagation();toggleFav(${i})" aria-label="Удалить из избранного">♥</button></article>`}).join('')}</div>`:`<div class="favorites-empty"><b>♡</b><h3>Нет сохранённых мастеров</h3><p>Нажмите сердечко на карточке мастера.</p></div>`;
 }else{
  const ids=[...pnSavedWorkIds],feed=masters.filter(Boolean).flatMap(m=>(m.workItems||[]).map(w=>({id:String(w.id),photo:w.image_url,master:m.id,name:m.name})));
  box.innerHTML=ids.length?`<div class="favorite-works-grid">${ids.map(id=>{const x=feed.find(w=>w.id===id);if(!x)return'';return `<article class="favorite-work" onclick="openProfile(${x.master})"><img src="${pnEscHtml(x.photo)}" alt="Работа ${pnEscHtml(x.name)}"><button onclick="event.stopPropagation();toggleWorkFav('${pnEscHtml(id)}')">♥</button><div><b>${pnEscHtml(x.name)}</b><span>Открыть профиль</span></div></article>`}).join('')}</div>`:`<div class="favorites-empty"><b>♡</b><h3>Нет сохранённых работ</h3><p>Нажмите сердечко на работе.</p></div>`;
 }
}
document.querySelectorAll('[data-favorite-tab]').forEach(btn=>btn.addEventListener('click',()=>renderFavorites(btn.dataset.favoriteTab)));



// Client Home banners: three admin-controlled images with 3-second autoplay.
// Native horizontal scrolling remains enabled so the user can swipe manually.
let pnBannerIndex=0,pnBannerTimer=null,pnBannerScrollTimer=null;
function pnBannerFallbacks(){
 const urls=masters.filter(Boolean).flatMap(m=>[m.cover,m.gallery?.[0],m.avatar]).filter(Boolean);
 const unique=[...new Set(urls)];
 while(unique.length<3)unique.push(unique.length%2===0?'icon-512.png':'icon-192.png');
 return unique.slice(0,3);
}
function pnBannerSetActive(index,scroll=true){
 const track=document.getElementById('homeBannerTrack'),dots=document.getElementById('homeBannerDots');
 if(!track)return;
 const slides=[...track.children];if(!slides.length)return;
 pnBannerIndex=((Number(index)||0)%slides.length+slides.length)%slides.length;
 dots?.querySelectorAll('i').forEach((d,i)=>d.classList.toggle('active',i===pnBannerIndex));
 if(scroll)track.scrollTo({left:pnBannerIndex*track.clientWidth,behavior:'smooth'});
}
function pnBannerStart(){
 clearInterval(pnBannerTimer);
 pnBannerTimer=setInterval(()=>pnBannerSetActive(pnBannerIndex+1,true),3000);
}
function pnRenderHomeBanners(urls){
 const track=document.getElementById('homeBannerTrack'),dots=document.getElementById('homeBannerDots');
 if(!track||!dots)return;
 const list=[...new Set((urls||[]).filter(Boolean))];
 const fallback=pnBannerFallbacks();
 while(list.length<3)list.push(fallback[list.length]||'icon-512.png');
 const final=list.slice(0,3);
 track.innerHTML=final.map((url,i)=>`<div class="hero-carousel-slide"><img src="${pnEscHtml(url)}" alt="ProfiNavi banner ${i+1}" draggable="false"></div>`).join('');
 dots.innerHTML=final.map((_,i)=>`<i class="${i===0?'active':''}"></i>`).join('');
 pnBannerIndex=0;
 track.onscroll=()=>{
   clearTimeout(pnBannerScrollTimer);
   pnBannerScrollTimer=setTimeout(()=>{
     if(!track.clientWidth)return;
     pnBannerSetActive(Math.round(track.scrollLeft/track.clientWidth),false);
   },80);
 };
 ['pointerdown','touchstart'].forEach(ev=>track.addEventListener(ev,()=>clearInterval(pnBannerTimer),{passive:true}));
 ['pointerup','pointercancel','touchend'].forEach(ev=>track.addEventListener(ev,pnBannerStart,{passive:true}));
 pnBannerStart();
}
async function pnLoadHomeBanners(){
 let urls=[];
 try{urls=(await window.PNData?.listHomeBanners?.()||[]).map(x=>x.image_url).filter(Boolean)}catch(e){console.warn('Home banners:',e)}
 pnRenderHomeBanners(urls.length?urls:pnBannerFallbacks());
}
window.addEventListener('DOMContentLoaded',pnLoadHomeBanners);
window.addEventListener('resize',()=>pnBannerSetActive(pnBannerIndex,false));
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInterval(pnBannerTimer);else pnBannerStart()});

// Home map uses the same OpenStreetMap/Leaflet engine as the Search screen.
// This avoids 2GIS API-key/domain restrictions and renders all master markers.
let homeLeafletMap=null;
let homeLeafletMarkers=[];
function loadLeafletHome(){
 if(window.L) return Promise.resolve();
 return new Promise((resolve,reject)=>{
  if(!document.querySelector('link[data-pn-leaflet]')){
   const css=document.createElement('link');
   css.rel='stylesheet';css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';css.dataset.pnLeaflet='1';
   document.head.appendChild(css);
  }
  const existing=document.querySelector('script[data-pn-leaflet]');
  if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return;}
  const js=document.createElement('script');
  js.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';js.async=true;js.dataset.pnLeaflet='1';
  js.onload=resolve;js.onerror=reject;document.head.appendChild(js);
 });
}
function homeMasterIcon(m){
 return L.divIcon({
  className:'pn-leaflet-marker',
  html:`<button class="map-master-marker" type="button" aria-label="Открыть профиль ${pnEscHtml(m.name)}"><img src="${pnEscHtml(m.avatar)}" alt=""><span>${pnEscHtml(m.name)}</span></button>`,
  iconSize:[56,68],iconAnchor:[28,58]
 });
}
function renderHomeLeafletMarkers(){
 if(!homeLeafletMap||!window.L)return;
 homeLeafletMarkers.forEach(x=>homeLeafletMap.removeLayer(x));homeLeafletMarkers=[];
 const visible=masters.filter(m=>pnMasterMatchesCity(m)&&(current==='all'||m.cat===current));
 visible.forEach((m,i)=>{
  const masterIndex=masters.indexOf(m);
  const marker=L.marker([m.lat,m.lng],{icon:homeMasterIcon(m)}).addTo(homeLeafletMap);
  marker.on('click',e=>{L.DomEvent.stopPropagation(e);openProfile(masterIndex)});
  homeLeafletMarkers.push(marker);
 });
 if(visible.length){
  homeLeafletMap.fitBounds(visible.map(m=>[m.lat,m.lng]),{padding:[25,25],maxZoom:13});
 }else{
  const city=PN_HOME_CITIES[selectedCity]||PN_HOME_CITIES['Бишкек'];
  homeLeafletMap.setView([city.lat,city.lng],city.zoom);
 }
 setTimeout(()=>homeLeafletMap.invalidateSize(),100);
}
async function initHomeLeafletMap(){
 const mapEl=document.getElementById('twoGisMap');
 const connect=document.getElementById('mapConnect');
 if(!mapEl)return;
 try{
  await loadLeafletHome();
  connect?.classList.add('hidden');
  mapEl.classList.remove('hidden');

  if(homeLeafletMap){
    setTimeout(()=>homeLeafletMap.invalidateSize(),50);
    renderHomeLeafletMarkers();
    return;
  }

  mapEl.innerHTML='';
  homeLeafletMap=L.map(mapEl,{
    zoomControl:false,
    attributionControl:false,
    dragging:true,
    scrollWheelZoom:false,
    doubleClickZoom:false
  }).setView([PN_HOME_CITIES[selectedCity].lat,PN_HOME_CITIES[selectedCity].lng],PN_HOME_CITIES[selectedCity].zoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,
    attribution:'© OpenStreetMap'
  }).addTo(homeLeafletMap);

  renderHomeLeafletMarkers();
  const status=document.getElementById('homeMapStatus');
  if(status)status.textContent='Двигайте карту свободно';
 }catch(error){
  console.error('Home map error',error);
  connect?.classList.remove('hidden');
  mapEl.classList.add('hidden');
  const status=document.getElementById('homeMapStatus');
  if(status)status.textContent='Карта временно недоступна';
 }
}
window.addEventListener('DOMContentLoaded',()=>{if(!document.getElementById('mapBlock')?.classList.contains('hidden'))initHomeLeafletMap();});



async function pnEnterMasterFromClient(){
 try{
  const user=await window.PNAuth?.syncLocalUser?.();
  if(user?.id){
   const hasMaster=await window.PNAuth?.hasMasterProfile?.();
   if(hasMaster){
    const owner=localStorage.getItem('pn_master_cache_owner');
    if(owner!==String(user.id)){
     ['pn_master_profile_0','pn_master_services_0','pn_master_slots','pn_master_backend_reviews','pn_master_schedule_config','pn_bookings','pn_chats','pn_master_chat_unread','pn_master_chat_read_at','pn_master_chat_read_at_v49'].forEach(k=>localStorage.removeItem(k));
    }
    localStorage.setItem('pn_master_cache_owner',String(user.id));
    localStorage.setItem('pn_master_session',JSON.stringify({userId:user.id,name:user.name||'Мастер',test:!!window.PN_TEST_MODE,supabase:true}));
    localStorage.setItem('pn_last_mode','master');
    window.location.assign('master.html');
    return;
   }
   window.location.assign('master-login.html?from=client#register');
   return;
  }
 }catch(e){console.warn('Open master cabinet:',e)}
 window.location.assign('master-login.html');
}

const masterCabinetBtn=document.getElementById('openMasterCabinet');
if(masterCabinetBtn){
 masterCabinetBtn.textContent='Кабинет мастера';
 const hint=document.getElementById('masterCabinetHint');
 if(hint)hint.textContent='ProfiNavi Pro';
 masterCabinetBtn.addEventListener('click',(e)=>{
   e.preventDefault();
   e.stopPropagation();
   pnEnterMasterFromClient();
 });
}

window.addEventListener('storage',e=>{
  if(e.key==='pn_master_profile_0'||e.key==='pn_master_services_0'){
    applyMasterProSyncToClientHome();
    if(typeof renderMasters==='function') renderMasters();
    else if(typeof renderHome==='function') renderHome();
  }
});

// v62: Master mode is the source of truth for the first master's client card.
function refreshMasterCardFromPro(){
 applyMasterProSyncToClientHome();
 if(typeof render==='function')render();
}
window.addEventListener('pageshow',()=>refreshMasterCardFromPro());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshMasterCardFromPro()});

/* v86 — keep client bookings visible after returning from booking/registration */
function pnRefreshClientHomeState(){
  try{ renderUpcomingBooking(); }catch(e){ console.error('Bookings render error',e); }
  try{ if(typeof updateChatBadge==='function')updateChatBadge(); }catch(e){}
}
window.addEventListener('DOMContentLoaded',pnRefreshClientHomeState);
window.addEventListener('pageshow',pnRefreshClientHomeState);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)pnRefreshClientHomeState()});

/* v87 — restore client UI reliably after back navigation */
window.addEventListener('pageshow',()=>{
  try{renderUpcomingBooking()}catch(e){}
  try{if(document.getElementById('twoGisMap'))initHomeLeafletMap()}catch(e){}
});

// v105 account state: anonymous browsing, persistent client account, linked ProfiNaviPro.
function pnOpenClientAuth(mode='login'){
 const params=new URLSearchParams({return:'client.html'});
 if(mode==='register') params.set('mode','register');
 location.href=`client-login.html?${params.toString()}`;
}
async function pnRefreshClientAccount(){
 const btn=document.getElementById('openAccount');
 const host=document.getElementById('clientAccountDynamic');
 let user=null;try{user=await window.PNAuth?.syncLocalUser()}catch(e){console.warn(e)}
 if(!user?.name){
   if(btn){
    btn.style.visibility='visible';
    btn.disabled=false;
    btn.classList.add('guest-auth-btn');
    btn.setAttribute('aria-label','Войти или зарегистрироваться');
    btn.textContent='Войти';
   }
   if(host)host.innerHTML=`
     <div class="client-account-header guest-client-account-header"><div class="client-account-title"><h2>Вход в ProfiNavi</h2><p>Войдите или зарегистрируйтесь, чтобы сохранять записи, видеть чаты и управлять своими данными.</p></div></div>
     <div class="client-account-section client-account-auth-actions">
       <button class="wide" type="button" id="pnGuestLogin">Войти</button>
       <button class="wide light" type="button" id="pnGuestRegister">Зарегистрироваться</button>
     </div>`;
   host?.querySelector('#pnGuestLogin')?.addEventListener('click',()=>pnOpenClientAuth('login'));
   host?.querySelector('#pnGuestRegister')?.addEventListener('click',()=>pnOpenClientAuth('register'));
   return;
 }
 if(btn){
  btn.style.visibility='visible';
  btn.disabled=false;
  btn.classList.remove('guest-auth-btn');
  btn.setAttribute('aria-label','Аккаунт');
  btn.textContent=(user.name[0]||'U').toUpperCase();
 }
 let hasMaster=false;try{hasMaster=await window.PNAuth.hasMasterProfile()}catch(e){}
 if(host)host.innerHTML=`
   <div class="client-account-header"><div class="big-avatar">${(user.name[0]||'U').toUpperCase()}</div><div class="client-account-title"><h2>${user.name}</h2><p>Аккаунт ProfiNavi</p></div></div>
   <div class="client-account-section"><h3>Информация об аккаунте</h3><div class="client-account-list">
     <div class="client-account-row"><span>Имя</span><strong>${user.name}</strong></div>
     ${user.phone?`<div class="client-account-row"><span>Телефон</span><strong>${user.phone}</strong></div>`:''}
   </div></div>
   <div class="client-account-section client-account-pro"><h3>ProfiNaviPro</h3><p>${hasMaster?'Управляйте своим кабинетом мастера.':'Хотите принимать клиентов через ProfiNavi?'}</p>
   <button class="wide account-master-link" id="pnMasterAction">${hasMaster?'Кабинет мастера · ProfiNaviPro':'Стать мастером'}</button></div>
   <div class="client-account-section client-account-session"><button class="client-logout-btn" type="button" id="pnClientLogout">Выйти из аккаунта</button></div>`;
 host.querySelector('#pnMasterAction').onclick=()=>pnEnterMasterFromClient();
 host.querySelector('#pnClientLogout').onclick=pnLogoutClient;
}
async function pnLogoutClient(){
 const btn=document.getElementById('pnClientLogout');
 if(btn){btn.disabled=true;btn.textContent='Выходим…'}
 try{
  await window.PNAuth?.signOut?.();
 }catch(e){
  console.warn('Client logout:',e);
  try{window.PNAuth?.clearLocalAuthState?.()}catch(_){}
 }
 try{closeModal('accountModal')}catch(e){}
 location.replace('client.html');
}
window.addEventListener('DOMContentLoaded',()=>pnRefreshClientAccount());
window.addEventListener('pageshow',()=>pnRefreshClientAccount());

/* v109 — post-service rating popup + Supabase */
function pnReviewKey(){return 'pn_verified_reviews'}
function pnHasReview(bookingId){
 try{return (JSON.parse(localStorage.getItem(pnReviewKey())||'[]')||[]).some(r=>String(r.bookingId)===String(bookingId))}catch(e){return false}
}
function pnBookingFinished(b){
 if(!b || b.status==='cancelled') return false;
 if(b.status==='completed'||b.status==='done') return true;
 const start=bookingDateTime(b);if(!start||b.status!=='confirmed')return false;
 const explicitEnd=new Date(b.endsAt||b.ends_at||'');
 const end=Number.isNaN(explicitEnd.getTime())?new Date(start.getTime()+Math.max(1,Number(b.durationMinutes)||60)*60000):explicitEnd;
 return Date.now()>=end.getTime();
}
function pnOpenRatingPopup(booking){
 if(!booking || pnHasReview(booking.id) || document.getElementById('pnRatingOverlay')) return;
 const m=pnMasterForBooking(booking);
 if(!m)return;
 const ov=document.createElement('div');ov.id='pnRatingOverlay';ov.className='pn-rating-overlay';
 ov.innerHTML=`<div class="pn-rating-sheet">
   <button class="pn-rating-close" aria-label="Закрыть">×</button>
   <div class="pn-rating-avatar"><img src="${pnEscHtml(m.avatar)}" alt="${pnEscHtml(m.name)}"></div>
   <h2>Как вам услуга?</h2><p class="pn-rating-sub">${pnEscHtml(m.name)} · ${pnEscHtml(booking.service||'Услуга')}</p>
   <div class="pn-rating-stars" role="radiogroup" aria-label="Оценка"><button data-rate="1">★</button><button data-rate="2">★</button><button data-rate="3">★</button><button data-rate="4">★</button><button data-rate="5">★</button></div>
   <p class="pn-rating-hint">Поставьте оценку от 1 до 5</p>
   <textarea class="pn-rating-comment" placeholder="Комментарий (необязательно)"></textarea>
   <label class="pn-rating-photo"><span>＋ Добавить фото</span><small>Необязательно · до 3 фото</small><input type="file" accept="image/*" multiple hidden></label>
   <div class="pn-rating-previews"></div>
   <button class="pn-rating-submit" disabled>Отправить оценку</button>
   <button class="pn-rating-later">Не сейчас</button>
 </div>`;
 document.body.appendChild(ov);let rating=0,files=[];
 const stars=[...ov.querySelectorAll('.pn-rating-stars button')],submit=ov.querySelector('.pn-rating-submit');
 stars.forEach(btn=>btn.onclick=()=>{rating=Number(btn.dataset.rate);stars.forEach((s,i)=>s.classList.toggle('active',i<rating));submit.disabled=false;ov.querySelector('.pn-rating-hint').textContent=['','Плохо','Ниже ожиданий','Нормально','Хорошо','Отлично!'][rating]});
 ov.querySelector('input[type=file]').onchange=e=>{
   files=[...e.target.files].slice(0,3);
   ov.querySelector('.pn-rating-previews').innerHTML=files.map(f=>`<img src="${URL.createObjectURL(f)}" alt="Фото отзыва">`).join('');
 };
 const close=()=>ov.remove();ov.querySelector('.pn-rating-close').onclick=close;ov.querySelector('.pn-rating-later').onclick=close;
 submit.onclick=async()=>{
   if(!rating)return;
   submit.disabled=true;submit.textContent='Сохраняем…';
   try{
     if(!window.PNData||!booking.syncedToSupabase)throw new Error('Эта запись ещё не синхронизирована с базой');
     const saved=await window.PNData.createReview({bookingId:booking.id,legacyMasterId:Number(booking.master)||0,rating,text:ov.querySelector('.pn-rating-comment').value.trim(),files});
     const all=JSON.parse(localStorage.getItem(pnReviewKey())||'[]');
     const user=JSON.parse(localStorage.getItem('pn_client_user')||'null')||{};
     all.unshift({id:saved.id,bookingId:booking.id,clientId:user.id,masterId:Number(booking.master)||0,name:user.name||booking.clientName||'Клиент',service:booking.service||'Услуга',rating:saved.rating,text:saved.text||'',photos:saved.photos||[],date:new Date(saved.created_at).toLocaleDateString('ru-RU',{day:'numeric',month:'long'}),verified:true,syncedToSupabase:true});
     localStorage.setItem(pnReviewKey(),JSON.stringify(all));
     booking.reviewed=true;const list=getBookings();const found=list.find(x=>String(x.id)===String(booking.id));if(found)found.reviewed=true;localStorage.setItem('pn_bookings',JSON.stringify(list));
     ov.querySelector('.pn-rating-sheet').innerHTML='<div class="pn-rating-thanks"><div>✓</div><h2>Спасибо за оценку!</h2><p>Отзыв сохранён в ProfiNavi.</p></div>';setTimeout(close,1200);
   }catch(e){alert('Не удалось сохранить отзыв: '+e.message);submit.disabled=false;submit.textContent='Отправить оценку'}
 };
}
function pnCheckPendingReview(){
 const b=getBookings().filter(x=>pnBookingFinished(x)&&!x.reviewed&&!pnHasReview(x.id)).sort((a,b)=>(bookingDateTime(b)?.getTime()||0)-(bookingDateTime(a)?.getTime()||0))[0];
 if(b)setTimeout(()=>pnOpenRatingPopup(b),500);
}
window.addEventListener('DOMContentLoaded',pnCheckPendingReview);
window.addEventListener('pageshow',pnCheckPendingReview);

/* v109 — restore client bookings/reviews from Supabase on another browser/device */
async function pnHydrateSupportUnread(){
 try{
  if(!window.PNAuth||!window.PNData)return;
  const u=await PNAuth.currentUser();
  if(!u){localStorage.setItem('pn_support_unread','0');updateChatBadge();return}
  const s=await PNData.getSupportSummary();localStorage.setItem('pn_support_unread',s?.unreadCount?'1':'0');updateChatBadge();
 }catch(e){console.warn('Support unread sync:',e)}
}
window.addEventListener('DOMContentLoaded',()=>setTimeout(pnHydrateSupportUnread,100));
window.addEventListener('pageshow',()=>setTimeout(pnHydrateSupportUnread,100));

async function pnHydrateClientData(){
 try{
  if(!window.PNAuth||!window.PNData)return;
  const user=await PNAuth.syncLocalUser();if(!user)return;
  const [rows,reviews]=await Promise.all([PNData.listBookings(),PNData.listMyReviews()]);
  const reviewedIds=new Set((reviews||[]).map(r=>String(r.booking_id)));
  const mapped=(rows||[]).map(r=>{
   const dt=new Date(r.starts_at);const status=r.status==='approved'?'confirmed':r.status==='declined'?'cancelled':r.status;
   return {id:r.id,master:Number(r.legacy_master_id)||0,masterName:r.master_name||'',service:r.service_name||'Услуга',serviceId:r.service_id||null,date:dt.toISOString(),endsAt:r.ends_at||null,durationMinutes:Number(r.duration_minutes)||null,price:Number(r.price)||0,dateText:dt.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}),time:dt.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}),status,clientName:user.name||'Клиент ProfiNavi',createdAt:r.created_at,syncedToSupabase:true,reviewed:reviewedIds.has(String(r.id))};
  });
  localStorage.setItem('pn_bookings',JSON.stringify(mapped));
  const localReviews=(reviews||[]).map(r=>({id:r.id,bookingId:r.booking_id,clientId:user.id,masterId:Number(r.legacy_master_id)||0,name:user.name||'Клиент',rating:r.rating,text:r.text||'',photos:r.photos||[],date:new Date(r.created_at).toLocaleDateString('ru-RU',{day:'numeric',month:'long'}),verified:true,syncedToSupabase:true}));
  localStorage.setItem('pn_verified_reviews',JSON.stringify(localReviews));
  renderUpcomingBooking();pnCheckPendingReview();
 }catch(e){console.warn('ProfiNavi Supabase sync:',e)}
}
window.addEventListener('DOMContentLoaded',()=>setTimeout(pnHydrateClientData,80));
window.addEventListener('pageshow',()=>setTimeout(pnHydrateClientData,80));


async function pnRefreshVisibleMaps(){
  if(!window.PNMap)return;
  const cp=PNMap.getCustomMaster();
  if(!cp)return;
  const lat=Number(cp.lat??cp.latitude),lng=Number(cp.lng??cp.longitude);
  if(!Number.isFinite(lat)||!Number.isFinite(lng))return;
  // Update in-memory master 0 used by existing home map.
  if(window.masters&&masters[0]){masters[0].lat=lat;masters[0].lng=lng;masters[0].address=cp.address||masters[0].address;masters[0].district=cp.area||masters[0].district;}
  // Re-render any dedicated master map blocks.
  document.querySelectorAll('[data-master-map]').forEach(el=>{
    const id=Number(el.dataset.masterMap||0);
    const m=(window.masters||[]).find(x=>Number(x.id)===id)||(window.masters||[])[id];
    PNMap.render(el,m,15);
  });
}
window.addEventListener('load',()=>setTimeout(pnRefreshVisibleMaps,250));
window.addEventListener('pageshow',()=>setTimeout(pnRefreshVisibleMaps,250));

window.addEventListener('DOMContentLoaded',()=>window.PNBackendSync?.hydrateClientFavorites?.().then(()=>render()).catch(()=>{}));

window.addEventListener('DOMContentLoaded',()=>window.PNRealtime?.watchClient?.(()=>Promise.all([pnHydrateClientData(),pnHydrateSupportUnread()]).catch(()=>{})));

async function pnHydrateRankedDirectory(){
 try{
  if(!window.PNRanking?.hydrate)return;
  await window.PNRanking.hydrate(masters);
  await pnSyncWorkFavorites();
  render();
  try{await pnLoadHomeBanners()}catch(e){}
  try{render2GisMarkers()}catch(e){}
  try{renderHomeLeafletMarkers()}catch(e){}
 }catch(e){console.warn('ranked directory sync',e)}
}
window.addEventListener('DOMContentLoaded',()=>setTimeout(pnHydrateRankedDirectory,60));
window.addEventListener('pageshow',()=>setTimeout(pnHydrateRankedDirectory,60));
