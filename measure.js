(async()=>{
 window.dataLayer=window.dataLayer||[];

 const cleanText=(value)=>String(value||'').replace(/\s+/g,' ').trim().slice(0,160);
 const absoluteUrl=(href)=>{
  try{return new URL(href||location.href,location.href).href}catch{return href||location.href}
 };
 const utmKeys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
 const query=new URL(location.href).searchParams;
 let campaign={};
 try{campaign=JSON.parse(sessionStorage.getItem('aq-campaign')||'{}')}catch{}
 for(const key of utmKeys){
  const value=cleanText(query.get(key));
  if(value)campaign[key]=value;
 }
 try{sessionStorage.setItem('aq-campaign',JSON.stringify(campaign))}catch{}

 const labelFor=(target)=>[
  target.getAttribute('aria-label'),
  target.textContent,
  target.getAttribute('title'),
  target.getAttribute('name'),
  'button'
 ].map(cleanText).find(Boolean);
 const track=(eventName,details={})=>{
  const payload={
   button_text:cleanText(details.button_text)||'button',
   click_url:absoluteUrl(details.click_url),
   page_location:location.href,
   ...campaign,
   ...details,
   event:eventName
  };
  // Keep the structured object for GTM triggers and also send the event
  // directly to the live GA4 stream. The latter makes these event names
  // available even when a GTM workspace has no matching custom-event tag.
  window.dataLayer.push(payload);
  const ga4Payload={...payload};
  delete ga4Payload.event;
  if(typeof window.gtag==='function')window.gtag('event',eventName,{...ga4Payload,transport_type:'beacon'});
 };

 document.addEventListener('click',(event)=>{
  const target=event.target instanceof Element?event.target.closest('a,button'):null;
  if(!target)return;
  const href=target.getAttribute('href')||target.dataset.url||'';
  const clickUrl=absoluteUrl(href);
  const base={button_text:labelFor(target),click_url:clickUrl};
  const branch=target.closest('#branches .city');
  const branchEventName=target.dataset.trackEvent;

  track('button_click',base);
  if(/^tel:/i.test(href)){
   track('phone_click',base);
  }else if(branchEventName){
   track(branchEventName,{
    ...base,
    branch_city:cleanText(branch.querySelector('h3')?.textContent),
    branch_address:cleanText(branch.querySelector('.address')?.textContent)
   });
  }else if(/^https?:/i.test(clickUrl)&&new URL(clickUrl).origin!==location.origin){
   track('outbound_click',{...base,link_domain:new URL(clickUrl).hostname});
  }
 },{passive:true});

 document.querySelectorAll('details.offer-group').forEach((group,index)=>{
  group.addEventListener('toggle',()=>{
   const category=cleanText(group.querySelector('.category-copy > span')?.textContent)||`offer_${index+1}`;
   const categoryKey=group.querySelector('.deals')?.dataset.category||`offer-${index+1}`;
   track('offer_interaction',{
    button_text:category,
    click_url:`${location.origin}${location.pathname}#offers-${categoryKey}`,
    offer_category:categoryKey,
    interaction_state:group.open?'opened':'closed'
   });
  });
 });

 if(document.visibilityState!=='visible')await new Promise(resolve=>document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')resolve()},{once:true}));
 const code=location.pathname.split('/').at(-1).match(/^(?:0[1-9]|1[0-9]|20)$/)?.[0]||query.get('via')||'';
 let visitor=crypto.randomUUID(),id=crypto.randomUUID();
 try{
  visitor=localStorage.getItem('aq-browser')||visitor;localStorage.setItem('aq-browser',visitor);
  const key='aq-entry:'+code,old=JSON.parse(sessionStorage.getItem(key)||'null');
  if(old&&Date.now()-old.time<1800000)id=old.id;
  sessionStorage.setItem(key,JSON.stringify({id,time:Date.now()}));
 }catch{}
 await fetch('visit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id,visitor,code,...campaign}),keepalive:true}).catch(()=>{});
})();
