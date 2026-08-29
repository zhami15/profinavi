const PN_SUPABASE_URL='https://ydezwnuoeqlzmeuufrmo.supabase.co';
const PN_SUPABASE_PUBLISHABLE_KEY='sb_publishable_IJ4Ue3an-u8PUp0ZuIzV5g_TMVE6L9X';
const PN_TEST_MODE=true;
const PN_TEST_OTP='111111';
window.PN_TEST_MODE=PN_TEST_MODE;
window.PN_TEST_OTP=PN_TEST_OTP;
window.pnSupabase=window.supabase?.createClient ? window.supabase.createClient(PN_SUPABASE_URL,PN_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}) : null;

function pnTestPhone(contact){return String(contact||'').replace(/[^\d+]/g,'')}
function pnTestClient(){try{return JSON.parse(localStorage.getItem('pn_client_user')||'null')}catch{return null}}

window.PNAuth={
 async currentUser(){
  if(PN_TEST_MODE){const u=pnTestClient();return u?{id:u.id||'test_client',phone:u.phone||null,email:null,created_at:u.registeredAt||new Date().toISOString(),user_metadata:{name:u.name||''}}:null}
  const {data}=await pnSupabase.auth.getUser();return data?.user||null
 },
 async sendOtp(method,contact){
  if(PN_TEST_MODE){sessionStorage.setItem('pn_test_pending_phone',pnTestPhone(contact));return {data:{test:true},error:null}}
  if(method==='email')return pnSupabase.auth.signInWithOtp({email:contact,options:{shouldCreateUser:true}});
  return pnSupabase.auth.signInWithOtp({phone:pnTestPhone(contact),options:{shouldCreateUser:true}});
 },
 async verifyOtp(method,contact,token){
  if(PN_TEST_MODE){return String(token)===PN_TEST_OTP?{data:{test:true},error:null}:{data:null,error:new Error('Тестовый код: '+PN_TEST_OTP)}}
  if(method==='email')return pnSupabase.auth.verifyOtp({email:contact,token,type:'email'});
  return pnSupabase.auth.verifyOtp({phone:pnTestPhone(contact),token,type:'sms'});
 },
 async saveName(name){
  if(PN_TEST_MODE){
   const phone=sessionStorage.getItem('pn_test_pending_phone')||pnTestClient()?.phone||'';
   const cached={id:'test_client_'+Date.now(),name:name.trim(),role:'client',phone,method:'phone',contact:phone,registeredAt:new Date().toISOString(),test:true};
   localStorage.setItem('pn_client_user',JSON.stringify(cached));return cached;
  }
  const user=await this.currentUser(); if(!user)throw new Error('Нет активной сессии');
  const phone=user.phone||null;
  const {error:a}=await pnSupabase.auth.updateUser({data:{name}}); if(a)throw a;
  const {error}=await pnSupabase.from('profiles').upsert({id:user.id,name,phone,role:'client',updated_at:new Date().toISOString()},{onConflict:'id'}); if(error)throw error;
  return this.syncLocalUser();
 },
 async syncLocalUser(){
  if(PN_TEST_MODE)return pnTestClient();
  const user=await this.currentUser();
  if(!user){localStorage.removeItem('pn_client_user');return null}
  const {data,error}=await pnSupabase.from('profiles').select('id,name,phone,role').eq('id',user.id).maybeSingle();
  if(error)throw error;
  const name=data?.name||user.user_metadata?.name||user.user_metadata?.full_name||'';
  const cached={id:user.id,name,role:data?.role||'client',phone:data?.phone||user.phone||null,email:user.email||null,method:user.email?'email':'phone',contact:user.email||user.phone||null,registeredAt:user.created_at};
  if(name)localStorage.setItem('pn_client_user',JSON.stringify(cached));return cached;
 },
 async hasMasterProfile(){
  if(PN_TEST_MODE)return !!localStorage.getItem('pn_test_master_credentials');
  const user=await this.currentUser();if(!user)return false;
  const {data,error}=await pnSupabase.from('master_profiles').select('user_id').eq('user_id',user.id).maybeSingle();
  if(error)throw error;return !!data;
 },
 async signOut(){
  if(PN_TEST_MODE){localStorage.removeItem('pn_client_user');return}
  await pnSupabase.auth.signOut();localStorage.removeItem('pn_client_user')
 }
};
