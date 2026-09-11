-- REDE AGRO — carteira, dados Pix e pagamentos na entrega
-- Cole TODO este arquivo no Supabase > SQL Editor e clique em Run.
-- Pode ser executado mais de uma vez: os comandos são idempotentes.

create extension if not exists pgcrypto;

create table if not exists public."Usuario" (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text,
  email text,
  telefone text,
  senha text,
  tipo text not null default 'ENTREGADOR',
  status text not null default 'PENDENTE',
  criado_em timestamptz not null default now()
);

alter table public."Usuario"
  add column if not exists chave_pix text,
  add column if not exists tipo_chave_pix text,
  add column if not exists disponivel boolean not null default false,
  add column if not exists ultima_latitude double precision,
  add column if not exists ultima_longitude double precision,
  add column if not exists ultima_localizacao_em timestamptz;

create unique index if not exists usuario_email_unico on public."Usuario" (email) where email is not null;
create unique index if not exists usuario_cpf_unico on public."Usuario" (cpf) where cpf is not null;

create table if not exists public."Entrega" (
  id uuid primary key default gen_random_uuid(),
  entregador_id uuid references public."Usuario"(id) on delete set null,
  cliente_nome text not null default 'Cliente',
  cliente_telefone text not null default '',
  endereco_coleta text not null default '',
  lat_coleta double precision,
  lng_coleta double precision,
  endereco_entrega text not null default '',
  lat_entrega double precision,
  lng_entrega double precision,
  valor numeric(12,2) not null default 0,
  status text not null default 'DISPONIVEL',
  criado_em timestamptz not null default now()
);

alter table public."Entrega"
  add column if not exists metodo_pagamento text not null default 'PIX',
  add column if not exists pagamento_status text not null default 'PENDENTE',
  add column if not exists valor_recebido numeric(12,2),
  add column if not exists troco numeric(12,2),
  add column if not exists pix_payload text,
  add column if not exists pix_txid text,
  add column if not exists pix_expira_em timestamptz,
  add column if not exists codigo_confirmacao text,
  add column if not exists foto_confirmacao_url text;

-- Restringe os valores novos sem falhar se a regra já existir.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'entrega_metodo_pagamento_valido') then
    alter table public."Entrega" add constraint entrega_metodo_pagamento_valido
      check (metodo_pagamento in ('PIX', 'CARTAO', 'DINHEIRO'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'entrega_pagamento_status_valido') then
    alter table public."Entrega" add constraint entrega_pagamento_status_valido
      check (pagamento_status in ('PENDENTE', 'AGUARDANDO_PIX', 'APROVADO', 'RECUSADO', 'EXPIRADO'));
  end if;
end $$;

create index if not exists entrega_entregador_status_idx on public."Entrega" (entregador_id, status);
create index if not exists entrega_pagamento_status_idx on public."Entrega" (pagamento_status);
create unique index if not exists entrega_pix_txid_unico on public."Entrega" (pix_txid) where pix_txid is not null;

create table if not exists public."Transacao" (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public."Usuario"(id) on delete cascade,
  entrega_id uuid references public."Entrega"(id) on delete set null,
  tipo text not null,
  valor numeric(12,2) not null,
  valor_total numeric(12,2),
  taxa_plataforma numeric(12,2) not null default 0,
  status text not null default 'PENDENTE',
  gateway_txid text,
  criado_em timestamptz not null default now(),
  constraint transacao_tipo_valido check (tipo in ('CREDITO', 'DEBITO')),
  constraint transacao_status_valido check (status in ('PENDENTE', 'CONCLUIDO', 'CANCELADO'))
);

-- Há bancos de teste que já possuem créditos duplicados para a mesma entrega.
-- Preservamos o histórico e mantemos vinculada apenas a transação mais recente;
-- as cópias antigas ficam sem entrega_id para não impedirem a regra daqui em diante.
with duplicadas as (
  select id, row_number() over (
    partition by entrega_id
    order by criado_em desc nulls last, id desc
  ) as posicao
  from public."Transacao"
  where entrega_id is not null
)
update public."Transacao" transacao
set entrega_id = null
from duplicadas
where transacao.id = duplicadas.id and duplicadas.posicao > 1;

-- Garante que uma entrega só credite a carteira uma vez daqui em diante.
create unique index if not exists transacao_entrega_unica
  on public."Transacao" (entrega_id) where entrega_id is not null;
create index if not exists transacao_usuario_data_idx on public."Transacao" (usuario_id, criado_em desc);

-- O servidor usa SUPABASE_SECRET_KEY. Não exponha essa chave ao aplicativo.
-- Se você já configurou RLS/policies no projeto, preserve as suas políticas existentes.
