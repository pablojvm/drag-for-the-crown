-- Endurecer lo que el navegador puede hacer contra la base de datos.

-- 1) Hall of Fame: el navegador sigue subiendo su resultado, pero con límites para que no se pueda inundar ni trucar a lo loco.
--    (Hacerlo infalible requiere que el servidor juegue la partida; eso llega con el motor nuevo.)
create or replace function public.board_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_hoy int; v_reciente int;
begin
  select count(*) into v_hoy from board where user_id = new.user_id and created_at > now() - interval '1 day';
  if v_hoy >= 6 then raise exception 'límite de entradas diarias en el Hall of Fame'; end if;
  select count(*) into v_reciente from board where user_id = new.user_id and created_at > now() - interval '10 minutes';
  if v_reciente >= 1 then raise exception 'espera un poco antes de subir otra temporada'; end if;
  -- Coherencia básica: una ganadora tiene al menos un reto ganado y un PPE razonable
  if new.won and (new.wins < 1 or new.ppe < 2) then raise exception 'resultado incoherente'; end if;
  if new.wins > 14 then raise exception 'resultado incoherente'; end if;
  new.created_at := now();
  return new;
end $$;
drop trigger if exists board_guard on public.board;
create trigger board_guard before insert on public.board for each row execute function public.board_guard();

-- 2) Errores del juego: cada navegador puede apuntar sus fallos (para enterarnos de lo que se rompe).
create table if not exists public.client_errors (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null default auth.uid(),
  message text not null check (char_length(message) <= 500),
  stack text check (char_length(stack) <= 4000),
  context text check (char_length(context) <= 500),
  version text check (char_length(version) <= 40),
  url text check (char_length(url) <= 300),
  created_at timestamptz not null default now()
);
create index if not exists client_errors_at on public.client_errors (created_at desc);
alter table public.client_errors enable row level security;
create policy "errores: cada una apunta los suyos" on public.client_errors for insert to authenticated with check (user_id = auth.uid());
-- Nadie los lee desde el navegador: se miran en el panel de Supabase.

create or replace function public.client_errors_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from client_errors where user_id = new.user_id and created_at > now() - interval '1 hour') >= 30 then
    return null; -- se descarta en silencio: no queremos que un bucle llene la tabla
  end if;
  new.created_at := now();
  return new;
end $$;
drop trigger if exists client_errors_guard on public.client_errors;
create trigger client_errors_guard before insert on public.client_errors for each row execute function public.client_errors_guard();

-- 3) Cuota de IA también por conexión (IP con hash): crear invitadas nuevas ya no da llamadas infinitas.
create table if not exists public.ai_usage_ip (
  ip_hash text not null,
  day date not null default current_date,
  calls int not null default 0,
  primary key (ip_hash, day)
);
alter table public.ai_usage_ip enable row level security;
-- Sin políticas: solo la toca la función del servidor.

create or replace function public.ai_take_ip(p_ip text, p_limit int)
returns int language plpgsql security definer set search_path = public as $$
declare v int;
begin
  insert into ai_usage_ip (ip_hash, day, calls) values (p_ip, current_date, 1)
  on conflict (ip_hash, day) do update set calls = ai_usage_ip.calls + 1
  returning calls into v;
  if v > p_limit then
    update ai_usage_ip set calls = calls - 1 where ip_hash = p_ip and day = current_date;
    return -1;
  end if;
  return v;
end $$;
revoke all on function public.ai_take_ip(text, int) from public, anon, authenticated;
