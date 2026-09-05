(function(){
  'use strict';
  const CLEANUP_KEY='pn_clean_catalog_v129';
  try{
    if(localStorage.getItem(CLEANUP_KEY)!=='1'){
      const exact=['pn_favs','pn_fav_works','pn_chats','pn_bookings','pn_booking','pn_client_chat_unread','pn_master_chat_unread','pn_master_feed_works','pn_master_profile_0','pn_master_services_0','pn_master_slots','pn_master_schedule_config','pn_master_session','pn_client_user','pn_public_reviews_0','pn_master_backend_reviews'];
      exact.forEach(k=>localStorage.removeItem(k));
      Object.keys(localStorage).forEach(k=>{
        if(k.startsWith('pn_dynamic_master_')||k.startsWith('pn_chat_')||k.startsWith('pn_master_profile_')||k.startsWith('pn_public_reviews_')) localStorage.removeItem(k);
        if(k.startsWith('sb-ydezwnuoeqlzmeuufrmo-auth-token')) localStorage.removeItem(k);
      });
      localStorage.setItem(CLEANUP_KEY,'1');
    }
  }catch(e){}
  window.PN_MASTER_WORK_SETS=[];
  window.PN_MASTERS=[];
  window.PNCloneMasters=()=>[];
})();
