-- Best-effort activity heartbeat for Free-plan inactivity protection.
-- Supabase does not guarantee that internal activity prevents every Free-plan pause;
-- paid projects are the only official no-auto-pause guarantee.
create extension if not exists pg_cron;

create table if not exists public.system_heartbeat (
  id smallint primary key check (id = 1),
  touched_at timestamptz not null default now(),
  note text not null default 'supabase_keepalive'
);
insert into public.system_heartbeat(id,touched_at,note)
values (1,now(),'supabase_keepalive')
on conflict (id) do update set touched_at=excluded.touched_at;
alter table public.system_heartbeat enable row level security;
revoke all on table public.system_heartbeat from anon, authenticated;

do $$
declare existing_job bigint;
begin
  select jobid into existing_job from cron.job where jobname='isppk_keepalive_6h' limit 1;
  if existing_job is not null then perform cron.unschedule(existing_job); end if;
end $$;

select cron.schedule(
  'isppk_keepalive_6h',
  '17 */6 * * *',
  $$update public.system_heartbeat set touched_at=now() where id=1;$$
);
