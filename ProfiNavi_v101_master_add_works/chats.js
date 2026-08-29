
(function cleanupLegacyClientUnreadV51(){
 try{
   localStorage.removeItem('pn_chat_unread');
   localStorage.removeItem('pn_client_chat_unread');
 }catch(e){}
})();

const masters=[
 {name:'Tunuk Nails',avatar:'assets/tunuk.png'},
 {name:'Adel Beauty',avatar:'assets/adel.png'},
 {name:'Alya Lashes',avatar:'assets/alya.png'},
 {name:'Mira Brows',avatar:'assets/mira.png'}
];
function getBookings(){const x=JSON.parse(localStorage.getItem('pn_bookings')||'[]');return Array.isArray(x)?x:[]}
function getChats(){return JSON.parse(localStorage.getItem('pn_chats')||'{}')}
function getRead(){return JSON.parse(localStorage.getItem('pn_client_chat_read_at_v49')||'{}')}
function bookingEndAt(b){
 const d=new Date(b?.date||'');if(Number.isNaN(d.getTime()))return null;
 const [h,m]=String(b.time||'00:00').split(':').map(Number);
 return new Date(d.getFullYear(),d.getMonth(),d.getDate(),h||0,m||0);
}
function expired(b){const dt=bookingEndAt(b);return dt?Date.now()>=dt.getTime()+72*60*60*1000:false}

function renderClientChatList(){
 const chats=getChats();
 const reads=getRead();
 const box=document.getElementById('chatList');
 const bookings=[...getBookings()].reverse().filter((b,i)=>(chats[String(b.id||i)]||[]).length>0);

 if(!bookings.length){
   box.innerHTML=`<div class="chat-list-empty"><div class="chat-list-empty-icon">♡</div><h2>Пока нет чатов</h2><p>После записи к мастеру здесь появится переписка.</p><a href="client.html">Найти мастера</a></div>`;
   return;
 }

 box.innerHTML=bookings.map((b,i)=>{
   let m=masters[Number(b.master)||0]||masters[0];
   if(Number(b.master||0)===0){
     try{
       const p=JSON.parse(localStorage.getItem('pn_master_profile_0')||'null');
       if(p)m={...m,name:p.name||m.name,avatar:p.avatar||m.avatar};
     }catch(e){}
   }

   const key=String(b.id||i);
   const msgs=chats[key]||[];
   const last=msgs[msgs.length-1];
   const lastMaster=[...msgs].reverse().find(x=>x.from==='master');
   const unread=!!(lastMaster && Number(lastMaster.ts||0)>Number(reads[key]||0));
   const status=expired(b)?'Чат закрыт':b.status==='confirmed'?'Запись подтверждена':b.status==='cancelled'?'Запись отклонена':'Ожидает подтверждения';

   return `<a class="chat-list-item ${unread?'is-unread':''}" href="chat.html?master=${b.master||0}&booking=${encodeURIComponent(key)}">
     <img src="${m.avatar}" alt="${m.name}">
     <div class="chat-list-text">
       <div class="chat-list-row">
         <h2>${m.name}</h2>
         <div class="chat-list-meta">${unread?'<b class="chat-unread-badge">1</b>':''}</div>
       </div>
       <p>${last?.text||`Запись на ${b.service||'услугу'}`}</p>
       <span class="chat-list-status">${status}</span>
     </div>
   </a>`;
 }).join('');
}

renderClientChatList();

/* Safari/iPhone often restores the previous page from back-forward cache.
   Re-render instead of showing the stale badge that was cached before the chat was opened. */
window.addEventListener('pageshow',()=>renderClientChatList());
window.addEventListener('focus',()=>renderClientChatList());
document.addEventListener('visibilitychange',()=>{
 if(!document.hidden)renderClientChatList();
});
window.addEventListener('storage',e=>{
 if(['pn_chats','pn_bookings','pn_client_chat_read_at_v49'].includes(e.key)){
   renderClientChatList();
 }
});


