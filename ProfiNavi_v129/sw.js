const CACHE='profinavi-v138';
const CORE=['./','./index.html','./client.html','./chats.html','./support-chat.html','./master-chats.html','./style.css','./icon.svg','./icon-192.png','./icon-512.png','./manifest.webmanifest','./supabase-client.js','./pn-data.js','./pn-ranking.js','./pn-pwa.js','./pn-i18n.js','./admin-login.html','./admin.html','./admin-master.html','./admin-support.html','./admin-support-chat.html','./pn-admin.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res}).catch(()=>caches.match(req).then(r=>r||caches.match('./client.html')||caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res})));
});
