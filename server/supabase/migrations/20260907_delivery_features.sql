-- Execute este script no SQL Editor do Supabase antes de habilitar produção.
-- O fluxo atual funciona sem estas colunas, mas elas permitem auditoria da confirmação.
alter table public."Entrega"
  add column if not exists comprovante_url text,
  add column if not exists codigo_confirmacao_validado boolean default false,
  add column if not exists avaliacao_cliente smallint check (avaliacao_cliente between 1 and 5),
  add column if not exists observacao_entrega text;

create index if not exists entrega_entregador_status_idx
  on public."Entrega" (entregador_id, status);

alter table public."Usuario"
  add column if not exists disponivel boolean default false,
  add column if not exists ultima_latitude double precision,
  add column if not exists ultima_longitude double precision,
  add column if not exists ultima_localizacao_em timestamptz;
