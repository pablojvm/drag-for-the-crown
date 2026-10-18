-- Drag for the Crown: partidas en la nube, Hall of Fame mundial, memoria larga y cuota de IA.
-- Jugadores: anónimos por defecto (auth anónima) y, si quieren, enlazan su cuenta de Google.

-- Partida guardada (una por jugador)
create table if not exists public.saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.saves enable row level security;
create policy "saves: leer la mía" on public.saves for select using (auth.uid() = user_id);
create policy "saves: crear la mía" on public.saves for insert with check (auth.uid() = user_id);
create policy "saves: cambiar la mía" on public.saves for update using (auth.uid() = user_id);
create policy "saves: borrar la mía" on public.saves for delete using (auth.uid() = user_id);

-- Hall of Fame mundial del modo historia
create table if not exists public.board (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 16),
  season text not null check (char_length(season) <= 40),
  queen text not null check (char_length(queen) <= 60),
  ppe numeric(4,2) not null check (ppe between 0 and 5),
  wins int not null default 0 check (wins between 0 and 20),
  won boolean not null default false,
  place text check (char_length(place) <= 12),
  created_at timestamptz not null default now()
);
create index if not exists board_rank on public.board (ppe desc, wins desc, won desc);
alter table public.board enable row level security;
create policy "board: todos leen" on public.board for select using (true);
create policy "board: cada una sube lo suyo" on public.board for insert with check (auth.uid() = user_id);

-- Memoria larga: resumen de cada temporada jugada (lo que recuerdan las reinas en las siguientes)
create table if not exists public.memories (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  season text not null,
  queen text not null,
  summary text not null check (char_length(summary) <= 4000),
  created_at timestamptz not null default now()
);
create index if not exists memories_user on public.memories (user_id, created_at desc);
alter table public.memories enable row level security;
create policy "memories: leer las mías" on public.memories for select using (auth.uid() = user_id);
create policy "memories: crear las mías" on public.memories for insert with check (auth.uid() = user_id);

-- Cuota de IA por jugador y día (solo la toca la función del servidor)
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  calls int not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
-- Sin políticas: el cliente no puede leerla ni escribirla; la función usa la clave de servicio.

-- Suma una llamada y devuelve cuántas lleva hoy el jugador y cuántas van en total
create or replace function public.ai_take(p_user uuid, p_limit int, p_global int)
returns table (mine int, total int)
language plpgsql security definer set search_path = public as $$
declare v_total int;
begin
  select coalesce(sum(calls), 0) into v_total from ai_usage where day = current_date;
  if v_total >= p_global then
    return query select -1, v_total; return;
  end if;
  insert into ai_usage (user_id, day, calls) values (p_user, current_date, 1)
  on conflict (user_id, day) do update set calls = ai_usage.calls + 1
  returning ai_usage.calls, v_total + 1 into mine, total;
  if mine > p_limit then
    update ai_usage set calls = calls - 1 where user_id = p_user and day = current_date;
    mine := -2;
  end if;
  return next;
end $$;
revoke all on function public.ai_take(uuid, int, int) from public, anon, authenticated;
