
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

let m=masters[masterIndex]||masters[0];
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

document.getElementById('chatPageForm').onsubmit=e=>{
 e.preventDefault();
 if(isChatExpired(booking))return;
 const input=document.getElementById('chatPageInput'),text=input.value.trim();
 if(!text)return;
 const all=getChats();all[key]=all[key]||[];
 all[key].push({from:'client',text,ts:Date.now(),kind:'message'});
 saveChats(all);input.value='';render();
};

window.addEventListener('storage',e=>{
 if(['pn_chats','pn_bookings'].includes(e.key))location.reload();
});
