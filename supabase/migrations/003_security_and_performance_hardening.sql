create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_pic()
returns boolean language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='pic');
$$;
revoke all on function private.is_pic() from public, anon;
grant execute on function private.is_pic() to authenticated, service_role;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin new.updated_at=now(); return new; end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.audit_master_change() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;

drop policy if exists "school public read" on public.school_settings;
drop policy if exists "teachers public read" on public.teachers;
drop policy if exists "classes public read" on public.classes;
drop policy if exists "subjects public read" on public.subjects;
drop policy if exists "instrument active public read" on public.instrument_versions;
drop policy if exists "anonymous observation insert" on public.observations;
drop policy if exists "pic profiles read" on public.profiles;
drop policy if exists "pic school write" on public.school_settings;
drop policy if exists "pic teachers write" on public.teachers;
drop policy if exists "pic classes write" on public.classes;
drop policy if exists "pic subjects write" on public.subjects;
drop policy if exists "pic instrument write" on public.instrument_versions;
drop policy if exists "pic observations read" on public.observations;
drop policy if exists "pic observations update" on public.observations;
drop policy if exists "pic observations delete" on public.observations;
drop policy if exists "pic audit read" on public.master_audit_log;

create policy "school anon read" on public.school_settings for select to anon using (true);
create policy "school authenticated read" on public.school_settings for select to authenticated using (true);
create policy "school pic insert" on public.school_settings for insert to authenticated with check (private.is_pic());
create policy "school pic update" on public.school_settings for update to authenticated using (private.is_pic()) with check (private.is_pic());
create policy "school pic delete" on public.school_settings for delete to authenticated using (private.is_pic());

create policy "teachers anon read" on public.teachers for select to anon using (true);
create policy "teachers authenticated read" on public.teachers for select to authenticated using (true);
create policy "teachers pic insert" on public.teachers for insert to authenticated with check (private.is_pic());
create policy "teachers pic update" on public.teachers for update to authenticated using (private.is_pic()) with check (private.is_pic());
create policy "teachers pic delete" on public.teachers for delete to authenticated using (private.is_pic());

create policy "classes anon read" on public.classes for select to anon using (true);
create policy "classes authenticated read" on public.classes for select to authenticated using (true);
create policy "classes pic insert" on public.classes for insert to authenticated with check (private.is_pic());
create policy "classes pic update" on public.classes for update to authenticated using (private.is_pic()) with check (private.is_pic());
create policy "classes pic delete" on public.classes for delete to authenticated using (private.is_pic());

create policy "subjects anon read" on public.subjects for select to anon using (true);
create policy "subjects authenticated read" on public.subjects for select to authenticated using (true);
create policy "subjects pic insert" on public.subjects for insert to authenticated with check (private.is_pic());
create policy "subjects pic update" on public.subjects for update to authenticated using (private.is_pic()) with check (private.is_pic());
create policy "subjects pic delete" on public.subjects for delete to authenticated using (private.is_pic());

create policy "instrument anon active read" on public.instrument_versions for select to anon using (active);
create policy "instrument authenticated read" on public.instrument_versions for select to authenticated using (active or private.is_pic());
create policy "instrument pic insert" on public.instrument_versions for insert to authenticated with check (private.is_pic());
create policy "instrument pic update" on public.instrument_versions for update to authenticated using (private.is_pic()) with check (private.is_pic());
create policy "instrument pic delete" on public.instrument_versions for delete to authenticated using (private.is_pic());

create policy "anonymous observation insert" on public.observations for insert to anon with check (
  status='submitted' and google_form_status='pending'
  and observer_name='' and observer_position='' and observer_summary=''
  and final_teacher_scores='{}'::jsonb and final_student_scores='{}'::jsonb
  and exists(select 1 from public.instrument_versions iv where iv.id=instrument_version_id and iv.active=true)
);
create policy "pic observations read" on public.observations for select to authenticated using (private.is_pic());
create policy "pic observations insert" on public.observations for insert to authenticated with check (private.is_pic());
create policy "pic observations update" on public.observations for update to authenticated using (private.is_pic()) with check (private.is_pic());
create policy "pic observations delete" on public.observations for delete to authenticated using (private.is_pic());
create policy "pic profiles read" on public.profiles for select to authenticated using (private.is_pic());
create policy "pic audit read" on public.master_audit_log for select to authenticated using (private.is_pic());

drop function if exists public.is_pic();

create index if not exists observations_subject_idx on public.observations(subject_id);
create index if not exists observations_class_idx on public.observations(class_id);

create table if not exists private.system_heartbeat (
  id smallint primary key check (id=1),
  touched_at timestamptz not null default now(),
  note text not null default 'supabase_keepalive'
);
insert into private.system_heartbeat(id,touched_at,note)
values(1,now(),'supabase_keepalive')
on conflict(id) do update set touched_at=excluded.touched_at;
select cron.alter_job(
  job_id := (select jobid from cron.job where jobname='isppk_keepalive_6h' limit 1),
  command := 'update private.system_heartbeat set touched_at=now() where id=1;'
);
drop table if exists public.system_heartbeat;
