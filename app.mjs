const defaults={'homeis-article':'Home is · სტატია','homeis-banner':'Home is · ბანერი','bmg-article':'BMG · სტატია','bmg-banner':'BMG · ბანერი','ipn-article':'IPN · სტატია','ipn-banner':'IPN · ბანერი','fb-launch':'Facebook · გამხსნელი პოსტი','ig-story':'Instagram · Story','linkedin-offer':'LinkedIn · ბიზნესშეთავაზება'};
const slots = Object.fromEntries(Array.from({length:20}, (_, i) => [String(i + 1).padStart(2,'0'), '']));
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const reply=(s,type='text/plain;charset=utf-8',status=200)=>new Response(s,{status,headers:{'content-type':type,'cache-control':'no-store','x-content-type-options':'nosniff'}});
export async function handle(req,{DB:db,pages,assets,authorize}){
const url=new URL(req.url),p=url.pathname;
if(p==='/'||p==='/index.html'||Object.hasOwn(slots,p.slice(1)))return reply(pages.home,'text/html;charset=utf-8');
if(assets[p]){let [mime,data]=assets[p];return new Response(Uint8Array.from(atob(data),c=>c.charCodeAt(0)),{headers:{'content-type':mime,'cache-control':'public,max-age=3600'}})}
if(req.method==='POST'&&req.headers.get('origin')!==url.origin)return reply('Forbidden',undefined,403);
if(p==='/visit'&&req.method==='POST'){const a=await req.json().catch(()=>({}));if(!uuid.test(a.id)||!uuid.test(a.visitor)||typeof a.code!=='string'||a.code.length>80)return reply('Invalid',undefined,400);const code=Object.hasOwn(slots,a.code)||Object.hasOwn(defaults,a.code)||a.code&&await db.prepare('SELECT code FROM links WHERE code=?').bind(a.code).first()?a.code:'';await db.prepare("INSERT OR IGNORE INTO visits VALUES(?,?,?,date('now','+4 hours'))").bind(a.id,a.visitor,code).run();return reply('ok')}
if(p==='/offers'&&req.method==='GET'){
 const rows=await db.prepare('SELECT * FROM offers ORDER BY rowid').all();
 return reply(JSON.stringify(rows.results),'application/json');
}
if(!['/analytics','/report','/links','/manage-offers'].includes(p))return reply('404',undefined,404);
const denied=authorize(req,p);if(denied)return denied;
if(p==='/manage-offers'&&req.method==='POST'){
 const data=await req.json().catch(()=>null);
 if(!data||typeof data!=='object')return reply('Invalid',undefined,400);
 if(data.remove&&uuid.test(data.id)){await db.prepare('DELETE FROM offers WHERE id=?').bind(data.id).run();return reply('ok')}
 const {model,category,previous,current}=data;
 if(!['water','sauna','pool'].includes(category)||typeof model!=='string'||!model.trim()||model.length>120||!Number.isFinite(previous)||!Number.isFinite(current)||current<=0||previous<=current||(data.id&&!uuid.test(data.id)))return reply('Invalid',undefined,400);
 await db.prepare('INSERT INTO offers(id,category,model,previous,current) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET category=excluded.category,model=excluded.model,previous=excluded.previous,current=excluded.current').bind(data.id||crypto.randomUUID(),category,model.trim(),previous,current).run();
 return reply('ok');
}
if(p==='/analytics')return reply(pages.admin,'text/html;charset=utf-8');
if(p==='/links'&&req.method==='PATCH'){
 if(req.headers.get('origin')!==url.origin)return reply('Forbidden',undefined,403);
 const data=await req.json().catch(()=>({}));
 if(!Object.hasOwn(slots,data.code)||typeof data.label!=='string'||data.label.length>100)return reply('Invalid',undefined,400);
 await db.prepare('INSERT INTO links(code,label) VALUES(?,?) ON CONFLICT(code) DO UPDATE SET label=excluded.label').bind(data.code,data.label.trim()).run();
 return reply('ok')
}
if(p==='/links'&&req.method==='POST'){let label=(await req.json()).label;if(typeof label!=='string'||!label.trim()||label.length>100)return reply('Invalid',undefined,400);await db.prepare('INSERT INTO links VALUES(?,?)').bind(crypto.randomUUID(),label.trim()).run();return reply('ok')}
if(p==='/report'){const days=url.searchParams.get('period'),where=['7','30'].includes(days)?" WHERE day >= date('now','+4 hours','-"+(Number(days)-1)+" days')":'';let [custom,counts,total]=await db.batch([db.prepare('SELECT * FROM links'),db.prepare('SELECT code,count(*) total,count(distinct visitor) people FROM visits'+where+' GROUP BY code'),db.prepare('SELECT count(*) total,count(distinct visitor) people FROM visits'+where)]);let map=new Map(counts.results.map(v=>[v.code,v]));const assigned=new Map(custom.results.map(x=>[x.code,x.label]));let all=[...Object.keys(slots).sort().map(code=>({code,label:assigned.get(code)||'',slot:true})),...Object.entries(defaults).map(([code,label])=>({code,label})),...custom.results.filter(x=>!Object.hasOwn(slots,x.code)),{code:'',label:'პირდაპირი ან მოუნიშნავი ბმული'}];return reply(JSON.stringify({...total.results[0],rows:all.map(v=>({people:0,total:0,...v,...map.get(v.code)}))}),'application/json')}
return reply('Method not allowed',undefined,405)
}
