const CACHE='profinavi-v138-stable';
const CORE=[
 './','./index.html','./client.html','./client-login.html','./profile.html','./booking.html','./booking-confirm.html','./chats.html','./chat.html','./favorites.html','./snap.html','./map.html','./support-chat.html',
 './master-login.html','./master.html','./master-profile.html','./master-bookings.html','./master-chats.html','./master-analytics.html',
 './admin-login.html','./admin.html','./admin-master.html','./admin-support.html','./admin-support-chat.html',
 './style.css','./script.js','./profile.js','./booking.js','./booking-confirm.js','./chats.js','./chat.js','./secondary-pages.js','./map.js','./master.js','./support-chat.js','./pn-admin.js',
 './supabase-client.js','./pn-data.js','./pn-ranking.js','./pn-map.js','./pn-pwa.js','./pn-i18n.js',
 './icon.svg','./icon-192.png','./icon-512.png','./manifest.webmanifest','./assets/service-placeholder.svg'
];
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
  // Stable release: network-first for local code so a redeploy cannot be stuck on an old runtime-cached JS file.
  if(/\.(?:js|css|html)$/.test(url.pathname)){
    event.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res}).catch(()=>caches.match(req)));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res})));
});
