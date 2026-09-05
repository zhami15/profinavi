
(function(){
 try{
  const cp=JSON.parse(localStorage.getItem('pn_master_profile_0')||'null');
  if(cp && window.masters && masters[0]){
   const lat=Number(cp.lat??cp.latitude),lng=Number(cp.lng??cp.longitude);
   if(Number.isFinite(lat)&&Number.isFinite(lng)){masters[0].lat=lat;masters[0].lng=lng;}
   if(cp.address)masters[0].address=cp.address;
   if(cp.area)masters[0].district=cp.area;
   if(cp.profileName||cp.name)masters[0].name=cp.profileName||cp.name;
  }
 }catch(e){}
})();

const mapAreas=['center','jal','microdistricts','asia','asia','polytech','alamedin','east','microdistricts','center','center'];
const mapAvailability=[['today','tomorrow'],['tomorrow'],['today'],['today','tomorrow'],['tomorrow'],['today'],['today','tomorrow'],['tomorrow'],['today'],['today','tomorrow'],['tomorrow']];
const masters=window.PNCloneMasters().map((m,id)=>({...m,id,services:[m.cat],area:mapAreas[id]||'center',priceValue:Number.parseInt(String(m.price).replace(/\D/g,''),10)||0,price:m.price,available:mapAvailability[id]||['tomorrow'],rating:Number(m.rating)||0}));
window.masters=masters;


try{
 const cp=JSON.parse(localStorage.getItem('pn_master_profile_0')||'null');
 if(cp && masters[0]){
   if(cp.profileName||cp.name) masters[0].name=cp.profileName||cp.name;
   if(cp.area||cp.address) masters[0].district=[cp.area,cp.address].filter(Boolean).join(' · ');
   if(Number.isFinite(Number(cp.lat))) masters[0].lat=Number(cp.lat);
   if(Number.isFinite(Number(cp.lng))) masters[0].lng=Number(cp.lng);
 }
}catch(e){}

let map, markers=[], userMarker, userLocation;
const filters={priceMin:0,priceMax:null,date:'all',areas:new Set(),services:new Set()};
let draft=null,currentSheet=null;
const statusEl=document.getElementById('locationStatus');
const sheet=document.getElementById('nearbySheet');
const countEl=document.getElementById('searchResultsCount');
const errorEl=document.getElementById('mapPageError');
const resetBtn=document.getElementById('resetSearchFilters');
const filterSheet=document.getElementById('filterSheet');
const filterBackdrop=document.getElementById('filterBackdrop');
const filterContent=document.getElementById('filterSheetContent');
const selectedCard=document.getElementById('selectedMasterCard');
const masterStrip=document.getElementById('masterStrip');

