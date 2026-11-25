-- =====================================================
--  Hannah Idle v1.34 – Gemeinschafts-Boss und Angel-Wettbewerb
--  Einmal im Supabase-Dashboard unter "SQL Editor" einfügen und auf "Run" klicken.
--  Kann gefahrlos mehrmals ausgeführt werden. Nur eigene Tabellen/Funktionen mit Vorsilbe im_.
--  Mitmachen kann nur, wer in der Bestenliste eingetragen ist (Spieler-ID + Geheimnis werden geprüft).
-- =====================================================

-- ----- Gemeinschafts-Boss: jede Woche (Montag bis Sonntag) ein neuer Boss -----
create table if not exists public.im_boss (
  woche    text   primary key,
  hp_max   bigint not null,
  schaden  bigint not null default 0,
  besiegt  timestamptz
);
create table if not exists public.im_boss_beitrag (
  woche       text   not null,
  spieler_id  uuid   not null,
  name        text   not null,
  schaden     bigint not null default 0,
  primary key (woche, spieler_id)
);
alter table public.im_boss enable row level security;
alter table public.im_boss_beitrag enable row level security;
revoke all on public.im_boss, public.im_boss_beitrag from anon, authenticated;

create or replace function public.im_boss_stand_intern(p_woche text, p_spieler_id uuid)
returns json language sql security definer set search_path = public as $$
  select json_build_object(
    'woche', b.woche, 'hp_max', b.hp_max, 'schaden', least(b.schaden, b.hp_max), 'besiegt', b.besiegt is not null,
    'helfer', (select count(*) from im_boss_beitrag x where x.woche = b.woche),
    'mein', coalesce((select x.schaden from im_boss_beitrag x where x.woche = b.woche and x.spieler_id = p_spieler_id), 0),
    'top', coalesce((select json_agg(json_build_object('name', t.name, 'schaden', t.schaden) order by t.schaden desc)
                     from (select name, schaden from im_boss_beitrag x where x.woche = b.woche order by schaden desc limit 10) t), '[]'::json))
  from im_boss b where b.woche = p_woche
$$;

-- Boss dieser Woche anlegen, falls es ihn noch nicht gibt (Leben wächst mit der Zahl der Helfer der Vorwoche)
create or replace function public.im_boss_woche()
returns text language plpgsql security definer set search_path = public as $$
declare v_woche text := im_woche(now()); v_vor int;
begin
  if not exists (select 1 from im_boss where woche = v_woche) then
    select count(*) into v_vor from im_boss_beitrag where woche = im_woche(now() - interval '7 days');
    insert into im_boss (woche, hp_max) values (v_woche, 2000000 + greatest(v_vor, 3) * 600000) on conflict do nothing;
  end if;
  return v_woche;
end;
$$;

create or replace function public.im_boss_stand(p_spieler_id uuid default null)
returns json language plpgsql security definer set search_path = public as $$
declare v_woche text := im_boss_woche();
begin
  return im_boss_stand_intern(v_woche, p_spieler_id);
end;
$$;

-- Schaden melden: höchstens 60.000 auf einmal und 1.500.000 pro Spieler und Woche
create or replace function public.im_boss_schlag(p_spieler_id uuid, p_geheimnis text, p_schaden integer)
returns json language plpgsql security definer set search_path = public as $$
declare v_woche text := im_boss_woche(); v_name text; v_jetzt bigint; v_neu bigint;
begin
  select name into v_name from im_bestenliste where spieler_id = p_spieler_id and geheimnis = p_geheimnis;
  if v_name is null then raise exception 'Trag dich zuerst in die Bestenliste ein.'; end if;
  if p_schaden is null or p_schaden < 1 then return im_boss_stand_intern(v_woche, p_spieler_id); end if;
  select coalesce(schaden, 0) into v_jetzt from im_boss_beitrag where woche = v_woche and spieler_id = p_spieler_id;
  v_neu := least(p_schaden, 60000, greatest(0, 1500000 - coalesce(v_jetzt, 0)));
  if v_neu > 0 then
    insert into im_boss_beitrag (woche, spieler_id, name, schaden) values (v_woche, p_spieler_id, v_name, v_neu)
      on conflict (woche, spieler_id) do update set schaden = im_boss_beitrag.schaden + v_neu, name = v_name;
    update im_boss set schaden = schaden + v_neu,
      besiegt = case when besiegt is null and schaden + v_neu >= hp_max then now() else besiegt end
      where woche = v_woche;
  end if;
  return im_boss_stand_intern(v_woche, p_spieler_id);
end;
$$;

-- ----- Angel-Wettbewerb: jeden Freitag, der schwerste Riesenwels gewinnt -----
create table if not exists public.im_angel (
  tag         text    not null,
  spieler_id  uuid    not null,
  name        text    not null,
  gewicht     numeric not null,
  zeit        timestamptz not null default now(),
  primary key (tag, spieler_id)
);
alter table public.im_angel enable row level security;
revoke all on public.im_angel from anon, authenticated;

create or replace function public.im_angel_melde(p_spieler_id uuid, p_geheimnis text, p_gewicht numeric)
returns void language plpgsql security definer set search_path = public as $$
declare v_name text; v_tag text := to_char(now() at time zone 'Europe/Berlin', 'YYYY-MM-DD');
begin
  if extract(isodow from now() at time zone 'Europe/Berlin') <> 5 then raise exception 'Der Angel-Wettbewerb ist nur freitags.'; end if;
  if p_gewicht is null or p_gewicht <= 0 or p_gewicht > 60 then raise exception 'Ungültiges Gewicht.'; end if;
  select name into v_name from im_bestenliste where spieler_id = p_spieler_id and geheimnis = p_geheimnis;
  if v_name is null then raise exception 'Trag dich zuerst in die Bestenliste ein.'; end if;
  insert into im_angel (tag, spieler_id, name, gewicht) values (v_tag, p_spieler_id, v_name, round(p_gewicht, 2))
    on conflict (tag, spieler_id) do update set gewicht = greatest(im_angel.gewicht, excluded.gewicht), name = v_name,
      zeit = case when excluded.gewicht > im_angel.gewicht then now() else im_angel.zeit end;
end;
$$;

-- Liste des letzten Wettbewerbs (heute, wenn Freitag ist – sonst der letzte Freitag)
create or replace function public.im_angel_liste()
returns json language sql security definer set search_path = public as $$
  with t as (select max(tag) as tag from im_angel)
  select json_build_object('tag', (select tag from t), 'liste', coalesce((select json_agg(json_build_object('name', a.name, 'gewicht', a.gewicht) order by a.gewicht desc, a.zeit asc)
    from (select * from im_angel where tag = (select tag from t) order by gewicht desc, zeit asc limit 20) a), '[]'::json))
$$;

revoke all on function public.im_boss_stand_intern(text, uuid) from public, anon, authenticated;
revoke all on function public.im_boss_woche() from public, anon, authenticated;
grant execute on function public.im_boss_stand(uuid) to anon, authenticated;
grant execute on function public.im_boss_schlag(uuid, text, integer) to anon, authenticated;
grant execute on function public.im_angel_melde(uuid, text, numeric) to anon, authenticated;
grant execute on function public.im_angel_liste() to anon, authenticated;
