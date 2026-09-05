(()=>{
 const q=new URLSearchParams(location.search),returnTo=q.get('return')||'chats.html';
 const box=document.getElementById('supportMessages'),form=document.getElementById('supportForm'),input=document.getElementById('supportInput');
 let user=null,thread=null,channel=null;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const time=v=>new Date(v).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
 document.getElementById('supportBack').onclick=()=>location.href=returnTo;
 async function ensureAuth(){
   user=await window.PNAuth?.currentUser?.();
   if(user)return true;
   const target=`support-chat.html?return=${encodeURIComponent(returnTo)}`;
   location.replace(returnTo.includes('master-')?'master-login.html':`client-login.html?return=${encodeURIComponent(target)}`);
   return false;
 }
 async function load(){
   if(!await ensureAuth())return;
   try{
     thread=await PNData.getSupportThread(false);
     const msgs=thread?await PNData.listSupportMessages(thread.id):[];
     box.innerHTML=msgs.length?'<div class="chat-date">Техническая поддержка</div>'+msgs.map(m=>`<div class="chat-row ${m.sender_id===user.id?'user':'master'}"><div class="chat-bubble">${esc(m.body).replace(/\n/g,'<br>')}<div class="chat-time">${time(m.created_at)}</div></div></div>`).join(''):`<div class="support-welcome"><div class="support-welcome-icon">?</div><h2>Чем можем помочь?</h2><p>Опишите проблему или вопрос. Переписку увидит администратор ProfiNavi.</p></div>`;
     if(thread)await PNData.markSupportRead(thread.id);localStorage.setItem('pn_support_unread','0');
     requestAnimationFrame(()=>box.scrollTop=box.scrollHeight);
     if(thread)watch();
   }catch(e){box.innerHTML=`<div class="chat-empty-state"><h2>Не удалось открыть поддержку</h2><p>${esc(e.message)}</p></div>`}
 }
 function watch(){
   if(!thread||channel||!window.pnSupabase)return;
   channel=pnSupabase.channel(`pn-support-${thread.id}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'support_messages',filter:`thread_id=eq.${thread.id}`},()=>loadMessagesOnly()).subscribe();
 }
 async function loadMessagesOnly(){
   if(!thread||!user)return;
   try{const msgs=await PNData.listSupportMessages(thread.id);box.innerHTML=msgs.length?'<div class="chat-date">Техническая поддержка</div>'+msgs.map(m=>`<div class="chat-row ${m.sender_id===user.id?'user':'master'}"><div class="chat-bubble">${esc(m.body).replace(/\n/g,'<br>')}<div class="chat-time">${time(m.created_at)}</div></div></div>`).join(''):'';await PNData.markSupportRead(thread.id);localStorage.setItem('pn_support_unread','0');requestAnimationFrame(()=>box.scrollTop=box.scrollHeight)}catch(e){}
 }
 form.onsubmit=async e=>{
   e.preventDefault();const text=input.value.trim();if(!text)return;
   const btn=form.querySelector('button');btn.disabled=true;input.disabled=true;
   try{if(!thread){thread=await PNData.getSupportThread(true);if(!thread)throw new Error('Не удалось создать обращение');watch()}await PNData.sendSupportMessage(thread.id,text);input.value='';await loadMessagesOnly()}catch(err){alert('Не удалось отправить сообщение: '+err.message)}finally{btn.disabled=false;input.disabled=false;input.focus()}
 };
 window.addEventListener('beforeunload',()=>{if(channel&&window.pnSupabase)pnSupabase.removeChannel(channel)});
 load();
})();
