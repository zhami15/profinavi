// Source mirror of deployed Edge Function: profinavi-admin-clients
// Deployment is performed through Supabase; kept here so the ZIP matches the live backend.
import { createClient } from 'jsr:@supabase/supabase-js@2.115.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const jsonHeaders = { ...cors, 'Content-Type': 'application/json' };

function reply(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: jsonHeaders }); }
function fail(message: string, status = 400) { return reply({ error: message }, status); }
function normalizePhone(value: unknown) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 9) digits = '996' + digits;
  return digits;
}
function isFuture(value: unknown) { const t = Date.parse(String(value ?? '')); return Number.isFinite(t) && t > Date.now(); }

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return fail('Method not allowed', 405);
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authorization = req.headers.get('Authorization') ?? '';
    if (!url || !anonKey || !serviceKey || !authorization) return fail('Unauthorized', 401);
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { autoRefreshToken: false, persistSession: false } });
    const { data: callerData, error: callerError } = await userClient.auth.getUser();
    if (callerError || !callerData.user) return fail('Unauthorized', 401);
    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const callerPhone = normalizePhone(callerData.user.phone || callerData.user.user_metadata?.phone);
    if (!callerPhone) return fail('Admin phone is missing', 403);
    const { data: allowRows, error: allowError } = await admin.from('profinavi_admin_allowlist').select('phone_normalized,is_active').eq('is_active', true);
    if (allowError) throw allowError;
    const adminPhones = new Set((allowRows ?? []).map((x: any) => normalizePhone(x.phone_normalized)));
    if (!adminPhones.has(callerPhone)) return fail('Forbidden', 403);
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || 'list');
    if (action === 'list') {
      const [{ data: profiles, error: profilesError }, { data: masters, error: mastersError }, authResult] = await Promise.all([
        admin.from('profiles').select('id,name,phone,city,role,avatar_url,created_at').eq('role', 'client').order('created_at', { ascending: false }),
        admin.from('master_profiles').select('user_id'),
        admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      ]);
      if (profilesError) throw profilesError;if (mastersError) throw mastersError;if (authResult.error) throw authResult.error;
      const masterIds = new Set((masters ?? []).map((x: any) => x.user_id));
      const authById = new Map((authResult.data?.users ?? []).map((u: any) => [u.id, u]));
      const rows = (profiles ?? []).filter((p: any) => p.id !== callerData.user.id && !masterIds.has(p.id) && !adminPhones.has(normalizePhone(p.phone))).map((p: any) => {
        const authUser: any = authById.get(p.id);const blocked = Boolean(authUser && (isFuture(authUser.banned_until) || authUser.app_metadata?.profinavi_client_blocked === true));
        return { id:p.id,name:p.name,phone:p.phone,city:p.city,avatar_url:p.avatar_url,created_at:p.created_at,blocked,blocked_reason:authUser?.app_metadata?.profinavi_client_blocked_reason||null,blocked_at:authUser?.app_metadata?.profinavi_client_blocked_at||null,banned_until:authUser?.banned_until||null };
      });
      return reply({ ok:true,clients:rows });
    }
    if (action === 'set_block') {
      const userId=String(body?.user_id||''),blocked=Boolean(body?.blocked),reason=String(body?.reason||'').trim().slice(0,500);
      if(!userId)return fail('user_id is required');if(userId===callerData.user.id)return fail('Нельзя заблокировать текущего администратора',400);
      const {data:profile,error:profileError}=await admin.from('profiles').select('id,role,phone').eq('id',userId).maybeSingle();if(profileError)throw profileError;if(!profile||profile.role!=='client')return fail('Клиент не найден',404);
      const {data:masterRow,error:masterError}=await admin.from('master_profiles').select('user_id').eq('user_id',userId).maybeSingle();if(masterError)throw masterError;if(masterRow)return fail('Нельзя блокировать мастера через экран клиентов',400);if(adminPhones.has(normalizePhone(profile.phone)))return fail('Нельзя блокировать администратора',400);
      const {data:current,error:currentError}=await admin.auth.admin.getUserById(userId);if(currentError||!current.user)throw currentError||new Error('Auth user not found');
      const now=new Date().toISOString(),nextMeta={...(current.user.app_metadata??{}),profinavi_client_blocked:blocked,profinavi_client_blocked_reason:blocked?(reason||null):null,profinavi_client_blocked_at:blocked?now:null};
      const {data:updated,error:updateError}=await admin.auth.admin.updateUserById(userId,{ban_duration:blocked?'876000h':'none',app_metadata:nextMeta});if(updateError)throw updateError;
      return reply({ok:true,client:{id:userId,blocked,blocked_reason:blocked?(reason||null):null,blocked_at:blocked?now:null,banned_until:updated.user?.banned_until||null}});
    }
    return fail('Unknown action',400);
  } catch(e){console.error(e);return fail(e instanceof Error?e.message:'Admin clients operation failed',500)}
});