const serviceLabels={hair:'Волосы',nails:'Ногти',lashes:'Ресницы',brows:'Брови',makeup:'Макияж'};
const areaLabels={center:'Центр',jal:'Джал',microdistricts:'Микрорайоны',asia:'Asia Mall',polytech:'Политех',alamedin:'Аламедин',east:'Карла Маркса'};
function km(a,b,c,d){const r=x=>x*Math.PI/180,R=6371,dl=r(c-a),dn=r(d-b);const q=Math.sin(dl/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dn/2)**2;return R*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q))}
function label(d){return d<1?`${Math.max(1,Math.round(d*1000))} м`:`${d.toFixed(d<10?1:0)} км`}
function masterCategoryKeys(m){const a=Array.isArray(m.categories)&&m.categories.length?m.categories:[m.cat];return a.filter(x=>typeof x==='string')}
function categoryLabel(m){return masterCategoryKeys(m).map(x=>serviceLabels[x]||x).join(' · ')}
function anyFilters(){return filters.priceMin>0||filters.priceMax!==null||filters.date!=='all'||filters.areas.size||filters.services.size}
function visible(){
 let list=masters.filter(m=>{
   if(m.priceValue<filters.priceMin)return false;
   if(filters.priceMax!==null&&m.priceValue>filters.priceMax)return false;
   if(filters.date==='today'&&!m.available.includes('today'))return false;
   if(filters.date==='tomorrow'&&!m.available.includes('tomorrow'))return false;
   if(filters.areas.size&&!filters.areas.has(m.area))return false;
   if(filters.services.size&&!masterCategoryKeys(m).some(s=>filters.services.has(s)))return false;
   return true;
 });
 if(userLocation)list.sort((x,y)=>km(userLocation.lat,userLocation.lng,x.lat,x.lng)-km(userLocation.lat,userLocation.lng,y.lat,y.lng));
 return list;
}
function renderSheet(){
 const list=visible();
 if(countEl)countEl.textContent=`Найдено: ${list.length}`;
 resetBtn.classList.toggle('hidden',!anyFilters());
 if(masterStrip){
   masterStrip.innerHTML=list.length?list.map(m=>{
     const service=serviceLabels[m.services[0]]||'Услуга';
     return `<button class="map-strip-card" type="button" data-master-id="${m.id}" aria-label="Открыть профиль ${m.name}">
       <img src="${m.avatar}" alt="">
       <span class="map-strip-copy">
         <span class="map-strip-name"><b>${m.name}</b><em>${window.PNRanking?.ratingLabel?window.PNRanking.ratingLabel(m):('★ '+Number(m.rating||0).toFixed(1))}</em></span>
         <span class="map-strip-service"><span>${service}</span><strong>${m.price}</strong></span>
       </span>
     </button>`;
   }).join(''):`<div style="padding:18px;text-align:center;width:100%"><b>Пока нет мастеров</b><br><small>После публикации мастер появится на карте.</small></div>`;
   masterStrip.querySelectorAll('.map-strip-card').forEach(card=>{
     const m=masters.find(x=>x.id===Number(card.dataset.masterId));
     card.onclick=()=>location.href=`profile.html?id=${m.id}`;
   });
 }
 if(selectedCard && !selectedCard.classList.contains('hidden')){
   const id=Number(selectedCard.dataset.masterId);
   const master=list.find(m=>m.id===id);
   if(!master)selectedCard.classList.add('hidden');
 }
}
function showMasterCard(m){
 if(!selectedCard)return;
 const distance=userLocation?` · ${label(km(userLocation.lat,userLocation.lng,m.lat,m.lng))}`:'';
 const available=m.available.includes('today')?'Свободно сегодня':'Свободно завтра';
 selectedCard.dataset.masterId=m.id;
 selectedCard.innerHTML=`<button class="map-selected-master-close" type="button" aria-label="Закрыть">×</button><img src="${m.avatar}" alt="${m.name}"><div class="map-selected-master-copy" role="button" tabindex="0"><b>${m.name} · ${window.PNRanking?.ratingLabel?window.PNRanking.ratingLabel(m):('★ '+Number(m.rating||0).toFixed(1))}</b><small>${categoryLabel(m)} · ${m.district}${distance}</small><strong>${m.price} · ${available}</strong></div><button class="map-selected-master-action" type="button">Записаться</button>`;
 selectedCard.classList.remove('hidden');
 selectedCard.querySelector('.map-selected-master-close').onclick=()=>selectedCard.classList.add('hidden');
 selectedCard.querySelector('.map-selected-master-copy').onclick=()=>location.href=`profile.html?id=${m.id}`;
 selectedCard.querySelector('.map-selected-master-action').onclick=()=>location.href=`booking.html?master=${m.id}`;
}
function clearMarkers(){markers.forEach(x=>map.removeLayer(x));markers=[]}
function makeIcon(m){return L.divIcon({className:'pn-leaflet-marker',html:`<div class="map-master-marker"><img src="${m.avatar}" alt=""><span>${m.name}</span></div>`,iconSize:[56,68],iconAnchor:[28,58]})}
function renderMarkers(){if(!map){renderSheet();return}clearMarkers();visible().forEach(m=>{const marker=L.marker([m.lat,m.lng],{icon:makeIcon(m)}).addTo(map);marker.on('click',()=>{showMasterCard(m);const card=masterStrip?.querySelector(`[data-master-id="${m.id}"]`);if(card){masterStrip.querySelectorAll('.map-strip-card').forEach(x=>x.classList.remove('selected'));card.classList.add('selected');card.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});}});markers.push(marker)});renderSheet();fitAll();updateTriggerLabels()}
function fitAll(){if(!map)return;const pts=visible().map(m=>[m.lat,m.lng]);if(userLocation)pts.unshift([userLocation.lat,userLocation.lng]);if(pts.length)map.fitBounds(pts,{paddingTopLeft:[35,35],paddingBottomRight:[35,35],maxZoom:14})}
function requestLocation(){if(!navigator.geolocation){statusEl.textContent='Мастера на карте Бишкека';return}navigator.geolocation.getCurrentPosition(p=>{userLocation={lat:p.coords.latitude,lng:p.coords.longitude};statusEl.textContent='Показываем мастеров рядом с вами';if(userMarker)map.removeLayer(userMarker);userMarker=L.circleMarker([userLocation.lat,userLocation.lng],{radius:9,weight:4,color:'#fff',fillColor:'#2f80ed',fillOpacity:1}).addTo(map);renderMarkers()},e=>{statusEl.textContent=e.code===1?'Мастера на карте Бишкека':'Мастера показаны на карте Бишкека';fitAll()},{enableHighAccuracy:true,timeout:10000,maximumAge:30000})}
function showError(){errorEl.textContent='Карта временно не загрузилась. Список мастеров доступен ниже.';errorEl.classList.remove('hidden');statusEl.textContent='Список мастеров доступен ниже'}
function loadMap(){const css=document.createElement('link');css.rel='stylesheet';css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(css);const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.onload=()=>{try{map=L.map('fullMap',{zoomControl:false}).setView([42.8585,74.5925],12);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);L.control.zoom({position:'topright'}).addTo(map);map.on('click',()=>selectedCard&&selectedCard.classList.add('hidden'));renderMarkers();requestLocation();setTimeout(()=>map.invalidateSize(),100)}catch(e){showError()}};s.onerror=showError;document.head.appendChild(s)}

