-- ProfiNavi v149 — master-profile address photo persistence
alter table public.master_profiles
  add column if not exists location_image_url text;
