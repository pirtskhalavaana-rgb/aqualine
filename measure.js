(async()=>{
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
