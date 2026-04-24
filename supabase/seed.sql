create table if not exists public.habits (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  water boolean default false,
  sleep boolean default false,
  protein boolean default false,
  date date default now()
);

insert into public.habits (user_id, water, sleep, protein, date)
values
  ('00000000-0000-0000-0000-000000000001', true, true, false, now()::date),
  ('00000000-0000-0000-0000-000000000001', true, false, true, (now() - interval '1 day')::date),
  ('00000000-0000-0000-0000-000000000001', false, true, true, (now() - interval '2 day')::date);