const configs={
 price:{title:'Цена',hint:'Укажите максимальную стоимость'},
 date:{title:'Дата',hint:'Когда вам удобно?',type:'radio',options:[['all','Любая дата'],['today','Сегодня'],['tomorrow','Завтра'],['week','На этой неделе']]},
 area:{title:'Район',hint:'Можно выбрать несколько',type:'checkbox',options:Object.entries(areaLabels)},
 service:{title:'Услуги',hint:'Можно выбрать несколько',type:'checkbox',options:Object.entries(serviceLabels)}
};
function openFilter(kind){
 currentSheet=kind;const c=configs[kind];document.getElementById('filterSheetTitle').textContent=c.title;document.getElementById('filterSheetHint').textContent=c.hint;
 if(kind==='price'){
   draft={min:filters.priceMin,max:filters.priceMax};
   const ceiling=5000;
   const minValue=Math.min(draft.min||0,ceiling-100);
   const maxValue=draft.max===null?ceiling:Math.min(draft.max,ceiling);
   filterContent.innerHTML=`<div class="price-slider-wrap">
     <div class="price-range-label"><strong id="priceRangeValue">${minValue} сом&nbsp;&nbsp;~&nbsp;&nbsp;${maxValue>=ceiling?'Без ограничений':maxValue+' сом'}</strong></div>
     <div class="dual-range" id="dualRange">
       <div class="dual-range-track"></div><div class="dual-range-fill" id="priceRangeFill"></div>
       <input id="priceMinSlider" class="price-slider price-slider-min" type="range" min="0" max="${ceiling}" step="100" value="${minValue}" aria-label="Минимальная цена">
       <input id="priceMaxSlider" class="price-slider price-slider-max" type="range" min="0" max="${ceiling}" step="100" value="${maxValue}" aria-label="Максимальная цена">
     </div>
     <div class="price-slider-scale"><span>0 сом</span><span>∞<small>Без ограничений</small></span></div>
   </div>`;
   const minInput=document.getElementById('priceMinSlider');
   const maxInput=document.getElementById('priceMaxSlider');
   const value=document.getElementById('priceRangeValue');
   const fill=document.getElementById('priceRangeFill');
   const sync=changed=>{
     let min=Number(minInput.value),max=Number(maxInput.value);
     if(max-min<100){if(changed==='min')min=max-100;else max=min+100;}
     min=Math.max(0,min);max=Math.min(ceiling,max);
     minInput.value=min;maxInput.value=max;
     draft={min,max:max>=ceiling?null:max};
     const left=min/ceiling*100,right=100-max/ceiling*100;
     fill.style.left=`${left}%`;fill.style.right=`${right}%`;
     value.innerHTML=`${min} сом&nbsp;&nbsp;~&nbsp;&nbsp;${max>=ceiling?'Без ограничений':max+' сом'}`;
   };
   minInput.oninput=()=>sync('min');maxInput.oninput=()=>sync('max');sync();
 }else{
   draft=kind==='area'?new Set(filters.areas):kind==='service'?new Set(filters.services):filters[kind];
   filterContent.innerHTML=c.options.map(([value,text])=>{const checked=c.type==='radio'?draft===value:draft.has(value);return `<label class="filter-option"><span>${text}</span><input type="${c.type}" name="filter-${kind}" value="${value}" ${checked?'checked':''}><i></i></label>`}).join('');
   filterContent.querySelectorAll('input').forEach(input=>input.onchange=()=>{if(c.type==='radio')draft=input.value;else input.checked?draft.add(input.value):draft.delete(input.value)});
 }
 document.getElementById('applyCurrentFilter').textContent='Показать';
 filterBackdrop.classList.remove('hidden');filterSheet.classList.add('open');filterSheet.setAttribute('aria-hidden','false');document.body.classList.add('filter-sheet-open');
}
function closeFilter(){filterSheet.classList.remove('open');filterSheet.setAttribute('aria-hidden','true');filterBackdrop.classList.add('hidden');document.body.classList.remove('filter-sheet-open')}
function applyFilter(){if(currentSheet==='area')filters.areas=new Set(draft);else if(currentSheet==='service')filters.services=new Set(draft);else if(currentSheet==='price'){filters.priceMin=draft.min||0;filters.priceMax=draft.max;}else filters[currentSheet]=draft;closeFilter();renderMarkers()}
function updateTriggerLabels(){
 // Названия фильтров всегда остаются одинаковыми; выбранное состояние показываем только цветом.
 const fixedLabels={price:'Цена',date:'Дата',area:'Район',service:'Услуги'};
 document.querySelectorAll('.search-filter-trigger').forEach(b=>{
   const k=b.dataset.sheet;
   const label=b.querySelector('span');
   if(label)label.textContent=fixedLabels[k];
   const active=k==='price'?(filters.priceMin>0||filters.priceMax!==null):k==='date'?filters.date!=='all':k==='area'?filters.areas.size:filters.services.size;
   b.classList.toggle('active',!!active);
 });
}
document.querySelectorAll('.search-filter-trigger').forEach(b=>b.onclick=()=>openFilter(b.dataset.sheet));
document.getElementById('closeFilterSheet').onclick=closeFilter;filterBackdrop.onclick=closeFilter;document.getElementById('applyCurrentFilter').onclick=applyFilter;
document.getElementById('clearCurrentFilter').onclick=()=>{if(currentSheet==='area'||currentSheet==='service')draft=new Set();else if(currentSheet==='price'){filters.priceMin=0;filters.priceMax=null;}else draft='all';openFilter(currentSheet)};
resetBtn.onclick=()=>{filters.priceMin=0;filters.priceMax=null;filters.date='all';filters.areas.clear();filters.services.clear();renderMarkers()};
renderSheet();updateTriggerLabels();loadMap();

