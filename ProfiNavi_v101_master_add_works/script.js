
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

const masters=[
 {name:'Tunuk Nails',cat:'nails',district:'Vefa Center · Байтик Баатыра 98',walk:'на месте',price:'1400 сом',rating:'4.9',experience:'Опыт 5 лет',saves:142,emoji:'💅',avatar:'assets/tunuk-new.png',desc:'Аккуратное покрытие, френч и нежные дизайны. Подходит тем, кто любит clean girl nails.',ig:'tunuk_nails',lat:42.857255,lng:74.609848,
  gallery:['assets/nails-demo.png','assets/nails-reference.jpeg','assets/nails-demo.png','assets/nails-reference.jpeg','assets/nails-demo.png','assets/nails-reference.jpeg','assets/nails-demo.png','assets/nails-reference.jpeg','assets/nails-demo.png','assets/nails-reference.jpeg'],
  services:[{name:'Френч с дизайном',desc:'Нежный френч с цветами',price:'1500 сом',time:'2 ч.'},{name:'Омбре',desc:'Плавный переход цветов',price:'1300 сом',time:'2 ч.'},{name:'Наращивание',desc:'Классическое наращивание',price:'1700 сом',time:'2,5 ч.'},{name:'Маникюр + покрытие',desc:'Покрытие в один тон',price:'900 сом',time:'1,5 ч.'},{name:'Дизайн ногтей',desc:'Дизайн на выбор',price:'1200 сом',time:'1,5 ч.'}]},
 {name:'Adel Beauty',cat:'nails',district:'Нижний Джал',walk:'на месте',price:'1200 сом',rating:'4.8',experience:'Опыт 4 года',saves:96,emoji:'🎀',avatar:'assets/adel-new.png',desc:'Маникюр, укрепление и дизайны на каждый день. Мягкий розовый стиль и аккуратная форма.',ig:'adel_nails',lat:42.842427,lng:74.566250,
  gallery:['assets/nails-reference.jpeg','assets/nails-demo.png','assets/nails-reference.jpeg','assets/nails-demo.png','assets/nails-reference.jpeg','assets/nails-demo.png','assets/nails-reference.jpeg','assets/nails-demo.png','assets/nails-reference.jpeg','assets/nails-demo.png'],
  services:[{name:'Маникюр',desc:'Обработка и покрытие',price:'1200 сом',time:'1,5 ч.'},{name:'Укрепление',desc:'Укрепление гелем',price:'1500 сом',time:'2 ч.'},{name:'Френч',desc:'Классический френч',price:'1400 сом',time:'2 ч.'},{name:'Дизайн',desc:'Дизайн на выбор',price:'1600 сом',time:'2 ч.'},{name:'Снятие + маникюр',desc:'Полный комплекс',price:'1300 сом',time:'2 ч.'}]},
 {name:'Alya Lashes',cat:'lashes',district:'5 микрорайон, дом 2',walk:'на месте',price:'1000 сом',rating:'4.7',experience:'Опыт 6 лет',saves:83,emoji:'👁️',avatar:'assets/alya-new.png',desc:'Наращивание ресниц: натуральный эффект, лисий эффект, мокрый эффект.',ig:'alya_lashes',lat:42.873765,lng:74.636127},
 {name:'Mira Brows',cat:'brows',district:'Asia Mall · Ч. Айтматова 3',walk:'на месте',price:'700 сом',rating:'4.9',experience:'Опыт 3 года',saves:74,emoji:'🤎',avatar:'assets/mira-new.png',desc:'Коррекция, окрашивание и долговременная укладка бровей.',ig:'mira_brows',lat:42.855421,lng:74.586573},
 {name:'Nursaule Nails',cat:'nails',district:'Asia Mall',walk:'на месте',price:'900 сом',rating:'4.8',experience:'Опыт 4 года',saves:68,emoji:'💅',avatar:'assets/nursaule-new.png',desc:'Маникюр и длинный овал. Аккуратные формы и современные дизайны.',ig:'nursaule_nails',lat:42.85575,lng:74.58710,gallery:['assets/nails-demo.png','assets/nails-reference.jpeg'],services:[{name:'Маникюр + покрытие',desc:'Однотонное покрытие',price:'900 сом',time:'1,5 ч.'}]},
 {name:'Diana Nail Art',cat:'nails',district:'Токтоналиева 52 · Политех',walk:'на месте',price:'1500 сом',rating:'4.9',experience:'Опыт 5 лет',saves:121,emoji:'🎨',avatar:'assets/diana-new.png',desc:'Ручная роспись и сложные дизайны ногтей.',ig:'diana_nail_art',lat:42.84975,lng:74.57865,gallery:['assets/nails-reference.jpeg','assets/nails-demo.png'],services:[{name:'Маникюр со сложным дизайном',desc:'Ручная роспись',price:'1500 сом',time:'2,5 ч.'}]},
 {name:'Valeria Nails',cat:'nails',district:'Аламедин Grand · Курманджан Датка 226',walk:'на месте',price:'1000 сом',rating:'4.8',experience:'Опыт 5 лет',saves:89,emoji:'🤍',avatar:'assets/valeria-new.png',desc:'Френч и аккуратный повседневный маникюр.',ig:'valeria_nails',lat:42.88535,lng:74.63740,gallery:['assets/nails-demo.png','assets/nails-reference.jpeg'],services:[{name:'Френч',desc:'Классический или цветной',price:'1000 сом',time:'2 ч.'}]},
 {name:'Marina Nails',cat:'nails',district:'Район Карла Маркса',walk:'на месте',price:'1000 сом',rating:'4.9',experience:'Опыт 8 лет',saves:103,emoji:'✨',avatar:'assets/marina-new.png',desc:'Маникюр и покрытие с вниманием к деталям.',ig:'marina_nails',lat:42.87480,lng:74.63080,gallery:['assets/nails-reference.jpeg','assets/nails-demo.png'],services:[{name:'Маникюр + покрытие',desc:'Полный комплекс',price:'1000 сом',time:'1,5 ч.'}]},
 {name:'Nina Nails',cat:'nails',district:'5 микрорайон, дом 2 · салон «Алия»',walk:'на месте',price:'1000 сом',rating:'4.9',experience:'Опыт 11 лет',saves:156,emoji:'🌸',avatar:'assets/nina-new.png',desc:'Качественный и аккуратный маникюр с большим опытом работы.',ig:'nina_nails',lat:42.87370,lng:74.63605,gallery:['assets/nails-demo.png','assets/nails-reference.jpeg'],services:[{name:'Маникюр',desc:'Обработка и однотонное покрытие',price:'1000 сом',time:'1,5 ч.'}]},
 {name:'Nellinails Studio',cat:'nails',district:'Куйбышева 93 · ЦУМ / Дордой Плаза',walk:'на месте',price:'1000 сом',rating:'4.8',experience:'Студия маникюра',saves:134,emoji:'💗',avatar:'assets/nellinails-new.png',desc:'Маникюр, педикюр и услуга в 4 руки за 1 час 30 минут.',ig:'nellinails_studio',lat:42.87725,lng:74.61475,gallery:['assets/nails-reference.jpeg','assets/nails-demo.png'],services:[{name:'Маникюр однотонный',desc:'Однотонное покрытие',price:'1000 сом',time:'1,5 ч.'},{name:'Педикюр однотонный',desc:'Педикюр с покрытием',price:'1200 сом',time:'1,5 ч.'}]},
 {name:'Bogdan Nails',cat:'nails',district:'Бишкек · принимает на дому',walk:'на месте',price:'1700 сом',rating:'4.7',experience:'Индивидуальная запись',saves:61,emoji:'🖤',avatar:'assets/bogdan-new.png',desc:'Фиксированная стоимость с ремонтом, дизайном и массажем рук.',ig:'bogdan_nails',lat:42.86650,lng:74.59830,gallery:['assets/nails-demo.png','assets/nails-reference.jpeg'],services:[{name:'Маникюр полный комплекс',desc:'Ремонт, дизайн и массаж рук включены',price:'1700 сом',time:'3 ч.'}]}
];
const masterWorkSets = [['assets/work-01.jpg', 'assets/work-02.jpg', 'assets/work-03.jpg', 'assets/work-04.jpg', 'assets/work-05.jpg', 'assets/work-06.jpg'], ['assets/work-04.jpg', 'assets/work-05.jpg', 'assets/work-06.jpg', 'assets/work-07.jpg', 'assets/work-08.jpg', 'assets/work-09.jpg'], ['assets/work-07.jpg', 'assets/work-08.jpg', 'assets/work-09.jpg', 'assets/work-10.jpg', 'assets/work-11.jpg', 'assets/work-12.jpg'], ['assets/work-10.jpg', 'assets/work-11.jpg', 'assets/work-12.jpg', 'assets/work-13.jpg', 'assets/work-14.jpg', 'assets/work-01.jpg'], ['assets/work-13.jpg', 'assets/work-14.jpg', 'assets/work-01.jpg', 'assets/work-02.jpg', 'assets/work-03.jpg', 'assets/work-04.jpg'], ['assets/work-02.jpg', 'assets/work-03.jpg', 'assets/work-04.jpg', 'assets/work-05.jpg', 'assets/work-06.jpg', 'assets/work-07.jpg'], ['assets/work-05.jpg', 'assets/work-06.jpg', 'assets/work-07.jpg', 'assets/work-08.jpg', 'assets/work-09.jpg', 'assets/work-10.jpg'], ['assets/work-08.jpg', 'assets/work-09.jpg', 'assets/work-10.jpg', 'assets/work-11.jpg', 'assets/work-12.jpg', 'assets/work-13.jpg'], ['assets/work-11.jpg', 'assets/work-12.jpg', 'assets/work-13.jpg', 'assets/work-14.jpg', 'assets/work-01.jpg', 'assets/work-02.jpg'], ['assets/work-14.jpg', 'assets/work-01.jpg', 'assets/work-02.jpg', 'assets/work-03.jpg', 'assets/work-04.jpg', 'assets/work-05.jpg'], ['assets/work-03.jpg', 'assets/work-04.jpg', 'assets/work-05.jpg', 'assets/work-06.jpg', 'assets/work-07.jpg', 'assets/work-08.jpg']];
masters.forEach((m,i)=>{m.gallery=masterWorkSets[i]||masterWorkSets[0];});
try{const custom=JSON.parse(localStorage.getItem('pn_master_services_0')||'null');if(Array.isArray(custom)&&custom.length){masters[0].services=custom.map(x=>({name:x.name,desc:'',price:`${Number(x.price)||0} сом`,time:x.time||'1,5 ч.',_promo:x.promo||'',_discount:Number(x.discount)||0}));masters[0].price=masters[0].services[0]?.price||masters[0].price;}}catch(e){}


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


