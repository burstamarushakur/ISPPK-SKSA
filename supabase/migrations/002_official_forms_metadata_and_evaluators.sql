create table if not exists public.evaluators (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  position text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.school_settings add column if not exists address text not null default '';
alter table public.school_settings add column if not exists phone text not null default '';
alter table public.school_settings add column if not exists fax text not null default '';
alter table public.school_settings add column if not exists grade text not null default '';
alter table public.school_settings add column if not exists school_type text not null default '';
alter table public.school_settings add column if not exists location text not null default '';
alter table public.school_settings add column if not exists school_program text not null default '';

alter table public.observations add column if not exists evaluator_id uuid references public.evaluators(id);
alter table public.observations add column if not exists teacher_phone text not null default '';
alter table public.observations add column if not exists teacher_email text not null default '';
alter table public.observations add column if not exists academic_qualification text not null default '';
alter table public.observations add column if not exists professional_qualification text not null default '';
alter table public.observations add column if not exists teaching_experience_years integer;
alter table public.observations add column if not exists subject_teaching_experience_years integer;
alter table public.observations add column if not exists special_position text not null default '';
alter table public.observations add column if not exists students_male integer;
alter table public.observations add column if not exists students_female integer;

alter table public.evaluators enable row level security;
drop policy if exists "evaluators public read" on public.evaluators;
create policy "evaluators public read" on public.evaluators for select to anon, authenticated using (active or private.is_pic());
drop policy if exists "pic evaluators write" on public.evaluators;
create policy "pic evaluators write" on public.evaluators for all to authenticated using (private.is_pic()) with check (private.is_pic());

drop trigger if exists evaluators_touch on public.evaluators;
create trigger evaluators_touch before update on public.evaluators for each row execute procedure public.touch_updated_at();
drop trigger if exists evaluators_audit on public.evaluators;
create trigger evaluators_audit after insert or update or delete on public.evaluators for each row execute procedure public.audit_master_change();

insert into public.evaluators(name,position,sort_order) values
('SITI ZALEHA BTE RAMLAN','PENGETUA/GURU BESAR',1),
('NADZLIN HAFIZA BINTI MOHD YASIN','PENOLONG KANAN',2),
('ABD AZIZ BIN ABDUL RAHMAN','PENOLONG PPD',3),
('DALMAN BIN DASIRON','PENOLONG KANAN HEM',4),
('HUZIL BIN TALIB','PENOLONG PPD',5),
('ZURIANA BINTI KAMARUDIN','PENOLONG KANAN KOKURIKULUM',6),
('MARDIANA BT SAMSURY','GURU AKADEMIK BIASA/GURU PENOLONG',7),
('MUZLEHA BINTI MD MUKEAR @ MD MUKIAR','GURU AKADEMIK BIASA/GURU PENOLONG',8),
('NORLIZA BTE TAIB','GURU AKADEMIK BIASA/GURU PENOLONG',9),
('ERDALINA BINTI RAMLI','GURU PENDIDIKAN ISLAM SEKOLAH RENDAH',10)
on conflict(name) do update set position=excluded.position, sort_order=excluded.sort_order, active=true;

drop policy if exists "anonymous observation insert" on public.observations;
create policy "anonymous observation insert" on public.observations for insert to anon, authenticated with check (
  status='submitted' and google_form_status='pending' and evaluator_id is not null
  and exists(select 1 from public.evaluators e where e.id=evaluator_id and e.active=true)
  and exists(select 1 from public.instrument_versions iv where iv.id=instrument_version_id and iv.active=true)
);
create index if not exists observations_evaluator_idx on public.observations(evaluator_id);
