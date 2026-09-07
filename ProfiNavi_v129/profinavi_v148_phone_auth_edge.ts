import { createClient } from 'jsr:@supabase/supabase-js@2.115.0';

const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'
};
const jsonHeaders={...cors,'Content-Type':'application/json'};
const DEMO_CODE='111111', OTP_TTL_MINUTES=10, RESEND_SECONDS=60, MAX_ATTEMPTS=5;

type AdminClient=ReturnType<typeof createClient>;

function normalizePhone(value:unknown){
  let d=String(value??'').replace(/\D/g,'');
  if(d.startsWith('0'))d=d.slice(1);
  if(d.length===9)d='996'+d;
  if(!d.startsWith('996')||d.length!==12)throw new Error('Введите номер Кыргызстана в формате +996 XXX XXX XXX');
  return '+'+d;
}
function phoneDigits(value:unknown){return String(value??'').replace(/\D/g,'')}
function demoEmail(phone:string){return `demo-${phone.replace(/\D/g,'')}@auth.profinavi.local`}
function fail(message:string,status=400){return new Response(JSON.stringify({error:message}),{status,headers:jsonHeaders})}

async function findUser(admin:AdminClient,phone:string){
  const target=phoneDigits(phone),email=demoEmail(phone).toLowerCase();
  for(let page=1;page<=50;page++){
    const {data,error}=await admin.auth.admin.listUsers({page,perPage:100});
    if(error)throw error;
    const u=data.users.find(x=>
      phoneDigits(x.phone)===target||
      phoneDigits(x.user_metadata?.phone)===target||
      String(x.email??'').toLowerCase()===email
    );
    if(u)return u;
    if(data.users.length<100)break;
  }
  return null;
}

async function callerUser(admin:AdminClient,req:Request){
  const header=String(req.headers.get('authorization')||'');
  const m=header.match(/^Bearer\s+(.+)$/i);
  if(!m)return null;
  const {data,error}=await admin.auth.getUser(m[1]);
  if(error)return null;
  return data.user||null;
}

async function hasMasterProfile(admin:AdminClient,userId:string){
  const {data,error}=await admin.from('master_profiles').select('user_id').eq('user_id',userId).maybeSingle();
  if(error)throw error;
  return !!data;
}

