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
try{
 const cp=JSON.parse(localStorage.getItem('pn_master_profile_0')||'null');
 if(cp){
  if(cp.name) masters[0].name=cp.name;
  if(cp.area||cp.address) masters[0].district=[cp.area,cp.address].filter(Boolean).join(' · ');
  if(cp.experience) masters[0].experience=cp.experience;
  if(cp.about) masters[0].desc=cp.about;
  if(cp.avatar) masters[0].avatar=cp.avatar;
  if(Array.isArray(cp.works)&&cp.works.length) masters[0].gallery=cp.works;
 }
}catch(e){}
try{const custom=JSON.parse(localStorage.getItem('pn_master_services_0')||'null');if(Array.isArray(custom)&&custom.length){masters[0].services=custom.map(x=>({name:x.name,desc:'',price:`${Number(x.price)||0} сом`,time:x.time||'1,5 ч.',_promo:x.promo||'',_discount:Number(x.discount)||0}));masters[0].price=masters[0].services[0]?.price||masters[0].price;}}catch(e){}

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



const CLIENT_MASTER_REVIEWS=[
 {name:'Алина',rating:5,service:'Маникюр + покрытие',text:'Очень аккуратная работа, всё понравилось. Обязательно вернусь.',date:'12 августа',photos:['assets/work-01.jpg','assets/work-02.jpg']},
 {name:'Мээрим',rating:5,service:'Френч с дизайном',text:'Красиво, чисто и удобно. Результат полностью совпал с ожиданиями.',date:'9 августа',photos:['assets/work-03.jpg']},
 {name:'Айжан',rating:5,service:'Дизайн ногтей',text:'Мастер внимательно выслушала пожелания и сделала именно тот дизайн, который я хотела.',date:'4 августа',photos:['assets/work-04.jpg','assets/work-05.jpg','assets/work-06.jpg']},
 {name:'Диана',rating:5,service:'Маникюр + покрытие',text:'Очень приятная атмосфера и аккуратный маникюр. Носка отличная.',date:'29 июля',photos:[]},
 {name:'Алина К.',rating:4,service:'Омбре',text:'Всё понравилось, особенно форма и обработка.',date:'22 июля',photos:[]},
 {name:'Жибек',rating:5,service:'Наращивание',text:'Записалась впервые и осталась довольна. Приду ещё.',date:'15 июля',photos:['assets/work-07.jpg']}
];

function getClientEditableProfile(index){
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
 let saved=[];
 try{saved=JSON.parse(localStorage.getItem('pn_verified_reviews')||'[]').filter(r=>r.verified && Number(r.masterId||0)===Number(index))}catch(e){}
 return [...saved,...CLIENT_MASTER_REVIEWS];
}
function showClientAllReviews(){
 const m=masters[masterIndex], p=getClientEditableProfile(masterIndex), list=allClientReviews(masterIndex);
 const rating=p.rating||m.rating;
 const ov=document.createElement('div');ov.className='master-edit-profile-overlay';
 ov.innerHTML=`<div class="master-edit-profile-screen reviews-full-screen">
   <header class="edit-profile-head"><button class="edit-close" type="button">‹ Назад</button><b>Отзывы</b><span></span></header>
   <section class="reviews-full-summary"><strong>${rating}</strong><div>★★★★★</div><span>${list.length} отзывов</span></section>
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
if(!Number.isInteger(masterIndex)||!masters[masterIndex]) masterIndex=0;
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
 const fav=getFavs().includes(masterIndex);
 const p=getClientEditableProfile(masterIndex);
 const data=getClientEditableServices(masterIndex) || m.services || [{name:'Основная услуга',price:parseInt(String(m.price||'').replace(/\D/g,''),10)||0,time:'1,5 ч.'}];
 const gallery=(p.works&&p.works.length?p.works:m.gallery)||[m.avatar];
 const cover=p.cover||gallery[0]||p.avatar||m.avatar;
 const avatar=p.avatar||m.avatar;
 const name=p.name||m.name;
 const area=p.area || String(m.district||'').split('·')[0].trim();
 const rating=p.rating||m.rating;
 const about=p.about||m.desc||'';
 const strengths=(p.strengths&&p.strengths.length?p.strengths:['Аккуратность','Современный дизайн','Консультация']);
 const payment=p.payment||'Наличными и переводом';
 const address=p.address||m.district||'Бишкек';
 const reviewsList=allClientReviews(masterIndex);
 const reviews=Math.max(reviewsList.length,12);

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
      <div class="profile-rating"><span>★ ${rating}</span><button class="reviews-link" onclick="showClientAllReviews()">${reviews} отзывов</button></div>
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
      <div class="reviews-score"><strong>${rating}</strong><div>★★★★★</div><span>${reviews} отзывов</span></div>
      ${reviewsList.slice(0,2).map(clientReviewCard).join('')}
      <button class="show-all-reviews" onclick="showClientAllReviews()">Показать все отзывы</button>
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
