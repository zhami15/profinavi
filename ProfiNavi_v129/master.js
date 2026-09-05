
(function migrateLegacyMasterChatsV50(){
 try{
   const shared=JSON.parse(localStorage.getItem('pn_chats')||'{}');
   const legacy=JSON.parse(localStorage.getItem('pn_master_chats')||'{}');
   let changed=false;
   Object.keys(legacy).forEach(id=>{
     shared[id]=shared[id]||[];
     const existing=new Set(shared[id].map(m=>`${m.from}|${m.ts}|${m.text}`));
     legacy[id].forEach(msg=>{
       const sig=`${msg.from}|${msg.ts}|${msg.text}`;
       if(!existing.has(sig)){
         shared[id].push(msg);
         existing.add(sig);
         changed=true;
       }
     });
     shared[id].sort((a,b)=>Number(a.ts||0)-Number(b.ts||0));
   });
   if(changed)localStorage.setItem('pn_chats',JSON.stringify(shared));
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


const MASTER_KEY='pn_master_session';
const SERVICE_KEY='pn_master_services_0';
const SLOT_KEY='pn_master_slots';
const CHAT_KEY='pn_chats';

const MASTER_READ_AT_KEY='pn_master_chat_read_at_v49';
function getMasterReadAt(){return jget(MASTER_READ_AT_KEY,{})}
function markMasterRead(id){
 const r=getMasterReadAt();
 r[String(id)]=Date.now();
 jset(MASTER_READ_AT_KEY,r);
}
function masterChatUnread(id){
 const chats=jget(CHAT_KEY,{});
 const msgs=chats[String(id)]||[];
 const lastClient=[...msgs].reverse().find(x=>x.from==='client');
 return !!(lastClient && Number(lastClient.ts||0)>Number(getMasterReadAt()[String(id)]||0));
}
function masterUnreadCount(){
 return getBookings().filter(b=>masterChatUnread(b.id)).length;
}
function bookingEndAt(b){
 if(!b?.date)return null;
 const d=new Date(b.date);
 if(Number.isNaN(d.getTime()))return null;
 const [h,min]=String(b.time||'00:00').split(':').map(Number);
 return new Date(d.getFullYear(),d.getMonth(),d.getDate(),h||0,min||0,0,0);
}
function masterChatExpired(b){
 const dt=bookingEndAt(b);
 return dt?Date.now()>=dt.getTime()+72*60*60*1000:false;
}
function pushMasterMessage(bookingId,text,kind='message'){
 const chats=jget(CHAT_KEY,{});
 const key=String(bookingId);
 chats[key]=chats[key]||[];
 chats[key].push({from:'master',text,ts:Date.now(),kind});
 jset(CHAT_KEY,chats);
}
const GREETING_KEY='pn_master_auto_greeting';
const PROFILE_KEY='pn_master_profile_0';

const DEFAULT_SERVICES=[];
const DEFAULT_PROFILE={
 name:'Мастер ProfiNavi', area:'', address:'',
 rating:0, reviewsCount:0, experience:'', about:'',
 avatar:'icon-192.png',
 works:[]
};

function jget(k,d){try{return JSON.parse(localStorage.getItem(k)||'null')??d}catch{return d}}
function jset(k,v){localStorage.setItem(k,JSON.stringify(v))}
function session(){return jget(MASTER_KEY,null)}
function requireMaster(){if(!session()){location.href='master-login.html';return false}return true}
function getBookings(){return jget('pn_bookings',[])}
function setBookings(v){jset('pn_bookings',v)}
function services(){
 const saved=jget(SERVICE_KEY,null);
 if(!saved)return DEFAULT_SERVICES.map(x=>({...x}));
 const imageByName=Object.fromEntries(DEFAULT_SERVICES.map(x=>[x.name,x.image]));
 return saved.map(s=>({...s,image:(s.image===undefined?imageByName[s.name]:s.image)}));
}
function saveServices(v){jset(SERVICE_KEY,v);window.PNData?.replaceMasterServices?.(v).catch(e=>console.warn('services backend',e))}
function profile(){return {...DEFAULT_PROFILE,...jget(PROFILE_KEY,{})}}
function saveProfile(v){jset(PROFILE_KEY,v);window.PNData?.saveMasterProfile?.(v).then(()=>Array.isArray(v.works)?PNData.replaceMasterWorks(v.works):null).catch(e=>console.warn('profile backend',e))}
async function toggleMasterPublish(){
 const p=profile(),next=!p.is_published;
 try{if(!window.PNData)throw new Error('База данных не загрузилась');const saved=await PNData.setMasterPublished(next);jset(PROFILE_KEY,{...p,is_published:saved});renderProfile()}catch(e){alert('Не удалось изменить публикацию: '+e.message)}
}
function money(v){return new Intl.NumberFormat('ru-RU').format(Number(v)||0)+' сом'}
function sameDay(a,b){const x=new Date(a),y=new Date(b);return x.getFullYear()===y.getFullYear()&&x.getMonth()===y.getMonth()&&x.getDate()===y.getDate()}
function bookingRevenue(b){const s=services().find(x=>x.name===b.service);return s?.price||1200}

const MASTER_READ_KEY='pn_master_chat_read_at';
function masterReadMap(){return jget(MASTER_READ_KEY,{})}
function masterUnreadChatIds(){
 const reads=masterReadMap(),chats=jget(CHAT_KEY,{}),id='thread_master_0_client_main';
 const lastClient=[...(chats[id]||[])].reverse().find(x=>x.from==='client');
 return (lastClient&&Number(lastClient.ts||0)>Number(reads[id]||0))?[id]:[];
}
function markMasterChatRead(id){
 const reads=masterReadMap();
 reads[String(id)]=Date.now();
 jset(MASTER_READ_KEY,reads);
 const legacy=jget('pn_master_chat_unread',{});
 if(Object.prototype.hasOwnProperty.call(legacy,String(id))){
   delete legacy[String(id)];
   jset('pn_master_chat_unread',legacy);
 }
}

function nav(active){const totalUnread=masterUnreadCount();return `<nav class="master-bottom-nav">
<a class="${active==='home'?'active':''}" href="master.html"><svg viewBox="0 0 24 24"><path d="M3.5 10.8 12 4l8.5 6.8v8.7a1 1 0 0 1-1 1h-5.2v-5.6H9.7v5.6H4.5a1 1 0 0 1-1-1v-8.7Z"/></svg><span>Главная</span></a>
<a class="${active==='bookings'?'active':''}" href="master-bookings.html"><svg viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/></svg><span>Записи</span></a>
<a class="${active==='chats'?'active':''}" href="master-chats.html"><svg viewBox="0 0 24 24"><path d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v7.5A1.5 1.5 0 0 1 19 17H9l-4.5 3v-12A1.5 1.5 0 0 1 5 6.5Z"/></svg><span>Чаты${totalUnread?`<i class="nav-unread-badge">${totalUnread}</i>`:''}</span></a>
<a class="${active==='analytics'?'active':''}" href="master-analytics.html"><svg viewBox="0 0 24 24"><path d="M5 19V11M12 19V5M19 19v-8"/></svg><span>Аналитика</span></a>
<a class="${active==='profile'?'active':''}" href="master-profile.html"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 20c.7-3.7 3-5.6 6.5-5.6s5.8 1.9 6.5 5.6"/></svg><span>Профиль</span></a>
</nav>`}
function switchToClient(){localStorage.setItem('pn_last_mode','client');location.href='client.html'}

function openMasterAccount(){
 const modal=document.getElementById('masterAccountModal');
 if(modal)modal.classList.remove('hidden');
}
function closeMasterAccount(){
 const modal=document.getElementById('masterAccountModal');
 if(modal)modal.classList.add('hidden');
}

function switchToClient(){localStorage.setItem('pn_last_mode','client');location.href='client.html'}
function switchToClient(){localStorage.setItem('pn_last_mode','client');location.href='client.html'}
function masterHeader(title,sub=''){
 const p=profile();
 return `<header class="master-top pro-client-header">
   <div class="pro-client-header-row">
     <button class="pro-back-client" onclick="switchToClient()" aria-label="Вернуться в клиентский режим">‹</button>
     <div class="pro-centered-logo"><span class="logo-pink">Profi</span><span class="logo-black">Navi</span><small>PRO</small></div>
     <button class="pro-profile-icon pro-account-icon" type="button" onclick="openMasterAccount()" aria-label="Аккаунт">
       <img src="${p.avatar}" alt="${p.name||'Аккаунт'}">
     </button>
   </div>
   <div class="pro-current-page"><h1>${title}</h1>${sub?`<p>${sub}</p>`:''}</div>
 </header>

 <div class="master-account-overlay hidden" id="masterAccountModal" onclick="if(event.target===this)closeMasterAccount()">
   <section class="master-account-card" role="dialog" aria-modal="true" aria-label="Аккаунт мастера">
     <button class="master-account-close" type="button" onclick="closeMasterAccount()" aria-label="Закрыть">×</button>

     <div class="master-account-header">
       <img src="${p.avatar}" alt="${p.name||'Аккаунт'}">
       <div>
         <h2>${p.name||'Мастер ProfiNavi'}</h2>
         <p>Аккаунт ProfiNavi</p>
       </div>
     </div>

     <div class="master-account-section">
       <h3>Информация об аккаунте</h3>
       <div class="master-account-list">
         <div class="master-account-row"><span>Имя</span><strong>${p.name||'Не указано'}</strong></div>
         <div class="master-account-row"><span>Город</span><strong>Бишкек</strong></div>
         <div class="master-account-row"><span>Режим</span><strong>Мастер</strong></div>
       </div>
     </div>

     <div class="master-account-section">
       <h3>ProfiNavi</h3>
       <p class="master-account-note">Перейдите в клиентскую часть, чтобы искать и бронировать других мастеров.</p>
       <button class="master-account-primary" type="button" onclick="switchToClient()">Перейти в клиентский режим</button>
     </div>

     <div class="master-account-section master-account-exit">
       <button class="master-account-secondary" type="button" onclick="logoutMaster()">Выйти из аккаунта</button>
     </div>
   </section>
 </div>`;
}
async function logoutMaster(){try{await window.PNAuth?.signOut?.()}catch(e){}localStorage.removeItem(MASTER_KEY);location.href='index.html'}
function updateClientUnread(){let u=jget('pn_client_chat_unread',{});u['thread_master_0_client_main']=1;jset('pn_client_chat_unread',u)}

async function pnConversationForBooking(bookingId){
 if(!window.PNData)return null;
 try{const cs=await PNData.listConversations();return cs.find(c=>String(c.booking_id)===String(bookingId))||null}catch(e){return null}
}
async function pnSendBookingMessage(bookingId,text){
 const c=await pnConversationForBooking(bookingId);if(!c)return false;
 await PNData.sendMessage(c.id,text);return true;
}


function ensureAutoGreeting(b){
 const greeting=localStorage.getItem(GREETING_KEY)||'Здравствуйте! Спасибо за запись 🤍 Если будут вопросы — напишите мне здесь.';
 let chats=jget(CHAT_KEY,{});
 let id=String(b.id);
 if(!chats[id]) chats[id]=[];
 if(!chats[id].some(m=>m.auto)) chats[id].push({from:'master',text:greeting,ts:Date.now(),auto:true});
 jset(CHAT_KEY,chats);
}

function sendApprovalMessage(b){
  const chats=jget(CHAT_KEY,{});
  const id='thread_master_0_client_main';
  chats[id]=chats[id]||[];
  const exists=chats[id].some(m=>m.approvalMessage);
  if(!exists){
    chats[id].push({
      from:'master',
      text:`Запись подтверждена ✅ Спасибо за запись! Жду вас ${b.date?new Date(b.date).toLocaleDateString('ru-RU',{day:'numeric',month:'long'}):''}${b.time?` в ${b.time}`:''}.`,
      ts:Date.now(),
      approvalMessage:true
    });
    jset(CHAT_KEY,chats);
  }
}

async function confirmBooking(id,noReload=false){
 const bookings=getBookings(),b=bookings.find(x=>String(x.id)===String(id));
 if(!b)return;
 if(b.status!=='confirmed'){
   if(b.syncedToSupabase&&window.PNData){try{await PNData.updateBookingStatus(id,'approved')}catch(e){alert('Не удалось подтвердить запись: '+e.message);return}}
   b.status='confirmed';
   b.confirmedAt=new Date().toISOString();
   setBookings(bookings);
   const d=new Date(b.date);
   const dateText=!Number.isNaN(d.getTime())?d.toLocaleDateString('ru-RU',{day:'numeric',month:'long'}):'';
   const approvalText=`Ваша запись подтверждена${dateText?` на ${dateText}`:''}${b.time?` в ${b.time}`:''}. Жду вас!`;
   if(b.syncedToSupabase&&window.PNData){try{await pnSendBookingMessage(b.id,approvalText)}catch(e){console.warn('approval message backend',e)}}else pushMasterMessage(b.id,approvalText,'booking-confirmed');
 }
 if(!noReload)location.reload();
}
function sendRejectionMessage(b){
  const chats=jget(CHAT_KEY,{});
  const id='thread_master_0_client_main';
  chats[id]=chats[id]||[];
  const exists=chats[id].some(m=>m.rejectionMessage);
  if(!exists){
    const d=b.date?new Date(b.date):null;
    const dateText=d&&!isNaN(d)?d.toLocaleDateString('ru-RU',{day:'numeric',month:'long'}):'';
    chats[id].push({
      from:'master',
      text:`К сожалению, мастер не смог подтвердить запись${dateText?` на ${dateText}`:''}${b.time?` в ${b.time}`:''}. Вы можете выбрать другое свободное время.`,
      ts:Date.now(),
      rejectionMessage:true
    });
    jset(CHAT_KEY,chats);
  }
}

async function cancelBooking(id,noReload=false){
 const bookings=getBookings(),b=bookings.find(x=>String(x.id)===String(id));
 if(!b)return;
 if(b.status!=='cancelled'){
   if(b.syncedToSupabase&&window.PNData){try{await PNData.updateBookingStatus(id,'declined')}catch(e){alert('Не удалось отклонить запись: '+e.message);return}}
   b.status='cancelled';
   b.cancelledAt=new Date().toISOString();
   setBookings(bookings);

   // Отклонённая заявка не создаёт чат: клиент увидит статус записи.
 }
 if(!noReload)location.reload();
}
function getSlots(){
 let s=jget(SLOT_KEY,null);
 if(s) return s;
 const d=new Date(), out={};
 for(let i=0;i<7;i++){let x=new Date(d);x.setDate(x.getDate()+i);out[x.toISOString().slice(0,10)]=['10:00','11:30','13:00','15:00','17:30']}
 return out;
}
function saveSlots(s){jset(SLOT_KEY,s);window.PNData?.replaceAvailability?.(s).catch(e=>console.warn('slots backend',e))}
function openSlotEditor(){
 const slots=getSlots(), key=new Date().toISOString().slice(0,10), current=(slots[key]||[]).join(', ');
 const val=prompt('Свободное время на сегодня. Введите через запятую:',current);
 if(val===null)return;
 slots[key]=val.split(',').map(x=>x.trim()).filter(Boolean);saveSlots(slots);renderDashboard();
}

const AVAIL_CAL_KEY='pn_master_availability_calendar';
let masterScheduleStart=new Date();masterScheduleStart.setHours(0,0,0,0);
let masterScheduleConfig=jget('pn_master_schedule_config',{days:'Ежедневно',start:'10:00',end:'19:00',step:60});
let schedulePainting=false,schedulePaintMode='close',scheduleTouched=new Set();

function dateKeyLocal(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function scheduleDays(){return Array.from({length:7},(_,i)=>{const d=new Date(masterScheduleStart);d.setDate(d.getDate()+i);return d})}
function shiftMasterScheduleWeek(n){const today=new Date();today.setHours(0,0,0,0);const d=new Date(masterScheduleStart);d.setDate(d.getDate()+n);masterScheduleStart=d<today?today:d;renderDashboard()}
function makeTimeSlots(start,end,step){const [sh,sm]=start.split(':').map(Number),[eh,em]=end.split(':').map(Number),out=[];let a=sh*60+sm,b=eh*60+em;while(a<b){out.push(`${String(Math.floor(a/60)).padStart(2,'0')}:${String(a%60).padStart(2,'0')}`);a+=Number(step)}return out}
function dayAllowed(d,mode){const wd=d.getDay();return mode==='Ежедневно'||(mode==='Будни'&&wd>=1&&wd<=5)||(mode==='Выходные'&&(wd===0||wd===6))||(mode==='Пн–Сб'&&wd>=1&&wd<=6)}

function liveScheduleChange(){
 const days=document.getElementById('masterDays')?.value||'Ежедневно';
 const start=document.getElementById('masterStartTime')?.value||'10:00';
 const end=document.getElementById('masterEndTime')?.value||'19:00';
 const step=Number(document.getElementById('masterInterval')?.value||60);
 masterScheduleConfig={days,start,end,step};
 jset('pn_master_schedule_config',masterScheduleConfig);
 const slots=getSlots(),times=makeTimeSlots(start,end,step);
 scheduleDays().forEach(d=>slots[dateKeyLocal(d)]=dayAllowed(d,days)?[...times]:[]);
 saveSlots(slots);
 const wrap=document.querySelector('.master-calendar-live');
 if(wrap)wrap.innerHTML=renderScheduleTableInner();
}

function saveScheduleConfig(){
 // Dropdown changes are already applied live.
 // Saving must only confirm the current state and must not rebuild/reset edited calendar cells.
 jset('pn_master_schedule_config',masterScheduleConfig);
 showScheduleSavedPopup();
}

function renderScheduleTableInner(){
 const days=scheduleDays(),cfg=masterScheduleConfig,times=makeTimeSlots(cfg.start,cfg.end,cfg.step),slots=getSlots(),today=new Date();today.setHours(0,0,0,0);
 return `<table class="booking-table master-calendar-table generated-calendar">
 <thead><tr><th></th>${days.map(d=>`<th class="${dateKeyLocal(d)===dateKeyLocal(today)?'today':''}"><b>${d.getDate()}</b><span>${d.toLocaleDateString('ru-RU',{weekday:'short'})}</span></th>`).join('')}</tr></thead>
 <tbody>${times.map(t=>`<tr><th>${t}</th>${days.map(d=>{const k=dateKeyLocal(d),available=(slots[k]||[]).includes(t);return `<td><button data-slot="${k}|${t}" class="slot ${available?'available':'busy'}" aria-label="${k} ${t}">${available?'○':'×'}</button></td>`}).join('')}</tr>`).join('')}</tbody>
 </table>`;
}

function paintScheduleSlot(btn){
 if(!btn||!btn.dataset.slot||scheduleTouched.has(btn.dataset.slot))return;
 scheduleTouched.add(btn.dataset.slot);
 const [k,t]=btn.dataset.slot.split('|'),slots=getSlots(),list=new Set(slots[k]||[]);
 if(schedulePaintMode==='open')list.add(t);else list.delete(t);
 slots[k]=[...list].sort();saveSlots(slots);
 const open=list.has(t);btn.classList.toggle('available',open);btn.classList.toggle('busy',!open);btn.textContent=open?'○':'×';
}
function startSchedulePaint(e){
 const btn=e.target.closest?.('[data-slot]');if(!btn)return;
 e.preventDefault();schedulePainting=true;scheduleTouched.clear();
 schedulePaintMode=btn.classList.contains('available')?'close':'open';
 paintScheduleSlot(btn);
 try{e.currentTarget.setPointerCapture(e.pointerId)}catch(_){}
}
function moveSchedulePaint(e){
 if(!schedulePainting)return;
 e.preventDefault();
 const el=document.elementFromPoint(e.clientX,e.clientY);
 paintScheduleSlot(el?.closest?.('[data-slot]'));
}
function endSchedulePaint(){schedulePainting=false;scheduleTouched.clear()}

function showScheduleSavedPopup(){
 const old=document.getElementById('scheduleSavedPopup');if(old)old.remove();
 const el=document.createElement('div');el.id='scheduleSavedPopup';el.className='schedule-saved-popup';
 el.innerHTML=`<div><span>✓</span><b>График сохранён</b><p>Клиенты уже видят доступное время для записи.</p></div>`;
 document.body.appendChild(el);setTimeout(()=>el.classList.add('show'),20);setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),250)},2200);
}

