-- =====================================================
--  Idle Marie – Bestenliste, Admin-Menü, Belohnungs-Codes, Nachricht an alle, Lauftext
--
--  Einmal im Supabase-Dashboard unter "SQL Editor" einfügen und auf "Run" klicken.
--  Kann gefahrlos mehrmals ausgeführt werden. Benutzt nur eigene Tabellen und Funktionen
--  mit der Vorsilbe im_ – die anderen Spiele im selben Projekt bleiben unberührt.
--
--  DIE ADMIN-PIN STEHT NICHT IN DIESER DATEI (die liegt öffentlich auf GitHub)!
--  Danach im SQL Editor einmal separat ausführen (eigene PIN einsetzen):
--      select public.im_admin_pin_setzen('123456');
--  Gespeichert wird nur ein verschlüsselter Fingerabdruck (bcrypt).
--
--  Sicherheit:
--  • Alle Tabellen sind für Besucher gesperrt (RLS an, keine Rechte) – Zugriff nur über die Funktionen.
--  • Jeder Spieler hat ein Geheimnis: Nur wer es kennt, kann seinen Eintrag ändern oder löschen.
--  • Admin-Funktionen prüfen bei JEDEM Aufruf die PIN. Nach 5 falschen Versuchen 30 Minuten gesperrt.
--  • Gespeichert werden nur Spitznamen und Spielwerte – keine echten Namen, keine E-Mail.
-- =====================================================

create extension if not exists pgcrypto with schema extensions;

-- =====================================================
--  BESTENLISTE
-- =====================================================

create table if not exists public.im_bestenliste (
  spieler_id   uuid             primary key,
  geheimnis    text             not null,
  name         text             not null,
  figur        text             not null default 'marie',
  begleiter    text             not null default '',
  gesamtstufe  integer          not null default 0,
  xp_gesamt    double precision not null default 0,
  kampfstufe   integer          not null default 0,
  monster      integer          not null default 0,
  haustiere    integer          not null default 0,
  erfolge      integer          not null default 0,
  woche        text,
  woche_start  double precision not null default 0,   -- Erfahrung zu Beginn der Woche
  vorwoche     text,
  vorwoche_xp  double precision not null default 0,
  aktualisiert timestamptz      not null default now()
);
create unique index if not exists im_bestenliste_name_einmalig on public.im_bestenliste (lower(name));
alter table public.im_bestenliste enable row level security;
revoke all on public.im_bestenliste from anon, authenticated;

-- Welche Woche ist gerade? z.B. "2026-W47" (deutsche Zeit, Woche beginnt Montag)
create or replace function public.im_woche(p_zeit timestamptz)
returns text
language sql
immutable
as $$ select to_char(p_zeit at time zone 'Europe/Berlin', 'IYYY-"W"IW') $$;

