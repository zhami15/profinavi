const PN_SUPABASE_URL='https://ydezwnuoeqlzmeuufrmo.supabase.co';
const PN_SUPABASE_PUBLISHABLE_KEY='sb_publishable_IJ4Ue3an-u8PUp0ZuIzV5g_TMVE6L9X';
const PN_TEST_MODE=true;
const PN_TEST_OTP='111111';
window.PN_TEST_MODE=PN_TEST_MODE;
window.PN_TEST_OTP=PN_TEST_OTP;
window.pnSupabase=window.supabase?.createClient ? window.supabase.createClient(PN_SUPABASE_URL,PN_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}) : null;

function pnPhone(contact){
 let d=String(contact||'').replace(/\D/g,'');
 if(d.startsWith('0'))d=d.slice(1);
 if(d.length===9)d='996'+d;
 return d?('+'+d):'';
}
function pnCachedClient(){try{return JSON.parse(localStorage.getItem('pn_client_user')||'null')}catch{return null}}

function pnValidateImageFile(file,maxBytes=10*1024*1024){
 if(!file)throw new Error('Файл не выбран');
 if(!String(file.type||'').startsWith('image/'))throw new Error('Можно загружать только изображения');
 if(Number(file.size||0)>maxBytes)throw new Error('Изображение слишком большое. Максимум 10 МБ');
 return file;
}
async function pnUploadImage(bucket,file,kind='image'){
 pnValidateImageFile(file);
 const user=await PNAuth.currentUser();if(!user)throw new Error('Нет активной сессии');
 const ext=(file.name?.split('.').pop()||file.type?.split('/').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
 const safeKind=String(kind||'image').toLowerCase().replace(/[^a-z0-9_-]/g,'-')||'image';
 const path=`${user.id}/${safeKind}/${crypto.randomUUID()}.${ext}`;
 const {error}=await pnSupabase.storage.from(bucket).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type||undefined});if(error)throw error;
 const publicUrl=pnSupabase.storage.from(bucket).getPublicUrl(path).data?.publicUrl||null;
 if(!publicUrl)throw new Error('Не удалось получить ссылку на изображение');
 return publicUrl;
}

