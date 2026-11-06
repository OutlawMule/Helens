-- ════════════════════════════════════════════════════════════════════
-- TEST DATA ONLY. Not for production. Run once, after the four migrations.
-- Every row uses an @example.test address so it is easy to find and remove:
--   delete from public.bookings      where email like '%@example.test';
--   delete from public.blocked_dates where reason like 'TEST DATA%';
-- Find references to test the lookup page (reference + email together):
--   select reference, email, status from public.bookings where email like '%@example.test';
-- ════════════════════════════════════════════════════════════════════
do $$
declare
  arena uuid; pool uuid; fire uuid; pub uuid; nursery uuid; b uuid;
begin
  select id into arena   from public.venue_facilities where slug = 'open-arena';
  select id into pool    from public.venue_facilities where slug = 'swimming-pool';
  select id into fire    from public.venue_facilities where slug = 'fire-pit-lounge';
  select id into pub     from public.venue_facilities where slug = 'pub-restaurant';
  select id into nursery from public.venue_facilities where slug = 'flower-nursery';
  if arena is null then raise exception 'Run the migrations first (facilities are missing).'; end if;

  -- 1. CONFIRMED wedding (arena + pub), 21 days from today
  insert into public.bookings (full_name, email, phone, event_type, event_date, start_time, end_time, guests, notes, status)
  values ('TEST Confirmed Wedding', 'confirmed@example.test', '+260 970 000 001', 'wedding', current_date + 21, '12:00', '23:00', 120, 'TEST DATA: confirmed wedding.', 'confirmed')
  returning id into b;
  insert into public.booking_facilities (booking_id, facility_id) values (b, arena), (b, pub);

  -- 2. PENDING request on a free date (pool + fire pit), 10 days out
  insert into public.bookings (full_name, email, phone, event_type, event_date, start_time, end_time, guests, notes)
  values ('TEST Pending Birthday', 'pending@example.test', '+260 970 000 002', 'private-celebration', current_date + 10, '14:00', '20:00', 35, 'TEST DATA: pending request, approve it from the admin panel.')
  returning id into b;
  insert into public.booking_facilities (booking_id, facility_id) values (b, pool), (b, fire);

  -- 3. PENDING request that OVERLAPS booking 1 on the arena. The website refuses these at submission; this row is
  --    inserted directly so you can watch the database refuse to CONFIRM it (conflict protection test).
  insert into public.bookings (full_name, email, phone, event_type, event_date, start_time, end_time, guests, notes)
  values ('TEST Conflicting Request', 'conflict@example.test', '+260 970 000 003', 'corporate', current_date + 21, '16:00', '22:00', 60, 'TEST DATA: overlaps the confirmed wedding. Approving must fail.')
  returning id into b;
  insert into public.booking_facilities (booking_id, facility_id) values (b, arena);

  -- 4. CONFIRMED overnight concert (ends after midnight), 35 days out
  insert into public.bookings (full_name, email, phone, event_type, event_date, start_time, end_time, guests, notes, status)
  values ('TEST Overnight Concert', 'concert@example.test', '+260 970 000 004', 'outdoor-concert', current_date + 35, '18:00', '02:00', 300, 'TEST DATA: ends the next day.', 'confirmed')
  returning id into b;
  insert into public.booking_facilities (booking_id, facility_id) values (b, arena);

  -- 5-7. One each of rejected / cancelled / completed
  insert into public.bookings (full_name, email, phone, event_type, event_date, start_time, end_time, guests, notes, status)
  values ('TEST Rejected Request', 'rejected@example.test', '+260 970 000 005', 'garden-event', current_date + 28, '10:00', '15:00', 40, 'TEST DATA', 'rejected')
  returning id into b;
  insert into public.booking_facilities (booking_id, facility_id) values (b, nursery);

  insert into public.bookings (full_name, email, phone, event_type, event_date, start_time, end_time, guests, notes, status)
  values ('TEST Cancelled Booking', 'cancelled@example.test', '+260 970 000 006', 'private-celebration', current_date + 5, '13:00', '18:00', 25, 'TEST DATA', 'cancelled')
  returning id into b;
  insert into public.booking_facilities (booking_id, facility_id) values (b, fire);

  insert into public.bookings (full_name, email, phone, event_type, event_date, start_time, end_time, guests, notes, status)
  values ('TEST Completed Event', 'completed@example.test', '+260 970 000 007', 'corporate', current_date - 14, '09:00', '16:00', 50, 'TEST DATA', 'completed')
  returning id into b;
  insert into public.booking_facilities (booking_id, facility_id) values (b, arena), (b, pub);

  -- Maintenance block on the pool, 14 to 16 days out (whole days, Africa/Lusaka)
  insert into public.blocked_dates (facility_id, kind, starts_at, ends_at, all_day, reason)
  values (pool, 'maintenance', ((current_date + 14) + time '00:00') at time zone 'Africa/Lusaka', ((current_date + 17) + time '00:00') at time zone 'Africa/Lusaka', true, 'TEST DATA: pool servicing');
end $$;