window.addEventListener('pageshow',()=>{
 try{
  const cp=JSON.parse(localStorage.getItem('pn_master_profile_0')||'null');
  if(cp&&window.masters&&masters[0]){
   const lat=Number(cp.lat??cp.latitude),lng=Number(cp.lng??cp.longitude);
   if(Number.isFinite(lat)&&Number.isFinite(lng)){masters[0].lat=lat;masters[0].lng=lng;}
  }
 }catch(e){}
});

window.addEventListener('DOMContentLoaded',()=>setTimeout(async()=>{try{const b=await window.PNBackendSync?.hydratePublicMasterCache?.(0);if(!b)return;const cp=JSON.parse(localStorage.getItem('pn_master_profile_0')||'{}');const m=masters[0];if(cp.name)m.name=cp.name;if(cp.avatar)m.avatar=cp.avatar;if(cp.area||cp.address)m.district=[cp.area,cp.address].filter(Boolean).join(' · ');if(Number.isFinite(Number(cp.lat)))m.lat=Number(cp.lat);if(Number.isFinite(Number(cp.lng)))m.lng=Number(cp.lng);if(cp.rating)m.rating=Number(cp.rating)||m.rating;renderMarkers();}catch(e){console.warn('public map sync',e)}},120));


async function pnHydrateMapDirectory(){
 try{
  if(!window.PNRanking?.hydrate)return;
  await window.PNRanking.hydrate(masters);
  renderMarkers();
 }catch(e){console.warn('map ranked directory sync',e)}
}
window.addEventListener('DOMContentLoaded',()=>setTimeout(pnHydrateMapDirectory,70));
window.addEventListener('pageshow',()=>setTimeout(pnHydrateMapDirectory,70));
