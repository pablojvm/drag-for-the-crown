-- Hall of Fame mundial más fiable y más privado.

-- 1) El navegador manda su track record (las etiquetas de cada episodio) y el servidor calcula con él
--    el PPE, los retos ganados y si ganó; los números que mande el navegador no cuentan.
alter table public.board add column if not exists track text[];

create or replace function public.board_check()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_valid constant text[] := array['WIN','BWIN','WINNER','TOP2','BTOP','HIGH','SAFE','LOW','BTM2','BTM3','ELIM','RUNNER-UP','3ª','P3','P4','FINAL','FINAL-MISSC','MISSC','RTRN','MC','QOSD','ELIMF','FINALISTA','SINESTRELLA'];
  v_n int; v_sum numeric := 0; v_cnt int := 0; v_l text; v_i int := 0;
begin
  if new.track is null or array_length(new.track, 1) is null then raise exception 'falta el track record'; end if;
  v_n := array_length(new.track, 1);
  if v_n < 2 or v_n > 20 then raise exception 'track record raro'; end if;
  foreach v_l in array new.track loop
    v_i := v_i + 1;
    if not v_l = any (v_valid) then raise exception 'etiqueta desconocida: %', left(v_l, 12); end if;
    -- La final cierra la temporada: después no hay más episodios (ELIM no, que con la Segunda Oportunidrag se vuelve)
    if v_l in ('WINNER', 'RUNNER-UP') and v_i < v_n then raise exception 'track record incoherente'; end if;
    -- Mismo valor de cada etiqueta que el juego (src/core/track.ts)
    if v_l in ('WIN','BWIN','WINNER') then v_sum := v_sum + 5; v_cnt := v_cnt + 1;
    elsif v_l in ('TOP2','BTOP') then v_sum := v_sum + 4.5; v_cnt := v_cnt + 1;
    elsif v_l = 'HIGH' then v_sum := v_sum + 4; v_cnt := v_cnt + 1;
    elsif v_l = 'SAFE' then v_sum := v_sum + 3; v_cnt := v_cnt + 1;
    elsif v_l = 'LOW' then v_sum := v_sum + 2; v_cnt := v_cnt + 1;
    elsif v_l in ('BTM2','BTM3') then v_sum := v_sum + 1; v_cnt := v_cnt + 1;
    elsif v_l = 'ELIM' then v_cnt := v_cnt + 1;
    end if;
  end loop;
  new.ppe := case when v_cnt > 0 then round(v_sum / v_cnt, 2) else 0 end;
  new.wins := (select count(*) from unnest(new.track) t where t = 'WIN');
  new.won := 'WINNER' = any (new.track);
  -- Nadie gana todos los retos de una temporada entera
  if new.wins > greatest(2, ceil(v_n * 0.7)) then raise exception 'resultado incoherente'; end if;
  return new;
end $$;
-- Va antes que board_guard (los disparadores van por orden alfabético)
drop trigger if exists board_check on public.board;
create trigger board_check before insert on public.board for each row execute function public.board_check();

-- 2) Privacidad: todo el mundo ve el ranking, pero no el identificador interno de cada jugadora
revoke select on public.board from anon, authenticated;
grant select (id, name, season, queen, ppe, wins, won, place, created_at, track) on public.board to anon, authenticated;