window.PNAuth={
 async currentUser(){
  if(!window.pnSupabase)return null;
  const {data}=await pnSupabase.auth.getUser();return data?.user||null
 },
 async sendOtp(method,contact,options={}){
  if(method!=='phone')return {data:null,error:new Error('В ProfiNavi используется только номер телефона')};
  const phone=pnPhone(contact),shouldCreateUser=options.shouldCreateUser!==false,purpose=options.purpose||'auth';
  sessionStorage.setItem('pn_test_pending_phone',phone);
  if(PN_TEST_MODE){
   try{
    const r=await fetch(`${PN_SUPABASE_URL}/functions/v1/profinavi-test-phone-auth`,{method:'POST',headers:{'Content-Type':'application/json','apikey':PN_SUPABASE_PUBLISHABLE_KEY},body:JSON.stringify({action:'send',phone,purpose,shouldCreateUser})});
    const body=await r.json();if(!r.ok)throw new Error(body.error||'Не удалось запросить код');
    return {data:body,error:null};
   }catch(error){return {data:null,error}}
  }
  return pnSupabase.auth.signInWithOtp({phone,options:{shouldCreateUser}});
 },
 async verifyOtp(method,contact,token,options={}){
  if(method!=='phone')return {data:null,error:new Error('Доступна только авторизация по телефону')};
  const phone=pnPhone(contact),shouldCreateUser=options.shouldCreateUser!==false,purpose=options.purpose||'auth';
  if(PN_TEST_MODE){
   try{
    const r=await fetch(`${PN_SUPABASE_URL}/functions/v1/profinavi-test-phone-auth`,{method:'POST',headers:{'Content-Type':'application/json','apikey':PN_SUPABASE_PUBLISHABLE_KEY},body:JSON.stringify({action:'verify',phone,code:String(token),purpose,shouldCreateUser})});
    const body=await r.json();if(!r.ok)throw new Error(body.error||'Не удалось подтвердить номер');
    const out=await pnSupabase.auth.setSession({access_token:body.access_token,refresh_token:body.refresh_token});if(out.error)throw out.error;
    sessionStorage.setItem('pn_test_pending_phone',body.phone||phone);
    return {data:{...out.data,demo:true,isNewUser:!!body.is_new_user},error:null};
   }catch(error){return {data:null,error}}
  }
  return pnSupabase.auth.verifyOtp({phone,token,type:'sms'});
 },
 async saveName(name){
  const user=await this.currentUser(); if(!user)throw new Error('Нет активной сессии');
  const phone=user.phone||user.user_metadata?.phone||sessionStorage.getItem('pn_test_pending_phone')||null;
  const {error:a}=await pnSupabase.auth.updateUser({data:{name,phone}}); if(a)throw a;
  const {data:existing}=await pnSupabase.from('profiles').select('role').eq('id',user.id).maybeSingle();
  const {error}=await pnSupabase.from('profiles').upsert({id:user.id,name:name.trim(),phone,role:existing?.role||'client',updated_at:new Date().toISOString()},{onConflict:'id'}); if(error)throw error;
  return this.syncLocalUser();
 },
 async syncLocalUser(){
  const user=await this.currentUser();
  if(!user){localStorage.removeItem('pn_client_user');return null}
  const {data,error}=await pnSupabase.from('profiles').select('id,name,phone,role').eq('id',user.id).maybeSingle();
  if(error)throw error;
  const name=data?.name||user.user_metadata?.name||'';
  const phone=data?.phone||user.phone||user.user_metadata?.phone||null;
  const cached={id:user.id,name,role:data?.role||'client',phone,email:null,method:'phone',contact:phone,registeredAt:user.created_at,test:PN_TEST_MODE};
  localStorage.setItem('pn_client_user',JSON.stringify(cached));return cached;
 },
 async hasMasterProfile(){
  const user=await this.currentUser();
  if(user){const {data,error}=await pnSupabase.from('master_profiles').select('user_id').eq('user_id',user.id).maybeSingle();if(!error&&data)return true}
  return false;
 },
 clearLocalAuthState(){
  const exact=[
    'pn_client_user','pn_bookings','pn_booking','pn_chats','pn_verified_reviews',
    'pn_favs','pn_fav_works','pn_client_chat_read_at_v49','pn_client_chat_read_at',
    'pn_client_chat_unread','pn_chat_unread','pn_master_chat_read_at_v49',
    'pn_master_chat_read_at','pn_master_chat_unread','pn_master_chats',
    'pn_master_backend_reviews','pn_master_cache_owner','pn_master_session',
    'pn_master_profile_0','pn_master_services_0','pn_master_slots','pn_master_schedule_config',
    'pn_master_feed_works'
  ];
  exact.forEach(k=>localStorage.removeItem(k));
  Object.keys(localStorage).forEach(k=>{if(k.startsWith('pn_chat_'))localStorage.removeItem(k)});
  ['pn_test_pending_phone','pn_auth_pending','pn_master_pending_phone'].forEach(k=>sessionStorage.removeItem(k));
 },
 async signOut(){
  let error=null;
  try{if(pnSupabase){const out=await pnSupabase.auth.signOut({scope:'local'});error=out?.error||null}}catch(e){error=e}
  this.clearLocalAuthState();
  if(error)throw error;
  return true;
 }
};

