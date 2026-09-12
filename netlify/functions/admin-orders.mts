import { getStore } from '@netlify/blobs';

const ok=(req:Request)=>{const secret=(Netlify.env.get('ADMIN_SECRET')||'').trim();return Boolean(secret)&&req.headers.get('x-admin-secret')===secret};
const safeStatus=new Set(['aceito','em_preparo','saiu_entrega','finalizado','cancelado']);
export default async(req:Request)=>{
 if(!ok(req)) return Response.json({error:'Acesso não autorizado.'},{status:401});
 const store=getStore('wippel-orders',{consistency:'strong'});
 if(req.method==='GET'){
  const list:any=await store.list({prefix:'order-'});const orders:any[]=[];
  for(const blob of (list.blobs||[])){const o:any=await store.get(blob.key,{type:'json'});if(o)orders.push({...o,_key:blob.key});}
  orders.sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
  return Response.json({orders},{headers:{'cache-control':'no-store'}});
 }
 if(req.method==='PATCH'){
  let b:any;try{b=await req.json()}catch{return Response.json({error:'Dados inválidos.'},{status:400})}
  const key=String(b.key||'');if(!/^order-[a-f0-9]{32}$/i.test(key))return Response.json({error:'Pedido inválido.'},{status:400});
  const o:any=await store.get(key,{type:'json'});if(!o)return Response.json({error:'Pedido não encontrado.'},{status:404});
  if(b.status!==undefined){if(!safeStatus.has(b.status))return Response.json({error:'Status inválido.'},{status:400});o.status=b.status;o.status_updated_at=new Date().toISOString();}
  if(b.paid!==undefined)o.paid=Boolean(b.paid);
  if(b.driver!==undefined)o.driver=String(b.driver||'').trim().slice(0,80);
  if(b.delivery_eta!==undefined){const n=Number(b.delivery_eta);if(!Number.isFinite(n)||n<0||n>300)return Response.json({error:'Previsão inválida.'},{status:400});o.delivery_eta=Math.round(n);}
  if(b.delivery_note!==undefined)o.delivery_note=String(b.delivery_note||'').trim().slice(0,300);
  if(b.driver!==undefined||b.delivery_eta!==undefined||b.delivery_note!==undefined)o.delivery_updated_at=new Date().toISOString();
  await store.setJSON(key,o);return Response.json({ok:true,status:o.status,paid:o.paid,driver:o.driver||'',delivery_eta:o.delivery_eta||null});
 }
 return new Response('Method not allowed',{status:405});
};
export const config={path:'/api/admin-orders'};