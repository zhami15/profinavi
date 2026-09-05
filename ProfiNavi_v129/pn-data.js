(function(){
  'use strict';
  const CLEANUP_KEY='pn_clean_schema_v138';
  try{
    if(localStorage.getItem(CLEANUP_KEY)!=='1'){
      // v138 clean-start: drop stale app/session caches from the test period while
      // preserving UI preferences such as language, geolocation and map settings.
      const exact=[
        'pn_favs','pn_fav_works','pn_chats','pn_master_chats','pn_bookings','pn_booking',
        'pn_client_chat_unread','pn_chat_unread','pn_master_chat_unread','pn_support_unread',
        'pn_client_chat_read_at_v49','pn_client_chat_read_at','pn_master_chat_read_at_v49','pn_master_chat_read_at',
        'pn_master_feed_works','pn_master_profile_0','pn_master_services_0','pn_master_slots','pn_master_schedule_config',
        'pn_master_session','pn_master_cache_owner','pn_client_user','pn_public_reviews_0','pn_master_backend_reviews',
        'pn_verified_reviews','pn_analytics_period_v59'
      ];
      exact.forEach(k=>localStorage.removeItem(k));
      Object.keys(localStorage).forEach(k=>{
        if(k.startsWith('pn_dynamic_master_')||k.startsWith('pn_chat_')||k.startsWith('pn_master_profile_')||
           k.startsWith('pn_master_services_')||k.startsWith('pn_public_reviews_')||k.startsWith('pn_public_slots_')||
           k.startsWith('pn_reviewed_booking_')) localStorage.removeItem(k);
        // Supabase session is intentionally local-reset once so v138 starts from
        // the freshly cleaned application database instead of stale test sessions.
        if(k.startsWith('sb-ydezwnuoeqlzmeuufrmo-auth-token')) localStorage.removeItem(k);
      });
      ['pn_test_pending_phone','pn_auth_pending','pn_master_pending_phone'].forEach(k=>sessionStorage.removeItem(k));
      localStorage.setItem(CLEANUP_KEY,'1');
    }
  }catch(e){}
  window.PN_MASTER_WORK_SETS=[];
  window.PN_MASTERS=[];
  window.PNCloneMasters=()=>[];
})();