window.PNData={
 async createBooking(input){
  const user=await PNAuth.currentUser();if(!user)throw new Error('Сначала подтвердите номер телефона');
  const startsAt=new Date(input.startsAt),legacyId=Number(input.master)||0;
  if(Number.isNaN(startsAt.getTime()))throw new Error('Некорректная дата записи');
  let masterId=null,serviceId=null,bookingPrice=Number(input.price)||0;
  const {data:mp,error:mpError}=await pnSupabase.from('master_profiles').select('user_id,is_published').eq('legacy_id',legacyId).eq('is_published',true).maybeSingle();
  if(mpError)throw mpError;
  masterId=mp?.user_id||null;
  if(!masterId)throw new Error('Мастер не найден или профиль больше не опубликован.');
  if(input.service){
   const {data:sv,error:svError}=await pnSupabase.from('services').select('id,price,new_price').eq('master_id',masterId).eq('name',input.service).eq('is_active',true).limit(1).maybeSingle();
   if(svError)throw svError;
   serviceId=sv?.id||null;
   if(!serviceId)throw new Error('Эта услуга больше недоступна. Обновите профиль мастера.');
   const base=Number(sv.price)||0,discount=sv.new_price==null?null:Number(sv.new_price);
   bookingPrice=Number.isFinite(discount)&&discount>=0&&discount<base?discount:base;
  }
  const payload={client_id:user.id,master_id:masterId,service_id:serviceId,legacy_master_id:legacyId,master_name:input.masterName||null,service_name:input.service||'Услуга',starts_at:startsAt.toISOString(),ends_at:null,price:bookingPrice,status:'pending',client_name:pnCachedClient()?.name||null};
  const {data,error}=await pnSupabase.from('bookings').insert(payload).select('id,created_at,master_id').single();if(error)throw error;return data;
 },
 async updateBookingStatus(id,status){
  const {data,error}=await pnSupabase.rpc('set_booking_status',{p_booking:id,p_status:status});if(error)throw error;return data;
 },
 async uploadReviewPhotos(bookingId,files){
  const user=await PNAuth.currentUser();if(!user)throw new Error('Нет активной сессии');
  const urls=[];
  for(const file of [...files].slice(0,3)){
   const ext=(file.name?.split('.').pop()||file.type?.split('/').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
   const path=`${user.id}/${bookingId}/${crypto.randomUUID()}.${ext}`;
   const {error}=await pnSupabase.storage.from('review-photos').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type||undefined});if(error)throw error;
   const {data}=pnSupabase.storage.from('review-photos').getPublicUrl(path);if(data?.publicUrl)urls.push(data.publicUrl);
  }
  return urls;
 },
 async createReview({bookingId,legacyMasterId,rating,text,files}){
  const user=await PNAuth.currentUser();if(!user)throw new Error('Нет активной сессии');
  const {data:booking,error:bookingError}=await pnSupabase.from('bookings').select('id,master_id,legacy_master_id').eq('id',bookingId).eq('client_id',user.id).maybeSingle();
  if(bookingError)throw bookingError;if(!booking)throw new Error('Запись не найдена');
  const photos=await this.uploadReviewPhotos(bookingId,files||[]);
  const payload={booking_id:bookingId,client_id:user.id,master_id:booking.master_id||null,legacy_master_id:Number(booking.legacy_master_id??legacyMasterId)||0,rating:Number(rating),text:(text||'').trim()||null,photos};
  const {data,error}=await pnSupabase.from('reviews').insert(payload).select('id,master_id,legacy_master_id,rating,text,photos,created_at').single();if(error)throw error;return data;
 },
 async hasReview(bookingId){
  const {data,error}=await pnSupabase.from('reviews').select('id').eq('booking_id',bookingId).maybeSingle();if(error)throw error;return !!data;
 },
 async listBookings(){
  const user=await PNAuth.currentUser();if(!user)return [];
  const {data,error}=await pnSupabase.from('bookings').select('id,legacy_master_id,master_name,service_name,starts_at,status,created_at').eq('client_id',user.id).order('starts_at',{ascending:true});if(error)throw error;return data||[];
 },
 async listMyReviews(){
  const user=await PNAuth.currentUser();if(!user)return [];
  const {data,error}=await pnSupabase.from('reviews').select('id,booking_id,legacy_master_id,rating,text,photos,created_at').eq('client_id',user.id).order('created_at',{ascending:false});if(error)throw error;return data||[];
 },
 async listPublicDirectory(){
  const {data:profiles,error}=await pnSupabase.from('master_profiles')
    .select('user_id,legacy_id,profile_name,city,area,address,latitude,longitude,bio,experience_text,categories,avatar_url,cover_url,strengths_tags,payment,location_info,schedule_config,rating,reviews_count,rating_confidence,top_score,ranking_breakdown,is_published,created_at')
    .eq('is_published',true).order('top_score',{ascending:false});
  if(error)throw error;if(!profiles?.length)return [];
  const ids=profiles.map(x=>x.user_id);
  const [sv,wo,sl]=await Promise.all([
    pnSupabase.from('services').select('id,master_id,name,description,price,new_price,promo_label,image_url,duration_text,is_active,sort_order').in('master_id',ids).eq('is_active',true).order('sort_order'),
    pnSupabase.from('works').select('id,master_id,image_url,caption,sort_order,created_at').in('master_id',ids).order('sort_order'),
    pnSupabase.from('availability_slots').select('master_id,starts_at,ends_at,is_available').in('master_id',ids).eq('is_available',true).gte('starts_at',new Date().toISOString()).lte('starts_at',new Date(Date.now()+14*86400000).toISOString()).order('starts_at')
  ]);
  if(sv.error)throw sv.error;if(wo.error)throw wo.error;if(sl.error)throw sl.error;
  const services=sv.data||[],works=wo.data||[],slots=sl.data||[];
  return profiles.map(profile=>({profile,services:services.filter(x=>x.master_id===profile.user_id),works:works.filter(x=>x.master_id===profile.user_id),slots:slots.filter(x=>x.master_id===profile.user_id)}));
 },
 async loadPublicMasterBundle(legacyId){
  const id=Number(legacyId)||0;
  const {data:profile,error}=await pnSupabase.from('master_profiles').select('*').eq('legacy_id',id).eq('is_published',true).maybeSingle();if(error)throw error;if(!profile)return null;
  const nowIso=new Date().toISOString();
  const horizonIso=new Date(Date.now()+62*86400000).toISOString();
  const [services,works,reviews,slots]=await Promise.all([
   pnSupabase.from('services').select('*').eq('master_id',profile.user_id).eq('is_active',true).order('sort_order'),
   pnSupabase.from('works').select('*').eq('master_id',profile.user_id).order('sort_order'),
   pnSupabase.from('reviews').select('*').eq('master_id',profile.user_id).order('created_at',{ascending:false}),
   pnSupabase.from('availability_slots').select('id,master_id,starts_at,ends_at,is_available').eq('master_id',profile.user_id).eq('is_available',true).gte('starts_at',nowIso).lte('starts_at',horizonIso).order('starts_at')
  ]);for(const r of [services,works,reviews,slots])if(r.error)throw r.error;
  return {profile,services:services.data||[],works:works.data||[],reviews:reviews.data||[],slots:slots.data||[]};
 }
};



