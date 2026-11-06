-- ════════════════════════════════════════════════════════════════════
-- Helens Haven · 2 of 4 · Booking rules (triggers, conflict protection, public submission function)
-- ════════════════════════════════════════════════════════════════════
-- Rules enforced INSIDE the database:
--   • Two CONFIRMED bookings can never overlap on the same facility (exclusion constraint).
--   • A booking cannot be confirmed into a blocked / maintenance period.
--   • A block cannot be created over an existing confirmed booking.
--   • PENDING bookings never hold a slot.

-- Local date/time → timestamps (Africa/Lusaka, UTC+2, no daylight saving).
create or replace function public.bookings_set_window()
returns trigger language plpgsql as $$
begin
  new.starts_at := (new.event_date + new.start_time) at time zone 'Africa/Lusaka';
  new.ends_at   := (new.event_date + new.end_time)   at time zone 'Africa/Lusaka';
  if new.ends_at <= new.starts_at then
    new.ends_at := new.ends_at + interval '1 day';   -- ends after midnight
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger bookings_set_window before insert or update on public.bookings
  for each row execute function public.bookings_set_window();

-- New booking_facilities rows copy the time window and "confirmed?" flag from their booking.
create or replace function public.booking_facilities_sync_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare b record;
begin
  select status, starts_at, ends_at into b from public.bookings where id = new.booking_id;
  if not found then
    raise exception 'BOOKING_NOT_FOUND' using errcode = 'P0001';
  end if;
  new.during := tstzrange(b.starts_at, b.ends_at, '[)');
  new.holds_slot := (b.status = 'confirmed');
  return new;
end $$;
create trigger trg_bf_1_sync before insert on public.booking_facilities
  for each row execute function public.booking_facilities_sync_insert();

-- A slot-holding row may not overlap a block. (Booking-vs-booking is the exclusion constraint's job.)
create or replace function public.booking_facilities_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.holds_slot then
    perform pg_advisory_xact_lock(hashtext('hh_booking_slots'));
    if exists (
      select 1 from public.blocked_dates bd
       where tstzrange(bd.starts_at, bd.ends_at, '[)') && new.during
         and (bd.facility_id is null or bd.facility_id = new.facility_id)
    ) then
      raise exception 'SLOT_BLOCKED' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
create trigger trg_bf_2_guard before insert or update on public.booking_facilities
  for each row execute function public.booking_facilities_guard();

-- When a booking's status or time changes, push that into its facility rows.
-- Confirming or rescheduling a confirmed booking therefore re-runs the exclusion constraint.
create or replace function public.bookings_sync_facilities()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.status, new.starts_at, new.ends_at) is distinct from (old.status, old.starts_at, old.ends_at) then
    update public.booking_facilities
       set during = tstzrange(new.starts_at, new.ends_at, '[)'),
           holds_slot = (new.status = 'confirmed')
     where booking_id = new.id;
  end if;
  return null;
end $$;
create trigger trg_bookings_sync after update on public.bookings
  for each row execute function public.bookings_sync_facilities();

-- Blocks cannot be placed over confirmed bookings.
create or replace function public.blocked_dates_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtext('hh_booking_slots'));
  if exists (
    select 1 from public.booking_facilities bf
     where bf.holds_slot
       and bf.during && tstzrange(new.starts_at, new.ends_at, '[)')
       and (new.facility_id is null or bf.facility_id = new.facility_id)
  ) then
    raise exception 'BLOCK_CONFLICTS_WITH_CONFIRMED_BOOKING' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger trg_blocked_dates_guard before insert or update on public.blocked_dates
  for each row execute function public.blocked_dates_guard();

-- ───────── Public booking submission ─────────
-- Called ONLY by the Next.js API route with the service role (execute is revoked from everyone else).
-- It validates facilities, refuses requests that overlap a confirmed booking or a block, then inserts the
-- booking and its facility rows in a single transaction. Output columns are prefixed to avoid name clashes.
create or replace function public.create_booking_request(
  p_full_name text,
  p_email text,
  p_phone text,
  p_event_type text,
  p_event_date date,
  p_start_time time,
  p_end_time time,
  p_guests integer,
  p_notes text,
  p_facility_slugs text[],
  p_status text default 'pending'
)
returns table (out_id uuid, out_reference text, out_status text)
language plpgsql security definer set search_path = public as $$
declare
  v_ids uuid[];
  v_requested integer;
  v_start timestamptz;
  v_end timestamptz;
  v_id uuid;
  v_ref text;
begin
  if p_status not in ('pending', 'confirmed') then
    raise exception 'INVALID_STATUS' using errcode = 'P0001';
  end if;

  select count(distinct s) into v_requested from unnest(p_facility_slugs) as s;
  select array_agg(f.id) into v_ids
    from public.venue_facilities f
   where f.slug = any (p_facility_slugs) and f.is_active;
  if v_ids is null or cardinality(v_ids) <> v_requested then
    raise exception 'FACILITY_UNAVAILABLE' using errcode = 'P0001';
  end if;

  v_start := (p_event_date + p_start_time) at time zone 'Africa/Lusaka';
  v_end   := (p_event_date + p_end_time)   at time zone 'Africa/Lusaka';
  if v_end <= v_start then v_end := v_end + interval '1 day'; end if;

  perform pg_advisory_xact_lock(hashtext('hh_booking_slots'));

  if exists (
    select 1 from public.booking_facilities bf
     where bf.holds_slot and bf.facility_id = any (v_ids) and bf.during && tstzrange(v_start, v_end, '[)')
  ) then
    raise exception 'SLOT_UNAVAILABLE' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.blocked_dates bd
     where tstzrange(bd.starts_at, bd.ends_at, '[)') && tstzrange(v_start, v_end, '[)')
       and (bd.facility_id is null or bd.facility_id = any (v_ids))
  ) then
    raise exception 'SLOT_BLOCKED' using errcode = 'P0001';
  end if;

  insert into public.bookings (full_name, email, phone, event_type, event_date, start_time, end_time, guests, notes, status)
  values (p_full_name, lower(p_email), p_phone, p_event_type, p_event_date, p_start_time, p_end_time, p_guests, p_notes, p_status)
  returning id, reference into v_id, v_ref;

  insert into public.booking_facilities (booking_id, facility_id)
  select v_id, unnest(v_ids);

  return query select v_id, v_ref, p_status;
end $$;

revoke all on function public.create_booking_request(text, text, text, text, date, time, time, integer, text, text[], text) from public, anon, authenticated;
grant execute on function public.create_booking_request(text, text, text, text, date, time, time, integer, text, text[], text) to service_role;
