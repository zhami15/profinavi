
function sendNewBookingToMasterChat(booking){
 try{
   const chats=JSON.parse(localStorage.getItem('pn_chats')||'{}');
   const key=String(booking.id);chats[key]=chats[key]||[];
   if(!chats[key].some(m=>m.bookingRequestMessage)){
     const d=booking.date?new Date(booking.date):null;
     const dateText=d&&!isNaN(d)?d.toLocaleDateString('ru-RU',{day:'numeric',month:'long'}):'';
     chats[key].push({
       from:'client',
       text:`Новая заявка на запись\n${booking.clientName||'Клиент ProfiNavi'}\n${booking.service||'Услуга'}${dateText?`\n${dateText}`:''}${booking.time?` в ${booking.time}`:''}`,
       ts:Date.now(),
       bookingRequestMessage:true
     });
     localStorage.setItem('pn_chats',JSON.stringify(chats));

     const unread=JSON.parse(localStorage.getItem('pn_master_chat_unread')||'{}');
     unread[key]=Number(unread[key]||0)+1;
     localStorage.setItem('pn_master_chat_unread',JSON.stringify(unread));
   }
 }catch(e){}
}

const masters=window.PNCloneMasters();
window.masters=masters;
const qs=new URLSearchParams(location.search);
const requestedMasterIndex=Number(qs.get('master'));
let masterIndex=Number.isInteger(requestedMasterIndex)&&requestedMasterIndex>=0?requestedMasterIndex:0;
let m=null;
let serviceName=qs.get('service')||'';
let service=null;
let selectedDate=null;
let selectedTime=null;
let loadingBackend=true;
let loadError='';

try{
 const cached=JSON.parse(localStorage.getItem(`pn_dynamic_master_${masterIndex}`)||'null');
 if(cached){masters[masterIndex]=cached;m=cached;}
}catch(e){}

const monthNames=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const dayNames=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
const now=new Date();
const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
let bookingDays=60;
let maxDate=new Date(today);
let visibleStart=new Date(today);