let current='all';let activeChat=0;let availabilityDate='';
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
 if(!userLocation) return list;
 return list.slice().sort((a,b)=>distanceKm(userLocation.lat,userLocation.lng,a.lat,a.lng)-distanceKm(userLocation.lat,userLocation.lng,b.lat,b.lng));
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
 const visible=masters.filter(m=>current==='all'||m.cat===current);
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
  if(status)status.textContent=err.code===1?'Разрешите геолокацию в браузере':'Показываем мастеров по Бишкеку';
 },{enableHighAccuracy:true,timeout:15000,maximumAge:60000});
}

function get2GisKey(){
 return String(window.PROFINAVI_2GIS_KEY || localStorage.getItem(TWO_GIS_KEY_STORAGE) || '899ec609-8768-48b6-9f00-f18100be8c71').trim();
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
   center: [74.5925, 42.8585],
   zoom: 12.4,
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
  if(current !== 'all' && m.cat !== current) return;
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
const setFavs=v=>localStorage.setItem('pn_favs',JSON.stringify(v));
const getFavWorks=()=>JSON.parse(localStorage.getItem('pn_fav_works')||'[]');
const setFavWorks=v=>localStorage.setItem('pn_fav_works',JSON.stringify(v));
const getChats=()=>JSON.parse(localStorage.getItem('pn_chats')||'{}');
const setChats=v=>localStorage.setItem('pn_chats',JSON.stringify(v));
function getClientChatReads(){return JSON.parse(localStorage.getItem('pn_client_chat_read_at_v49')||'{}')}
function updateChatBadge(){
 const chats=getChats(),reads=getClientChatReads();
 const bookings=(JSON.parse(localStorage.getItem('pn_bookings')||'[]')||[]);
 const validIds=new Set((Array.isArray(bookings)?bookings:[]).map(b=>String(b.id)).filter(Boolean));

 const count=[...validIds].filter(id=>{
   const msgs=chats[id]||[];
   const lastMaster=[...msgs].reverse().find(x=>x.from==='master');
   return !!(lastMaster && Number(lastMaster.ts||0)>Number(reads[id]||0));
 }).length;

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
 const images=m.gallery||Array.from({length:6},(_,i)=>m.avatar);
 return images.slice(0,10).map((src,j)=>{const mi=masters.indexOf(m);const key=`${mi}:${j}`;const saved=getFavWorks().includes(key);return `<div class="work-thumb"><img src="${src}" alt="Работа ${m.name} ${j+1}" loading="lazy"><button class="work-fav ${saved?'saved':''}" aria-label="Сохранить работу" onclick="event.stopPropagation();toggleWorkFav('${key}')">${saved?'♥':'♡'}</button></div>`}).join('');
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
       <img src="${image}" alt="${hasOwnImage?x.name:'Нет фото'}">
       ${oldPrice!==null && finalPrice<oldPrice && discount?`<span class="service-image-discount">-${discount}%</span>`:''}
     </div>

     <div class="service-preview-copy">
       <div class="service-offer-line">${label?`<span class="service-promo-badge">${label}</span>`:''}</div>
       <b>${x.name||'Услуга'}</b>
       <p class="service-preview-desc">${x.desc||''}</p>
       <div class="service-preview-price">
         <strong class="${hasDiscount?'promo-price':'regular-price'}">${finalPrice} сом</strong>
         ${oldPrice!==null?`<span class="old-service-price">${oldPrice} сом</span>`:''}
       </div>
       <small>◷ ${x.time||''}</small>
     </div>
   </div>`;
 }).join('');
}
function render(){
 applyMasterProSyncToClientHome();
 const q=(search?.value||'').toLowerCase().trim();const favs=getFavs();
 const data=sortedMasters(masters.filter((m,i)=>(current==='all'||m.cat===current)&&(!availabilityDate||(masterAvailability[availabilityDate]||[]).includes(i))&&`${m.name} ${m.district} ${m.desc}`.toLowerCase().includes(q)));
 document.getElementById('countText').textContent=`Найдено: ${data.length}`;
 grid.innerHTML=data.map((m)=>{const i=masters.indexOf(m);return `<article class="master-card" onclick="openProfile(${i})">
  <div class="master-card-head">
   <div class="master-identity"><img class="master-avatar" src="${m.avatar}" alt="Фото ${m.name}"><div><div class="name">${m.name}</div><div class="master-stats"><span>★ ${m.rating}</span><span>Район: ${m.area||'не указан'}</span></div></div></div>
   <div class="save-wrap"><button class="fav-card" aria-label="Сохранить мастера" onclick="event.stopPropagation();toggleFav(${i})">${favs.includes(i)?'♥':'♡'}</button><small>${m.saves+(favs.includes(i)?1:0)} сохранений</small></div>
  </div>
  <div class="works-carousel">${galleryItems(m)}</div>
  <div class="services-carousel">${serviceItems(m)}</div>
  </div>
 </article>`}).join('');updateStats();
}
function toggleFav(i){const favs=getFavs();const pos=favs.indexOf(i);pos>=0?favs.splice(pos,1):favs.push(i);setFavs(favs);render();renderFavorites();}
function toggleWorkFav(key){const favs=getFavWorks();const pos=favs.indexOf(key);pos>=0?favs.splice(pos,1):favs.push(key);setFavWorks(favs);render();renderSnap(document.querySelector('[data-snap-filter].active')?.dataset.snapFilter||'all');renderFavorites();}
document.querySelectorAll('.cat').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.cat').forEach(b=>b.classList.remove('active'));btn.classList.add('active');current=btn.dataset.category;render();render2GisMarkers();renderHomeLeafletMarkers();});
document.querySelectorAll('.quick-date').forEach(btn=>btn.addEventListener('click',()=>{
 const next=btn.dataset.date;
 availabilityDate=availabilityDate===next?'':next;
 document.querySelectorAll('.quick-date').forEach(b=>b.classList.toggle('active',b.dataset.date===availabilityDate));
 document.querySelector('.quick-date-filter')?.classList.toggle('filtered',Boolean(availabilityDate));
 render();
}));
search?.addEventListener('input',render);
document.getElementById('mapToggle')?.addEventListener('click',()=>{window.location.href='map.html'});
document.getElementById('homeMapOpen')?.addEventListener('click',(event)=>{event.stopPropagation();window.location.href='map.html'});
/* v87: home map uses Leaflet/OpenStreetMap only */
document.querySelectorAll('.pin').forEach(p=>p.onclick=()=>openProfile(Number(p.dataset.master)));
function profileGallery(m){
 const images=(m.gallery||[m.avatar]).slice(0,10);
 return images.map((src,j)=>`<button class="profile-grid-item" onclick="openLightbox('${src}')"><img src="${src}" alt="Работа ${j+1}"><span>${j<3?'✦':''}</span></button>`).join('');
}
function profileMenu(m){
 const list=m.services||[{name:'Основная услуга',desc:'',price:m.price,time:'1,5 ч.'}];
 const mi=masters.indexOf(m);
 return list.map((x,j)=>{
  const offer=getServiceOffer(mi,j,x);
  const safeName=x.name.replace(/'/g,"\'");
  return `<article class="full-menu-card">
   <img src="${(m.gallery&&m.gallery[j%m.gallery.length])||m.avatar}" alt="${x.name}">
   <div class="full-menu-info"><div class="service-offer-line">${serviceOfferMarkup(offer)}</div><h3>${x.name}</h3>${x.desc?`<p>${x.desc}</p>`:''}<div class="service-price-row"><strong class="${offer.label?'promo-price':'regular-price'}">${offer.price}</strong>${offer.oldPrice?`<span class="old-service-price">${offer.oldPrice}</span>`:''}</div><small>${x.time}</small></div>
   <button class="service-book-btn profile-service-book" onclick="event.stopPropagation();showBooking(${mi},'${safeName}')">Записаться</button>
  </article>`;
 }).join('');
}
function openProfile(i){
 window.location.href=`profile.html?id=${encodeURIComponent(i)}`;
}
function openServiceProfile(masterIndex,serviceIndex){
 const params=new URLSearchParams({id:String(masterIndex),service:String(serviceIndex)});
 window.location.href=`profile.html?${params.toString()}#menu`;
}
function bindProfileTabs(){
 document.querySelectorAll('#profileTabs button').forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll('#profileTabs button').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.profile-pane').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active');
  document.querySelector(`.profile-pane[data-pane="${btn.dataset.tab}"]`)?.classList.add('active');
  document.querySelector('.profile-modal-card')?.scrollTo({top:document.querySelector('#profileTabs').offsetTop-5,behavior:'smooth'});
 });
}
function showBooking(i,service){
 const m=masters[i];
 alert(`Запись к ${m.name}\nУслуга: ${service}\n\nВ следующей версии здесь будет календарь свободного времени. После подтверждения записи откроется чат.`);
}
function openLightbox(src){window.open(src,'_blank');}
function openChat(i){activeChat=i;const m=masters[i];document.getElementById('chatAvatar').textContent=m.emoji;document.getElementById('chatName').textContent=m.name;openModal('chatModal');renderChat();}
function renderChat(){const chats=getChats();const key=String(activeChat);if(!chats[key]) chats[key]=[{from:'master',text:'Здравствуйте 💕 Напишите, какую услугу хотите и на какую дату.'}];setChats(chats);document.getElementById('chatMessages').innerHTML=chats[key].map(x=>`<div class="bubble ${x.from}">${x.text}</div>`).join('');document.getElementById('chatMessages').scrollTop=99999;updateStats();}
function sendMsg(text){if(!text.trim())return;const chats=getChats();const key=String(activeChat);if(!chats[key])chats[key]=[];chats[key].push({from:'user',text:text.trim()});chats[key].push({from:'master',text:'Спасибо! В демо это автоответ. В реальном сайте мастер получит сообщение.'});setChats(chats);renderChat();}
document.getElementById('chatForm')?.addEventListener('submit',e=>{e.preventDefault();const input=document.getElementById('chatInput');if(!input)return;sendMsg(input.value);input.value='';});
document.querySelectorAll('.quick-replies button').forEach(b=>b.onclick=()=>sendMsg(b.dataset.msg));
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
function renderUpcomingBooking(){
 const box=document.getElementById('upcomingBooking'); if(!box)return;
 const bookings=getBookings().slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
 if(!bookings.length){box.innerHTML=`<article class="booking-home-card empty"><div><p class="booking-home-kicker">Мои записи</p><h3 style="margin:0 0 5px">Пока нет ближайших записей</h3><p style="margin:0;color:#766b70">Можно записываться к разным мастерам и на несколько услуг.</p></div><div class="booking-home-empty-icon"><svg viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="15" rx="3"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/></svg></div></article>`;return}
 box.innerHTML=`<div class="booking-list-wrap"><div class="booking-list-title"><p class="booking-home-kicker">Мои записи</p><span>${bookings.length}</span></div>${bookings.map((b,idx)=>{
  const m=masters[b.master]||masters[0];
  const confirmed=b.status==='confirmed';
  const cancelled=b.status==='cancelled';
  const id=b.id||String(idx);
  const expired=isChatExpired(b);
  const statusText=cancelled?'Отклонено':expired?'Чат завершён':confirmed?'Подтверждено':'Ожидает подтверждения';
  const statusClass=cancelled?'cancelled':expired?'expired':confirmed?'confirmed':'pending';
  return `<article class="booking-home-card booking-list-item"><span class="booking-status ${statusClass}">${statusText}</span><div class="booking-home-main"><img class="booking-home-avatar" src="${m.avatar}" alt="${m.name}"><div class="booking-home-info"><button class="booking-master-link" onclick="openProfile(${b.master})">${m.name}</button><p><b>${b.dateText||''} · ${b.time||''}</b></p><p>${b.service||'Услуга'}</p></div></div><div class="booking-home-actions"><a class="primary" href="chat.html?master=${b.master}&booking=${encodeURIComponent(id)}">${expired?'Посмотреть переписку':'Написать мастеру'}</a>${(!confirmed&&!cancelled&&!expired)?`<button class="ghost" onclick="confirmBookingDemo('${id}')">Демо: подтвердить</button>`:''}</div><p class="booking-home-note">${cancelled?'Мастер отклонил эту запись. В чате есть автоматическое сообщение от мастера.':expired?'Прошло более 72 часов после записи. Чат закрыт для новых сообщений.':confirmed?'Запись подтверждена. Чат доступен в течение 72 часов после записи.':'Можно написать мастеру сразу, пока заявка ожидает подтверждения.'}</p></article>`
 }).join('')}</div>`;
}
function confirmBookingDemo(id){
 const list=getBookings();
 const b=list.find(x=>String(x.id)===String(id));
 if(!b)return;
 b.status='confirmed';
 localStorage.setItem('pn_bookings',JSON.stringify(list));
 const m=masters[b.master]||masters[0];
 const key=`pn_chat_${b.master}`;
 const messages=JSON.parse(localStorage.getItem(key)||'null')||[];
 const exists=messages.some(x=>x.kind==='booking-confirmed' && String(x.bookingId||'')===String(id));
 if(!exists){
  messages.push({from:'master',kind:'booking-confirmed',bookingId:id,text:`Мастер подтвердил запись. Спасибо за запись! Буду ждать вас ${b.dateText||''} в ${b.time||''} 🌸`,time:'сейчас'});
  localStorage.setItem(key,JSON.stringify(messages));
 }
 const unread=getUnread();
 unread[String(b.master)]=Number(unread[String(b.master)]||0)+1;
 setUnread(unread);
 renderUpcomingBooking();
 updateStats();
}

