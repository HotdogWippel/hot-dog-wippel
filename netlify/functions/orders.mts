import { getStore } from '@netlify/blobs';

const zones={murta:5,cordeiros:5,'costa cavalcante':5,'sao vicente':7,'nilo bittencourt':7,'cidade nova':9,'portal 1 e 2':8,'barra do rio':6,'sao joao':7};
const norm=(s='')=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();

export default async (req:Request)=>{
  if(req.method!=='POST') return new Response('Method not allowed',{status:405});
  let b:any; try{b=await req.json()}catch{return Response.json({error:'Pedido inválido.'},{status:400})}
  const name=String(b.customer_name||'').trim(), phone=String(b.phone||'').replace(/\D/g,'');
  if(!name || phone.length<10) return Response.json({error:'Informe seu nome e WhatsApp corretamente.'},{status:400});
  if(!Array.isArray(b.items)||!b.items.length) return Response.json({error:'Adicione pelo menos um item.'},{status:400});
  let fee=0;
  if(b.order_mode==='entrega'){
    if(!String(b.street||'').trim()||!String(b.house_number||'').trim()||!String(b.neighborhood||'').trim()) return Response.json({error:'Preencha o endereço completo.'},{status:400});
    const known=zones[norm(b.neighborhood) as keyof typeof zones];
    if(known===undefined) return Response.json({error:'Ainda não entregamos nesse bairro.'},{status:400});
    fee=Number(known);
  }
  const subtotal=b.items.reduce((s:number,x:any)=>s+(Number(x.price)||0)*(Math.max(1,Number(x.qty)||1)),0);
  if(!Number.isFinite(subtotal)||subtotal<=0) return Response.json({error:'Não foi possível calcular o pedido.'},{status:400});
  const total=subtotal+fee;
  const now=Date.now(), orderNumber=String(now).slice(-6);
  const order={...b,customer_name:name,phone,subtotal,delivery_fee:fee,total,order_number:orderNumber,status:'aceito',paid:false,printed:false,created_at:new Date().toISOString(),source:'web-netlify'};
  const store=getStore('wippel-orders',{consistency:'strong'});
  await store.setJSON(`order-${now}-${crypto.randomUUID()}`,order);
  return Response.json({ok:true,order_number:orderNumber,total,pix_key:'47999821938'});
};
export const config={path:'/api/orders'};