function renderAvailabilityCalendar(){
 const cfg=masterScheduleConfig,days=scheduleDays(),today=new Date();today.setHours(0,0,0,0);
 return `<section class="master-section master-schedule-builder">
 <div class="master-section-head"><div><h2>Мой график</h2><small>Изменения сразу появляются в календаре</small></div></div>
 <div class="schedule-config-grid">
  <label class="schedule-days-select"><span>Дни работы</span><select id="masterDays" onchange="liveScheduleChange()">
   <option ${cfg.days==='Ежедневно'?'selected':''}>Ежедневно</option><option ${cfg.days==='Будни'?'selected':''}>Будни</option><option ${cfg.days==='Выходные'?'selected':''}>Выходные</option><option ${cfg.days==='Пн–Сб'?'selected':''}>Пн–Сб</option>
  </select></label>
  <div class="schedule-time-row">
   <label><span>С</span><select id="masterStartTime" onchange="liveScheduleChange()">${Array.from({length:25},(_,i)=>{const h=8+Math.floor(i/2),m=i%2?'30':'00',v=`${String(h).padStart(2,'0')}:${m}`;return `<option ${v===cfg.start?'selected':''}>${v}</option>`}).join('')}</select></label>
   <label><span>До</span><select id="masterEndTime" onchange="liveScheduleChange()">${Array.from({length:27},(_,i)=>{const h=9+Math.floor(i/2),m=i%2?'30':'00',v=`${String(h).padStart(2,'0')}:${m}`;return `<option ${v===cfg.end?'selected':''}>${v}</option>`}).join('')}</select></label>
  </div>
  <label class="schedule-interval-select"><span>Интервал записи</span><select id="masterInterval" onchange="liveScheduleChange()"><option value="30" ${cfg.step===30?'selected':''}>30 минут</option><option value="60" ${cfg.step===60?'selected':''}>1 час</option><option value="90" ${cfg.step===90?'selected':''}>1,5 часа</option><option value="120" ${cfg.step===120?'selected':''}>2 часа</option></select></label>
 </div>
 <div class="schedule-week-nav"><button onclick="shiftMasterScheduleWeek(-7)" ${masterScheduleStart.getTime()<=today.getTime()?'disabled':''}>‹</button><b>${days[0].toLocaleDateString('ru-RU',{month:'long',year:'numeric'})}</b><button onclick="shiftMasterScheduleWeek(7)">›</button></div>
 <div class="master-calendar-table-wrap master-calendar-live" onpointerdown="startSchedulePaint(event)" onpointermove="moveSchedulePaint(event)" onpointerup="endSchedulePaint()" onpointercancel="endSchedulePaint()" onpointerleave="endSchedulePaint()">${renderScheduleTableInner()}</div>
 <p class="master-help">Проведите пальцем по времени: можно одним движением открыть или закрыть сразу несколько ячеек.</p>
 <button class="schedule-save-bottom" onclick="saveScheduleConfig()">Сохранить график</button>
 </section>`;
}

