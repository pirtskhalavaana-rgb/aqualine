(async()=>{
 window.dataLayer=window.dataLayer||[];
 const cleanText=(value)=>value.replace(/\s+/g,' ').trim().slice(0,160);
 const absoluteUrl=(href)=>{
  try{return new URL(href,location.href).href}catch{return href||location.href}
 };
 document.addEventListener('click',(event)=>{
  const target=event.target instanceof Element?event.target.closest('a,button'):null;
  if(!target)return;
  const href=target.getAttribute('href')||target.dataset.url||'';
  const payload={
   event:'button_click',
   button_text:cleanText(target.textContent||target.getAttribute('aria-label')||target.title||'button'),
   click_url:absoluteUrl(href),
   page_location:location.href
  };
  window.dataLayer.push(payload);
  if(/^tel:/i.test(href))window.dataLayer.push({event:'phone_click',...payload});
  else if(href&&new URL(absoluteUrl(href)).origin!==location.origin)window.dataLayer.push({event:'outbound_click',...payload});
  if(target.closest('.offer-group'))window.dataLayer.push({event:'offer_interaction',...payload});
 },{passive:true});
 if(document.visibilityState!=='visible')await new Promise(resolve=>document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')resolve()},{once:true}));
 const code=location.pathname.split('/').at(-1).match(/^(?:0[1-9]|1[0-9]|20)$/)?.[0]||new URL(location.href).searchParams.get('via')||'';
 let visitor=crypto.randomUUID(),id=crypto.randomUUID();
 try{
  visitor=localStorage.getItem('aq-browser')||visitor;localStorage.setItem('aq-browser',visitor);
  let key='aq-entry:'+code,old=JSON.parse(sessionStorage.getItem(key)||'null');
  if(old&&Date.now()-old.time<1800000)id=old.id;
  sessionStorage.setItem(key,JSON.stringify({id,time:Date.now()}));
 }catch{}
 await fetch('visit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id,visitor,code}),keepalive:true}).catch(()=>{});
})();