function localDateKey(date){
 return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function resetCalendarRange(){
 bookingDays=Math.max(31,Number(m?.bookingDays)||60);
 maxDate=new Date(today);maxDate.setDate(maxDate.getDate()+bookingDays-1);
 if(visibleStart<today)visibleStart=new Date(today);
}
function applyMaster(next){
 if(!next)return;
 m=next;masterIndex=Number(next.id??masterIndex);masters[masterIndex]=next;
 const list=Array.isArray(m.services)&&m.services.length?m.services:[{name:'Услуга',desc:'',price:'0 сом',time:''}];
 if(!serviceName)serviceName=list[0].name;
 service=list.find(s=>s.name===serviceName)||list[0];
 resetCalendarRange();
}
if(m)applyMaster(m);

function buildDays(){
 const days=[];
 for(let i=0;i<7;i++){
  const d=new Date(visibleStart);d.setDate(visibleStart.getDate()+i);
  if(d<=maxDate)days.push(d);
 }
 return days;
}
function atStart(){return visibleStart.getTime()<=today.getTime()}
function atEnd(){const next=new Date(visibleStart);next.setDate(next.getDate()+7);return next>maxDate}
function timeSlots(){
 if(m?._backend){
  const found=new Set();
  Object.values(m.slotMap||{}).forEach(day=>(day||[]).forEach(t=>found.add(String(t))));
  if(found.size)return [...found].sort((a,b)=>a.localeCompare(b));
  const start=m.openTime||'09:00',end=m.closeTime||'21:00';
  const [sh,sm]=start.split(':').map(Number),[eh,em]=end.split(':').map(Number);
  if(Number.isFinite(sh)&&Number.isFinite(eh)){
   const out=[];let cur=sh*60+(sm||0),last=eh*60+(em||0);
   while(cur<last){out.push(`${String(Math.floor(cur/60)).padStart(2,'0')}:${String(cur%60).padStart(2,'0')}`);cur+=30}
   if(out.length)return out;
  }
 }
 const out=[];for(let h=9;h<=20;h++){out.push(`${String(h).padStart(2,'0')}:00`);if(h<20)out.push(`${String(h).padStart(2,'0')}:30`)}return out;
}
function slotDateTime(date,time){const [h,min]=time.split(':').map(Number);const dt=new Date(date);dt.setHours(h,min,0,0);return dt}
function isPastSlot(date,time){return slotDateTime(date,time).getTime()<=Date.now()}
function isBookedAlready(date,time){
 try{
  const bookings=JSON.parse(localStorage.getItem('pn_bookings')||'[]');
  return bookings.some(x=>{
   if(Number(x.master??x.masterId??-1)!==masterIndex||x.status==='cancelled'||x.status==='declined')return false;
   const d=new Date(x.date||x.starts_at);return !Number.isNaN(d.getTime())&&localDateKey(d)===localDateKey(date)&&String(x.time||'')===time;
  });
 }catch(e){return false}
}
function isAvailable(date,time){
 if(isPastSlot(date,time)||isBookedAlready(date,time))return false;
 if(m?._backend)return (m.slotMap?.[localDateKey(date)]||[]).includes(time);
 return false;
}
function fmtDate(d){return `${d.getDate()} ${monthNames[d.getMonth()].toLowerCase()}`}
function sameDay(a,b){return a&&b&&a.toDateString()===b.toDateString()}
function loadingMarkup(){return `<div class="master-empty booking-loading-state"><b>Загружаем свободное время…</b><p>Получаем актуальное расписание мастера.</p></div>`}
function errorMarkup(msg){return `<header class="booking-head"><button class="booking-close" onclick="history.length>1?history.back():location.href='client.html'" aria-label="Закрыть">×</button><h1>Запись</h1><span></span></header><div class="master-empty booking-loading-state"><b>Не удалось загрузить расписание</b><p>${msg||'Попробуйте открыть запись ещё раз.'}</p><button class="primary" onclick="pnHydrateBookingMaster()">Повторить</button></div>`}
function render(){
 const content=document.getElementById('bookingContent');if(!content)return;
 if(loadingBackend&&!m){content.innerHTML=loadingMarkup();return}
 if(loadError&&!m){content.innerHTML=errorMarkup(loadError);return}
 if(!m||!service){content.innerHTML=errorMarkup('Мастер или услуга не найдены.');return}
 const days=buildDays();
 const times=timeSlots();
 const hasAny=Object.values(m.slotMap||{}).some(x=>Array.isArray(x)&&x.length);
 content.innerHTML=`
  <header class="booking-head">
   <button class="booking-close" onclick="history.length>1?history.back():location.href='profile.html?id=${masterIndex}'" aria-label="Закрыть">×</button><h1>Запись</h1><span></span>
  </header>
  <section class="booking-service"><h2>Выбранная услуга</h2><article>
   <img src="${service.image||m.gallery?.[0]||m.avatar}" alt="${service.name}">
   <div><small>${m.name}</small><h3>${service.name}</h3><p>${service.desc||''}</p><span>${service.time?`◷ ${service.time}`:''}</span><strong>${service.price||''}</strong></div>
  </article></section>
  <section class="booking-calendar-section">
   <div class="booking-section-title"><h2>Выберите дату и время</h2><span>${m.district||''}</span></div>
   ${!hasAny?'<div class="master-empty booking-no-slots"><b>У мастера пока нет свободных окон</b><p>Попробуйте проверить расписание позже.</p></div>':`
   <div class="booking-month-row"><button ${atStart()?'disabled':''} onclick="shiftWeek(-7)" aria-label="Предыдущая неделя">‹</button><b>${monthNames[days[0].getMonth()]} ${days[0].getFullYear()}</b><button ${atEnd()?'disabled':''} onclick="shiftWeek(7)" aria-label="Следующая неделя">›</button></div>
   <div class="booking-table-wrap"><table class="booking-table">
    <thead><tr><th aria-label="Часы"></th>${days.map(d=>`<th class="${sameDay(d,today)?'today':''}"><b>${d.getDate()}</b><span>${dayNames[d.getDay()]}</span></th>`).join('')}</tr></thead>
    <tbody>${times.map(t=>`<tr><th>${t}</th>${days.map(d=>{const ok=isAvailable(d,t),selected=sameDay(selectedDate,d)&&selectedTime===t;return `<td><button class="slot ${ok?'available':'busy'} ${selected?'selected':''}" ${ok?`onclick="selectSlot('${d.toISOString()}','${t}')"`:'disabled'} aria-label="${ok?'Доступно':(isPastSlot(d,t)?'Время прошло':'Недоступно')} ${fmtDate(d)} ${t}">${ok?'○':'×'}</button></td>`}).join('')}</tr>`).join('')}</tbody>
   </table></div>`}
  </section>
  <div class="booking-footer"><div>${selectedDate?`<b>${fmtDate(selectedDate)}, ${selectedTime}</b><span>${service.name}</span>`:'<b>Выберите свободное время</b><span>Доступные слоты отмечены кружком</span>'}</div><button ${selectedDate?'':'disabled'} onclick="confirmBooking()">Продолжить</button></div>`;
}
function shiftWeek(delta){const next=new Date(visibleStart);next.setDate(next.getDate()+delta);if(next<today)visibleStart=new Date(today);else if(next>maxDate)return;else visibleStart=next;render()}
function selectSlot(iso,time){selectedDate=new Date(iso);selectedTime=time;render();setTimeout(()=>document.querySelector('.booking-footer')?.scrollIntoView({behavior:'smooth',block:'end'}),30)}
function confirmBooking(){if(!selectedDate||!selectedTime)return;const params=new URLSearchParams({master:String(masterIndex),service:service.name,date:selectedDate.toISOString(),time:selectedTime});location.href=`booking-confirm.html?${params.toString()}`}

async function pnHydrateBookingMaster(){
 loadingBackend=true;loadError='';if(!m)render();
 try{
  if(!window.PNData?.loadPublicMasterBundle||!window.PNRanking?.fromBundle)throw new Error('Модуль расписания не загрузился.');
  const b=await window.PNData.loadPublicMasterBundle(masterIndex);
  if(!b)throw new Error('Профиль мастера не найден или не опубликован.');
  const dynamic=window.PNRanking.fromBundle(b.profile,b.services,b.works,b.slots||[]);
  if(!dynamic)throw new Error('Не удалось прочитать профиль мастера.');
  applyMaster(dynamic);
  try{localStorage.setItem(`pn_dynamic_master_${masterIndex}`,JSON.stringify(dynamic))}catch(e){}
 }catch(e){console.warn('booking schedule load',e);loadError=e?.message||'Ошибка загрузки расписания';}
 finally{loadingBackend=false;render()}
}

render();
pnHydrateBookingMaster();
window.addEventListener('pageshow',()=>pnHydrateBookingMaster());
window.addEventListener('storage',e=>{if(e.key&&e.key==='pn_bookings')pnHydrateBookingMaster()});