function renderDashboard(){
 if(!requireMaster())return;
 const root=document.getElementById('masterRoot'), bookings=getBookings(), today=new Date(), p=profile(), unreadChats=jget('pn_master_chat_unread',{}), unreadTotal=Object.values(unreadChats).reduce((a,b)=>a+Number(b||0),0);
 const todayList=bookings.filter(b=>sameDay(b.date,today)), pending=bookings.filter(b=>b.status==='pending'), confirmed=todayList.filter(b=>b.status==='confirmed');
 const revenue=confirmed.reduce((s,b)=>s+bookingRevenue(b),0), key=today.toISOString().slice(0,10), slots=getSlots()[key]||[];
 root.innerHTML=`${masterHeader('Здравствуйте, '+(p.ownerName||session()?.name||p.name),'')}
 <section class="master-metrics"><article><small>Сегодня</small><b>${todayList.length}</b><span>записей</span></article><article><small>Доход</small><b>${money(revenue).replace(' сом','')}</b><span>сом</span></article><article><small>Рейтинг</small><b>${Number(p.reviewsCount||0)>0?Number(p.rating||0).toFixed(1):'—'}</b><span>${Number(p.reviewsCount||0)>0?'★':'нет отзывов'}</span></article></section>

 <section class="master-section quick-approval-section">
   <div class="master-section-head"><h2>Подтвердить записи</h2>${pending.length?`<span class="pending-count">${pending.length}</span>`:''}</div>
   ${pending.length?pending.slice(0,4).map(b=>{
      const d=new Date(b.date);
      const dateText=isNaN(d)?'Дата не указана':d.toLocaleDateString('ru-RU',{day:'numeric',month:'long'});
      return `<article class="home-request-card">
        <div class="home-request-top">
          <div class="home-request-date"><b>${b.time||'—'}</b><span>${dateText}</span></div>
          <span class="home-request-badge">Новая запись</span>
        </div>
        <div class="home-request-body">
          <strong>${b.clientName||'Клиент ProfiNavi'}</strong>
          <span>${b.service||'Услуга'}</span>
        </div>
        <div class="home-request-actions">
          <button class="approve" onclick="confirmBooking('${b.id}')">Подтвердить</button>
          <button class="decline" onclick="cancelBooking('${b.id}')">Отклонить</button>
        </div>
      </article>`;
   }).join(''):'<div class="master-empty compact">Новых записей нет</div>'}
 </section>

 ${renderAvailabilityCalendar()}
 ${nav('home')}`;
}function bookingCard(b,actions){
 const d=new Date(b.date), date=d.toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
 const status=b.status==='confirmed'?'Подтверждено':b.status==='cancelled'?'Отменено':'Ожидает';
 return `<article class="master-booking-card ${b.status||'pending'}"><div class="master-booking-time"><b>${b.time||'—'}</b><span>${date}</span></div><div class="master-booking-copy"><strong>${b.service||'Услуга'}</strong><span>${b.clientName||'Клиент ProfiNavi'}</span><em class="status-${b.status||'pending'}">${status}</em></div>${actions&&b.status==='pending'?`<div class="master-booking-actions"><button onclick="confirmBooking('${b.id}')">✓ Подтвердить</button><button class="light" onclick="cancelBooking('${b.id}')">Отказать</button></div>`:''}</article>`;
}
function renderBookings(){
 if(!requireMaster())return;
 const root=document.getElementById('masterRoot'), arr=getBookings();
 const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()+i);return d}); let selected=0;
 root.innerHTML=`${masterHeader('Записи','')}<section class="master-days" id="masterDays">${days.map((d,i)=>`<button class="${i===0?'active':''}" data-day="${i}"><small>${i===0?'Сегодня':d.toLocaleDateString('ru-RU',{weekday:'short'})}</small><b>${d.getDate()}</b></button>`).join('')}</section><section class="master-section" id="bookingList"></section>${nav('bookings')}`;
 const draw=()=>{const day=days[selected], list=arr.filter(b=>sameDay(b.date,day)).sort((a,b)=>(a.time||'').localeCompare(b.time||''));document.getElementById('bookingList').innerHTML=`<div class="master-section-head"><h2>${day.toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}</h2></div>${list.length?list.map(b=>bookingCard(b,true)).join(''):'<div class="master-empty">Записей нет</div>'}`};
 draw();document.querySelectorAll('#masterDays button').forEach(btn=>btn.onclick=()=>{selected=+btn.dataset.day;document.querySelectorAll('#masterDays button').forEach(x=>x.classList.toggle('active',x===btn));draw()});
}

