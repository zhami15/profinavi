const q=new URLSearchParams(location.search);
const master=q.get('master')||'0', service=q.get('service')||'Услуга', time=q.get('time')||'', date=new Date(q.get('date')||Date.now());
const baseMasters=window.PNCloneMasters();
const names=baseMasters.map(x=>x.name);
try{const id=Number(master);const cached=JSON.parse(localStorage.getItem(`pn_dynamic_master_${id}`)||'null');if(cached)names[id]=cached.name}catch(e){}
const dateText=date.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
document.getElementById('confirmContent').innerHTML=`<header class="booking-head"><button class="booking-close" onclick="history.back()">‹</button><h1>Подтверждение</h1><span></span></header><section class="booking-confirm-card"><div class="confirm-icon">✓</div><h2>Проверьте запись</h2><dl><div><dt>Мастер</dt><dd>${names[Number(master)]||names[0]}</dd></div><div><dt>Услуга</dt><dd>${service}</dd></div><div><dt>Дата</dt><dd>${dateText}</dd></div><div><dt>Время</dt><dd>${time}</dd></div></dl><label>Комментарий мастеру<textarea placeholder="Например: хочу короткую форму и нежный дизайн"></textarea></label><button onclick="finishBooking()">Подтвердить запись</button></section>`;
async function completeBooking(){
 const user=JSON.parse(localStorage.getItem('pn_client_user')||'null')||{};
 const masterName=names[Number(master)]||names[0];
 const rawDate=q.get('date')||new Date().toISOString();
 const baseDate=new Date(rawDate);
 if(Number.isNaN(baseDate.getTime())){
   alert('Некорректная дата записи. Выберите время ещё раз.');
   return;
 }
 const [hh,mm]=String(time||'12:00').split(':').map(Number);
 const startsAt=new Date(
   baseDate.getFullYear(),
   baseDate.getMonth(),
   baseDate.getDate(),
   Number.isFinite(hh)?hh:12,
   Number.isFinite(mm)?mm:0,
   0,0
 );
 let dbRow;
 try{
   if(!window.PNData)throw new Error('База данных не загрузилась');
   dbRow=await window.PNData.createBooking({master:Number(master),masterName,service,startsAt:startsAt.toISOString(),price:0});
 }catch(e){
   alert('Не удалось сохранить запись в базе: '+e.message);
   return;
 }
 const booking={
   id:dbRow.id,
   master:Number(master),
   masterName,
   service,
   date:date.toISOString(),
   dateText,
   time,
   status:'pending',
   clientName:user.name||'Клиент ProfiNavi',
   createdAt:dbRow.created_at||new Date().toISOString(),
   syncedToSupabase:true
 };
 const bookings=JSON.parse(localStorage.getItem('pn_bookings')||'[]');
 bookings.push(booking);
 localStorage.setItem('pn_bookings',JSON.stringify(bookings));
 // Чат создаётся backend-триггером только после подтверждения записи мастером.
 localStorage.removeItem('pn_booking');
 alert('Заявка сохранена в ProfiNavi и отправлена мастеру.');
 location.href='client.html';
}

function getClientUser(){
 try{return JSON.parse(localStorage.getItem('pn_client_user')||'null')}catch(e){return null}
}
function saveClientUser(user){
 localStorage.setItem('pn_client_user',JSON.stringify(user));
}
async function finishBooking(){
 const user=getClientUser();
 if(user&&user.name){ await completeBooking(); return; }
 if(window.PNAuth){
   try{
     const synced=await window.PNAuth.syncLocalUser();
     if(synced&&synced.name){ await completeBooking(); return; }
   }catch(e){ console.warn('Supabase auth unavailable:',e); }
 }
 location.href='client-login.html?return=booking-confirm.html';
}

let authMethod='';
let authValue='';

function closeAuthModal(){
 document.getElementById('pnAuthOverlay')?.remove();
}

function openAuthModal(){
 closeAuthModal();
 const overlay=document.createElement('div');
 overlay.id='pnAuthOverlay';
 overlay.className='pn-auth-overlay';
 overlay.innerHTML=`<div class="pn-auth-sheet">
   <button class="pn-auth-close" type="button" aria-label="Закрыть">×</button>
   <div class="pn-auth-logo">Profi<span>Navi</span></div>
   <h2>Войдите, чтобы записаться</h2>
   <p class="pn-auth-sub">Просматривать мастеров можно без регистрации. Аккаунт нужен только для записи.</p>

   <button class="pn-auth-option phone" data-method="phone" type="button">
     <span>☎</span><b>Продолжить по номеру телефона</b>
   </button>


   <p class="pn-auth-legal">Продолжая, вы соглашаетесь с условиями ProfiNavi.</p>
 </div>`;
 document.body.appendChild(overlay);
 overlay.querySelector('.pn-auth-close').onclick=closeAuthModal;
 overlay.addEventListener('click',e=>{if(e.target===overlay)closeAuthModal()});
 overlay.querySelectorAll('[data-method]').forEach(btn=>{
   btn.onclick=()=>{
     authMethod=btn.dataset.method;
     if(authMethod==='phone') showContactStep();
   };
 });
}

