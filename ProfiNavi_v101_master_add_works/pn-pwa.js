(function(){
  'use strict';
  if(!('serviceWorker' in navigator))return;
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(err=>console.warn('ProfiNavi service worker:',err));
  });
})();
