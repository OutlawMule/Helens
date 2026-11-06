-- ════════════════════════════════════════════════════════════════════
-- Helens Haven · 4 of 4 · Storage bucket, facilities and starter content
-- ════════════════════════════════════════════════════════════════════

-- Public bucket for gallery photos (images only, 10 MB each). Anyone can view; only admins can change.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery', 'gallery', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "gallery files: public read" on storage.objects for select using (bucket_id = 'gallery');
create policy "gallery files: admins insert" on storage.objects for insert to authenticated with check (bucket_id = 'gallery' and public.is_admin());
create policy "gallery files: admins update" on storage.objects for update to authenticated using (bucket_id = 'gallery' and public.is_admin());
create policy "gallery files: admins delete" on storage.objects for delete to authenticated using (bucket_id = 'gallery' and public.is_admin());

-- The five facilities named by the owner. Sizes are verified facts; descriptions are editable in the admin panel.
insert into public.venue_facilities (slug, name, description, sort_order) values
  ('open-arena',      'Open Arena',        '40m × 40m open grass arena, suitable for outdoor events and marquees.', 1),
  ('swimming-pool',   'Swimming Pool',     '6m × 4m pool. Shallow end 1.0m, deep end 1.8m.', 2),
  ('fire-pit-lounge', 'Fire Pit & Lounge', 'Separate outdoor sitting area with a central fireplace.', 3),
  ('pub-restaurant',  'Pub & Restaurant',  'Garden dining and refreshments.', 4),
  ('flower-nursery',  'Flower Nursery',    'Flowers, landscaping plants and gardening experiences.', 5)
on conflict (slug) do nothing;

-- Booking settings. Defaults invent no policy: approval is required, no minimum notice, and no operating
-- hours are enforced until the administrator sets them (Admin → Settings).
insert into public.website_content (key, value, is_public) values
  ('booking', '{"enabled": true, "requireApproval": true, "minNoticeDays": 0, "maxAdvanceDays": 730}', true)
on conflict (key) do nothing;

-- Clearly labelled SAMPLE testimonials. Delete or unpublish them once real guest feedback is added.
insert into public.testimonials (author_name, author_context, quote, is_sample, sort_order) values
  ('Sample guest', 'Sample wedding feedback', 'Sample testimonial: the garden setting made the whole day feel calm and beautiful.', true, 1),
  ('Sample guest', 'Sample corporate event feedback', 'Sample testimonial: a relaxed, green venue that took our team out of the office for the day.', true, 2),
  ('Sample guest', 'Sample family celebration feedback', 'Sample testimonial: the fire pit evening was the part everyone remembered most.', true, 3)
on conflict do nothing;
