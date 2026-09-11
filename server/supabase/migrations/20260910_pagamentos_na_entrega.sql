-- Pagamentos vinculados ao pedido. Execute no SQL Editor do Supabase.
alter table public."Entrega"
  add column if not exists metodo_pagamento text not null default 'PIX'
    check (metodo_pagamento in ('PIX', 'CARTAO', 'DINHEIRO')),
  add column if not exists pagamento_status text not null default 'PENDENTE'
    check (pagamento_status in ('PENDENTE', 'AGUARDANDO_PIX', 'APROVADO', 'RECUSADO', 'EXPIRADO')),
  add column if not exists valor_recebido numeric,
  add column if not exists troco numeric,
  add column if not exists pix_payload text,
  add column if not exists pix_txid text,
  add column if not exists pix_expira_em timestamptz;

create index if not exists entrega_pagamento_status_idx
  on public."Entrega" (pagamento_status);

-- Mantém a transação mais recente por entrega e preserva cópias antigas no extrato,
-- mas sem vínculo de entrega; assim dados de teste duplicados não travam a migration.
with duplicadas as (
  select id, row_number() over (partition by entrega_id order by criado_em desc nulls last, id desc) as posicao
  from public."Transacao"
  where entrega_id is not null
)
update public."Transacao" transacao
set entrega_id = null
from duplicadas
where transacao.id = duplicadas.id and duplicadas.posicao > 1;

-- A mesma entrega não pode gerar dois créditos na carteira daqui em diante.
create unique index if not exists transacao_entrega_unica
  on public."Transacao" (entrega_id) where entrega_id is not null;
