-- Límites que faltaban: que nadie pueda llenar la base de datos desde el navegador.

-- 1) Partida en la nube: como mucho lo que cabe en el localStorage de un navegador (unos 5 MB).
alter table public.saves drop constraint if exists saves_tamano;
alter table public.saves add constraint saves_tamano check (pg_column_size(data) <= 6000000) not valid;

-- 2) Memoria larga: un resumen por temporada jugada; con 20 al día va sobrado.
create or replace function public.memories_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from memories where user_id = new.user_id and created_at > now() - interval '1 day') >= 20 then
    raise exception 'límite diario de recuerdos';
  end if;
  new.created_at := now();
  return new;
end $$;
drop trigger if exists memories_guard on public.memories;
create trigger memories_guard before insert on public.memories for each row execute function public.memories_guard();
