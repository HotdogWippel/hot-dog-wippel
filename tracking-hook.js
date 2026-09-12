(()=>{
  const originalFetch=window.fetch.bind(window);
  window.fetch=async(...args)=>{
    const res=await originalFetch(...args);
    try{
      const url=typeof args[0]==='string'?args[0]:args[0]?.url||'';
      const method=(args[1]?.method||'GET').toUpperCase();
      if(url.includes('/api/orders')&&method==='POST'&&res.ok){
        const data=await res.clone().json();
        if(data.tracking_url){
          localStorage.setItem('wippel_last_tracking',data.tracking_url);
          setTimeout(()=>{
            const msg=document.getElementById('msg');
            if(msg&&!msg.querySelector('[data-track]')){
              msg.insertAdjacentHTML('beforeend',`<br><a data-track href="${data.tracking_url}" style="display:inline-block;margin-top:12px;background:#c62828;color:#fff;padding:12px 16px;border-radius:12px;text-decoration:none;font-weight:800">📍 Acompanhar meu pedido</a>`);
            }
            showLast();
          },120);
        }
      }
    }catch{}
    return res;
  };
  function showLast(){
    const url=localStorage.getItem('wippel_last_tracking');
    const a=document.getElementById('lastOrder');
    if(a&&url){a.href=url;a.hidden=false}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',showLast); else showLast();
})();