async function pnGeocodeAddress(address,city){
  const {data,error}=await pnSupabase.functions.invoke('profinavi-geocode-address',{body:{address,city}});
  if(error) throw error;
  if(data?.error) throw new Error(data.error);
  return data||{found:false};
}

async function pnReverseGeocode(lat,lng){
 const {data,error}=await pnSupabase.functions.invoke('profinavi-reverse-geocode',{body:{lat,lng}});
 if(error) throw error;
 if(data?.error) throw new Error(data.error);
 return data;
}


Object.assign(window.PNData,{
 async loadMasterBundle(){
  const user=await PNAuth.currentUser();if(!user)throw new Error('Нет активной сессии');const uid=user.id;
  const reqs=[
   pnSupabase.from('master_profiles').select('*').eq('user_id',uid).maybeSingle(),
   pnSupabase.from('services').select('*').eq('master_id',uid).order('sort_order'),
   pnSupabase.from('works').select('*').eq('master_id',uid).order('sort_order'),
   pnSupabase.from('availability_slots').select('*').eq('master_id',uid).gte('ends_at',new Date(Date.now()-86400000).toISOString()).order('starts_at'),
   pnSupabase.from('bookings').select('*').eq('master_id',uid).order('starts_at'),
   pnSupabase.from('reviews').select('*').eq('master_id',uid).order('created_at',{ascending:false})
  ];
  const [mp,sv,wo,sl,bk,rv]=await Promise.all(reqs);for(const r of [mp,sv,wo,sl,bk,rv])if(r.error)throw r.error;
  return {profile:mp.data,services:sv.data||[],works:wo.data||[],slots:sl.data||[],bookings:bk.data||[],reviews:rv.data||[]};
 },
 async saveMasterProfile(input){
  const user=await PNAuth.currentUser();if(!user)throw new Error('Нет активной сессии');
  const row={user_id:user.id,profile_name:input.profileName||input.name||null,city:input.city||'Бишкек',area:input.area||null,address:input.address||null,
   latitude:Number.isFinite(Number(input.lat))?Number(input.lat):null,longitude:Number.isFinite(Number(input.lng))?Number(input.lng):null,bio:input.about||null,
   experience_text:input.experience||null,strengths_tags:Array.isArray(input.strengths)?input.strengths:[],
   avatar_url:String(input.avatar||'').startsWith('http')?input.avatar:null,cover_url:String(input.cover||'').startsWith('http')?input.cover:null,
   payment:input.payment||null,location_info:input.locationInfo||null,
   schedule_config:{days:input.scheduleType||'Ежедневно',workDays:input.workDays||[],start:input.openTime||'10:00',end:input.closeTime||'19:00'},updated_at:new Date().toISOString()};
  const {data,error}=await pnSupabase.from('master_profiles').upsert(row,{onConflict:'user_id'}).select().single();if(error)throw error;return data;
 },
 async setMasterPublished(value){
  const user=await PNAuth.currentUser();if(!user)throw new Error('Нет активной сессии');
  const {data,error}=await pnSupabase.from('master_profiles').update({is_published:!!value,updated_at:new Date().toISOString()}).eq('user_id',user.id).select('is_published').single();if(error)throw error;return !!data?.is_published;
 },
 async replaceMasterServices(items){
  const user=await PNAuth.currentUser();if(!user)throw new Error('Нет активной сессии');const uid=user.id;
  const {error:d}=await pnSupabase.from('services').delete().eq('master_id',uid);if(d)throw d;
  const rows=(items||[]).map((x,i)=>({master_id:uid,name:(x.name||'Услуга').trim(),description:x.desc||null,price:Number(x.price)||0,
   new_price:(x.newPrice!==undefined&&x.newPrice!==null&&String(x.newPrice)!=='')?Number(x.newPrice):null,promo_label:x.promo||null,
   image_url:String(x.image||'').startsWith('http')?x.image:null,duration_text:x.time||null,is_active:true,sort_order:i}));
  if(!rows.length)return[];const {data,error}=await pnSupabase.from('services').insert(rows).select();if(error)throw error;return data||[];
 },
 async replaceMasterWorks(urls){
  const user=await PNAuth.currentUser();if(!user)throw new Error('Нет активной сессии');const uid=user.id;
  const {error:d}=await pnSupabase.from('works').delete().eq('master_id',uid);if(d)throw d;
  const rows=(urls||[]).filter(x=>String(x||'').startsWith('http')).map((url,i)=>({master_id:uid,image_url:url,sort_order:i}));
  if(!rows.length)return[];const {data,error}=await pnSupabase.from('works').insert(rows).select();if(error)throw error;return data||[];
 },
 async replaceAvailability(slotMap){
  const user=await PNAuth.currentUser();if(!user)throw new Error('Нет активной сессии');const uid=user.id;const today=new Date();today.setHours(0,0,0,0);
  const {error:d}=await pnSupabase.from('availability_slots').delete().eq('master_id',uid).gte('starts_at',today.toISOString());if(d)throw d;
  const rows=[];Object.entries(slotMap||{}).forEach(([date,times])=>(times||[]).forEach(t=>{const [h,m]=String(t).split(':').map(Number);const st=new Date(date+'T00:00:00');st.setHours(h||0,m||0,0,0);rows.push({master_id:uid,starts_at:st.toISOString(),ends_at:new Date(st.getTime()+3600000).toISOString(),is_available:true})}));
  if(!rows.length)return[];const {data,error}=await pnSupabase.from('availability_slots').insert(rows).select();if(error)throw error;return data||[];
 },
 async uploadMasterMedia(file,kind='work'){
  return pnUploadImage('master-media',file,kind);
 },
 async uploadServiceMedia(file){
  return pnUploadImage('service-media',file,'service');
 },
 async listMasterBookings(){const user=await PNAuth.currentUser();if(!user)return[];const {data,error}=await pnSupabase.from('bookings').select('*').eq('master_id',user.id).order('starts_at');if(error)throw error;return data||[]},
 async listConversations(){const user=await PNAuth.currentUser();if(!user)return[];const {data,error}=await pnSupabase.from('conversations').select('*').or(`client_id.eq.${user.id},master_id.eq.${user.id}`).order('created_at',{ascending:false});if(error)throw error;return data||[]},
 async listMessages(id){const {data,error}=await pnSupabase.from('messages').select('*').eq('conversation_id',id).order('created_at');if(error)throw error;return data||[]},
 async sendMessage(id,body){const user=await PNAuth.currentUser();if(!user)throw new Error('Нет активной сессии');const text=String(body||'').trim();if(!text)throw new Error('Введите сообщение');const {data,error}=await pnSupabase.from('messages').insert({conversation_id:id,sender_id:user.id,body:text}).select().single();if(error)throw error;return data},
 async markConversationRead(id){const user=await PNAuth.currentUser();if(!user)return;const {error}=await pnSupabase.from('conversation_reads').upsert({conversation_id:id,user_id:user.id,last_read_at:new Date().toISOString()},{onConflict:'conversation_id,user_id'});if(error)throw error},
 async listLegacyFavorites(){const user=await PNAuth.currentUser();if(!user)return[];const {data,error}=await pnSupabase.from('legacy_favorites').select('legacy_master_id').eq('client_id',user.id);if(error)throw error;return(data||[]).map(x=>Number(x.legacy_master_id))},
 async setLegacyFavorite(id,on){const user=await PNAuth.currentUser();if(!user)throw new Error('Войдите в аккаунт');id=Number(id);if(on){const {error}=await pnSupabase.from('legacy_favorites').upsert({client_id:user.id,legacy_master_id:id},{onConflict:'client_id,legacy_master_id'});if(error)throw error}else{const {error}=await pnSupabase.from('legacy_favorites').delete().eq('client_id',user.id).eq('legacy_master_id',id);if(error)throw error}return true}
});
window.PNBackendSync={
 async hydratePublicMasterCache(legacyId=0){
  const b=await PNData.loadPublicMasterBundle(legacyId);if(!b)return null;const p=b.profile;let c={};try{c=JSON.parse(localStorage.getItem(`pn_master_profile_${legacyId}`)||'{}')}catch(e){}
  c={...c,user_id:p.user_id,name:p.profile_name||c.name,profileName:p.profile_name||c.profileName,city:p.city||c.city,area:p.area||'',address:p.address||'',lat:p.latitude,lng:p.longitude,about:p.bio||c.about,experience:p.experience_text||c.experience,strengths:p.strengths_tags||c.strengths||[],avatar:p.avatar_url||c.avatar,cover:p.cover_url||c.cover,rating:Number(p.rating??0),reviewsCount:Number(p.reviews_count??0),ratingConfidence:Number(p.rating_confidence??0),topScore:Number(p.top_score??0),createdAt:p.created_at,is_published:!!p.is_published};
  c.works=(b.works||[]).map(x=>x.image_url).filter(Boolean);localStorage.setItem(`pn_master_profile_${legacyId}`,JSON.stringify(c));
  localStorage.setItem(`pn_master_services_${legacyId}`,JSON.stringify((b.services||[]).map(x=>({id:x.id,name:x.name,desc:x.description||'',price:Number(x.price)||0,newPrice:x.new_price===null?null:Number(x.new_price),promo:x.promo_label||'',time:x.duration_text||'',image:x.image_url||null}))));
  if(legacyId===0)localStorage.setItem('pn_master_services_0',localStorage.getItem(`pn_master_services_${legacyId}`)||'[]');
  localStorage.setItem(`pn_public_reviews_${legacyId}`,JSON.stringify((b.reviews||[]).map(x=>({id:x.id,bookingId:x.booking_id,rating:Number(x.rating)||0,text:x.text||'',photos:x.photos||[],date:new Date(x.created_at).toLocaleDateString('ru-RU',{day:'numeric',month:'long'}),verified:true}))));
  {const slotMap={};(b.slots||[]).forEach(x=>{const d=new Date(x.starts_at),k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,t=`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;(slotMap[k]||(slotMap[k]=[])).push(t)});localStorage.setItem(`pn_public_slots_${legacyId}`,JSON.stringify(slotMap));}
  return b;
 },
 async hydrateMasterCache(){
  const b=await PNData.loadMasterBundle();
  if(b.profile){let c={};try{c=JSON.parse(localStorage.getItem('pn_master_profile_0')||'{}')}catch(e){}const p=b.profile;
   c={...c,user_id:p.user_id,name:p.profile_name||c.name,profileName:p.profile_name||c.profileName,city:p.city||c.city,area:p.area||'',address:p.address||'',lat:p.latitude,lng:p.longitude,
    about:p.bio||c.about,experience:p.experience_text||c.experience,strengths:p.strengths_tags||c.strengths||[],avatar:p.avatar_url||c.avatar,cover:p.cover_url||c.cover,
    payment:p.payment||c.payment,locationInfo:p.location_info||c.locationInfo,scheduleType:p.schedule_config?.days||c.scheduleType,workDays:p.schedule_config?.workDays||c.workDays,
    openTime:p.schedule_config?.start||c.openTime,closeTime:p.schedule_config?.end||c.closeTime,rating:Number(p.rating??0),reviewsCount:Number(p.reviews_count??0),ratingConfidence:Number(p.rating_confidence??0),topScore:Number(p.top_score??0),createdAt:p.created_at,is_published:!!p.is_published};localStorage.setItem('pn_master_profile_0',JSON.stringify(c))}
  localStorage.setItem('pn_master_services_0',JSON.stringify((b.services||[]).map(x=>({id:x.id,name:x.name,desc:x.description||'',price:Number(x.price)||0,newPrice:x.new_price===null?null:Number(x.new_price),promo:x.promo_label||'',time:x.duration_text||'',image:x.image_url||null}))));
  {let c={};try{c=JSON.parse(localStorage.getItem('pn_master_profile_0')||'{}')}catch(e){}c.works=(b.works||[]).map(x=>x.image_url).filter(Boolean);localStorage.setItem('pn_master_profile_0',JSON.stringify(c))}
  {const o={};(b.slots||[]).forEach(x=>{const d=new Date(x.starts_at),k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,t=`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;(o[k]||(o[k]=[])).push(t)});localStorage.setItem('pn_master_slots',JSON.stringify(o))}
  if(b.bookings)localStorage.setItem('pn_bookings',JSON.stringify(b.bookings.map(x=>({id:x.id,master:0,masterId:0,clientId:x.client_id,clientName:x.client_name||'Клиент',service:x.service_name||'Услуга',date:x.starts_at,time:new Date(x.starts_at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}),status:x.status==='approved'?'confirmed':x.status==='declined'?'cancelled':x.status,syncedToSupabase:true}))));
  localStorage.setItem('pn_master_backend_reviews',JSON.stringify((b.reviews||[]).map(x=>({id:x.id,bookingId:x.booking_id,name:x.client_name||'Клиент',rating:Number(x.rating)||0,service:x.service_name||'Услуга',text:x.text||'',date:new Date(x.created_at).toLocaleDateString('ru-RU',{day:'numeric',month:'long'}),verified:true,photos:x.photos||[]}))));
  return b;
 },
 async hydrateClientFavorites(){try{const ids=await PNData.listLegacyFavorites();localStorage.setItem('pn_favs',JSON.stringify(ids));return ids}catch(e){return[]}}
};

