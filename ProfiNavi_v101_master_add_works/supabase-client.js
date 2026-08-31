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

window.PNAuth={
 async currentUser(){
  if(!window.pnSupabase)return null;
  const {data}=await pnSupabase.auth.getUser();return data?.user||null
 },
 async sendOtp(method,contact){
  if(method!=='phone')return {data:null,error:new Error('В ProfiNavi используется регистрация только по номеру телефона')};
  sessionStorage.setItem('pn_test_pending_phone',pnPhone(contact));
  if(PN_TEST_MODE)return {data:{test:true},error:null};
  return pnSupabase.auth.signInWithOtp({phone:pnPhone(contact),options:{shouldCreateUser:true}});
 },
 async verifyOtp(method,contact,token){
  if(method!=='phone')return {data:null,error:new Error('Доступна только регистрация по телефону')};
  if(PN_TEST_MODE){
   try{
    const r=await fetch(`${PN_SUPABASE_URL}/functions/v1/profinavi-test-phone-auth`,{method:'POST',headers:{'Content-Type':'application/json','apikey':PN_SUPABASE_PUBLISHABLE_KEY},body:JSON.stringify({phone:pnPhone(contact),code:String(token)})});
    const body=await r.json();if(!r.ok)throw new Error(body.error||'Не удалось подтвердить номер');
    const out=await pnSupabase.auth.verifyOtp({token_hash:body.token_hash,type:'magiclink'});if(out.error)throw out.error;
    sessionStorage.setItem('pn_test_pending_phone',body.phone||pnPhone(contact));
    return out;
   }catch(error){return {data:null,error}}
  }
  return pnSupabase.auth.verifyOtp({phone:pnPhone(contact),token,type:'sms'});
 },
 async saveName(name){
  const user=await this.currentUser(); if(!user)throw new Error('Нет активной сессии');
  const phone=user.phone||user.user_metadata?.phone||sessionStorage.getItem('pn_test_pending_phone')||null;
  const {error:a}=await pnSupabase.auth.updateUser({data:{name,phone}}); if(a)throw a;
  const {error}=await pnSupabase.from('profiles').upsert({id:user.id,name:name.trim(),phone,role:'client',updated_at:new Date().toISOString()},{onConflict:'id'}); if(error)throw error;
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
  return PN_TEST_MODE&&!!localStorage.getItem('pn_test_master_credentials');
 },
 async signOut(){await pnSupabase?.auth.signOut();localStorage.removeItem('pn_client_user')}
};

window.PNData={
 async createBooking(input){
  const user=await PNAuth.currentUser();if(!user)throw new Error('Сначала подтвердите номер телефона');
  const startsAt=new Date(input.startsAt);
  const payload={client_id:user.id,master_id:null,service_id:null,legacy_master_id:Number(input.master)||0,master_name:input.masterName||null,service_name:input.service||'Услуга',starts_at:startsAt.toISOString(),ends_at:null,price:Number(input.price)||0,status:'pending'};
  const {data,error}=await pnSupabase.from('bookings').insert(payload).select('id,created_at').single();if(error)throw error;return data;
 },
 async updateBookingStatus(id,status){
  const {error}=await pnSupabase.from('bookings').update({status,updated_at:new Date().toISOString()}).eq('id',id);if(error)throw error;return true;
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
  const photos=await this.uploadReviewPhotos(bookingId,files||[]);
  const payload={booking_id:bookingId,client_id:user.id,master_id:null,legacy_master_id:Number(legacyMasterId)||0,rating:Number(rating),text:(text||'').trim()||null,photos};
  const {data,error}=await pnSupabase.from('reviews').insert(payload).select('id,rating,text,photos,created_at').single();if(error)throw error;return data;
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
 }
};


async function pnPhonePasswordLogin(phone,password){
  const {data,error}=await pnSupabase.functions.invoke('profinavi-phone-password-login',{body:{phone,password}});
  if(error){
    let msg='Не удалось войти';
    try{ if(error.context){const j=await error.context.json();msg=j?.error||msg;} }catch(e){}
    throw new Error(msg);
  }
  if(data?.error) throw new Error(data.error);
  if(!data?.access_token||!data?.refresh_token) throw new Error('Сервер не вернул сессию');
  const {data:sessionData,error:sessionError}=await pnSupabase.auth.setSession({access_token:data.access_token,refresh_token:data.refresh_token});
  if(sessionError) throw sessionError;
  return sessionData;
}


async function pnGeocodeAddress(address,city){
  const {data,error}=await pnSupabase.functions.invoke('profinavi-geocode-address',{body:{address,city}});
  if(error) throw error;
  if(data?.error) throw new Error(data.error);
  return data||{found:false};
}