async function validateFlow(admin:AdminClient,purpose:string,phone:string,caller:any){
  const existing=await findUser(admin,phone);
  if(purpose==='client-register'){
    if(existing)throw Object.assign(new Error('Этот номер уже зарегистрирован. Войдите в существующий аккаунт.'),{status:409});
  }else if(purpose==='master-register'){
    if(caller&&await hasMasterProfile(admin,caller.id)){
      throw Object.assign(new Error('Для этого аккаунта уже создан кабинет мастера.'),{status:409});
    }
    if(existing&&(!caller||existing.id!==caller.id)){
      throw Object.assign(new Error('Этот номер уже используется другим аккаунтом. Войдите в существующий аккаунт или укажите другой номер.'),{status:409});
    }
  }else if(purpose==='client-login'){
    if(!existing)throw Object.assign(new Error('Аккаунт с таким номером не найден. Зарегистрируйтесь.'),{status:404});
  }else if(purpose==='master-login'){
    if(!existing)throw Object.assign(new Error('Аккаунт с таким номером не найден.'),{status:404});
    if(!await hasMasterProfile(admin,existing.id)){
      throw Object.assign(new Error('Для этого номера нет кабинета мастера. Войдите как клиент и выберите «Стать мастером».'),{status:404});
    }
  }
  return existing;
}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return fail('Method not allowed',405);
  try{
    const p=await req.json().catch(()=>({}));
    const action=String(p?.action??'verify');
    const phone=normalizePhone(p?.phone);
    const purpose=String(p?.purpose??'auth').slice(0,40)||'auth';
    const shouldCreateUser=p?.shouldCreateUser!==false;
    const url=Deno.env.get('SUPABASE_URL');
    const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey=Deno.env.get('SUPABASE_ANON_KEY');
    if(!url||!serviceKey||!anonKey)throw new Error('Supabase environment is incomplete');
    const admin=createClient(url,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}});
    const caller=await callerUser(admin,req);

    if(action==='check'||action==='send'){
      let existing;
      try{existing=await validateFlow(admin,purpose,phone,caller)}catch(error:any){return fail(error?.message||'Проверка номера не пройдена',Number(error?.status)||400)}
      if(action==='check'){
        return new Response(JSON.stringify({ok:true,exists:!!existing,is_self:!!(caller&&existing?.id===caller.id),has_master:existing?await hasMasterProfile(admin,existing.id):false}),{headers:jsonHeaders});
      }
      const cutoff=new Date(Date.now()-RESEND_SECONDS*1000).toISOString();
      const {data:recent,error:re}=await admin.from('profinavi_demo_otp_requests')
        .select('created_at').eq('phone',phone).eq('purpose',purpose).is('consumed_at',null)
        .gte('created_at',cutoff).order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(re)throw re;
      if(recent)return fail(`Повторный код можно запросить через ${RESEND_SECONDS} секунд.`,429);
      const expiresAt=new Date(Date.now()+OTP_TTL_MINUTES*60000).toISOString();
      const {error}=await admin.from('profinavi_demo_otp_requests').insert({phone,purpose,should_create_user:shouldCreateUser,attempts:0,expires_at:expiresAt});
      if(error)throw error;
      admin.from('profinavi_demo_otp_requests').delete().lt('created_at',new Date(Date.now()-86400000).toISOString()).then(()=>{});
      return new Response(JSON.stringify({ok:true,demo:true,expires_at:expiresAt}),{headers:jsonHeaders});
    }

    if(action!=='verify')return fail('Unknown action',400);
    const {data:r,error:re}=await admin.from('profinavi_demo_otp_requests')
      .select('id,attempts,expires_at,should_create_user').eq('phone',phone).eq('purpose',purpose)
      .is('consumed_at',null).gt('expires_at',new Date().toISOString())
      .order('created_at',{ascending:false}).limit(1).maybeSingle();
    if(re)throw re;
    if(!r)return fail('Сначала запросите новый код.',400);
    if(Number(r.attempts)>=MAX_ATTEMPTS)return fail('Слишком много неверных попыток. Запросите новый код.',429);
    const code=String(p?.code??'').trim();
    if(code!==DEMO_CODE){
      await admin.from('profinavi_demo_otp_requests').update({attempts:Number(r.attempts)+1}).eq('id',r.id);
      return fail('Неверный демо-код',401);
    }

    let existing;
    try{existing=await validateFlow(admin,purpose,phone,caller)}catch(error:any){return fail(error?.message||'Проверка номера не пройдена',Number(error?.status)||400)}
    const allowCreate=shouldCreateUser&&r.should_create_user!==false;
    const email=demoEmail(phone);
    let user:any=existing;
    let isNewUser=false;

    if(purpose==='master-register'&&caller){
      if(existing&&existing.id!==caller.id)return fail('Этот номер уже используется другим аккаунтом.',409);
      const meta=caller.user_metadata??{};
      const {data,error}=await admin.auth.admin.updateUserById(caller.id,{
        email,email_confirm:true,phone,phone_confirm:true,
        user_metadata:{...meta,phone,demo_otp:true,demo_internal_email:true}
      });
      if(error)throw error;
      user=data.user;
    }else if(!user){
      if(!allowCreate)return fail('Аккаунт с таким номером не найден.',404);
      const {data,error}=await admin.auth.admin.createUser({
        email,email_confirm:true,phone,phone_confirm:true,
        user_metadata:{phone,demo_otp:true,demo_internal_email:true}
      });
      if(error)throw error;
      user=data.user;
      isNewUser=true;
    }else{
      const meta=user.user_metadata??{};
      const {data,error}=await admin.auth.admin.updateUserById(user.id,{
        email,email_confirm:true,phone,phone_confirm:true,
        user_metadata:{...meta,phone,demo_otp:true,demo_internal_email:true}
      });
      if(error)throw error;
      user=data.user;
    }

    const {data:linkData,error:linkError}=await admin.auth.admin.generateLink({type:'magiclink',email});
    if(linkError)throw linkError;
    const tokenHash=linkData?.properties?.hashed_token;
    if(!tokenHash)throw new Error('Не удалось создать демо-сессию');
    const client=createClient(url,anonKey,{auth:{autoRefreshToken:false,persistSession:false}});
    const {data:signed,error:signError}=await client.auth.verifyOtp({token_hash:tokenHash,type:'email'});
    if(signError||!signed.session)throw signError??new Error('Не удалось создать демо-сессию');
    await admin.from('profinavi_demo_otp_requests').update({consumed_at:new Date().toISOString()}).eq('id',r.id);
    return new Response(JSON.stringify({
      ok:true,demo:true,phone,
      access_token:signed.session.access_token,
      refresh_token:signed.session.refresh_token,
      expires_in:signed.session.expires_in,
      user_id:signed.user?.id??user.id,
      is_new_user:isNewUser
    }),{headers:jsonHeaders});
  }catch(error:any){
    console.error(error);
    return fail(error instanceof Error?error.message:'Ошибка демо-авторизации',400);
  }
});
