-- ════════════════════════════════════════════════════════════════════
-- Helens Haven · 1 of 4 · Core schema
-- Run the four migration files in order (SQL Editor or `supabase db push`).
-- ════════════════════════════════════════════════════════════════════

-- Needed so a GiST exclusion constraint can combine "same facility" (=) with "overlapping time" (&&).
create extension if not exists btree_gist with schema extensions;

-- ───────── helpers ─────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Human-friendly booking reference, e.g. HH-7K3PQ9 (no 0/O/1/I to avoid misreading).
create or replace function public.generate_booking_reference()
returns text language plpgsql as $$
declare
  chars constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  ref text;
  i int;
begin
  loop
    ref := 'HH-';
    for i in 1..6 loop
      ref := ref || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.bookings b where b.reference = ref);
  end loop;
  return ref;
end $$;

-- ───────── profiles (one row per auth user; role decides admin access) ─────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

-- Every new auth user gets a profile with role 'user'. Nobody becomes admin automatically.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────── venue facilities ─────────
create table public.venue_facilities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,   -- false = hidden from new booking requests
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger venue_facilities_set_updated_at before update on public.venue_facilities
  for each row execute function public.set_updated_at();

-- ───────── bookings ─────────
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default public.generate_booking_reference(),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')),
  full_name text not null check (char_length(full_name) between 2 and 100),
  email text not null check (char_length(email) between 5 and 200),
  phone text not null check (char_length(phone) between 7 and 25),
  event_type text not null
    check (event_type in ('wedding', 'private-celebration', 'corporate', 'outdoor-concert', 'garden-event', 'other')),
  event_date date not null,
  start_time time not null,
  end_time time not null,
  -- Maintained by trigger from the local (Africa/Lusaka) date and times. If end_time <= start_time the event
  -- is treated as ending the next day.
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  guests int not null check (guests between 1 and 10000),   -- sanity bound, not a venue capacity
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (start_time <> end_time)
);
create index bookings_status_idx on public.bookings (status);
create index bookings_event_date_idx on public.bookings (event_date);
create index bookings_starts_at_idx on public.bookings (starts_at);
create index bookings_email_idx on public.bookings (lower(email));
create index bookings_created_idx on public.bookings (created_at desc);

-- ───────── booking facilities (which spaces a booking uses) ─────────
-- `during` and `holds_slot` are copies kept in sync by triggers (migration 2). They let PostgreSQL itself
-- refuse two CONFIRMED bookings that overlap on the same facility, no matter which code path writes the data.
create table public.booking_facilities (
  booking_id uuid not null references public.bookings (id) on delete cascade,
  facility_id uuid not null references public.venue_facilities (id) on delete restrict,
  during tstzrange not null,
  holds_slot boolean not null default false,
  primary key (booking_id, facility_id),
  constraint booking_facilities_no_overlap
    exclude using gist (facility_id with =, during with &&) where (holds_slot)
);
create index booking_facilities_facility_idx on public.booking_facilities (facility_id);

-- ───────── blocked dates / maintenance ─────────
create table public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references public.venue_facilities (id) on delete cascade,  -- null = whole venue
  kind text not null default 'blocked' check (kind in ('blocked', 'maintenance')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default true,
  reason text check (char_length(reason) <= 300),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index blocked_dates_range_idx on public.blocked_dates (starts_at, ends_at);

-- ───────── gallery ─────────
create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  title text not null check (char_length(title) between 1 and 120),
  alt_text text not null check (char_length(alt_text) between 1 and 240),
  category text not null default 'events'
    check (category in ('events', 'weddings', 'arena', 'pool-lounge', 'dining', 'nursery-garden')),
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create index gallery_images_order_idx on public.gallery_images (is_published, sort_order, created_at desc);

-- ───────── testimonials ─────────
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null check (char_length(author_name) between 2 and 100),
  author_context text check (char_length(author_context) <= 120),
  quote text not null check (char_length(quote) between 10 and 800),
  is_sample boolean not null default false,   -- sample content is always labelled on the site
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ───────── website content + settings (key → JSON) ─────────
create table public.website_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

-- ───────── administrative activity log (append-only) ─────────
create table public.activity_logs (
  id bigint generated always as identity primary key,
  admin_id uuid references public.profiles (id) on delete set null,
  admin_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activity_logs_created_idx on public.activity_logs (created_at desc);
create index activity_logs_entity_idx on public.activity_logs (entity_type, entity_id);

-- ───────── contact form messages ─────────
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) <= 200),
  phone text check (char_length(phone) <= 25),
  message text not null check (char_length(message) between 10 and 3000),
  status text not null default 'new' check (status in ('new', 'handled')),
  created_at timestamptz not null default now()
);
create index contact_messages_created_idx on public.contact_messages (created_at desc);