function sendQuickReply(id,text){
 const b=getBookings().find(x=>String(x.id)===String(id));
 if(!b || masterChatExpired(b))return false;
 pushMasterMessage(id,text,'message');
 if(b.syncedToSupabase&&window.PNData)pnSendBookingMessage(id,text).catch(e=>console.warn('message backend',e));
 return true;
}
function openChat(id){
 const booking=getBookings().find(x=>String(x.id)===String(id));
 if(!booking)return;
 const existing=(jget(CHAT_KEY,{})[String(id)]||[]);
 if(booking.status==='pending'&&!existing.length)return;
 markMasterRead(id);

 const overlay=document.createElement('div');
 overlay.className='master-chat-overlay';

 const draw=()=>{
   const current=getBookings().find(x=>String(x.id)===String(id))||booking;
   const msgs=(jget(CHAT_KEY,{})[String(id)]||[]);
   const expired=masterChatExpired(current);
   const pending=current.status==='pending';

   overlay.innerHTML=`<div class="master-chat-head">
     <button type="button" id="closeChat">‹</button>
     <div>
       <b>${current.clientName||'Клиент ProfiNavi'}</b>
       <small>${current.service||''} · ${current.time||''}${expired?' · чат закрыт':''}</small>
     </div>
   </div>

   ${pending&&!expired?`<div class="chat-booking-actions">
     <button type="button" class="approve" id="chatApprove">Подтвердить запись</button>
     <button type="button" class="decline" id="chatDecline">Отклонить</button>
   </div>`:''}

   ${current.status==='confirmed'?'<div class="chat-booking-status confirmed">✓ Запись подтверждена</div>':
     current.status==='cancelled'?'<div class="chat-booking-status cancelled">Запись отклонена</div>':''}

   <div class="master-chat-thread">
     ${msgs.length?msgs.map(msg=>`<div class="bubble ${msg.from==='master'?'mine':'incoming'}">${msg.text}</div>`).join(''):'<div class="master-empty">Начните переписку</div>'}
     ${expired?'<div class="chat-closed-notice"><strong>Чат закрыт</strong><p>Прошло 72 часа после времени записи.</p></div>':''}
   </div>

   ${!expired?`<div class="quick-replies">
     <button type="button" data-reply="Здравствуйте! Да, время свободно 😊">Время свободно</button>
     <button type="button" data-reply="Спасибо за запись! Буду ждать вас 🤍">Буду ждать</button>
     <button type="button" data-reply="Можете, пожалуйста, уточнить желаемый дизайн?">Уточнить дизайн</button>
     <button type="button" data-reply="К сожалению, это время уже недоступно. Могу предложить другое.">Другое время</button>
   </div>
   <form class="master-chat-compose" id="chatForm">
     <input id="chatInput" placeholder="Сообщение…" autocomplete="off">
     <button type="submit">➤</button>
   </form>`:''}`;

   overlay.querySelector('#closeChat').onclick=()=>{overlay.remove();renderChats()};

   const approve=overlay.querySelector('#chatApprove');
   if(approve)approve.onclick=async()=>{await confirmBooking(id,true);draw()};

   const decline=overlay.querySelector('#chatDecline');
   if(decline)decline.onclick=async()=>{await cancelBooking(id,true);draw()};

   overlay.querySelectorAll('.quick-replies button').forEach(btn=>{
     btn.onclick=()=>{sendQuickReply(id,btn.dataset.reply);draw()};
   });

   const form=overlay.querySelector('#chatForm');
   if(form)form.onsubmit=e=>{
     e.preventDefault();
     const input=overlay.querySelector('#chatInput'),text=input.value.trim();
     if(!text)return;
     if(sendQuickReply(id,text)){input.value='';draw()}
   };

   requestAnimationFrame(()=>{
     const thread=overlay.querySelector('.master-chat-thread');
     if(thread)thread.scrollTop=thread.scrollHeight;
   });
 };

 document.body.appendChild(overlay);
 draw();
}
function saveGreeting(){
 const el=document.getElementById('autoGreeting');localStorage.setItem(GREETING_KEY,el.value.trim());document.getElementById('greetingSaved').textContent='Сохранено';
}

function renderChats(){
 if(!requireMaster())return;
 const root=document.getElementById('masterRoot'),bookings=getBookings(),chats=jget(CHAT_KEY,{});
 const rows=[...bookings].filter(b=>(chats[String(b.id)]||[]).length>0||['confirmed','completed','done'].includes(b.status)).sort((a,b)=>{
   const au=masterChatUnread(a.id)?1:0,bu=masterChatUnread(b.id)?1:0;
   if(au!==bu)return bu-au;
   return new Date(b.createdAt||b.date).getTime()-new Date(a.createdAt||a.date).getTime();
 });
 root.innerHTML=`${masterHeader('Чаты','')}
 <section class="master-chat-list">
 ${rows.length?rows.map(b=>{
   const msgs=chats[String(b.id)]||[],last=msgs[msgs.length-1],unread=masterChatUnread(b.id),expired=masterChatExpired(b);
   return `<button class="master-chat-item chat-button ${unread?'is-unread':''}" onclick="openChat('${b.id}')">
     <div class="master-client-avatar">${(b.clientName||'К')[0]}</div>
     <div>
       <b>${b.clientName||'Клиент ProfiNavi'}</b>
       <p>${last?last.text:'Нет сообщений'}</p>
       <small>${b.service||'Услуга'} · ${b.time||''}${expired?' · чат закрыт':''}</small>
     </div>
     <span class="chat-row-end">${unread?'<i class="master-unread-badge">1</i>':''}<em>›</em></span>
   </button>`;
 }).join(''):'<div class="master-empty">Пока нет чатов</div>'}
 </section>${nav('chats')}`;
}
function editProfile(){
 const p=profile();
 const name=prompt('Имя / название профиля',p.name); if(name===null)return;
 const area=prompt('Район / ориентир',p.area); if(area===null)return;
 const address=prompt('Адрес',p.address); if(address===null)return;
 const experience=prompt('Опыт',p.experience); if(experience===null)return;
 const about=prompt('Коротко о себе',p.about); if(about===null)return;
 saveProfile({...p,name,area,address,experience,about});renderProfile();
}
function editService(i){
 let data=services(),s=data[i];if(!s)return;
 const name=prompt('Название услуги',s.name);if(name===null)return;
 const price=prompt('Цена, сом',s.price);if(price===null)return;
 const time=prompt('Длительность',s.time||'');if(time===null)return;
 const promo=prompt('Акция (можно оставить пустым)',s.promo||'');if(promo===null)return;
 const discount=promo?prompt('Скидка, %',s.discount||20):0;
 data[i]={...s,name,price:Number(price)||0,time,promo,discount:Number(discount)||0};saveServices(data);renderProfile();
}
function addService(){let d=services();d.push({name:'Новая услуга',price:1000,time:'1 ч.',promo:'',discount:0,image:null});saveServices(d);renderProfile();setTimeout(()=>openServiceEditor(d.length-1),40)}
function serviceRows(data){return data.map((s,i)=>`<article class="master-service-edit"><div><b>${s.name}</b><span>${s.price===0?'0 сом · Ищу моделей':money(s.price)}${s.promo?` · ${s.promo}${s.discount?` −${s.discount}%`:''}`:''}</span></div><button onclick="openServiceEditor(${i})">Редактировать</button></article>`).join('')}

function editWork(i){
 const p=profile(), works=[...(p.works||[])];
 const current=works[i]||'';
 const val=prompt('Путь или URL фотографии работы',current);
 if(val===null)return;
 if(val.trim()) works[i]=val.trim(); else works.splice(i,1);
 saveProfile({...p,works});renderProfile();
}
function addWork(){
 const p=profile(), works=[...(p.works||[])];
 const val=prompt('Путь или URL новой фотографии');
 if(!val)return;
 works.push(val.trim());saveProfile({...p,works});renderProfile();
}
function editAvatar(){
 const p=profile(),val=prompt('Путь или URL фото профиля',p.avatar);
 if(val===null||!val.trim())return;saveProfile({...p,avatar:val.trim()});renderProfile();
}
function editCover(){
 const p=profile(),val=prompt('Путь или URL обложки',p.cover||(p.works&&p.works[0])||p.avatar);
 if(val===null||!val.trim())return;saveProfile({...p,cover:val.trim()});renderProfile();
}
function editAbout(){
 const p=profile();
 const about=prompt('О мастере',p.about||'');if(about===null)return;
 const experience=prompt('Опыт',p.experience||'');if(experience===null)return;
 saveProfile({...p,about,experience});renderProfile();
}
function editAddress(){
 const p=profile();
 const area=prompt('Район / ориентир',p.area||'');if(area===null)return;
 const address=prompt('Адрес',p.address||'');if(address===null)return;
 saveProfile({...p,area,address});renderProfile();
}
function masterServiceCard(s,i,p){
 const old=Number(s.price)||0;
 const hasNew=s.newPrice!==undefined && s.newPrice!==null && Number(s.newPrice)<old;
 const final=hasNew?Number(s.newPrice):old;
 const discount=hasNew&&old>0?Math.round((old-final)/old*100):0;
 const img=s.image||null;
 return `<article class="full-menu-card master-editable-service" onclick="openServiceEditor(${i})">
   <div class="service-card-media">${img?`<img src="${img}" alt="${s.name}">`:`<div class="service-card-no-image"><span>Фото</span></div>`}</div>
   <div class="full-menu-info">
     <div class="service-offer-line">${s.promo?`<span class="service-promo-badge">${s.promo}</span>`:''}${discount?`<span class="discount-percent">-${discount}%</span>`:''}</div>
     <h3>${s.name}</h3>
     <div class="service-price-row">${hasNew?`<strong class="promo-price">${final} сом</strong><span class="old-service-price">${old} сом</span>`:`<strong class="regular-price">${old} сом</strong>`}</div>
     <small>${s.time||''}</small>
   </div>
 </article>`;
}

