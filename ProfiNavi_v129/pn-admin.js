(function(){
  const sb=window.pnSupabase;
  if(!sb)return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalizePhone=v=>String(v||'').replace(/\D/g,'');
  async function user(){return await window.PNAuth?.currentUser?.()||null}
  async function ensureRole(){
    let u=await user();if(!u)throw new Error('Нет активной сессии');
    if(u.app_metadata?.profinavi_role==='admin')return u;
    const {data,error}=await sb.functions.invoke('profinavi-admin-ensure-role',{body:{}});
    if(error)throw error;if(data?.error)throw new Error(data.error);
    const refreshed=await sb.auth.refreshSession();if(refreshed.error)throw refreshed.error;
    u=(await sb.auth.getUser()).data.user;
    if(u?.app_metadata?.profinavi_role!=='admin')throw new Error('У этого аккаунта нет прав администратора');
    return u;
  }
  async function requireAdmin(){
    try{return await ensureRole()}catch(e){
      console.warn('Admin guard:',e);
      try{await window.PNAuth?.signOut?.()}catch(_){try{await sb.auth.signOut({scope:'local'})}catch(__){}}
      location.replace('admin-login.html');throw e;
    }
  }
  async function listMasters(){
    const {data,error}=await sb.from('master_profiles').select('*').order('created_at',{ascending:false});if(error)throw error;
    const rows=data||[],ids=rows.map(x=>x.user_id).filter(Boolean);let contacts=[];
    if(ids.length){const r=await sb.from('profiles').select('id,name,phone,role').in('id',ids);if(r.error)throw r.error;contacts=r.data||[]}
    const byId=Object.fromEntries(contacts.map(x=>[x.id,x]));
    return rows.map(x=>({...x,contact:byId[x.user_id]||null}));
  }
  async function loadMaster(legacyId){
    const {data:profile,error}=await sb.from('master_profiles').select('*').eq('legacy_id',Number(legacyId)).maybeSingle();if(error)throw error;if(!profile)throw new Error('Мастер не найден');
    const uid=profile.user_id;
    const [ct,sv,wo,sl,au]=await Promise.all([
      sb.from('profiles').select('id,name,phone,role').eq('id',uid).maybeSingle(),
      sb.from('services').select('*').eq('master_id',uid).order('sort_order'),
      sb.from('works').select('*').eq('master_id',uid).order('sort_order'),
      sb.from('availability_slots').select('*').eq('master_id',uid).gte('ends_at',new Date(Date.now()-86400000).toISOString()).order('starts_at'),
      sb.from('admin_audit_log').select('*').eq('target_master_id',uid).order('created_at',{ascending:false}).limit(50)
    ]);
    for(const r of [ct,sv,wo,sl,au])if(r.error)throw r.error;
    return{profile,contact:ct.data,services:sv.data||[],works:wo.data||[],slots:sl.data||[],audit:au.data||[]};
  }
  async function log(targetMasterId,action,entityType='master_profile',entityId=null,before=null,after=null){
    const u=await ensureRole();
    const {error}=await sb.from('admin_audit_log').insert({admin_id:u.id,admin_name:u.app_metadata?.admin_name||u.user_metadata?.name||'Admin',target_master_id:targetMasterId,action,entity_type:entityType,entity_id:entityId,before_data:before,after_data:after});
    if(error)throw error;
  }
  function extFor(file){
    const name=String(file?.name||''),m=name.match(/\.([a-zA-Z0-9]+)$/);if(m)return m[1].toLowerCase();
    const type=String(file?.type||'');return type.includes('png')?'png':type.includes('webp')?'webp':type.includes('heic')?'heic':type.includes('heif')?'heif':'jpg';
  }
  async function upload(bucket,targetUserId,file,kind){
    if(!file)throw new Error('Выберите изображение');if(file.size>10*1024*1024)throw new Error('Файл больше 10 МБ');
    const path=`${targetUserId}/${kind}/${Date.now()}-${crypto.randomUUID?.()||Math.random().toString(36).slice(2)}.${extFor(file)}`;
    const {error}=await sb.storage.from(bucket).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type||undefined});if(error)throw error;
    const {data}=sb.storage.from(bucket).getPublicUrl(path);if(!data?.publicUrl)throw new Error('Не удалось получить URL изображения');return data.publicUrl;
  }
  async function saveProfile(uid,patch,before){
    const row={...patch,updated_at:new Date().toISOString()};
    if(row.is_blocked){row.blocked_at=before?.blocked_at||new Date().toISOString()}else{row.blocked_at=null;row.blocked_reason=null}
    const {data,error}=await sb.from('master_profiles').update(row).eq('user_id',uid).select().single();if(error)throw error;
    await log(uid,'profile_update','master_profile',uid,before,data);return data;
  }
  async function saveService(uid,id,patch,before){
    const row={...patch,updated_at:new Date().toISOString()};
    const {data,error}=await sb.from('services').update(row).eq('id',id).eq('master_id',uid).select().single();if(error)throw error;
    await log(uid,'service_update','service',id,before,data);return data;
  }
  async function addService(uid){
    const {data,error}=await sb.from('services').insert({master_id:uid,name:'Новая услуга',price:0,duration_minutes:60,duration_text:'60 мин',is_active:true,sort_order:999}).select().single();if(error)throw error;
    await log(uid,'service_create','service',data.id,null,data);return data;
  }
  async function addWork(uid,file){
    const url=await upload('master-media',uid,file,'work');
    const {data,error}=await sb.from('works').insert({master_id:uid,image_url:url,sort_order:999}).select().single();if(error)throw error;
    await log(uid,'work_create','work',data.id,null,data);return data;
  }
  async function deleteWork(uid,work){
    const {error}=await sb.from('works').delete().eq('id',work.id).eq('master_id',uid);if(error)throw error;
    await log(uid,'work_delete','work',work.id,work,null);
  }
  function localIso(date,time){
    const [h,m]=String(time).split(':').map(Number),d=new Date(`${date}T00:00:00`);d.setHours(h||0,m||0,0,0);return d.toISOString();
  }
  function addMinutes(time,min){const[h,m]=time.split(':').map(Number),v=h*60+m+min;return`${String(Math.floor(v/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`}
  function ymd(d){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  async function replaceSchedule(uid,{start='10:00',end='19:00',step=60,daysAhead=30,weekdays=[0,1,2,3,4,5,6]}){
    const today=new Date();today.setHours(0,0,0,0);
    const beforeRes=await sb.from('availability_slots').select('id,starts_at,ends_at,is_available').eq('master_id',uid).gte('starts_at',today.toISOString());if(beforeRes.error)throw beforeRes.error;
    const del=await sb.from('availability_slots').delete().eq('master_id',uid).gte('starts_at',today.toISOString());if(del.error)throw del.error;
    const rows=[];const stepMin=Math.max(30,Number(step)||60),ahead=Math.min(62,Math.max(1,Number(daysAhead)||30));
    const[startH,startM]=start.split(':').map(Number),[endH,endM]=end.split(':').map(Number),s0=startH*60+startM,e0=endH*60+endM;
    for(let i=0;i<ahead;i++){const d=new Date(today);d.setDate(today.getDate()+i);if(!weekdays.includes(d.getDay()))continue;for(let v=s0;v+stepMin<=e0;v+=stepMin){const t=`${String(Math.floor(v/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`;rows.push({master_id:uid,starts_at:localIso(ymd(d),t),ends_at:localIso(ymd(d),addMinutes(t,stepMin)),is_available:true})}}
    let inserted=[];if(rows.length){const r=await sb.from('availability_slots').insert(rows).select();if(r.error)throw r.error;inserted=r.data||[]}
    const scheduleConfig={days:'По выбранным дням',workDays:weekdays,start,end,step:stepMin};
    const up=await sb.from('master_profiles').update({schedule_config:scheduleConfig,updated_at:new Date().toISOString()}).eq('user_id',uid);if(up.error)throw up.error;
    await log(uid,'schedule_replace','availability',null,{count:(beforeRes.data||[]).length},{count:inserted.length,start,end,step:stepMin,daysAhead:ahead,weekdays});return inserted;
  }
  async function listSupportThreads(){
    const u=await ensureRole();const tr=await sb.from('support_threads').select('*').not('last_message_at','is',null).order('last_message_at',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false});if(tr.error)throw tr.error;
    const threads=tr.data||[],ids=threads.map(x=>x.id),userIds=threads.map(x=>x.user_id);if(!threads.length)return[];
    const [pr,ms,rd]=await Promise.all([
      sb.from('profiles').select('id,name,phone,role').in('id',userIds),
      sb.from('support_messages').select('*').in('thread_id',ids).order('created_at'),
      sb.from('support_reads').select('*').eq('user_id',u.id).in('thread_id',ids)
    ]);for(const r of [pr,ms,rd])if(r.error)throw r.error;
    const contacts=Object.fromEntries((pr.data||[]).map(x=>[x.id,x])),reads=Object.fromEntries((rd.data||[]).map(x=>[x.thread_id,x.last_read_at]));
    const byThread={};for(const m of ms.data||[])(byThread[m.thread_id]||(byThread[m.thread_id]=[])).push(m);
    return threads.map(th=>{const messages=byThread[th.id]||[],last=messages[messages.length-1]||null,lastRead=reads[th.id]||'1970-01-01T00:00:00.000Z';const unread=messages.filter(m=>m.sender_id!==u.id&&m.created_at>lastRead).length;return{...th,contact:contacts[th.user_id]||null,lastMessage:last,unreadCount:unread}});
  }
  async function loadSupportThread(threadId){
    const u=await ensureRole();const th=await sb.from('support_threads').select('*').eq('id',threadId).maybeSingle();if(th.error)throw th.error;if(!th.data)throw new Error('Диалог поддержки не найден');
    const [pr,ms]=await Promise.all([sb.from('profiles').select('id,name,phone,role').eq('id',th.data.user_id).maybeSingle(),sb.from('support_messages').select('*').eq('thread_id',threadId).order('created_at')]);if(pr.error)throw pr.error;if(ms.error)throw ms.error;
    return{thread:th.data,contact:pr.data||null,messages:ms.data||[],admin:u};
  }
  async function sendSupportMessage(threadId,body){const u=await ensureRole();const text=String(body||'').trim();if(!text)throw new Error('Введите сообщение');if(text.length>5000)throw new Error('Сообщение слишком длинное');const r=await sb.from('support_messages').insert({thread_id:threadId,sender_id:u.id,body:text}).select().single();if(r.error)throw r.error;return r.data}
  async function markSupportRead(threadId){const u=await ensureRole();const r=await sb.from('support_reads').upsert({thread_id:threadId,user_id:u.id,last_read_at:new Date().toISOString()},{onConflict:'thread_id,user_id'});if(r.error)throw r.error}
  async function logout(){try{await window.PNAuth?.signOut?.()}catch(e){try{await sb.auth.signOut({scope:'local'})}catch(_){}}location.replace('admin-login.html')}
  window.PNAdmin={esc,normalizePhone,user,ensureRole,requireAdmin,listMasters,loadMaster,log,uploadMaster:(uid,file,kind)=>upload('master-media',uid,file,kind),uploadService:(uid,file)=>upload('service-media',uid,file,'service'),saveProfile,saveService,addService,addWork,deleteWork,replaceSchedule,listSupportThreads,loadSupportThread,sendSupportMessage,markSupportRead,logout};
})();
