const M=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const token=new URLSearchParams(location.search).get('pedido')||'';
const labels={aceito:'Pedido recebido','em_preparo':'Em preparo','saiu_entrega':'Saiu para entrega',finalizado:'Finalizado'};
const order=['aceito','em_preparo','saiu_entrega','finalizado'];
let timer;
function render(d){
  document.getElementById('title').textContent=`Pedido #${d.order_number}`;
  const date=d.created_at?new Date(d.created_at).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'';
  document.getElementById('subtitle').className='muted';
  document.getElementById('subtitle').textContent=`${labels[d.status]||'Pedido recebido'}${date?' · '+date:''}`;
  document.getElementById('total').textContent=M(d.total);
  const current=Math.max(0,order.indexOf(d.status));
  document.getElementById('steps').innerHTML=order.map((s,i)=>`<div class="step ${i<current?'done':''} ${i===current?'current':''}"><div class="dot">${i<current?'✓':i+1}</div><div><b>${labels[s]}</b>${s==='aceito'?'<br><small>Recebemos seu pedido.</small>':s==='em_preparo'?'<br><small>Seu pedido está sendo preparado.</small>':s==='saiu_entrega'?'<br><small>Seu pedido saiu para entrega.</small>':'<br><small>Pedido concluído.</small>'}</div></div>`).join('');
  let pay='';
  if(d.payment==='pix') pay=`<p><b>Pagamento:</b> PIX · ${d.paid?'✅ confirmado':'⏳ aguardando confirmação'}</p>`;
  else if(d.payment) pay=`<p><b>Pagamento:</b> ${d.payment==='cartao'?'Cartão':d.payment==='dinheiro'?'Dinheiro':d.payment}</p>`;
  if(d.order_mode==='entrega' && d.status!=='finalizado') pay+=`<p><b>Previsão:</b> 45–60 min</p>`;
  document.getElementById('payment').innerHTML=pay;
  document.getElementById('items').innerHTML='<h3>Seu pedido</h3>'+((d.items||[]).map(x=>`<div class="item"><b>${x.qty||1}x ${x.name}</b>${x.variant?`<br><small>${x.variant}</small>`:''}${x.options?.length?`<br><small>+ ${x.options.join(', ')}</small>`:''}</div>`).join('')||'<p>Itens indisponíveis para visualização.</p>');
  if(d.status==='finalizado'&&timer) clearInterval(timer);
}
async function load(){
  if(!/^[a-f0-9]{32}$/i.test(token)){document.getElementById('title').textContent='Pedido não encontrado';document.getElementById('subtitle').textContent='Este link não é válido.';return}
  try{
    const r=await fetch('/api/track-order?pedido='+encodeURIComponent(token),{cache:'no-store'});
    const d=await r.json();
    if(!r.ok) throw Error(d.error||'Pedido não encontrado.');
    render(d);
  }catch(e){document.getElementById('title').textContent='Não foi possível acompanhar';document.getElementById('subtitle').className='muted';document.getElementById('subtitle').textContent=e.message}
}
load();timer=setInterval(load,15000);