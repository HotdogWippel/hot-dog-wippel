import { getStore } from '@netlify/blobs';
const zones={murta:5,cordeiros:5,'costa cavalcante':5,'sao vicente':7,'nilo bittencourt':7,'cidade nova':9,'portal 1 e 2':8,'barra do rio':6,'sao joao':7};
const norm=(s='')=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const ok=(req:Request)=>{const secret=(Netlify.env.get('ADMIN_SECRET')||'').trim();return Boolean(secret)&&req.headers.get('x-admin-secret')===secret};
export default async(req:Request)=>{
 if(req.method!=='POST')return new Response('Method not allowed',{status:405});
 if(!ok(req))return Response.json({error:'Acesso não autorizado.'},{status:401});
 let b:any;try{b=await req.json()}catch{return Response.json({error:'Dados inválidos.'},{status:400})}
 const name=String(b.customer_name||'Balcão').trim(),phone=String(b.phone||'').replace(/\D/g,'');
 if(!Array.isArray(b.items)||!b.items.length)return Response.json({error:'Adicione pelo menos um item.'},{status:400});
 const items=b.items.map((x:any)=>({id:String(x.id||''),name:String(x.name||'Item'),qty:Math.max(1,Number(x.qty)||1),price:Math.max(0,Number(x.price)||0),variant:String(x.variant||''),options:Array.isArray(x.options)?x.options:[],note:String(x.note||'')}));
 const subtotal=items.reduce((s:number,x:any)=>s+x.price*x.qty,0);if(!Number.isFinite(subtotal)||subtotal<=0)return Response.json({error:'Total inválido.'},{status:400});
 let fee=0;const mode=String(b.order_mode||'retirada');
 if(mode==='entrega'){
  const n=norm(b.neighborhood);if(!String(b.street||'').trim()||!String(b.house_number||'').trim()||!n)return Response.json({error:'Preencha o endereço da entrega.'},{status:400});
  const known=zones[n as keyof typeof zones];if(known===undefined)return Response.json({error:'Bairro fora das taxas cadastradas.'},{status:400});fee=known;
 }
 const now=Date.now(),token=crypto.randomUUID().replaceAll('-',''),orderNumber=String(now).slice(-6),total=subtotal+fee;
 const order={customer_name:name,phone,order_mode:mode,payment:String(b.payment||'dinheiro'),cep:String(b.cep||''),street:String(b.street||''),house_number:String(b.house_number||''),complement:String(b.complement||''),neighborhood:String(b.neighborhood||''),city:String(b.city||'Itajaí'),notes:String(b.notes||''),subtotal,delivery_fee:fee,total,items,order_number:orderNumber,status:'aceito',paid:Boolean(b.paid),printed:false,created_at:new Date().toISOString(),source:'pdv-netlify',tracking_token:token};
 const store=getStore('wippel-orders',{consistency:'strong'});await store.setJSON(`order-${token}`,order);
 return Response.json({ok:true,order_number:orderNumber,total,tracking_url:`/acompanhar.html?pedido=${token}`});
};
export const config={path:'/api/admin-create-order'};