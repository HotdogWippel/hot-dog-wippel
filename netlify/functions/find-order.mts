import { getStore } from '@netlify/blobs';

const digits=(v='')=>String(v).replace(/\D/g,'');

export default async (req:Request)=>{
  if(req.method!=='POST') return new Response('Method not allowed',{status:405});
  let b:any; try{b=await req.json()}catch{return Response.json({error:'Dados inválidos.'},{status:400})}
  const number=digits(b.order_number).slice(-6), phone=digits(b.phone);
  if(number.length<4 || phone.length<10) return Response.json({error:'Informe o número do pedido e o WhatsApp usado no pedido.'},{status:400});
  const store=getStore('wippel-orders',{consistency:'strong'});
  const list:any=await store.list({prefix:'order-'});
  for(const blob of (list.blobs||[])){
    const order:any=await store.get(blob.key,{type:'json'});
    if(order && digits(order.order_number)===number && digits(order.phone)===phone){
      const token=String(order.tracking_token||blob.key.replace(/^order-/,''));
      if(/^[a-f0-9]{32}$/i.test(token)) return Response.json({ok:true,order_number:order.order_number,tracking_url:`/acompanhar.html?pedido=${token}`},{headers:{'cache-control':'no-store'}});
    }
  }
  return Response.json({error:'Não encontramos esse pedido com esse WhatsApp.'},{status:404,headers:{'cache-control':'no-store'}});
};
export const config={path:'/api/find-order'};