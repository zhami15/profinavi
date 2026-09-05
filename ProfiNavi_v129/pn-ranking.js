(function(){
  'use strict';
  const categoryMap={'Ногти':'nails','Волосы':'hair','Ресницы':'lashes','Брови':'brows','Макияж':'makeup',nails:'nails',hair:'hair',lashes:'lashes',brows:'brows',makeup:'makeup'};
  const emojiMap={nails:'💅',hair:'✂️',lashes:'👁️',brows:'🤎',makeup:'💄'};

  function ageDays(createdAt){
    const t=new Date(createdAt||0).getTime();
    return Number.isFinite(t)&&t>0?Math.max(0,(Date.now()-t)/86400000):Infinity;
  }
  function explorationRate(master){
    const d=ageDays(master?.createdAt);
    if(d<7)return .20;
    if(d<14)return .15;
    if(d<30)return .10;
    return 0;
  }
  function isNew(master){return explorationRate(master)>0}
  function ratingLabel(master){
    const n=Number(master?.reviewsCount||0),r=Number(master?.rating||0);
    if(n>0&&r>0)return `★ ${r.toFixed(1)} (${n})`;
    if(isNew(master))return 'Новый мастер';
    return 'Нет отзывов';
  }
  function ratingHtml(master){
    const n=Number(master?.reviewsCount||0),r=Number(master?.rating||0);
    if(n>0&&r>0)return `<span class="pn-real-rating">★ ${r.toFixed(1)} <small>(${n})</small></span>`;
    if(isNew(master))return '<span class="pn-new-master-badge">Новый мастер</span>';
    return '<span class="pn-no-rating">Нет отзывов</span>';
  }
  function hash01(str){
    let h=2166136261;
    for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}
    return ((h>>>0)%100000)/100000;
  }
  function sessionSeed(){
    let s=sessionStorage.getItem('pn_rank_seed');
    if(!s){s=String(Math.random()).slice(2);sessionStorage.setItem('pn_rank_seed',s)}
    return s;
  }
  function rank(list,{allowExploration=true}={}){
    const arr=(list||[]).filter(Boolean).slice().sort((a,b)=>{
      const ar=Number(a.topScore||0),br=Number(b.topScore||0);
      if(br!==ar)return br-ar;
      const ac=Number(a.reviewsCount||0),bc=Number(b.reviewsCount||0);
      if(bc!==ac)return bc-ac;
      return Number(a.id||0)-Number(b.id||0);
    });
    if(!allowExploration)return arr;
    const fresh=arr.filter(x=>x._backend&&isNew(x));
    if(!fresh.length)return arr;
    const day=new Date().toISOString().slice(0,10),seed=sessionSeed();
    const maxRate=Math.max(...fresh.map(explorationRate));
    if(hash01(`${seed}:${day}:explore`)>=maxRate)return arr;
    const chosen=fresh.slice().sort((a,b)=>hash01(`${seed}:${day}:${b.user_id}`)-hash01(`${seed}:${day}:${a.user_id}`))[0];
    const from=arr.indexOf(chosen); if(from>=0)arr.splice(from,1);
    const pos=Math.min(arr.length,2+Math.floor(hash01(`${seed}:${day}:slot`)*6));
    arr.splice(pos,0,chosen);
    chosen._explorationShown=true;
    return arr;
  }
  function normalizeService(s){
    const old=Number(s.price)||0,newPrice=s.new_price==null?null:Number(s.new_price);
    const final=Number.isFinite(newPrice)&&newPrice>=0&&newPrice<old?newPrice:old;
    return {id:s.id,name:s.name||'Услуга',desc:s.description||'',price:`${final} сом`,oldPrice:old,newPrice:Number.isFinite(newPrice)?newPrice:null,time:s.duration_text||'',durationMinutes:Number(s.duration_minutes)||window.PNDurationMinutes?.(s.duration_text,60)||60,image:s.image_url||null,promo:s.promo_label||''};
  }
  function fromBundle(profile,services=[],works=[],slots=[]){
    const id=Number(profile.legacy_id);
    if(!Number.isInteger(id)||id<0)return null;
    const cats=(profile.categories||[]).map(x=>categoryMap[x]||x).filter(Boolean);
    const cat=cats[0]||'nails',sv=services.map(normalizeService),gallery=works.map(x=>x.image_url).filter(Boolean);
    const avatar=profile.avatar_url||gallery[0]||'assets/service-placeholder.svg';
    const price=sv[0]?.price||'0 сом';
    const priceValue=Number.parseInt(String(price).replace(/\D/g,''),10)||0;
    const now=new Date(),todayKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const tomorrow=new Date(now);tomorrow.setDate(now.getDate()+1);const tomorrowKey=`${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;
    const slotKeys=slots.map(x=>{const d=new Date(x.starts_at);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`});
    const available=[];if(slotKeys.includes(todayKey))available.push('today');if(slotKeys.includes(tomorrowKey))available.push('tomorrow');if(slots.length)available.push('week');
    const scheduleStep=Math.max(5,Number(profile.schedule_config?.step)||60);
    const slotMap={},slotIntervals={};slots.forEach(x=>{const d=new Date(x.starts_at),k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,t=`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;(slotMap[k]||(slotMap[k]=[])).push(t);const start=d.getTime(),end=start+scheduleStep*60000;(slotIntervals[k]||(slotIntervals[k]=[])).push({start,end,time:t})});
    Object.values(slotMap).forEach(a=>a.sort());Object.values(slotIntervals).forEach(a=>a.sort((x,y)=>x.start-y.start));
    return {
      id,_backend:true,user_id:profile.user_id,legacyId:id,
      name:profile.profile_name||'Мастер ProfiNavi',cat,categories:cats,
      district:[profile.area,profile.address].filter(Boolean).join(' · ')||profile.city||'Бишкек',area:profile.area||'',address:profile.address||'',walk:'на месте',
      price,priceValue,available,slotMap,slotIntervals,scheduleStep,rating:Number(profile.rating)||0,reviewsCount:Number(profile.reviews_count)||0,ratingConfidence:Number(profile.rating_confidence)||0,topScore:Number(profile.top_score)||0,
      createdAt:profile.created_at,isNew:ageDays(profile.created_at)<30,experience:profile.experience_text||'',saves:0,emoji:emojiMap[cat]||'✦',avatar,
      desc:profile.bio||'',about:profile.bio||'',lat:Number(profile.latitude)||42.8746,lng:Number(profile.longitude)||74.5698,bookingDays:60,services:sv.length?sv:[{name:'Услуга',desc:'',price:'0 сом',time:''}],gallery:gallery.length?gallery:[avatar],works:gallery,cover:profile.cover_url||gallery[0]||avatar,strengths:profile.strengths_tags||[],payment:profile.payment||'',locationInfo:profile.location_info||'',scheduleType:profile.schedule_config?.days||'Ежедневно',workDays:profile.schedule_config?.workDays||[],openTime:profile.schedule_config?.start||'10:00',closeTime:profile.schedule_config?.end||'19:00',
      is_published:!!profile.is_published,rankingBreakdown:profile.ranking_breakdown||{}
    };
  }
  function hydrateCached(target){
    let count=0;
    try{
      Object.keys(localStorage).filter(k=>k.startsWith('pn_dynamic_master_')).forEach(k=>{
        try{
          const m=JSON.parse(localStorage.getItem(k)||'null');
          if(m&&m._backend&&Number.isFinite(Number(m.id))){target[Number(m.id)]=m;count++}
        }catch(e){}
      });
    }catch(e){}
    return count;
  }
  async function hydrate(target){
    const cachedCount=hydrateCached(target);
    if(!window.PNData?.listPublicDirectory)return target;
    try{
      const rows=await window.PNData.listPublicDirectory();
      const liveIds=new Set();
      for(const x of rows){
        const m=fromBundle(x.profile,x.services,x.works,x.slots);
        if(m){liveIds.add(Number(m.id));target[m.id]=m;try{localStorage.setItem(`pn_dynamic_master_${m.id}`,JSON.stringify(m))}catch(e){}}
      }
      // Network response is authoritative: remove stale unpublished/blocked dynamic profiles.
      Object.keys(target).forEach(k=>{const m=target[k];if(m?._backend&&!liveIds.has(Number(m.id)))delete target[k]});
      try{Object.keys(localStorage).filter(k=>k.startsWith('pn_dynamic_master_')).forEach(k=>{const id=Number(k.replace('pn_dynamic_master_',''));if(Number.isFinite(id)&&!liveIds.has(id))localStorage.removeItem(k)})}catch(e){}
      return target;
    }catch(error){
      if(cachedCount){console.warn('Public directory network refresh failed; using cached masters',error);return target}
      throw error;
    }
  }
  window.PNRanking={ageDays,explorationRate,isNew,ratingLabel,ratingHtml,rank,fromBundle,hydrate};
})();
