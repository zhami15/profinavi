
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
const requestedMasterIndex=Number(qs.get('master')||0);
if(Number.isInteger(requestedMasterIndex)&&requestedMasterIndex>=0){
 try{const cached=JSON.parse(localStorage.getItem(`pn_dynamic_master_${requestedMasterIndex}`)||'null');if(cached)masters[requestedMasterIndex]=cached}catch(e){}
}
let masterIndex=requestedMasterIndex;
if(!Number.isInteger(masterIndex)||!masters[masterIndex]) masterIndex=0;
let m=masters[masterIndex];

if(masterIndex===0){
  try{
    const p=JSON.parse(localStorage.getItem('pn_master_profile_0')||'null');
    if(p){
      m={...m,
        name:p.name||m.name,
        avatar:p.avatar||m.avatar,
        gallery:(Array.isArray(p.works)&&p.works.length)?p.works:m.gallery,
        district:[p.area,p.address].filter(Boolean).join(' · ')||m.district
      };
    }
  }catch(e){}
  try{
    const customServices=JSON.parse(localStorage.getItem('pn_master_services_0')||'null');
    if(Array.isArray(customServices)&&customServices.length){
      m.services=customServices.map(s=>{
        const old=Number(s.price)||0;
        const hasNew=s.newPrice!==undefined&&s.newPrice!==null&&String(s.newPrice)!==''&&Number(s.newPrice)<old;
        const final=hasNew?Number(s.newPrice):old;
        return {
          ...s,
          desc:s.promo||'',
          price:`${final} сом`,
          time:s.time||'',
          image:s.image||null
        };
      });
    }
  }catch(e){}
}
const serviceName=decodeURIComponent(qs.get('service')||m.services[0].name);
const service=m.services.find(s=>s.name===serviceName)||m.services[0];
let selectedDate=null;
let selectedTime=null;

const monthNames=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const dayNames=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
const now=new Date();
const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
// Мастер задаёт, на сколько дней вперёд открыта запись. Минимум — 31 день.
const bookingDays=Math.max(31, Number(m.bookingDays)||31);
const maxDate=new Date(today);
maxDate.setDate(maxDate.getDate()+bookingDays-1);
let visibleStart=new Date(today);