create or replace function public.im_melde(
  p_spieler_id  uuid,
  p_geheimnis   text,
  p_name        text,
  p_figur       text,
  p_begleiter   text,
  p_gesamtstufe integer,
  p_xp_gesamt   double precision,
  p_kampfstufe  integer,
  p_monster     integer,
  p_haustiere   integer,
  p_erfolge     integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name  text := trim(p_name);
  v_woche text := im_woche(now());
  v_anderer record;
begin
  if length(v_name) < 1 or length(v_name) > 16 then
    raise exception 'Der Spitzname muss 1 bis 16 Zeichen lang sein.';
  end if;
  if length(p_geheimnis) < 16 or length(p_geheimnis) > 64 then
    raise exception 'Ungültige Anmeldung.';
  end if;
  if not (p_gesamtstufe between 0 and 5000) or not (p_xp_gesamt between 0 and 1e12) or not (p_kampfstufe between 0 and 200)
     or not (p_monster between 0 and 100000000) or not (p_haustiere between 0 and 100) or not (p_erfolge between 0 and 1000)
     or length(coalesce(p_figur, '')) > 16 or length(coalesce(p_begleiter, '')) > 16 then
    raise exception 'Ungültige Werte.';
  end if;
  -- Spitzname schon bei einem ANDEREN Spieler?
  -- gerade aktiv (15 Minuten) -> ablehnen; sonst ist es wohl dasselbe Kind auf neuem Gerät -> übernehmen
  select spieler_id, aktualisiert into v_anderer
  from im_bestenliste where lower(name) = lower(v_name) and spieler_id <> p_spieler_id;
  if found then
    if v_anderer.aktualisiert > now() - interval '15 minutes' then
      raise exception 'Den Spitznamen „%“ benutzt gerade jemand anderes. Bitte nimm einen anderen.', v_name;
    end if;
    if exists (select 1 from im_bestenliste where spieler_id = p_spieler_id) then
      delete from im_bestenliste where spieler_id = v_anderer.spieler_id;
    else
      update im_bestenliste set spieler_id = p_spieler_id, geheimnis = p_geheimnis where spieler_id = v_anderer.spieler_id;
    end if;
  end if;
  if not exists (select 1 from im_bestenliste where spieler_id = p_spieler_id)
     and (select count(*) from im_bestenliste) >= 100 then
    raise exception 'Die Bestenliste ist schon voll (100 Spieler).';
  end if;

  insert into im_bestenliste as b
    (spieler_id, geheimnis, name, figur, begleiter, gesamtstufe, xp_gesamt, kampfstufe, monster, haustiere, erfolge, woche, woche_start, aktualisiert)
  values
    (p_spieler_id, p_geheimnis, v_name, coalesce(p_figur, 'marie'), coalesce(p_begleiter, ''), p_gesamtstufe, p_xp_gesamt,
     p_kampfstufe, p_monster, p_haustiere, p_erfolge, v_woche, p_xp_gesamt, now())
  on conflict (spieler_id) do update
    set vorwoche    = case when b.woche is distinct from v_woche then b.woche else b.vorwoche end,
        vorwoche_xp = case when b.woche is null then 0
                           when b.woche <> v_woche then greatest(0, b.xp_gesamt - b.woche_start)
                           else b.vorwoche_xp end,
        woche_start = case when b.woche is distinct from v_woche then least(b.xp_gesamt, excluded.xp_gesamt)
                           else least(b.woche_start, excluded.xp_gesamt) end,
        woche       = v_woche,
        name        = excluded.name,
        figur       = excluded.figur,
        begleiter   = excluded.begleiter,
        gesamtstufe = excluded.gesamtstufe,
        xp_gesamt   = excluded.xp_gesamt,
        kampfstufe  = excluded.kampfstufe,
        monster     = excluded.monster,
        haustiere   = excluded.haustiere,
        erfolge     = excluded.erfolge,
        aktualisiert = now()
    where b.geheimnis = excluded.geheimnis;   -- nur der Besitzer darf ändern
end;
$$;

-- Liste holen (Top 100). woche_xp = in dieser Woche gesammelte Erfahrung,
-- wochen_sieger = hat letzte Woche die meiste Erfahrung gesammelt
drop function if exists public.im_hole_liste();
create function public.im_hole_liste()
returns table (
  spieler_id uuid, name text, figur text, begleiter text, gesamtstufe integer, xp_gesamt double precision,
  kampfstufe integer, monster integer, haustiere integer, erfolge integer, aktualisiert timestamptz,
  woche_xp double precision, wochen_sieger boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with w as (select im_woche(now()) as jetzt, im_woche(now() - interval '7 days') as letzte),
  d as (
    select b.*,
           case when b.woche = w.jetzt then greatest(0, b.xp_gesamt - b.woche_start) else 0 end as diese,
           case when b.woche = w.letzte then greatest(0, b.xp_gesamt - b.woche_start)
                when b.vorwoche = w.letzte then b.vorwoche_xp else 0 end as letzte
    from im_bestenliste b, w
  )
  select spieler_id, name, figur, begleiter, gesamtstufe, xp_gesamt, kampfstufe, monster, haustiere, erfolge, aktualisiert,
         diese, (letzte > 0 and letzte = max(letzte) over ())
  from d
  order by gesamtstufe desc, xp_gesamt desc
  limit 100;
$$;

create or replace function public.im_verlasse(p_spieler_id uuid, p_geheimnis text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from im_bestenliste where spieler_id = p_spieler_id and geheimnis = p_geheimnis;
$$;


-- =====================================================
--  ADMIN-PIN
-- =====================================================

create table if not exists public.im_admin (
  id            integer primary key default 1 check (id = 1),
  pin_hash      text,
  fehlversuche  integer not null default 0,
  gesperrt_bis  timestamptz
);
alter table public.im_admin enable row level security;
revoke all on public.im_admin from anon, authenticated;

-- PIN setzen – NUR im SQL Editor (Besitzer), für Besucher gesperrt
create or replace function public.im_admin_pin_setzen(p_pin text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into im_admin (id, pin_hash, fehlversuche, gesperrt_bis)
  values (1, extensions.crypt(p_pin, extensions.gen_salt('bf')), 0, null)
  on conflict (id) do update set pin_hash = excluded.pin_hash, fehlversuche = 0, gesperrt_bis = null;
$$;
revoke all on function public.im_admin_pin_setzen(text) from public, anon, authenticated;

-- Prüft die PIN. Rückgabe: null = richtig, sonst eine Fehlermeldung (kein raise, sonst zählt der Fehlversuch nicht)
create or replace function public.im_admin_fehler(p_pin text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare a im_admin;
begin
  select * into a from im_admin where id = 1 for update;
  if not found or a.pin_hash is null then return 'Der Admin-Zugang ist noch nicht eingerichtet.'; end if;
  if a.gesperrt_bis is not null and a.gesperrt_bis > now() then return 'Zu viele falsche Versuche – bitte in 30 Minuten nochmal.'; end if;
  if p_pin is null or extensions.crypt(p_pin, a.pin_hash) <> a.pin_hash then
    update im_admin
      set fehlversuche = fehlversuche + 1,
          gesperrt_bis = case when fehlversuche + 1 >= 5 then now() + interval '30 minutes' else null end
      where id = 1;
    return 'Falsche PIN.';
  end if;
  update im_admin set fehlversuche = 0, gesperrt_bis = null where id = 1;
  return null;
end;
$$;
revoke all on function public.im_admin_fehler(text) from public, anon, authenticated;

create or replace function public.im_admin_anmelden(p_pin text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare f text := im_admin_fehler(p_pin);
begin
  if f is not null then return json_build_object('fehler', f); end if;
  return json_build_object('ok', true);
end;
$$;


-- =====================================================
--  BELOHNUNGS-CODES (z.B. für ein gutes Zeugnis)
--  art: muenzen (Anzahl) | trank (Anzahl Glücks-Tränke) | samen (Anzahl Samen-Päckchen)
-- =====================================================

create table if not exists public.im_codes (
  code            text primary key,
  art             text not null,
  menge           double precision not null,
  text            text not null default '',
  erstellt        timestamptz not null default now(),
  eingeloest_am   timestamptz,
  eingeloest_von  text
);
alter table public.im_codes enable row level security;
revoke all on public.im_codes from anon, authenticated;

create or replace function public.im_admin_code_erstellen(p_pin text, p_art text, p_menge double precision, p_text text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  f text := im_admin_fehler(p_pin);
  zeichen text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  if f is not null then return json_build_object('fehler', f); end if;
  if p_art not in ('muenzen', 'trank', 'samen') or not (p_menge > 0 and p_menge <= 100000000) then
    return json_build_object('fehler', 'Ungültige Belohnung.');
  end if;
  loop
    v_code := '';
    for i in 1..8 loop v_code := v_code || substr(zeichen, 1 + floor(random() * length(zeichen))::int, 1); end loop;
    exit when not exists (select 1 from im_codes where code = v_code);
  end loop;
  insert into im_codes (code, art, menge, text) values (v_code, p_art, p_menge, left(coalesce(trim(p_text), ''), 80));
  return json_build_object('code', v_code);
end;
$$;

create or replace function public.im_admin_codes(p_pin text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare f text := im_admin_fehler(p_pin);
begin
  if f is not null then return json_build_object('fehler', f); end if;
  return json_build_object('codes', coalesce((
    select json_agg(c order by c.erstellt desc)
    from (select code, art, menge, text, erstellt, eingeloest_am, eingeloest_von from im_codes order by erstellt desc limit 20) c), '[]'::json));
end;
$$;

create or replace function public.im_loese_code(p_code text, p_wer text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  c im_codes;
begin
  select * into c from im_codes where code = v_code for update;
  if not found then raise exception 'Diesen Code gibt es nicht. Bitte genau abschreiben.'; end if;
  if c.eingeloest_am is not null then raise exception 'Dieser Code wurde schon eingelöst.'; end if;
  update im_codes set eingeloest_am = now(), eingeloest_von = left(coalesce(p_wer, ''), 32) where code = v_code;
  return json_build_object('art', c.art, 'menge', c.menge, 'text', c.text);
end;
$$;


-- =====================================================
--  NACHRICHT AN ALLE und LAUFTEXT
-- =====================================================

create table if not exists public.im_nachrichten (
  id        bigint generated always as identity primary key,
  text      text not null,
  erstellt  timestamptz not null default now(),
  bis       timestamptz not null
);
create table if not exists public.im_lauftext (
  id       integer primary key default 1 check (id = 1),
  text     text not null,
  erstellt timestamptz not null default now()
);
alter table public.im_nachrichten enable row level security;
alter table public.im_lauftext enable row level security;
revoke all on public.im_nachrichten, public.im_lauftext from anon, authenticated;

-- p_text leer = aktuelle Nachricht beenden
create or replace function public.im_admin_nachricht(p_pin text, p_text text, p_tage integer)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare f text := im_admin_fehler(p_pin);
begin
  if f is not null then return json_build_object('fehler', f); end if;
  update im_nachrichten set bis = now() where bis > now();
  if length(trim(coalesce(p_text, ''))) > 0 then
    insert into im_nachrichten (text, bis)
    values (left(trim(p_text), 300), now() + make_interval(days => greatest(1, least(coalesce(p_tage, 3), 30))));
  end if;
  return json_build_object('ok', true);
end;
$$;

create or replace function public.im_hole_nachricht()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object('id', id, 'text', text, 'bis', bis) from im_nachrichten where bis > now() order by erstellt desc limit 1;
$$;

-- p_text leer = Lauftext entfernen
create or replace function public.im_admin_lauftext(p_pin text, p_text text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare f text := im_admin_fehler(p_pin);
begin
  if f is not null then return json_build_object('fehler', f); end if;
  if length(trim(coalesce(p_text, ''))) = 0 then
    delete from im_lauftext where id = 1;
  else
    insert into im_lauftext (id, text, erstellt) values (1, left(trim(p_text), 200), now())
    on conflict (id) do update set text = excluded.text, erstellt = excluded.erstellt;
  end if;
  return json_build_object('ok', true);
end;
$$;

create or replace function public.im_hole_lauftext()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object('text', text, 'erstellt', erstellt) from im_lauftext where id = 1;
$$;


-- =====================================================
--  BESTENLISTE MODERIEREN
-- =====================================================

create or replace function public.im_admin_eintrag_loeschen(p_pin text, p_spieler_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare f text := im_admin_fehler(p_pin);
begin
  if f is not null then return json_build_object('fehler', f); end if;
  delete from im_bestenliste where spieler_id = p_spieler_id;
  return json_build_object('ok', true);
end;
$$;

create or replace function public.im_admin_eintrag_umbenennen(p_pin text, p_spieler_id uuid, p_name text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  f text := im_admin_fehler(p_pin);
  v_name text := trim(coalesce(p_name, ''));
begin
  if f is not null then return json_build_object('fehler', f); end if;
  if length(v_name) < 1 or length(v_name) > 16 then return json_build_object('fehler', 'Der Spitzname muss 1 bis 16 Zeichen lang sein.'); end if;
  if exists (select 1 from im_bestenliste where lower(name) = lower(v_name) and spieler_id <> p_spieler_id) then
    return json_build_object('fehler', 'Diesen Spitznamen gibt es schon.');
  end if;
  update im_bestenliste set name = v_name where spieler_id = p_spieler_id;
  return json_build_object('ok', true);
end;
$$;


-- =====================================================
--  RECHTE: Besucher dürfen nur diese Funktionen aufrufen
-- =====================================================
revoke all on function public.im_woche(timestamptz) from public;
revoke all on function public.im_melde(uuid, text, text, text, text, integer, double precision, integer, integer, integer, integer) from public;
revoke all on function public.im_hole_liste() from public;
revoke all on function public.im_verlasse(uuid, text) from public;
revoke all on function public.im_admin_anmelden(text) from public;
revoke all on function public.im_admin_code_erstellen(text, text, double precision, text) from public;
revoke all on function public.im_admin_codes(text) from public;
revoke all on function public.im_loese_code(text, text) from public;
revoke all on function public.im_admin_nachricht(text, text, integer) from public;
revoke all on function public.im_hole_nachricht() from public;
revoke all on function public.im_admin_lauftext(text, text) from public;
revoke all on function public.im_hole_lauftext() from public;
revoke all on function public.im_admin_eintrag_loeschen(text, uuid) from public;
revoke all on function public.im_admin_eintrag_umbenennen(text, uuid, text) from public;

grant execute on function public.im_melde(uuid, text, text, text, text, integer, double precision, integer, integer, integer, integer) to anon, authenticated;
grant execute on function public.im_hole_liste() to anon, authenticated;
grant execute on function public.im_verlasse(uuid, text) to anon, authenticated;
grant execute on function public.im_admin_anmelden(text) to anon, authenticated;
grant execute on function public.im_admin_code_erstellen(text, text, double precision, text) to anon, authenticated;
grant execute on function public.im_admin_codes(text) to anon, authenticated;
grant execute on function public.im_loese_code(text, text) to anon, authenticated;
grant execute on function public.im_admin_nachricht(text, text, integer) to anon, authenticated;
grant execute on function public.im_hole_nachricht() to anon, authenticated;
grant execute on function public.im_admin_lauftext(text, text) to anon, authenticated;
grant execute on function public.im_hole_lauftext() to anon, authenticated;
grant execute on function public.im_admin_eintrag_loeschen(text, uuid) to anon, authenticated;
grant execute on function public.im_admin_eintrag_umbenennen(text, uuid, text) to anon, authenticated;
