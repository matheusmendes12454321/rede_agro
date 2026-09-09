alter table public."Usuario" add column if not exists disponivel boolean not null default false;
alter table public."Usuario" add column if not exists ultima_latitude double precision;
alter table public."Usuario" add column if not exists ultima_longitude double precision;
alter table public."Usuario" add column if not exists ultima_localizacao_em timestamptz;

create table if not exists public."Entrega" (
  id uuid primary key default gen_random_uuid(),
  entregador_id uuid references public."Usuario"(id),
  cliente_nome text not null,
  cliente_telefone text not null,
  endereco_coleta text not null,
  lat_coleta double precision not null,
  lng_coleta double precision not null,
  endereco_entrega text not null,
  lat_entrega double precision not null,
  lng_entrega double precision not null,
  valor numeric not null check (valor > 0),
  status text not null default 'DISPONIVEL' check (status in ('DISPONIVEL','ACEITO','RECUSADO','A_CAMINHO_COLETA','COLETADO','A_CAMINHO_ENTREGA','ENTREGUE')),
  codigo_confirmacao text,
  foto_confirmacao_url text,
  criado_em timestamptz not null default now()
);
create index if not exists entrega_entregador_status_idx on public."Entrega"(entregador_id, status);
