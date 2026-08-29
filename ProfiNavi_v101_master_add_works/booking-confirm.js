const q=new URLSearchParams(location.search);
const master=q.get('master')||'0', service=q.get('service')||'Услуга', time=q.get('time')||'', date=new Date(q.get('date')||Date.now());
const names=['Tunuk Nails','Adel Beauty','Alya Lashes','Mira Brows'];
const dateText=date.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
document.getElementById('confirmContent').innerHTML=`<header class="booking-head"><button class="booking-close" onclick="history.back()">‹</button><h1>Подтверждение</h1><span></span></header><section class="booking-confirm-card"><div class="confirm-icon">✓</div><h2>Проверьте запись</h2><dl><div><dt>Мастер</dt><dd>${names[Number(master)]||names[0]}</dd></div><div><dt>Услуга</dt><dd>${service}</dd></div><div><dt>Дата</dt><dd>${dateText}</dd></div><div><dt>Время</dt><dd>${time}</dd></div></dl><label>Комментарий мастеру<textarea placeholder="Например: хочу короткую форму и нежный дизайн"></textarea></label><button onclick="finishBooking()">Подтвердить запись</button></section>`;
function completeBooking(){
 const booking={
   id:'b_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),
   master:Number(master),
   service,
   date:date.toISOString(),
   dateText,
   time,
   status:'pending',
   clientName:(JSON.parse(localStorage.getItem('pn_client_user')||'null')?.name)||'Клиент ProfiNavi',
   createdAt:new Date().toISOString()
 };

 const bookings=JSON.parse(localStorage.getItem('pn_bookings')||'[]');
 bookings.push(booking);
 localStorage.setItem('pn_bookings',JSON.stringify(bookings));

 const chats=JSON.parse(localStorage.getItem('pn_chats')||'{}');
 const key=String(booking.id);
 chats[key]=[
   {
     from:'client',
     text:`Здравствуйте! Хочу записаться на услугу 「${booking.service}」 — ${dateText} в ${booking.time}.`,
     ts:Date.now(),
     kind:'booking-request'
   }
 ];
 localStorage.setItem('pn_chats',JSON.stringify(chats));
 const masterReads=JSON.parse(localStorage.getItem('pn_master_chat_read_at_v49')||'{}');
 delete masterReads[key];
 localStorage.setItem('pn_master_chat_read_at_v49',JSON.stringify(masterReads));

 // No numeric unread counters: unread is derived from message time vs read time.
 localStorage.removeItem('pn_booking');
 alert('Заявка отправлена мастеру.');
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
 if(user&&user.name){ completeBooking(); return; }
 if(window.PNAuth){
   try{
     const synced=await window.PNAuth.syncLocalUser();
     if(synced&&synced.name){ completeBooking(); return; }
   }catch(e){ console.warn('Supabase auth unavailable:',e); }
 }
 openAuthModal();
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
   <button class="pn-auth-option email" data-method="email" type="button">
     <span>✉</span><b>Продолжить с email</b>
   </button>
   <button class="pn-auth-option social" data-method="apple" type="button">
     <span class="apple-mark">●</span><b>Продолжить с Apple</b>
   </button>
   <button class="pn-auth-option social" data-method="google" type="button">
     <span class="google-mark">G</span><b>Продолжить с Google</b>
   </button>

   <p class="pn-auth-legal">Продолжая, вы соглашаетесь с условиями ProfiNavi.</p>
 </div>`;
 document.body.appendChild(overlay);
 overlay.querySelector('.pn-auth-close').onclick=closeAuthModal;
 overlay.addEventListener('click',e=>{if(e.target===overlay)closeAuthModal()});
 overlay.querySelectorAll('[data-method]').forEach(btn=>{
   btn.onclick=()=>{
     authMethod=btn.dataset.method;
     if(authMethod==='phone'||authMethod==='email') showContactStep();
     else {
       if(!window.PNAuth){alert('Supabase не загрузился. Откройте сайт через Vercel.');return;}
       window.PNAuth.social(authMethod==='apple'?'apple':'google').then(({error})=>{if(error)alert('Не удалось войти: '+error.message)});
     }
   };
 });
}

function showContactStep(){
 const sheet=document.querySelector('#pnAuthOverlay .pn-auth-sheet');
 if(!sheet)return;
 const phone=authMethod==='phone';
 sheet.innerHTML=`<button class="pn-auth-back" type="button">‹</button>
   <div class="pn-auth-step">
     <h2>${phone?'Введите номер телефона':'Введите email'}</h2>
     <p class="pn-auth-sub">${phone?'Мы отправим код подтверждения по SMS.':'Мы отправим код подтверждения на почту.'}</p>
     <label class="pn-auth-field">
       <span>${phone?'Номер телефона':'Email'}</span>
       <input id="authContact" type="${phone?'tel':'email'}" placeholder="${phone?'+996 555 000 000':'name@example.com'}" autocomplete="${phone?'tel':'email'}">
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
     <p class="pn-auth-sub">Код отправлен на <b>${authValue}</b></p>
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
   try{const {error}=await window.PNAuth.verifyOtp(authMethod,authValue,code);if(error)throw error;const synced=await window.PNAuth.syncLocalUser();if(synced&&synced.name){closeAuthModal();completeBooking();return}showNameStep(authMethod,authValue)}
   catch(e){alert('Неверный или просроченный код: '+e.message);btn.disabled=false;btn.textContent='Подтвердить'}
 };
 sheet.querySelector('.pn-auth-resend').onclick=async()=>{try{const {error}=await window.PNAuth.sendOtp(authMethod,authValue);if(error)throw error;alert('Новый код отправлен.')}catch(e){alert('Не удалось отправить код: '+e.message)}};
}

function showNameStep(method,value=''){
 const sheet=document.querySelector('#pnAuthOverlay .pn-auth-sheet');
 if(!sheet)return;
 const provider=method==='apple'?'Apple':method==='google'?'Google':'';
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
 sheet.querySelector('.pn-auth-back').onclick=()=>method==='phone'||method==='email'?showCodeStep():openAuthModal();
 const nameInput=sheet.querySelector('#authName');
 nameInput.focus();
 sheet.querySelector('#finishRegistration').onclick=async()=>{
   const name=nameInput.value.trim();if(!name){nameInput.focus();return}
   const btn=sheet.querySelector('#finishRegistration');btn.disabled=true;btn.textContent='Сохраняем…';
   try{await window.PNAuth.saveName(name);closeAuthModal();completeBooking()}
   catch(e){alert('Не удалось сохранить профиль: '+e.message);btn.disabled=false;btn.textContent='Продолжить'}
 };
}

window.addEventListener('DOMContentLoaded',()=>window.PNAuth?.syncLocalUser().catch(()=>{}));