function showContactStep(){
 const sheet=document.querySelector('#pnAuthOverlay .pn-auth-sheet');
 if(!sheet)return;
 sheet.innerHTML=`<button class="pn-auth-back" type="button">‹</button>
   <div class="pn-auth-step">
     <h2>Введите номер телефона</h2>
     <p class="pn-auth-sub">Мы отправим код подтверждения по SMS.</p>
     <label class="pn-auth-field">
       <span>Номер телефона</span>
       <input id="authContact" type="tel" placeholder="+996 555 000 000" autocomplete="tel">
     </label>
     <button class="pn-auth-primary" id="sendAuthCode" type="button">Продолжить</button>
   </div>`;
 sheet.querySelector('.pn-auth-back').onclick=openAuthModal;
 sheet.querySelector('#sendAuthCode').onclick=async()=>{
   const value=sheet.querySelector('#authContact').value.trim();if(!value){sheet.querySelector('#authContact').focus();return}
   const btn=sheet.querySelector('#sendAuthCode');btn.disabled=true;btn.textContent='Отправляем…';authValue=value;
   try{
     if(!window.PNAuth) throw new Error('Supabase не загрузился. Откройте сайт через Vercel, а не как локальный HTML-файл.');
     const {error}=await window.PNAuth.sendOtp(authMethod,authValue);if(error)throw error;showCodeStep()
   }catch(e){alert('Не удалось отправить код: '+e.message);btn.disabled=false;btn.textContent='Продолжить'}
 };
}

function showCodeStep(){
 const sheet=document.querySelector('#pnAuthOverlay .pn-auth-sheet');
 if(!sheet)return;
 sheet.innerHTML=`<button class="pn-auth-back" type="button">‹</button>
   <div class="pn-auth-step">
     <h2>Введите код</h2>
     <p class="pn-auth-sub">${window.PN_TEST_MODE?'Тестовый режим — SMS пока не отправляется. Введите код <b>111111</b>.':`Код отправлен на <b>${authValue}</b>`}</p>
     <div class="pn-code-row">
       ${[0,1,2,3,4,5].map(i=>`<input class="pn-code-input" inputmode="numeric" maxlength="1" aria-label="Цифра ${i+1}">`).join('')}
     </div>
     <button class="pn-auth-primary" id="verifyAuthCode" type="button">Подтвердить</button>
     <button class="pn-auth-resend" type="button">Отправить код ещё раз</button>
   </div>`;

 const inputs=[...sheet.querySelectorAll('.pn-code-input')];
 inputs.forEach((input,i)=>{
   input.oninput=()=>{
     input.value=input.value.replace(/\D/g,'').slice(0,1);
     if(input.value&&inputs[i+1])inputs[i+1].focus();
   };
   input.onkeydown=e=>{
     if(e.key==='Backspace'&&!input.value&&inputs[i-1])inputs[i-1].focus();
   };
 });
 inputs[0]?.focus();
 sheet.querySelector('.pn-auth-back').onclick=showContactStep;
 sheet.querySelector('#verifyAuthCode').onclick=async()=>{
   const code=inputs.map(x=>x.value).join('');if(code.length!==6){inputs.find(x=>!x.value)?.focus();return}
   const btn=sheet.querySelector('#verifyAuthCode');btn.disabled=true;btn.textContent='Проверяем…';
   try{const {error}=await window.PNAuth.verifyOtp(authMethod,authValue,code);if(error)throw error;const synced=await window.PNAuth.syncLocalUser();if(synced&&synced.name){closeAuthModal();await completeBooking();return}showNameStep(authMethod,authValue)}
   catch(e){alert('Неверный или просроченный код: '+e.message);btn.disabled=false;btn.textContent='Подтвердить'}
 };
 sheet.querySelector('.pn-auth-resend').onclick=async()=>{try{const {error}=await window.PNAuth.sendOtp(authMethod,authValue);if(error)throw error;alert(window.PN_TEST_MODE?'Тестовый режим включён.':'Новый код отправлен.')}catch(e){alert('Не удалось отправить код: '+e.message)}};
}

function showNameStep(method,value=''){
 const sheet=document.querySelector('#pnAuthOverlay .pn-auth-sheet');
 if(!sheet)return;
 const provider='';
 sheet.innerHTML=`<button class="pn-auth-back" type="button">‹</button>
   <div class="pn-auth-step">
     <h2>${provider?`Продолжить с ${provider}`:'Почти готово'}</h2>
     <p class="pn-auth-sub">Как к вам обращаться?</p>
     <label class="pn-auth-field">
       <span>Имя *</span>
       <input id="authName" type="text" placeholder="Ваше имя" autocomplete="name">
     </label>
     <button class="pn-auth-primary" id="finishRegistration" type="button">Продолжить</button>
   </div>`;
 sheet.querySelector('.pn-auth-back').onclick=showCodeStep;
 const nameInput=sheet.querySelector('#authName');
 nameInput.focus();
 sheet.querySelector('#finishRegistration').onclick=async()=>{
   const name=nameInput.value.trim();if(!name){nameInput.focus();return}
   const btn=sheet.querySelector('#finishRegistration');btn.disabled=true;btn.textContent='Сохраняем…';
   try{await window.PNAuth.saveName(name);closeAuthModal();await completeBooking()}
   catch(e){alert('Не удалось сохранить профиль: '+e.message);btn.disabled=false;btn.textContent='Продолжить'}
 };
}

window.addEventListener('DOMContentLoaded',()=>window.PNAuth?.syncLocalUser().catch(()=>{}));
