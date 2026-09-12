import { getStore } from '@netlify/blobs';

export default async (req:Request)=>{
  if(req.method!=='GET') return new Response('Method not allowed',{status:405});
  const url=new URL(req.url);
  const token=(url.searchParams.get('pedido')||'').trim();
  if(!/^[a-f0-9]{32}$/i.test(token)) return Response.json({error:'Pedido não encontrado.'},{status:404});
  const store=getStore('wippel-orders',{consistency:'strong'});
  const order:any=await store.get(`order-${token}`,{type:'json'});
  if(!order) return Response.json({error:'Pedido não encontrado.'},{status:404});
  const safe={
    order_number:order.order_number,
    status:order.status||'aceito',
    created_at:order.created_at,
    order_mode:order.order_mode,
    total:order.total,
    payment:order.payment,
    paid:Boolean(order.paid),
    items:Array.isArray(order.items)?order.items.map((x:any)=>({name:x.name,qty:x.qty,variant:x.variant||'',options:Array.isArray(x.options)?x.options.map((o:any)=>o.name):[]})):[]
  };
  return Response.json(safe,{headers:{'cache-control':'no-store'}});
};
export const config={path:'/api/track-order'};