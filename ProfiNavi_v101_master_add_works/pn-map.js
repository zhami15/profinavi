
(function(){
  window.PNMap = {
    ensureLeaflet: function(){
      return new Promise((resolve,reject)=>{
        if(!document.querySelector('link[data-pn-leaflet]')){
          const l=document.createElement('link');l.rel='stylesheet';l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';l.dataset.pnLeaflet='1';document.head.appendChild(l);
        }
        if(window.L) return resolve();
        const existing=document.querySelector('script[data-pn-leaflet]');
        if(existing){existing.addEventListener('load',()=>resolve());return;}
        const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.dataset.pnLeaflet='1';
        s.onload=()=>resolve();s.onerror=reject;document.head.appendChild(s);
      });
    },
    getCustomMaster: function(){
      try{return JSON.parse(localStorage.getItem('pn_master_profile_0')||'null')}catch(e){return null}
    },
    coords: function(master){
      const cp=this.getCustomMaster();
      if(master && (String(master.id)==='0' || master.user_id===cp?.user_id) && cp){
        const lat=Number(cp.lat??cp.latitude), lng=Number(cp.lng??cp.longitude);
        if(Number.isFinite(lat)&&Number.isFinite(lng)) return [lat,lng];
      }
      const lat=Number(master?.lat??master?.latitude), lng=Number(master?.lng??master?.longitude);
      return Number.isFinite(lat)&&Number.isFinite(lng)?[lat,lng]:null;
    },
    render: async function(el, master, zoom=15){
      if(!el)return;
      const c=this.coords(master);
      if(!c){el.innerHTML='<div style="padding:22px;text-align:center;color:#777">Адрес мастера пока не определён на карте</div>';return;}
      await this.ensureLeaflet();
      if(el._pnMap){el._pnMap.remove();el._pnMap=null;}
      const map=L.map(el,{zoomControl:false,attributionControl:false}).setView(c,zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
      L.marker(c).addTo(map);
      el._pnMap=map;
      setTimeout(()=>map.invalidateSize(),80);
    }
  };

PNMap.pick = async function(el, initial, onChange){
  if(!el)return null;
  await this.ensureLeaflet();
  const bishkek=[42.8746,74.5698];
  const c=(initial&&Number.isFinite(Number(initial[0]))&&Number.isFinite(Number(initial[1])))
    ?[Number(initial[0]),Number(initial[1])]:bishkek;
  if(el._pnMap){el._pnMap.remove();el._pnMap=null;}
  const map=L.map(el,{zoomControl:true,attributionControl:false}).setView(c, initial?17:13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
  const marker=L.marker(c,{draggable:true}).addTo(map);
  const emit=()=>{const x=marker.getLatLng();onChange&&onChange({lat:x.lat,lng:x.lng});};
  marker.on('dragend',emit);
  map.on('click',e=>{marker.setLatLng(e.latlng);emit();});
  el._pnMap=map; el._pnMarker=marker;
  setTimeout(()=>map.invalidateSize(),100);
  emit();
  return {map,marker};
};

})();
