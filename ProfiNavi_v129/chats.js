(function cleanupLegacyClientUnreadV51(){try{localStorage.removeItem('pn_chat_unread');localStorage.removeItem('pn_client_chat_unread')}catch(e){}})();
const masters=window.PNCloneMasters();window.masters=masters;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function getBookings(){const x=JSON.parse(localStorage.getItem('pn_bookings')||'[]');return Array.isArray(x)?x:[]}
function getChats(){return JSON.parse(localStorage.getItem('pn_chats')||'{}')}
function getRead(){return JSON.parse(localStorage.getItem('pn_client_chat_read_at_v49')||'{}')}
function bookingEndAt(b){const d=new Date(b?.date||'');if(Number.isNaN(d.getTime()))return null;const[h,m]=String(b.time||'00:00').split(':').map(Number);return new Date(d.getFullYear(),d.getMonth(),d.getDate(),h||0,m||0)}
function expired(b){const dt=bookingEndAt(b);return dt?Date.now()>=dt.getTime()+72*60*60*1000:false}
let supportState={loggedIn:false,loaded:false,lastMessage:null,unreadCount:0};
function supportRow(){
 const href=supportState.loggedIn?'support-chat.html?return=chats.html':`client-login.html?return=${encodeURIComponent('support-chat.html?return=chats.html')}`;
 const last=supportState.lastMessage?.body||'Напишите нам, если возник вопрос или проблема';
 const unread=supportState.unreadCount>0;
 return `<a class="chat-list-item support-list-item ${unread?'is-unread':''}" href="${href}"><div class="support-list-avatar"><img src="icon-192.png" alt="ProfiNavi"></div><div class="chat-list-text"><div class="chat-list-row"><h2>Техническая поддержка</h2><div class="chat-list-meta">${unread?'<b class="chat-unread-badge">1</b>':''}</div></div><p>${esc(last)}</p><span class="chat-list-status">ProfiNavi · помощь по работе сервиса</span></div></a>`;
}
function renderClientChatList(){
 const chats=getChats(),reads=getRead(),box=document.getElementById('chatList');
 const bookings=[...getBookings()].reverse().filter((b,i)=>(chats[String(b.id||i)]||[]).length>0);
 const bookingHtml=bookings.map((b,i)=>{
   const mid=Number(b.master)||0;let m=masters[mid]||null;try{const cached=JSON.parse(localStorage.getItem(`pn_dynamic_master_${mid}`)||'null');if(cached)m=cached}catch(e){};m=m||{name:b.masterName||'Мастер ProfiNavi',avatar:'icon-192.png'};
   const key=String(b.id||i),msgs=chats[key]||[],last=msgs[msgs.length-1],lastMaster=[...msgs].reverse().find(x=>x.from==='master');
   const unread=!!(lastMaster&&Number(lastMaster.ts||0)>Number(reads[key]||0));
   const status=expired(b)?'Чат закрыт':b.status==='completed'||b.status==='done'?'Запись завершена':b.status==='confirmed'?'Запись подтверждена':b.status==='cancelled'?'Запись отменена':'Ожидает подтверждения';
   return `<a class="chat-list-item ${unread?'is-unread':''}" href="chat.html?master=${encodeURIComponent(b.master||0)}&booking=${encodeURIComponent(key)}"><img src="${esc(m.avatar||'icon-192.png')}" alt="${esc(m.name)}"><div class="chat-list-text"><div class="chat-list-row"><h2>${esc(m.name)}</h2><div class="chat-list-meta">${unread?'<b class="chat-unread-badge">1</b>':''}</div></div><p>${esc(last?.text||`Запись на ${b.service||'услугу'}`)}</p><span class="chat-list-status">${esc(status)}</span></div></a>`;
 }).join('');
 box.innerHTML=supportRow()+bookingHtml+(!bookings.length?'<div class="chat-list-hint">Диалоги с мастерами появятся здесь после подтверждения записи.</div>':'');
}
async function pnHydrateSupport(){
 try{
  const u=await window.PNAuth?.currentUser?.();
  if(!u){supportState={loggedIn:false,loaded:true,lastMessage:null,unreadCount:0};localStorage.setItem('pn_support_unread','0');renderClientChatList();return}
  const s=await PNData.getSupportSummary();supportState={loggedIn:true,loaded:true,lastMessage:s.lastMessage,unreadCount:s.unreadCount||0};localStorage.setItem('pn_support_unread',s.unreadCount?'1':'0');renderClientChatList();
 }catch(e){console.warn('support summary',e)}
}
async function pnHydrateChatsFromBackend(){
 if(!window.PNData||!window.PNAuth)return;const u=await PNAuth.currentUser();if(!u)return;
 const cs=await PNData.listConversations(),cache=JSON.parse(localStorage.getItem('pn_chats')||'{}'),allowed=new Set(cs.map(c=>String(c.booking_id)));
 getBookings().filter(b=>b.syncedToSupabase&&!allowed.has(String(b.id))).forEach(b=>delete cache[String(b.id)]);
 for(const c of cs){const ms=await PNData.listMessages(c.id);cache[String(c.booking_id)]=ms.map(m=>({from:m.sender_id===u.id?'client':'master',text:m.body,ts:new Date(m.created_at).getTime(),kind:m.is_system?'system':undefined,conversationId:c.id}))}
 localStorage.setItem('pn_chats',JSON.stringify(cache));renderClientChatList();
}
renderClientChatList();
window.addEventListener('pageshow',()=>{renderClientChatList();pnHydrateSupport()});window.addEventListener('focus',()=>{renderClientChatList();pnHydrateSupport()});document.addEventListener('visibilitychange',()=>{if(!document.hidden){renderClientChatList();pnHydrateSupport()}});
window.addEventListener('storage',e=>{if(['pn_chats','pn_bookings','pn_client_chat_read_at_v49','pn_support_unread'].includes(e.key))renderClientChatList()});
window.addEventListener('DOMContentLoaded',()=>Promise.all([pnHydrateChatsFromBackend(),pnHydrateSupport()]).catch(e=>console.warn('chat backend',e)));
window.addEventListener('DOMContentLoaded',()=>window.PNRealtime?.watchClient?.(()=>Promise.all([pnHydrateChatsFromBackend(),pnHydrateSupport()]).catch(()=>{})));
