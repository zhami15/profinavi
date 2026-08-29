const PN_SUPABASE_URL='https://ydezwnuoeqlzmeuufrmo.supabase.co';
const PN_SUPABASE_PUBLISHABLE_KEY='sb_publishable_IJ4Ue3an-u8PUp0ZuIzV5g_TMVE6L9X';
window.pnSupabase=window.supabase.createClient(PN_SUPABASE_URL,PN_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
window.PNAuth={
 async currentUser(){const {data}=await pnSupabase.auth.getUser();return data?.user||null},
 async sendOtp(method,contact){
  if(method==='email')return pnSupabase.auth.signInWithOtp({email:contact,options:{shouldCreateUser:true}});
  return pnSupabase.auth.signInWithOtp({phone:contact.replace(/[^\d+]/g,''),options:{shouldCreateUser:true}});
 },
 async verifyOtp(method,contact,token){
  if(method==='email')return pnSupabase.auth.verifyOtp({email:contact,token,type:'email'});
  return pnSupabase.auth.verifyOtp({phone:contact.replace(/[^\d+]/g,''),token,type:'sms'});
 },
 async social(provider){return pnSupabase.auth.signInWithOAuth({provider,options:{redirectTo:location.href}})},
 async saveName(name){
  const user=await this.currentUser(); if(!user)throw new Error('Нет активной сессии');
  const {error:a}=await pnSupabase.auth.updateUser({data:{name}}); if(a)throw a;
  const {error}=await pnSupabase.from('profiles').upsert({id:user.id,name,role:'client',updated_at:new Date().toISOString()},{onConflict:'id'}); if(error)throw error;
  const cached={id:user.id,name,method:user.app_metadata?.provider||(user.email?'email':'phone'),contact:user.email||user.phone||null,registeredAt:user.created_at};
  localStorage.setItem('pn_client_user',JSON.stringify(cached)); return cached;
 },
 async syncLocalUser(){
  const user=await this.currentUser(); if(!user)return null;
  const {data}=await pnSupabase.from('profiles').select('id,name,phone,role').eq('id',user.id).maybeSingle();
  const name=data?.name||user.user_metadata?.name||user.user_metadata?.full_name||'';
  if(name){const cached={id:user.id,name,method:user.app_metadata?.provider||(user.email?'email':'phone'),contact:user.email||user.phone||null,registeredAt:user.created_at};localStorage.setItem('pn_client_user',JSON.stringify(cached));return cached}
  return {id:user.id,name:''};
 }
};