window.PNRealtime={
 channels:[],
 stop(){this.channels.forEach(c=>pnSupabase?.removeChannel?.(c));this.channels=[]},
 watchClient(onChange){
  if(!pnSupabase)return;
  this.stop();
  PNAuth.currentUser().then(user=>{
   if(!user)return;
   const b=pnSupabase.channel('pn-client-bookings').on('postgres_changes',{event:'*',schema:'public',table:'bookings',filter:`client_id=eq.${user.id}`},()=>onChange?.('bookings')).subscribe();
   const c=pnSupabase.channel('pn-client-conversations').on('postgres_changes',{event:'*',schema:'public',table:'conversations',filter:`client_id=eq.${user.id}`},()=>onChange?.('conversations')).subscribe();
   const m=pnSupabase.channel('pn-client-messages').on('postgres_changes',{event:'*',schema:'public',table:'messages'},()=>onChange?.('messages')).subscribe();
   this.channels.push(b,c,m);
  }).catch(()=>{});
 },
 watchMaster(onChange){
  if(!pnSupabase)return;
  this.stop();
  PNAuth.currentUser().then(user=>{
   if(!user)return;
   const b=pnSupabase.channel('pn-master-bookings').on('postgres_changes',{event:'*',schema:'public',table:'bookings',filter:`master_id=eq.${user.id}`},()=>onChange?.('bookings')).subscribe();
   const c=pnSupabase.channel('pn-master-conversations').on('postgres_changes',{event:'*',schema:'public',table:'conversations',filter:`master_id=eq.${user.id}`},()=>onChange?.('conversations')).subscribe();
   const m=pnSupabase.channel('pn-master-messages').on('postgres_changes',{event:'*',schema:'public',table:'messages'},()=>onChange?.('messages')).subscribe();
   this.channels.push(b,c,m);
  }).catch(()=>{});
 }
};