function buildDays(){
  const days=[];
  for(let i=0;i<7;i++){
    const d=new Date(visibleStart);
    d.setDate(visibleStart.getDate()+i);
    if(d<=maxDate) days.push(d);
  }
  return days;
}
function atStart(){return visibleStart.getTime()<=today.getTime()}
function atEnd(){
  const next=new Date(visibleStart);
  next.setDate(next.getDate()+7);
  return next>maxDate;
}
function timeSlots(){
  if(masterIndex===0){
    try{
      const cfg=JSON.parse(localStorage.getItem('pn_master_schedule_config')||'null');
      if(cfg&&cfg.start&&cfg.end&&cfg.step){
        const out=[];
        const [sh,sm]=cfg.start.split(':').map(Number);
        const [eh,em]=cfg.end.split(':').map(Number);
        let cur=sh*60+sm,end=eh*60+em;
        while(cur<end){
          out.push(`${String(Math.floor(cur/60)).padStart(2,'0')}:${String(cur%60).padStart(2,'0')}`);
          cur+=Number(cfg.step)||60;
        }
        return out;
      }
    }catch(e){}
  }
  const slots=[];
  for(let h=9;h<=20;h++){
    slots.push(`${String(h).padStart(2,'0')}:00`);
    if(h<20) slots.push(`${String(h).padStart(2,'0')}:30`);
  }
  return slots;
}
function slotDateTime(date,time){
  const [hours,minutes]=time.split(':').map(Number);
  const dt=new Date(date);
  dt.setHours(hours,minutes,0,0);
  return dt;
}
function isPastSlot(date,time){
  // Для сегодняшнего дня нельзя выбирать уже прошедшее время.
  return slotDateTime(date,time).getTime() <= Date.now();
}
function localDateKey(date){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function isBookedAlready(date,time){
  try{
    const bookings=JSON.parse(localStorage.getItem('pn_bookings')||'[]');
    return bookings.some(x=>{
      if(Number(x.master||x.masterId||0)!==masterIndex) return false;
      if(x.status==='cancelled') return false;
      const d=new Date(x.date);
      return localDateKey(d)===localDateKey(date) && x.time===time;
    });
  }catch(e){return false}
}
function isAvailable(date,time){
  if(isPastSlot(date,time)) return false;
  if(isBookedAlready(date,time)) return false;

  if(m?._backend){
    const day=m.slotMap?.[localDateKey(date)]||[];
    return day.includes(time);
  }
  if(masterIndex===0){
    try{
      const slots=JSON.parse(localStorage.getItem('pn_master_slots')||'{}');
      const day=slots[localDateKey(date)]||[];
      return day.includes(time);
    }catch(e){
      return false;
    }
  }

  const seed=date.getDate()+Number(time.slice(0,2))*3+(time.endsWith('30')?1:0)+masterIndex;
  return seed%4!==0 && seed%7!==0;
}
function fmtDate(d){return `${d.getDate()} ${monthNames[d.getMonth()].toLowerCase()}`}
function sameDay(a,b){return a&&b&&a.toDateString()===b.toDateString()}
function render(){
  const days=buildDays();
  const content=document.getElementById('bookingContent');
  content.innerHTML=`
    <header class="booking-head">
      <button class="booking-close" onclick="history.length>1?history.back():location.href='profile.html?id=${masterIndex}'" aria-label="Закрыть">×</button>
      <h1>Запись</h1>
      <span></span>
    </header>
    <section class="booking-service">
      <h2>Выбранная услуга</h2>
      <article>
        <img src="${service.image||m.gallery[0]||m.avatar}" alt="${service.name}">
        <div><small>${m.name}</small><h3>${service.name}</h3><p>${service.desc}</p><span>◷ ${service.time}</span><strong>${service.price}</strong></div>
      </article>
    </section>
    <section class="booking-calendar-section">
      <div class="booking-section-title"><h2>Выберите дату и время</h2><span>${m.district}</span></div>
      <div class="booking-month-row"><button ${atStart()?'disabled':''} onclick="shiftWeek(-7)" aria-label="Предыдущая неделя">‹</button><b>${monthNames[days[0].getMonth()]} ${days[0].getFullYear()}</b><button ${atEnd()?'disabled':''} onclick="shiftWeek(7)" aria-label="Следующая неделя">›</button></div>
      <div class="booking-table-wrap">
        <table class="booking-table">
          <thead><tr><th aria-label="Часы"></th>${days.map(d=>`<th class="${sameDay(d,today)?'today':''}"><b>${d.getDate()}</b><span>${dayNames[d.getDay()]}</span></th>`).join('')}</tr></thead>
          <tbody>${timeSlots().map(t=>`<tr><th>${t}</th>${days.map(d=>{const ok=isAvailable(d,t); const selected=sameDay(selectedDate,d)&&selectedTime===t; return `<td><button class="slot ${ok?'available':'busy'} ${selected?'selected':''}" ${ok?`onclick="selectSlot('${d.toISOString()}','${t}')"`:'disabled'} aria-label="${ok?'Доступно':(isPastSlot(d,t)?'Время прошло':'Недоступно')} ${fmtDate(d)} ${t}">${ok?'○':'×'}</button></td>`}).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>
    </section>
    <div class="booking-footer">
      <div>${selectedDate?`<b>${fmtDate(selectedDate)}, ${selectedTime}</b><span>${service.name}</span>`:'<b>Выберите свободное время</b><span>Доступные слоты отмечены кружком</span>'}</div>
      <button ${selectedDate?'':'disabled'} onclick="confirmBooking()">Продолжить</button>
    </div>`;
}
function shiftWeek(delta){
  const next=new Date(visibleStart);
  next.setDate(next.getDate()+delta);
  if(next<today) visibleStart=new Date(today);
  else if(next>maxDate) return;
  else visibleStart=next;
  render();
}
function selectSlot(iso,time){selectedDate=new Date(iso);selectedTime=time;render();setTimeout(()=>document.querySelector('.booking-footer')?.scrollIntoView({behavior:'smooth',block:'end'}),30)}
function confirmBooking(){
  if(!selectedDate)return;
  const params=new URLSearchParams({master:String(masterIndex),service:service.name,date:selectedDate.toISOString(),time:selectedTime});
  location.href=`booking-confirm.html?${params.toString()}`;
}
render();


window.addEventListener('storage',e=>{
  if(e.key && (e.key.startsWith('pn_master_') || e.key==='pn_bookings')){
    location.reload();
  }
});


async function pnRecoverDynamicBooking(){
 if(masterIndex===requestedMasterIndex)return;
 try{
  if(!window.PNRanking?.hydrate)return;
  await window.PNRanking.hydrate(masters);
  if(masters[requestedMasterIndex])location.reload();
 }catch(e){console.warn('booking dynamic master recovery',e)}
}
window.addEventListener('DOMContentLoaded',()=>setTimeout(pnRecoverDynamicBooking,50));
