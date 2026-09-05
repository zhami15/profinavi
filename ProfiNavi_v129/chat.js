(function cleanupLegacyClientUnreadV51(){try{localStorage.removeItem('pn_chat_unread');localStorage.removeItem('pn_client_chat_unread')}catch(e){}})();

const masters=window.PNCloneMasters();window.masters=masters;
const chatEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const q=new URLSearchParams(location.search);
const requestedMaster=Number(q.get('master')||0),bookingId=q.get('booking');
let booking=null,m=null,key='';

function getBookings(){const x=JSON.parse(localStorage.getItem('pn_bookings')||'[]');return Array.isArray(x)?x:[]}
function getChats(){try{return JSON.parse(localStorage.getItem('pn_chats')||'{}')||{}}catch(e){return{}}}
function saveChats(v){localStorage.setItem('pn_chats',JSON.stringify(v))}
function getClientReadAt(){try{return JSON.parse(localStorage.getItem('pn_client_chat_read_at_v49')||'{}')||{}}catch(e){return{}}}
function saveClientReadAt(v){localStorage.setItem('pn_client_chat_read_at_v49',JSON.stringify(v))}
function bookingStartAt(b){const d=new Date(b?.date||'');if(Number.isNaN(d.getTime()))return null;const[h,min]=String(b.time||'00:00').split(':').map(Number);return new Date(d.getFullYear(),d.getMonth(),d.getDate(),h||0,min||0,0,0)}
function isChatExpired(b){const dt=bookingStartAt(b);return dt?Date.now()>=dt.getTime()+72*60*60*1000:false}
function isChatClosed(b){return !b||['cancelled','declined'].includes(b.status)||isChatExpired(b)}
function messages(){return key?(getChats()[key]||[]):[]}

async function hydrateBookings(){try{if(window.PNBackendSync?.hydrateClientBookings)await PNBackendSync.hydrateClientBookings()}catch(e){console.warn('booking hydrate',e)}}
async function hydrateChats(){
 if(!window.PNData||!window.PNAuth)return;const u=await PNAuth.currentUser();if(!u)return;
 const cs=await PNData.listConversations(),cache=getChats(),allowed=new Set(cs.map(c=>String(c.booking_id)));
 getBookings().filter(b=>b.syncedToSupabase&&!allowed.has(String(b.id))).forEach(b=>delete cache[String(b.id)]);
 for(const c of cs){const ms=await PNData.listMessages(c.id);cache[String(c.booking_id)]=ms.map(msg=>({from:msg.sender_id===u.id?'client':'master',text:msg.body,ts:new Date(msg.created_at).getTime(),kind:msg.is_system?'system':undefined,conversationId:c.id}))}
 saveChats(cache);
}
function resolveMaster(){
 const id=Number(booking?.master??requestedMaster);let x=Number.isFinite(id)?masters[id]:null;
 try{const cached=JSON.parse(localStorage.getItem(`pn_dynamic_master_${id}`)||'null');if(cached)x=cached}catch(e){}
 return x||{name:booking?.masterName||'Мастер ProfiNavi',avatar:'icon-192.png'};
}
function statusText(){
 if(['cancelled','declined'].includes(booking?.status))return 'Запись отменена';
 if(isChatExpired(booking))return 'Чат завершён';
 if(['completed','done'].includes(booking?.status))return 'Запись завершена';
 if(booking?.status==='confirmed')return 'Запись подтверждена';
 return 'Ожидает подтверждения';
}
async function markClientRead(){
 const reads=getClientReadAt(),msgs=messages(),lastMaster=[...msgs].reverse().find(x=>x.from==='master');reads[key]=Number(lastMaster?.ts||Date.now());saveClientReadAt(reads);
 if(booking?.syncedToSupabase&&window.PNData){try{const cs=await PNData.listConversations(),c=cs.find(x=>String(x.booking_id)===String(booking.id));if(c)await PNData.markConversationRead(c.id)}catch(e){console.warn('read sync',e)}}
}
function render(){
 if(!booking)return;const box=document.getElementById('chatPageMessages');if(!box)return;
 document.querySelector('.chat-screen-head p').textContent=statusText();
 const closed=isChatClosed(booking),msgs=messages();
 box.innerHTML=(msgs.length?'<div class="chat-date">Переписка</div>'+msgs.map(msg=>`<div class="chat-row ${msg.from==='master'?'master':'user'}"><div class="chat-bubble">${chatEsc(msg.text)}<div class="chat-time">${msg.ts?new Date(msg.ts).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):''}</div></div></div>`).join(''):'<div class="chat-empty-state"><h2>Начните переписку</h2></div>')+(closed?`<div class="chat-closed-notice"><strong>Чат закрыт</strong><p>${['cancelled','declined'].includes(booking.status)?'Запись отменена. Новые сообщения отправлять нельзя.':'Прошло 72 часа после времени записи. Новые сообщения отправлять нельзя.'}</p></div>`:'');
 const form=document.getElementById('chatPageForm'),input=document.getElementById('chatPageInput'),button=form?.querySelector('button');
 if(input&&button&&form){input.disabled=closed;button.disabled=closed;input.placeholder=closed?'Чат закрыт':'Сообщение…';form.classList.toggle('is-disabled',closed)}
 box.scrollTop=box.scrollHeight;
}
async function send(text){
 if(isChatClosed(booking))return;const value=String(text||'').trim();if(!value)return;
 if(booking.syncedToSupabase&&window.PNData){const cs=await PNData.listConversations(),c=cs.find(x=>String(x.booking_id)===String(booking.id));if(!c)throw new Error('Чат ещё не открыт мастером');await PNData.sendMessage(c.id,value);await hydrateChats()}
 else{const all=getChats();all[key]=all[key]||[];all[key].push({from:'client',text:value,ts:Date.now(),kind:'message'});saveChats(all)}
}
async function boot(){
 await hydrateBookings();booking=getBookings().find((b,i)=>String(b.id||i)===String(bookingId))||null;
 if(!booking||booking.status==='pending'){location.replace('chats.html');return}
 key=String(booking.id);m=resolveMaster();document.getElementById('chatPageAvatar').src=m.avatar||'icon-192.png';document.getElementById('chatPageName').textContent=m.name||'Мастер ProfiNavi';
 await hydrateChats();await markClientRead();render();
 const form=document.getElementById('chatPageForm');if(form)form.onsubmit=async e=>{e.preventDefault();const input=document.getElementById('chatPageInput'),text=input.value.trim();if(!text)return;try{await send(text);input.value='';render()}catch(err){alert('Не удалось отправить сообщение: '+err.message)}};
 window.addEventListener('storage',e=>{if(['pn_chats','pn_bookings'].includes(e.key))boot().catch(()=>{})});
 window.PNRealtime?.watchClient?.(async()=>{try{await hydrateBookings();booking=getBookings().find((b,i)=>String(b.id||i)===String(bookingId))||booking;await hydrateChats();render()}catch(e){}});
}
window.addEventListener('DOMContentLoaded',()=>boot().catch(e=>{console.warn('chat boot',e);location.replace('chats.html')}));
