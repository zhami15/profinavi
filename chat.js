
(function cleanupLegacyClientUnreadV51(){
 try{
   localStorage.removeItem('pn_chat_unread');
   localStorage.removeItem('pn_client_chat_unread');
 }catch(e){}
})();

const masters=window.PNCloneMasters();
window.masters=masters;
function getBookings(){const x=JSON.parse(localStorage.getItem('pn_bookings')||'[]');return Array.isArray(x)?x:[]}
function getChats(){return JSON.parse(localStorage.getItem('pn_chats')||'{}')}
function saveChats(v){localStorage.setItem('pn_chats',JSON.stringify(v))}
function getClientReadAt(){return JSON.parse(localStorage.getItem('pn_client_chat_read_at_v49')||'{}')}
function saveClientReadAt(v){localStorage.setItem('pn_client_chat_read_at_v49',JSON.stringify(v))}
function bookingEndAt(b){
 if(!b?.date)return null;
 const d=new Date(b.date);if(Number.isNaN(d.getTime()))return null;
 const [h,m]=String(b.time||'00:00').split(':').map(Number);
 return new Date(d.getFullYear(),d.getMonth(),d.getDate(),h||0,m||0,0,0);
}
function isChatExpired(b){const dt=bookingEndAt(b);return dt?Date.now()>=dt.getTime()+72*60*60*1000:false}

const q=new URLSearchParams(location.search);
const masterIndex=Number(q.get('master')||0);
const bookingId=q.get('booking');
const bookings=getBookings();
const booking=bookings.find((b,i)=>String(b.id||i)===String(bookingId))||null;
if(!booking){location.replace('chats.html')}
if(booking && booking.status==='pending'){location.replace('chats.html')}

let m=masters[masterIndex]||null;try{const cached=JSON.parse(localStorage.getItem(`pn_dynamic_master_${masterIndex}`)||'null');if(cached)m=cached}catch(e){};m=m||masters[0];
if(masterIndex===0){
 try{
   const p=JSON.parse(localStorage.getItem('pn_master_profile_0')||'null');
   if(p)m={...m,name:p.name||m.name,avatar:p.avatar||m.avatar};
 }catch(e){}
}
document.getElementById('chatPageAvatar').src=m.avatar;
document.getElementById('chatPageName').textContent=m.name;

const key=String(booking.id);

function markClientRead(){
 const reads=getClientReadAt();
 const msgs=messages();
 const lastMaster=[...msgs].reverse().find(msg=>msg.from==='master');
 if(lastMaster){
   reads[key]=Number(lastMaster.ts||Date.now());
 }else{
   reads[key]=Date.now();
 }
 saveClientReadAt(reads);
 if(booking?.syncedToSupabase&&window.PNData)PNData.listConversations().then(cs=>{const c=cs.find(x=>String(x.booking_id)===String(booking.id));if(c)return PNData.markConversationRead(c.id)}).catch(()=>{});
}
function messages(){return getChats()[key]||[]}
function notifyMaster(){
 // No counter: master unread is derived from latest client message timestamp.
}
function statusText(){
 if(isChatExpired(booking))return 'Чат завершён';
 if(booking.status==='confirmed')return 'Запись подтверждена';
 if(booking.status==='cancelled')return 'Запись отклонена';
 return 'Ожидает подтверждения';
}
function render(){
 document.querySelector('.chat-screen-head p').textContent=statusText();
 const expired=isChatExpired(booking),box=document.getElementById('chatPageMessages'),msgs=messages();
 box.innerHTML=(msgs.length?'<div class="chat-date">Сегодня</div>'+msgs.map(msg=>`
   <div class="chat-row ${msg.from==='master'?'master':'user'}">
     <div class="chat-bubble">${msg.text}<div class="chat-time">${msg.ts?new Date(msg.ts).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):''}</div></div>
   </div>`).join(''):'<div class="chat-empty-state"><h2>Начните переписку</h2></div>')
   +(expired?'<div class="chat-closed-notice"><strong>Чат закрыт</strong><p>Прошло 72 часа после времени записи. Новые сообщения отправлять нельзя.</p></div>':'');

 const form=document.getElementById('chatPageForm'),input=document.getElementById('chatPageInput'),button=form.querySelector('button');
 if(expired){
   input.disabled=true;button.disabled=true;input.placeholder='Чат закрыт';form.classList.add('is-disabled');
 }else{
   input.disabled=false;button.disabled=false;form.classList.remove('is-disabled');
 }
 box.scrollTop=box.scrollHeight;
}

markClientRead();
render();

document.getElementById('chatPageForm').onsubmit=async e=>{
 e.preventDefault();
 if(isChatExpired(booking))return;
 const input=document.getElementById('chatPageInput'),text=input.value.trim();
 if(!text)return;
 try{
  if(booking.syncedToSupabase&&window.PNData){
   const cs=await PNData.listConversations(),c=cs.find(x=>String(x.booking_id)===String(booking.id));
   if(!c)throw new Error('Чат ещё не открыт мастером');
   await PNData.sendMessage(c.id,text);
   await pnHydrateChatsFromBackend();
  }else{
   const all=getChats();all[key]=all[key]||[];
   all[key].push({from:'client',text,ts:Date.now(),kind:'message'});saveChats(all);
  }
 }catch(err){alert('Не удалось отправить сообщение: '+err.message);return}
 input.value='';render();
};

window.addEventListener('storage',e=>{
 if(['pn_chats','pn_bookings'].includes(e.key))location.reload();
});

async function pnHydrateChatsFromBackend(){if(!window.PNData||!window.PNAuth)return;const u=await PNAuth.currentUser();if(!u)return;const cs=await PNData.listConversations(),cache=JSON.parse(localStorage.getItem('pn_chats')||'{}'),allowed=new Set(cs.map(c=>String(c.booking_id)));getBookings().filter(b=>b.syncedToSupabase&&!allowed.has(String(b.id))).forEach(b=>delete cache[String(b.id)]);for(const c of cs){const ms=await PNData.listMessages(c.id);cache[String(c.booking_id)]=ms.map(m=>({from:m.sender_id===u.id?'client':'master',text:m.body,ts:new Date(m.created_at).getTime(),kind:m.is_system?'system':undefined,conversationId:c.id}))}localStorage.setItem('pn_chats',JSON.stringify(cache))}
window.addEventListener('DOMContentLoaded',()=>pnHydrateChatsFromBackend().catch(e=>console.warn('chat backend',e)));

window.addEventListener('DOMContentLoaded',()=>window.PNRealtime?.watchClient?.(()=>pnHydrateChatsFromBackend().then(()=>render()).catch(()=>{})));