render();
renderUpcomingBooking();
updateChatBadge();

// Bottom tabs: Home / Search / Работы / Message
function setBottomActive(id){
 document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.remove('active'));
 document.getElementById(id)?.classList.add('active');
}
document.getElementById('bottomHome')?.addEventListener('click',()=>{
 setBottomActive('bottomHome');
 window.scrollTo({top:0,behavior:'smooth'});
});
document.getElementById('bottomSearch')?.addEventListener('click',()=>{window.location.href='map.html'});
document.getElementById('bottomSnap')?.addEventListener('click',()=>{window.location.href='snap.html'});
document.getElementById('bottomChats')?.addEventListener('click',()=>{setBottomActive('bottomChats');});

document.getElementById('bottomFavorites')?.addEventListener('click',()=>{window.location.href='favorites.html'});

const snapIdeas=[
 {master:0,cat:'nails',emoji:'💅',title:'Milky french',type:'photo'},
 {master:1,cat:'nails',emoji:'🌸',title:'Pink clean nails',type:'video'},
 {master:2,cat:'lashes',emoji:'👁️',title:'Wet effect lashes',type:'video'},
 {master:3,cat:'brows',emoji:'🤎',title:'Soft brows',type:'photo'},
 {master:0,cat:'nails',emoji:'✨',title:'Chrome design',type:'photo'},
 {master:1,cat:'nails',emoji:'🎀',title:'Coquette nails',type:'video'},
 {master:2,cat:'lashes',emoji:'🪽',title:'Natural lashes',type:'photo'},
 {master:3,cat:'brows',emoji:'🪞',title:'Lamination',type:'video'}
];
function renderSnap(filter='all'){
 const box=document.getElementById('snapGrid');
 if(!box) return;
 const data=snapIdeas.filter(x=>filter==='all'||x.cat===filter);
 box.innerHTML=data.map((x,idx)=>{
  const m=masters[x.master];
  const originalIndex=snapIdeas.indexOf(x); const key=`snap:${originalIndex}`; const saved=getFavWorks().includes(key);
  return `<div class="snap-item ${idx%3===0?'tall':''}" onclick="openProfile(${x.master})" ondblclick="event.preventDefault();event.stopPropagation();toggleWorkFav('${key}')">
    ${x.type==='video'?'<div class="video-badge">▶ video</div>':''}
    <button class="snap-fav ${saved?'saved':''}" aria-label="Сохранить работу" onclick="event.stopPropagation();toggleWorkFav('${key}')">${saved?'♥':'♡'}</button>
    <div class="snap-emoji">${x.emoji}</div>
    <div class="snap-caption"><b>${x.title}</b><span>${m.name} · ${m.district}</span></div>
  </div>`;
 }).join('');
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
  box.innerHTML=ids.length?`<div class="favorite-masters-list">${ids.map(i=>{const m=masters[i];if(!m)return'';return `<article class="favorite-master" onclick="openProfile(${i})"><img src="${m.avatar}" alt="${m.name}"><div><h3>${m.name}</h3><p>★ ${m.rating} · ${m.experience}</p><span>⌖ ${m.district}</span></div><button onclick="event.stopPropagation();toggleFav(${i})" aria-label="Удалить из избранного">♥</button></article>`}).join('')}</div>`:`<div class="favorites-empty"><b>♡</b><h3>Нет сохранённых мастеров</h3><p>Нажмите сердечко на карточке мастера.</p></div>`;
 }else{
  const keys=getFavWorks();
  box.innerHTML=keys.length?`<div class="favorite-works-grid">${keys.map(key=>{if(key.startsWith('snap:')){const x=snapIdeas[Number(key.split(':')[1])];if(!x)return'';const m=masters[x.master];return `<article class="favorite-work snap-saved" onclick="openProfile(${x.master})"><button onclick="event.stopPropagation();toggleWorkFav('${key}')">♥</button><div class="saved-work-emoji">${x.emoji}</div><div><b>${x.title}</b><span>${m.name}</span></div></article>`}const [mi,gi]=key.split(':').map(Number);const m=masters[mi];const src=m?.gallery?.[gi]||m?.avatar;if(!m)return'';return `<article class="favorite-work" onclick="openProfile(${mi})"><img src="${src}" alt="Работа ${m.name}"><button onclick="event.stopPropagation();toggleWorkFav('${key}')">♥</button><div><b>${m.name}</b><span>Открыть профиль</span></div></article>`}).join('')}</div>`:`<div class="favorites-empty"><b>♡</b><h3>Нет сохранённых работ</h3><p>Нажмите сердечко на фото или дважды коснитесь работы в Работы.</p></div>`;
 }
}
document.querySelectorAll('[data-favorite-tab]').forEach(btn=>btn.addEventListener('click',()=>renderFavorites(btn.dataset.favoriteTab)));


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
  html:`<button class="map-master-marker" type="button" aria-label="Открыть профиль ${m.name}"><img src="${m.avatar}" alt=""><span>${m.name}</span></button>`,
  iconSize:[56,68],iconAnchor:[28,58]
 });
}
function renderHomeLeafletMarkers(){
 if(!homeLeafletMap||!window.L)return;
 homeLeafletMarkers.forEach(x=>homeLeafletMap.removeLayer(x));homeLeafletMarkers=[];
 const visible=masters.filter(m=>current==='all'||m.cat===current);
 visible.forEach((m,i)=>{
  const masterIndex=masters.indexOf(m);
  const marker=L.marker([m.lat,m.lng],{icon:homeMasterIcon(m)}).addTo(homeLeafletMap);
  marker.on('click',e=>{L.DomEvent.stopPropagation(e);openProfile(masterIndex)});
  homeLeafletMarkers.push(marker);
 });
 if(visible.length){
  homeLeafletMap.fitBounds(visible.map(m=>[m.lat,m.lng]),{padding:[25,25],maxZoom:13});
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
  }).setView([42.8585,74.5925],12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,
    attribution:'© OpenStreetMap'
  }).addTo(homeLeafletMap);

  renderHomeLeafletMarkers();
  const status=document.getElementById('homeMapStatus');
  if(status)status.textContent='Бишкек · двигайте карту свободно';
 }catch(error){
  console.error('Home map error',error);
  connect?.classList.remove('hidden');
  mapEl.classList.add('hidden');
  const status=document.getElementById('homeMapStatus');
  if(status)status.textContent='Карта временно недоступна';
 }
}
window.addEventListener('DOMContentLoaded',()=>{if(!document.getElementById('mapBlock')?.classList.contains('hidden'))initHomeLeafletMap();});



const masterCabinetBtn=document.getElementById('openMasterCabinet');
if(masterCabinetBtn){
 masterCabinetBtn.textContent='Кабинет мастера';
 const hint=document.getElementById('masterCabinetHint');
 if(hint)hint.textContent='ProfiNavi Pro';
 masterCabinetBtn.addEventListener('click',(e)=>{
   e.preventDefault();
   e.stopPropagation();
   const hasMasterNow=!!localStorage.getItem('pn_master_session');
   localStorage.setItem('pn_last_mode','master');
   window.location.assign(hasMasterNow?'master.html':'master-login.html');
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
