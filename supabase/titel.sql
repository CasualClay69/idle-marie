-- =====================================================
--  Hannah Idle v1.36 – Titel in der Bestenliste
--  Einmal im Supabase-Dashboard unter "SQL Editor" einfügen und auf "Run" klicken.
--  Kann gefahrlos mehrmals ausgeführt werden. Nur eigene Tabellen/Funktionen mit Vorsilbe im_.
--  Gespeichert wird nur eine kurze Titel-KENNUNG (z. B. "drachen") – den Text dazu kennt nur das Spiel.
--  So kann niemand eigene Wörter in die Bestenliste schreiben.
-- =====================================================

create table if not exists public.im_titel (
  spieler_id uuid primary key,
  titel      text not null default ''
);
alter table public.im_titel enable row level security;
revoke all on public.im_titel from anon, authenticated;

create or replace function public.im_setze_titel(p_spieler_id uuid, p_geheimnis text, p_titel text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from im_bestenliste where spieler_id = p_spieler_id and geheimnis = p_geheimnis) then
    raise exception 'Trag dich zuerst in die Bestenliste ein.';
  end if;
  if coalesce(p_titel, '') !~ '^[a-z0-9-]{0,24}$' then raise exception 'Ungültiger Titel.'; end if;
  insert into im_titel (spieler_id, titel) values (p_spieler_id, coalesce(p_titel, ''))
    on conflict (spieler_id) do update set titel = excluded.titel;
end;
$$;

-- Alle Titel als { spieler_id: titel } (nur von Spielern, die noch in der Bestenliste stehen)
create or replace function public.im_hole_titel()
returns json language sql stable security definer set search_path = public as $$
  select coalesce(json_object_agg(t.spieler_id, t.titel), '{}'::json)
  from im_titel t join im_bestenliste b on b.spieler_id = t.spieler_id
  where t.titel <> ''
$$;

grant execute on function public.im_setze_titel(uuid, text, text) to anon, authenticated;
grant execute on function public.im_hole_titel() to anon, authenticated;