function fileToDataURL(file, cb){
  const reader = new FileReader();
  reader.onload = () => cb(reader.result);
  reader.readAsDataURL(file);
}
function chooseImage(target, index){
  const overlay=document.createElement('div');
  overlay.className='master-photo-picker-overlay';
  overlay.innerHTML=`<div class="master-photo-picker">
    <div class="picker-handle"></div>
    <h3>Добавить фото</h3>
    <label class="picker-action"><span>📷</span><b>Снять фото</b><input id="cameraInput" type="file" accept="image/*" capture="environment" hidden></label>
    <label class="picker-action"><span>🖼</span><b>Выбрать из галереи</b><input id="galleryInput" type="file" accept="image/*" hidden></label>
    <button class="picker-cancel" type="button">Отмена</button>
  </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('.picker-cancel').onclick=()=>overlay.remove();
  overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};
  const useFile=(file)=>{
    if(!file)return;
    fileToDataURL(file,data=>{
      const p=profile();
      if(target==='avatar') saveProfile({...p,avatar:data});
      if(target==='cover') saveProfile({...p,cover:data});
      if(target==='work'){
        const works=[...(p.works||[])];
        if(Number.isInteger(index)) works[index]=data;
        else works.push(data);
        saveProfile({...p,works});
      }
      overlay.remove();
      renderProfile();
    });
  };
  overlay.querySelector('#cameraInput').onchange=e=>useFile(e.target.files?.[0]);
  overlay.querySelector('#galleryInput').onchange=e=>useFile(e.target.files?.[0]);
}
function chooseServiceImage(index,cb){
 const ov=document.createElement('div');ov.className='master-photo-picker-overlay';
 ov.innerHTML=`<div class="master-photo-picker"><div class="picker-handle"></div><h3>Фото услуги</h3><label class="picker-action"><span>📷</span><b>Снять фото</b><input id="sc" type="file" accept="image/*" capture="environment" hidden></label><label class="picker-action"><span>🖼</span><b>Выбрать из галереи</b><input id="sg" type="file" accept="image/*" hidden></label><button class="picker-cancel">Отмена</button></div>`;
 document.body.appendChild(ov);ov.querySelector('.picker-cancel').onclick=()=>ov.remove();
 const use=f=>{if(!f)return;fileToDataURL(f,data=>{let a=services();if(a[index]){a[index].image=data;saveServices(a)}ov.remove();cb&&cb(data)})};
 ov.querySelector('#sc').onchange=e=>use(e.target.files?.[0]);ov.querySelector('#sg').onchange=e=>use(e.target.files?.[0]);
}
function deleteWork(index){
  const p=profile(), works=[...(p.works||[])];
  if(!confirm('Удалить эту работу?'))return;
  works.splice(index,1);
  saveProfile({...p,works});
  renderProfile();
}
function openProfileEditor(){
  const p=profile();
  const overlay=document.createElement('div');
  overlay.className='master-edit-profile-overlay';
  overlay.innerHTML=`<div class="master-edit-profile-screen">
    <header class="edit-profile-head">
      <button class="edit-close" type="button">Отмена</button>
      <b>Редактировать профиль</b>
      <button class="edit-save" type="button">Готово</button>
    </header>
    <section class="edit-photo-block">
      <img src="${p.avatar}" class="edit-profile-avatar">
      <button id="editPhoto" type="button">Изменить фото профиля</button>
      <button id="editCover" type="button">Изменить обложку</button>
    </section>
    <section class="edit-fields">
      <label><span>Имя / название</span><input id="epName" value="${(p.name||'').replace(/"/g,'&quot;')}"></label>
      <label><span>Район / ориентир</span><input id="epArea" value="${(p.area||'').replace(/"/g,'&quot;')}"></label>
      <label><span>Адрес</span><input id="epAddress" value="${(p.address||'').replace(/"/g,'&quot;')}"></label>
      
      <label class="textarea-label"><span>О мастере</span><textarea id="epAbout" maxlength="220">${p.about||''}</textarea><small><b id="aboutCount">${(p.about||'').length}</b>/220</small></label>
      
      
    </section>
  </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('.edit-close').onclick=()=>overlay.remove();
  overlay.querySelector('#epAbout').oninput=e=>overlay.querySelector('#aboutCount').textContent=e.target.value.length;
  overlay.querySelector('#editPhoto').onclick=()=>{overlay.remove();chooseImage('avatar')};
  overlay.querySelector('#editCover').onclick=()=>{overlay.remove();chooseImage('cover')};
  overlay.querySelector('.edit-save').onclick=()=>{
    saveProfile({...p,
      name:overlay.querySelector('#epName').value.trim(),
      area:overlay.querySelector('#epArea').value.trim(),
      address:overlay.querySelector('#epAddress').value.trim(),
      about:overlay.querySelector('#epAbout').value.trim()
    });
    overlay.remove();
    renderProfile();
  };
}
function removeService(i){
 if(!confirm('Удалить эту услугу?'))return;
 const d=services();d.splice(i,1);saveServices(d);renderProfile();
}
function editStrengths(){
 const p=profile();
 const presets=['Аккуратность','Современный дизайн','Консультация','Чистая работа','Уютная атмосфера','Скорость','Сложные дизайны','Носка без сколов'];
 const selected=[...(p.strengths||[])];
 const ov=document.createElement('div');ov.className='master-edit-profile-overlay';
 ov.innerHTML=`<div class="master-edit-profile-screen"><header class="edit-profile-head"><button class="edit-close">Отмена</button><b>Сильные стороны</b><button class="edit-save">Готово</button></header><section class="strength-editor"><p>Выберите подходящие или добавьте свои.</p><div class="strength-choice-list">${presets.map(x=>`<button type="button" class="${selected.includes(x)?'active':''}" data-strength="${x}">${x}</button>`).join('')}</div><label class="custom-strength"><span>Своя сильная сторона</span><div><input id="customStrength" placeholder="Например: японский маникюр"><button id="addStrength" type="button">Добавить</button></div></label><div class="selected-strengths" id="selectedStrengths"></div></section></div>`;
 document.body.appendChild(ov);
 const draw=()=>{ov.querySelector('#selectedStrengths').innerHTML=selected.map((x,i)=>`<span>${x}<button type="button" data-i="${i}">×</button></span>`).join('');ov.querySelectorAll('#selectedStrengths button').forEach(b=>b.onclick=()=>{selected.splice(+b.dataset.i,1);draw();ov.querySelectorAll('[data-strength]').forEach(q=>q.classList.toggle('active',selected.includes(q.dataset.strength)))})};
 ov.querySelectorAll('[data-strength]').forEach(b=>b.onclick=()=>{const x=b.dataset.strength,i=selected.indexOf(x);if(i>=0)selected.splice(i,1);else selected.push(x);b.classList.toggle('active');draw()});
 ov.querySelector('#addStrength').onclick=()=>{const inp=ov.querySelector('#customStrength'),v=inp.value.trim();if(v&&!selected.includes(v)){selected.push(v);inp.value='';draw()}};
 ov.querySelector('.edit-close').onclick=()=>ov.remove();ov.querySelector('.edit-save').onclick=()=>{saveProfile({...p,strengths:selected});ov.remove();renderProfile()};draw();
}
function openServiceEditor(i){
 const data=services(),s=data[i];if(!s)return;const p=profile();const img=s.image||null;
 const ov=document.createElement('div');ov.className='master-edit-profile-overlay';
 ov.innerHTML=`<div class="master-edit-profile-screen"><header class="edit-profile-head"><button class="edit-close">Отмена</button><b>Услуга</b><button class="edit-save">Готово</button></header><section class="service-photo-editor">${img?`<img id="sip" src="${img}">`:`<div id="sip" class="service-image-empty">Фото не добавлено</div>`}<button id="csi">Добавить / изменить фото</button></section><section class="edit-fields"><label><span>Название</span><input id="sn" value="${(s.name||'').replace(/"/g,'&quot;')}"></label><label><span>Обычная цена, сом</span><input id="sp" type="number" min="0" value="${Number(s.price)||0}"></label><label><span>Новая цена, сом</span><input id="snp" type="number" min="0" value="${s.newPrice??''}" placeholder="Если скидки нет — оставьте пустым"></label><div class="auto-discount-row"><span>Скидка</span><b id="sd">—</b></div><label><span>Длительность</span><input id="st" value="${s.time||''}"></label><label><span>Акция</span><select id="spr"><option value="">Без акции</option><option value="Знакомство с мастером" ${s.promo==='Знакомство с мастером'?'selected':''}>Знакомство с мастером</option><option value="Ищу моделей" ${s.promo==='Ищу моделей'?'selected':''}>Ищу моделей</option><option value="custom" ${s.promo&&!['Знакомство с мастером','Ищу моделей'].includes(s.promo)?'selected':''}>Своя акция</option></select></label><label id="cpl" style="display:${s.promo&&!['Знакомство с мастером','Ищу моделей'].includes(s.promo)?'block':'none'}"><span>Название своей акции</span><input id="cp" value="${s.promo&&!['Знакомство с мастером','Ищу моделей'].includes(s.promo)?s.promo:''}" placeholder="Напишите название"></label></section><button class="delete-service-btn" id="deleteServiceBtn" type="button">Удалить услугу</button></div>`;
 document.body.appendChild(ov);const sp=ov.querySelector('#sp'),np=ov.querySelector('#snp'),sd=ov.querySelector('#sd');
 const calc=()=>{let a=+sp.value||0,b=np.value===''?null:+np.value;sd.textContent=(b!==null&&a>0&&b<a)?'-'+Math.round((a-b)/a*100)+'%':'—'};sp.oninput=np.oninput=calc;calc();
 const sel=ov.querySelector('#spr');sel.onchange=()=>ov.querySelector('#cpl').style.display=sel.value==='custom'?'block':'none';
 ov.querySelector('#csi').onclick=()=>chooseServiceImage(i,d=>{const old=ov.querySelector('#sip');if(old.tagName==='IMG')old.src=d;else{const im=document.createElement('img');im.id='sip';im.src=d;old.replaceWith(im)}});ov.querySelector('#deleteServiceBtn').onclick=()=>{ov.remove();removeService(i)};ov.querySelector('.edit-close').onclick=()=>ov.remove();
 ov.querySelector('.edit-save').onclick=()=>{let old=+sp.value||0,has=np.value!=='',nw=has?(+np.value||0):undefined,promo=sel.value;if(promo==='custom')promo=ov.querySelector('#cp').value.trim();data[i]={...services()[i],name:ov.querySelector('#sn').value.trim(),price:old,newPrice:nw,time:ov.querySelector('#st').value.trim(),promo,discount:(has&&old>0&&nw<old)?Math.round((old-nw)/old*100):0};saveServices(data);ov.remove();renderProfile()};
}

