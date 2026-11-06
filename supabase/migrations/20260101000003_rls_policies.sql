-- ════════════════════════════════════════════════════════════════════
-- Helens Haven · 3 of 4 · Row Level Security
-- ════════════════════════════════════════════════════════════════════
-- Principle: the public (anon) role can read ONLY published website content. It can never read bookings,
-- blocks, messages or logs, and can never write anything. Public bookings, availability, lookups and
-- contact messages go through server-side API routes that use the service role after validating input.

alter table public.profiles           enable row level security;
alter table public.venue_facilities   enable row level security;
alter table public.bookings           enable row level security;
alter table public.booking_facilities enable row level security;
alter table public.blocked_dates      enable row level security;
alter table public.gallery_images     enable row level security;
alter table public.testimonials       enable row level security;
alter table public.website_content    enable row level security;
alter table public.activity_logs      enable row level security;
alter table public.contact_messages   enable row level security;

-- Defence in depth: private tables are not even granted to anon.
revoke all on public.bookings, public.booking_facilities, public.blocked_dates, public.activity_logs, public.contact_messages, public.profiles from anon;

-- profiles: a user reads their own row; admins read and edit all. Nobody can self-promote
-- (there is no update policy for ordinary users, and no insert policy at all: the signup trigger creates rows).
create policy "profiles: read own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles: admins read all" on public.profiles for select to authenticated using (public.is_admin());
create policy "profiles: admins update" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- venue facilities: public can see active ones; admins manage everything
create policy "facilities: public read active" on public.venue_facilities for select to anon, authenticated using (is_active);
create policy "facilities: admins all" on public.venue_facilities for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- bookings & facility rows: admins only
create policy "bookings: admins all" on public.bookings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "booking_facilities: admins all" on public.booking_facilities for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- blocks, logs, messages: admins only (logs are append-only: no update or delete policy exists)
create policy "blocked_dates: admins all" on public.blocked_dates for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "activity_logs: admins read" on public.activity_logs for select to authenticated using (public.is_admin());
create policy "activity_logs: admins insert" on public.activity_logs for insert to authenticated with check (public.is_admin() and admin_id = auth.uid());
create policy "contact_messages: admins all" on public.contact_messages for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- public website content: published rows only
create policy "gallery: public read published" on public.gallery_images for select to anon, authenticated using (is_published);
create policy "gallery: admins all" on public.gallery_images for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "testimonials: public read published" on public.testimonials for select to anon, authenticated using (is_published);
create policy "testimonials: admins all" on public.testimonials for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "content: public read public rows" on public.website_content for select to anon, authenticated using (is_public);
create policy "content: admins all" on public.website_content for all to authenticated using (public.is_admin()) with check (public.is_admin());