function openWorkActions(i){
 const p=profile(),src=(p.works||[])[i];if(!src)return;
 const ov=document.createElement('div');ov.className='master-photo-picker-overlay';
 ov.innerHTML=`<div class="master-photo-picker"><div class="picker-handle"></div><img class="work-action-preview" src="${src}"><h3>Работа</h3><label class="work-action-btn"><b>Заменить из галереи</b><input id="replaceGallery" type="file" accept="image/*" hidden></label><label class="work-action-btn"><b>Снять новое фото</b><input id="replaceCamera" type="file" accept="image/*" capture="environment" hidden></label><button class="work-action-btn danger" id="removeWork">Удалить фото</button><button class="picker-cancel">Отмена</button></div>`;
 document.body.appendChild(ov);
 const replace=file=>{if(!file)return;fileToDataURL(file,data=>{const q=profile(),works=[...(q.works||[])];works[i]=data;saveProfile({...q,works});ov.remove();renderProfile()})};
 ov.querySelector('#replaceGallery').onchange=e=>replace(e.target.files?.[0]);
 ov.querySelector('#replaceCamera').onchange=e=>replace(e.target.files?.[0]);
 ov.querySelector('#removeWork').onclick=()=>{ov.remove();deleteWork(i)};
 ov.querySelector('.picker-cancel').onclick=()=>ov.remove();
 ov.onclick=e=>{if(e.target===ov)ov.remove()};
}

const MASTER_REVIEWS=[];


function masterReviewList(){
 const synced=!!session()?.userId;
 if(synced){try{const x=JSON.parse(localStorage.getItem('pn_master_backend_reviews')||'[]');return Array.isArray(x)?x:[]}catch(e){return []}}
 return MASTER_REVIEWS.filter(r=>r.verified);
}

function openReviewPhoto(src){
 const ov=document.createElement('div');
 ov.className='review-photo-viewer';
 ov.innerHTML=`<button class="review-viewer-close" type="button">×</button><img src="${src}" alt="Фото к отзыву">`;
 document.body.appendChild(ov);
 ov.querySelector('.review-viewer-close').onclick=()=>ov.remove();
 ov.onclick=e=>{if(e.target===ov)ov.remove()};
}

function renderReviewCard(r){
 return `<article class="review-card verified-review">
   <div class="review-top"><div><b>${r.name}</b></div><span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span></div>
   <small>${r.date}</small>
   <div class="review-service"><span>Услуга</span><b>${r.service||'Услуга не указана'}</b></div>
   <p>${r.text}</p>
   ${r.photos&&r.photos.length?`<div class="review-photo-grid">${r.photos.slice(0,3).map(x=>`<img src="${x}" alt="Фото к отзыву" onclick="openReviewPhoto('${x}')">`).join('')}</div>`:''}
 </article>`;
}

function showAllReviews(){
 const p=profile(),reviewList=masterReviewList(),ov=document.createElement('div');ov.className='master-edit-profile-overlay';
 ov.innerHTML=`<div class="master-edit-profile-screen"><header class="edit-profile-head"><button class="edit-close">‹ Назад</button><b>Отзывы</b><span></span></header><section class="reviews-full-summary">${reviewList.length?`<strong>${Number(p.rating||0).toFixed(1)}</strong><div class="rating-summary-star">★</div><span>${Number(p.reviewsCount||reviewList.length)} отзывов</span>`:'<strong>—</strong><span>Пока нет отзывов</span>'}</section><section class="reviews-full-list">${reviewList.length?reviewList.map(renderReviewCard).join(''):'<div class="master-empty">Пока нет отзывов</div>'}</section></div>`;
 document.body.appendChild(ov);ov.querySelector('.edit-close').onclick=()=>ov.remove();
}

function formatWorkSchedule(p){
 const days=p.workDays||[];
 let dayLabel=p.scheduleType||'Ежедневно';
 if(dayLabel==='Выбрать дни') dayLabel=days.length?days.join('/ '):'Дни не выбраны';
 const open=p.openTime||'10:00', close=p.closeTime||'21:00';
 return `${dayLabel}, ${open}–${close}`;
}

function openAddressEditor(){
 const p=profile(),ov=document.createElement('div');ov.className='master-edit-profile-overlay';
 const districts=['Центр','Вефа','Asia Mall','ЦУМ / Дордой Плаза','5 микрорайон','Нижний Джал','Аламедин','Политех','Другой район'];
 const openTimes=['08:00','09:00','10:00','11:00','12:00'];
 const closeTimes=['17:00','18:00','19:00','20:00','21:00','22:00','23:00'];
 const payments=['Наличные','Перевод','Наличные и перевод','Карта','Карта, наличные и перевод'];
 const currentArea=p.area||'Центр';
 const currentOpen=p.openTime||'10:00';
 const currentClose=p.closeTime||'21:00';
 const currentPayment=p.payment||'Наличные и перевод';
 ov.innerHTML=`<div class="master-edit-profile-screen">
  <header class="edit-profile-head"><button class="edit-close">Отмена</button><b>Адрес и информация</b><button class="edit-save">Готово</button></header>
  <section class="edit-fields address-editor-fields">
   <label><span>Район</span><select id="eaArea">${districts.map(x=>`<option ${x===currentArea?'selected':''}>${x}</option>`).join('')}</select></label>
   <label><span>Адрес</span><input id="eaAddress" value="${(p.address||'').replace(/"/g,'&quot;')}" placeholder="Улица, дом"></label>

   <div class="edit-group-title">График работы</div>
   <label><span>Рабочие дни</span><select id="eaScheduleType">
    <option>Ежедневно</option><option>Будни</option><option>Выходные</option><option>Выбрать дни</option>
   </select></label>
   <div id="customDays" class="work-days-picker" style="display:none">
    ${['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].map(x=>`<button type="button" data-day="${x}">${x}</button>`).join('')}
   </div>
   <div class="time-dropdown-row">
    <label><span>С</span><select id="eaOpen">${openTimes.map(x=>`<option ${x===currentOpen?'selected':''}>${x}</option>`).join('')}</select></label>
    <label><span>До</span><select id="eaClose">${closeTimes.map(x=>`<option ${x===currentClose?'selected':''}>${x}</option>`).join('')}</select></label>
   </div>

   <label><span>Оплата</span><select id="eaPayment">${payments.map(x=>`<option ${x===currentPayment?'selected':''}>${x}</option>`).join('')}</select></label>
   <label><span>Дополнительная информация</span><textarea id="eaInfo" maxlength="180" placeholder="Например: вход со стороны парковки">${p.locationInfo||''}</textarea></label>
  </section>
 </div>`;
 document.body.appendChild(ov);
 const scheduleType=ov.querySelector('#eaScheduleType'), customDays=ov.querySelector('#customDays');
 if(scheduleType){
   scheduleType.value=p.scheduleType||'Ежедневно';
   const saved=p.workDays||[];
   ov.querySelectorAll('#customDays button').forEach(b=>{
     b.classList.toggle('active',saved.includes(b.dataset.day));
     b.onclick=()=>b.classList.toggle('active');
   });
   customDays.style.display=scheduleType.value==='Выбрать дни'?'flex':'none';
   scheduleType.onchange=()=>customDays.style.display=scheduleType.value==='Выбрать дни'?'flex':'none';
 }
 ov.querySelector('.edit-close').onclick=()=>ov.remove();
 ov.querySelector('.edit-save').onclick=async()=>{
   const openTime=ov.querySelector('#eaOpen').value;
   const closeTime=ov.querySelector('#eaClose').value;
   const newAddress=ov.querySelector('#eaAddress').value.trim();
   const newArea=ov.querySelector('#eaArea').value;
   let geo=pnEditPickedLocation?{found:true,lat:pnEditPickedLocation.lat,lng:pnEditPickedLocation.lng}:{found:false};
   if(!geo.found){try{if(newAddress)geo=await pnGeocodeAddress(newAddress,p.city||'Бишкек')}catch(e){console.warn('geocode',e)}}
   saveProfile({...p,scheduleType:ov.querySelector('#eaScheduleType')?.value||'Ежедневно',workDays:(()=>{const t=ov.querySelector('#eaScheduleType')?.value||'Ежедневно';if(t==='Ежедневно')return ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'];if(t==='Будни')return ['ПН','ВТ','СР','ЧТ','ПТ'];if(t==='Выходные')return ['СБ','ВС'];return [...ov.querySelectorAll('#customDays button.active')].map(b=>b.dataset.day)})(),
     area:newArea,
     address:newAddress,
     lat:geo?.found?geo.lat:p.lat,
     lng:geo?.found?geo.lng:p.lng,
     openTime,
     closeTime,
     hours:`${openTime}–${closeTime}`,
     payment:ov.querySelector('#eaPayment').value,
     locationInfo:ov.querySelector('#eaInfo').value.trim()
   });
   try{
     const sess=session();
     if(sess?.userId && window.pnSupabase){
       await pnSupabase.from('master_profiles').update({
         area:newArea,address:newAddress,
         latitude:geo?.found?geo.lat:null,
         longitude:geo?.found?geo.lng:null,
         updated_at:new Date().toISOString()
       }).eq('user_id',sess.userId);
     }
   }catch(e){console.warn('profile address sync',e)}
   ov.remove();renderProfile()
 };
}
function canLeaveVerifiedReview(booking){
 return !!(booking && (booking.status==='completed'||booking.status==='done') && booking.clientId);
}
function createVerifiedReview(booking, payload){
 if(!canLeaveVerifiedReview(booking)) return {ok:false,error:'Отзыв можно оставить только после завершённой записи.'};
 const key='pn_verified_reviews';
 const all=JSON.parse(localStorage.getItem(key)||'[]');
 if(all.some(x=>x.bookingId===booking.id)) return {ok:false,error:'Для этой записи отзыв уже оставлен.'};
 const review={
   id:'review_'+Date.now(),bookingId:booking.id,clientId:booking.clientId,masterId:booking.masterId||0,
   name:booking.clientName||'Клиент',service:booking.service||booking.serviceName||'Услуга',
   rating:payload.rating,text:payload.text||'',photos:(payload.photos||[]).slice(0,3),
   date:new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long'}),verified:true
 };
 all.unshift(review);localStorage.setItem(key,JSON.stringify(all));return {ok:true,review};
}
function renderProfile(){
 if(!requireMaster())return;
 const root=document.getElementById('masterRoot'),p=profile(),data=services();
 const gallery=(p.works&&p.works.length?p.works:DEFAULT_PROFILE.works);
 const cover=p.cover||gallery[0]||p.avatar;
 const reviewList=masterReviewList();
 const reviews=Number(p.reviewsCount||0);

 root.innerHTML=`<div class="profile-screen master-exact-profile">
   <header class="profile-screen-head">
     <button class="profile-back" onclick="location.href='master.html'" aria-label="Назад">‹</button>
     <div class="profile-head-title"><img src="${p.avatar}" alt="${p.name}"><b>${p.name}</b></div>
     <button class="master-profile-edit-icon header-edit" onclick="openProfileEditor()" aria-label="Редактировать">✎</button>
   </header>

   <section class="profile-cover master-edit-cover" style="background-image:url('${cover}')">
     <button class="master-cover-edit" onclick="chooseImage('cover')">Изменить обложку</button>
   </section>

   <section class="profile-summary-card">
     <div class="master-avatar-edit">
       <img class="profile-main-avatar" src="${p.avatar}" alt="Фото ${p.name}">
       <button onclick="chooseImage('avatar')" aria-label="Изменить фото">✎</button>
     </div>
     <div class="profile-summary-main">
       <h1>${p.name}</h1>
       <p>${p.area ? `Район: ${p.area}` : 'Район не указан'}</p>
       <div class="profile-rating"><span>${reviews?`★ ${Number(p.rating||0).toFixed(1)} (${reviews})`:'Нет отзывов'}</span><button class="reviews-link" onclick="showAllReviews()">${reviews} отзывов</button></div>
       <button class="master-publish-btn ${p.is_published?'is-published':''}" type="button" onclick="toggleMasterPublish()">${p.is_published?'✓ Профиль опубликован':'Опубликовать профиль'}</button>
     </div>
   </section>

   <nav class="profile-tabs" id="masterProfileTabs">
     <button class="active" data-target="mp-works">Работы</button>
     <button data-target="mp-services">Услуги</button>
     <button data-target="mp-about">О мастере</button>
     <button data-target="mp-reviews">Отзывы</button>
     <button data-target="mp-address">Адрес</button>
   </nav>

   <main class="profile-tab-content">
     <section id="mp-works" class="profile-pane profile-section">
       <div class="master-section-head inline-profile-head"><h2>Работы</h2></div>
       <div class="profile-gallery-grid">${gallery.map((x,i)=>`<button class="profile-grid-item master-work-simple" onclick="openWorkActions(${i})"><img src="${x}" alt="Работа ${i+1}"></button>`).join('')}<button class="profile-grid-item add-work-tile icon-only-add" onclick="chooseImage('work')" aria-label="Добавить работу"><span>＋</span></button></div>
     </section>

     <section id="mp-services" class="profile-pane profile-section">
       <div class="profile-pane-head inline-profile-head"><h2>Услуги</h2><button class="text-btn" onclick="addService()">+ Добавить</button></div>
       <div class="full-menu-list">${data.map((s,i)=>masterServiceCard(s,i,p)).join('')}</div>
     </section>

     <section id="mp-about" class="profile-pane profile-section">
       <div class="inline-profile-head"><h2>О мастере</h2><button class="master-profile-edit-icon" onclick="openProfileEditor()">✎</button></div>
       <div class="profile-info-block"><h3>Самопрезентация</h3><p>${p.about||'Расскажите немного о себе.'}</p></div>
       <div class="profile-info-block"><div class="inline-profile-head strengths-title"><h3>Сильные стороны</h3><button class="text-btn" onclick="editStrengths()">Изменить</button></div><div class="tag-cloud">${(p.strengths||[]).length?(p.strengths||[]).map(x=>`<span>${x}</span>`).join(''):`<button class="empty-strengths" onclick="editStrengths()">Выбрать сильные стороны</button>`}</div></div>
     </section>

     <section id="mp-reviews" class="profile-pane profile-section">
       <div class="inline-profile-head"><h2>Отзывы</h2><button class="text-btn" onclick="showAllReviews()">Все отзывы</button></div>
       ${reviews?`<div class="reviews-score"><strong>${Number(p.rating||0).toFixed(1)}</strong><div class="rating-summary-star">★</div><span>${reviews} отзывов</span></div>`:'<div class="master-empty">Пока нет подтверждённых отзывов</div>'}
       ${reviewList.slice(0,2).map(renderReviewCard).join('')||'<div class="master-empty">Пока нет отзывов</div>'}
       <button class="show-all-reviews" onclick="showAllReviews()">Показать все отзывы</button>
       <p class="master-review-note">Отзывы мастером не редактируются.</p>
     </section>

     <section id="mp-address" class="profile-pane profile-section">
       <div class="inline-profile-head"><h2>Адрес и информация</h2><button class="text-btn" onclick="openAddressEditor()">Изменить</button></div>
       <div class="salon-photo" style="background-image:url('${gallery[1]||cover}')"></div>
       <h3>${p.name}</h3>
       <div class="access-list"><p>◷ ${formatWorkSchedule(p)}</p><p>₸ ${p.payment||'Наличными и переводом'}</p>${p.locationInfo?`<p>ⓘ ${p.locationInfo}</p>`:''}</div>
       <div class="profile-map-wrap"><div class="master-map-preview exact-map"><div><b>📍 ${p.address||p.area||'Бишкек'}</b>${p.area?`<span>Район: ${p.area}</span>`:''}</div></div></div>
     </section>
   </main>
 </div>${nav('profile')}`;

 const tabs=[...document.querySelectorAll('#masterProfileTabs button')];
 tabs.forEach(btn=>btn.onclick=()=>{
   const target=document.getElementById(btn.dataset.target);
   if(!target)return;
   const offset=(document.querySelector('.profile-screen-head')?.offsetHeight||0)+(document.getElementById('masterProfileTabs')?.offsetHeight||0)+12;
   const y=target.getBoundingClientRect().top+window.scrollY-offset;
   window.scrollTo({top:y,behavior:'smooth'});
 });
 const sections=[...document.querySelectorAll('.master-exact-profile .profile-section')];
 const activate=()=>{
   const marker=window.scrollY+(document.querySelector('.profile-screen-head')?.offsetHeight||0)+(document.getElementById('masterProfileTabs')?.offsetHeight||0)+42;
   let current=sections[0]?.id;
   sections.forEach(sec=>{if(sec.offsetTop<=marker)current=sec.id});
   tabs.forEach(btn=>btn.classList.toggle('active',btn.dataset.target===current));
 };
 window.addEventListener('scroll',activate,{passive:true});
 activate();
}


function renderAnalytics(){
 if(!requireMaster())return;
 const root=document.getElementById('masterRoot');
 const periods=[
  {key:'7',label:'7 дней',days:7,mode:'days'},
  {key:'30',label:'30 дней',days:30,mode:'days'},
  {key:'365',label:'12 месяцев',days:365,mode:'months'}
 ];
 const selected=localStorage.getItem('pn_analytics_period_v59')||'30';

 const draw=(periodKey)=>{
   localStorage.setItem('pn_analytics_period_v59',periodKey);
   const period=periods.find(x=>x.key===periodKey)||periods[1];
   const now=new Date();
   const nowMs=now.getTime();
   const fromMs=nowMs-period.days*86400000;
   const all=getBookings();

   const bookingTime=b=>{
     const d=new Date(b.date||b.createdAt||0);
     if(Number.isNaN(d.getTime()))return 0;
     const [h,min]=String(b.time||'00:00').split(':').map(Number);
     d.setHours(h||0,min||0,0,0);
     return d.getTime();
   };

   const rows=all.filter(b=>{
     const t=bookingTime(b);
     return t>=fromMs&&t<=nowMs;
   });
   const confirmed=rows.filter(b=>b.status==='confirmed');
   const cancelled=rows.filter(b=>b.status==='cancelled');
   const pending=rows.filter(b=>b.status==='pending');
   const completed=confirmed.filter(b=>bookingTime(b)<nowMs);

   const serviceList=services();
   const priceByService=Object.fromEntries(serviceList.map(s=>[
     s.name,
     Number(s.newPrice!==undefined&&s.newPrice!==null&&String(s.newPrice)!==''?s.newPrice:s.price)||0
   ]));

   const incomeOf=b=>Number(b.price||b.finalPrice||priceByService[b.service]||0);
   const totalIncome=completed.reduce((sum,b)=>sum+incomeOf(b),0);

   const serviceMap={};
   confirmed.forEach(b=>{
     const k=b.service||'Услуга';
     serviceMap[k]=(serviceMap[k]||0)+1;
   });
   const popular=Object.entries(serviceMap).sort((a,b)=>b[1]-a[1])[0];

   let chartData=[];
   if(period.mode==='months'){
     chartData=Array.from({length:12},(_,i)=>{
       const d=new Date(now.getFullYear(),now.getMonth()-11+i,1);
       const year=d.getFullYear(),month=d.getMonth();
       const value=completed
         .filter(b=>{
           const bd=new Date(b.date||0);
           return !Number.isNaN(bd.getTime())&&bd.getFullYear()===year&&bd.getMonth()===month;
         })
         .reduce((sum,b)=>sum+incomeOf(b),0);
       return {
         label:d.toLocaleDateString('ru-RU',{month:'long'}),
         value
       };
     });
   }else{
     chartData=Array.from({length:period.days},(_,i)=>{
       const d=new Date(now);
       d.setHours(0,0,0,0);
       d.setDate(d.getDate()-(period.days-1-i));
       const y=d.getFullYear(),mo=d.getMonth(),day=d.getDate();
       const value=completed
         .filter(b=>{
           const bd=new Date(b.date||0);
           return !Number.isNaN(bd.getTime())&&bd.getFullYear()===y&&bd.getMonth()===mo&&bd.getDate()===day;
         })
         .reduce((sum,b)=>sum+incomeOf(b),0);
       return {
         label:d.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'}),
         value
       };
     });
   }

   const rawMax=Math.max(0,...chartData.map(x=>x.value));
   const niceStep=(value)=>{
     if(value<=0)return 250;
     const rough=value/4;
     const pow=Math.pow(10,Math.floor(Math.log10(rough)));
     const fraction=rough/pow;
     const niceFraction=fraction<=1?1:fraction<=2?2:fraction<=5?5:10;
     return niceFraction*pow;
   };
   const scaleStep=niceStep(rawMax);
   const maxIncome=Math.max(scaleStep*4,Math.ceil(rawMax/scaleStep)*scaleStep);
   const yTicks=[maxIncome,maxIncome-scaleStep*1,maxIncome-scaleStep*2,maxIncome-scaleStep*3,0];

   root.innerHTML=`${masterHeader('Аналитика','Статистика записей')}
   <section class="master-analytics-page">
    <div class="analytics-periods">
      ${periods.map(p=>`<button class="${p.key===periodKey?'active':''}" data-period="${p.key}">${p.label}</button>`).join('')}
    </div>

    <div class="analytics-summary-grid analytics-summary-income">
      <article><strong>${rows.length}</strong><span>Всего заявок</span></article>
      <article><strong>${confirmed.length}</strong><span>Подтверждено</span></article>
      <article><strong>${completed.length}</strong><span>Завершено</span></article>
      <article><strong>${cancelled.length}</strong><span>Отклонено</span></article>
      <article class="analytics-income-total"><strong>${totalIncome.toLocaleString('ru-RU')} сом</strong><span>Доход</span></article>
    </div>

    <section class="analytics-card income-chart-card">
      <div class="analytics-card-head">
        <div>
          <h2>Доход</h2>
          <span>${period.label}</span>
        </div>
        <strong>${totalIncome.toLocaleString('ru-RU')} сом</strong>
      </div>

      <div class="income-chart-shell">
        <div class="income-y-axis">
          ${yTicks.map(v=>`<span>${v.toLocaleString('ru-RU')}</span>`).join('')}
        </div>
        <div class="income-plot">
          <div class="income-bars ${period.mode==='months'?'monthly':''}">
            <div class="income-grid-bg" aria-hidden="true"></div>
            ${chartData.map(x=>`<div class="income-bar-col">
              <div class="income-bar-area">
                <div class="income-bar-fill" style="height:${x.value?Math.max(3,Math.round(x.value/maxIncome*100)):0}%" title="${x.value.toLocaleString('ru-RU')} сом"></div>
              </div>
              <span>${x.label}</span>
            </div>`).join('')}
          </div>
        </div>
      </div>
    </section>

    <section class="analytics-card">
      <div class="analytics-card-head"><h2>Записи</h2><span>${period.label}</span></div>
      <div class="analytics-line"><span>Подтверждено</span><b>${confirmed.length}</b></div>
      <div class="analytics-line"><span>Ожидают ответа</span><b>${pending.length}</b></div>
      <div class="analytics-line"><span>Отклонено</span><b>${cancelled.length}</b></div>
    </section>

    <section class="analytics-card">
      <div class="analytics-card-head"><h2>Популярная услуга</h2></div>
      ${popular?`<div class="analytics-popular"><strong>${popular[0]}</strong><span>${popular[1]} ${popular[1]===1?'запись':'записей'}</span></div>`:
      '<div class="master-empty">Пока недостаточно данных</div>'}
    </section>
   </section>${nav('analytics')}`;

   root.querySelectorAll('[data-period]').forEach(btn=>btn.onclick=()=>draw(btn.dataset.period));
 };
 draw(selected);
}
document.addEventListener('DOMContentLoaded',()=>{const page=document.body.dataset.masterPage;if(page==='home')renderDashboard();if(page==='bookings')renderBookings();if(page==='chats')renderChats();if(page==='analytics')renderAnalytics();if(page==='profile')renderProfile()});

// pn_v50_storage_sync
window.addEventListener('storage',e=>{
 if(['pn_chats','pn_bookings'].includes(e.key)){
   const path=location.pathname;
   if(path.endsWith('master-chats.html')){
     try{renderChats()}catch(_){}
   }else if(path.endsWith('master.html')){
     try{renderDashboard()}catch(_){}
   }
 }
});


async function pnMasterOwnMap(){
  if(!window.PNMap)return;
  const profile=getProfile?getProfile():null;
  if(!profile)return;
  let el=document.getElementById('pnMasterOwnMap');
  const host=document.querySelector('#profileView,.master-profile,.profile-page,main');
  if(!host)return;
  if(!el){
    const sec=document.createElement('section');
    sec.style.cssText='margin:16px 0 28px';
    sec.innerHTML='<h3 style="margin:0 16px 10px">Адрес на карте</h3><div id="pnMasterOwnMap" style="height:240px;margin:0 16px;border-radius:18px;overflow:hidden;background:#f2f2f2"></div>';
    host.appendChild(sec); el=sec.querySelector('#pnMasterOwnMap');
  }
  await PNMap.render(el,profile,15);
}
window.addEventListener('load',()=>setTimeout(pnMasterOwnMap,250));
window.addEventListener('pageshow',()=>setTimeout(pnMasterOwnMap,250));


let pnEditPickedLocation=null;
document.addEventListener('click',e=>{
  const t=e.target;
  if(!t)return;
  if((t.textContent||'').trim().toLowerCase().includes('адрес') || t.id==='editAddress'){
    setTimeout(async()=>{
      const address=document.getElementById('eaAddress');
      if(!address||document.getElementById('eaLocationMap'))return;
      const wrap=document.createElement('div');
      wrap.style.cssText='margin-top:12px';
      wrap.innerHTML='<div style="font-weight:700;margin-bottom:6px">Точка на карте</div><div style="font-size:13px;color:#777;margin-bottom:8px">Нажмите на дом или перетащите маркер.</div><button type="button" id="eaFindAddress" class="secondary" style="width:100%;margin-bottom:8px">Найти введённый адрес</button><div id="eaLocationMap" style="height:250px;border-radius:18px;overflow:hidden;background:#f2f2f2"></div>';
      address.parentElement.appendChild(wrap);
      const p=getProfile();
      const initial=(Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng)))?[Number(p.lat),Number(p.lng)]:null;
      await PNMap.pick(document.getElementById('eaLocationMap'),initial,async x=>{
        const previous=pnEditPickedLocation; pnEditPickedLocation=x;
        if(previous){
          try{
            const r=await pnReverseGeocode(x.lat,x.lng);
            if(r?.found&&r.address&&r.address!==address.value.trim()){
              if(confirm('Точка перемещена.\nНовый адрес: '+r.address+'\n\nПодтвердить этот адрес?')) address.value=r.address;
            }
          }catch(e){console.warn('reverse geocode',e)}
        }
      });
      document.getElementById('eaFindAddress').onclick=async()=>{
        try{
          const g=await pnGeocodeAddress(address.value.trim(),p.city||'Бишкек');
          if(!g?.found)return alert('Адрес не найден. Поставьте точку вручную.');
          pnEditPickedLocation={lat:g.lat,lng:g.lng};
          await PNMap.pick(document.getElementById('eaLocationMap'),[g.lat,g.lng],x=>pnEditPickedLocation=x);
        }catch(err){alert('Поставьте точку вручную на карте.')}
      };
    },80);
  }
});

window.addEventListener('DOMContentLoaded',async()=>{try{if(window.PNBackendSync&&session()?.userId){await PNBackendSync.hydrateMasterCache();const f=location.pathname.split('/').pop();if(f==='master.html')renderDashboard();else if(f==='master-profile.html')renderProfile();else if(f==='master-bookings.html')renderBookings();else if(f==='master-chats.html')renderChats();else if(f==='master-analytics.html')renderAnalytics()}}catch(e){console.warn('backend hydrate',e)}});
window.addEventListener('DOMContentLoaded',()=>{
 if(window.PNRealtime)PNRealtime.watchMaster(async()=>{
  try{
   await PNBackendSync?.hydrateMasterCache?.();
   const f=location.pathname.split('/').pop();
   if(f==='master.html')renderDashboard();
   else if(f==='master-profile.html')renderProfile();
   else if(f==='master-bookings.html')renderBookings();
   else if(f==='master-chats.html')renderChats();
   else if(f==='master-analytics.html')renderAnalytics();
  }catch(e){}
 });
});
