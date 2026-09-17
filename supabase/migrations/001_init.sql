-- ISPPK SKSA - schema multi-tahun
-- Run in a NEW Supabase project. Do not apply to the Kokurikulum project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'viewer' check (role in ('viewer','pic')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.is_pic()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles p where p.id = auth.uid() and p.role='pic');
$$;

create table if not exists public.school_settings (
  id smallint primary key default 1 check (id=1),
  school_code text not null,
  school_name text not null,
  ppd text not null,
  state text not null,
  official_email text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  gender text check (gender in ('Lelaki','Perempuan')),
  option_name text not null default '',
  active boolean not null default true,
  sort_order integer not null default 999,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  year smallint not null check(year between 1 and 6),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(year,name)
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Every official year/version is a separate immutable configuration identity.
-- config JSON stores rubric, achievement bands, PDF metadata and Google Form mapping.
-- The seeded 2026 row uses {} because the app ships the verified 2026 base config;
-- once edited/saved by PIC, the full config is persisted here.
create table if not exists public.instrument_versions (
  id text primary key,
  year integer not null,
  code text not null unique,
  active boolean not null default false,
  is_default boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(year, code)
);
create unique index if not exists instrument_one_default_idx on public.instrument_versions((is_default)) where is_default=true;
create index if not exists instrument_year_idx on public.instrument_versions(year desc);

create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  instrument_version_id text not null references public.instrument_versions(id),
  instrument_year_snapshot integer not null,
  instrument_title_snapshot text not null default '',
  teacher_id uuid not null references public.teachers(id),
  teacher_name_snapshot text not null default '',
  gender text check (gender in ('Lelaki','Perempuan')),
  option_name text not null default '',
  subject_id uuid references public.subjects(id),
  subject_name_snapshot text not null default '',
  class_id uuid references public.classes(id),
  class_name_snapshot text not null default '',
  class_year_snapshot smallint check(class_year_snapshot between 1 and 6),
  topic text not null default '',
  students_present integer check(students_present >= 0),
  students_total integer check(students_total > 0),
  pdp_time time,
  observation_date date,
  observation_time time,
  self_teacher_scores jsonb not null default '{}'::jsonb,
  self_student_scores jsonb not null default '{}'::jsonb,
  final_teacher_scores jsonb not null default '{}'::jsonb,
  final_student_scores jsonb not null default '{}'::jsonb,
  reflection_1 text not null default '',
  reflection_2 text not null default '',
  observer_name text not null default '',
  observer_position text not null default '',
  observer_summary text not null default '',
  status text not null default 'submitted' check(status in ('draft','submitted','verified')),
  google_form_status text not null default 'pending' check(google_form_status in ('pending','sent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists observations_instrument_idx on public.observations(instrument_version_id, observation_date desc);
create index if not exists observations_year_idx on public.observations(instrument_year_snapshot, observation_date desc);
create index if not exists observations_teacher_idx on public.observations(teacher_id);
create index if not exists observations_status_idx on public.observations(status, google_form_status);
create index if not exists observations_date_idx on public.observations(observation_date desc);

create table if not exists public.master_audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text not null,
  operation text not null,
  before_data jsonb,
  after_data jsonb,
  changed_by uuid,
  changed_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create or replace function public.audit_master_change()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.master_audit_log(table_name,record_id,operation,before_data,after_data,changed_by)
  values (tg_table_name, coalesce(new.id::text,old.id::text), tg_op, to_jsonb(old), to_jsonb(new), auth.uid());
  return coalesce(new,old);
end; $$;

do $$
declare t text;
begin
  foreach t in array array['teachers','classes','subjects','instrument_versions'] loop
    execute format('drop trigger if exists %I_touch on public.%I',t,t);
    execute format('create trigger %I_touch before update on public.%I for each row execute procedure public.touch_updated_at()',t,t);
    execute format('drop trigger if exists %I_audit on public.%I',t,t);
    execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute procedure public.audit_master_change()',t,t);
  end loop;
end $$;

drop trigger if exists observations_touch on public.observations;
create trigger observations_touch before update on public.observations for each row execute procedure public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.school_settings enable row level security;
alter table public.teachers enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.instrument_versions enable row level security;
alter table public.observations enable row level security;
alter table public.master_audit_log enable row level security;

create policy "school public read" on public.school_settings for select to anon, authenticated using (true);
create policy "teachers public read" on public.teachers for select to anon, authenticated using (true);
create policy "classes public read" on public.classes for select to anon, authenticated using (true);
create policy "subjects public read" on public.subjects for select to anon, authenticated using (true);
create policy "instrument active public read" on public.instrument_versions for select to anon, authenticated using (active or public.is_pic());

-- Guru boleh hantar rekod baharu sahaja. Mereka tidak boleh browse rekod orang lain.
create policy "anonymous observation insert" on public.observations
for insert to anon, authenticated
with check (
  status='submitted'
  and google_form_status='pending'
  and observer_name=''
  and observer_summary=''
  and exists(select 1 from public.instrument_versions iv where iv.id=instrument_version_id and iv.active=true)
);

create policy "pic profiles read" on public.profiles for select to authenticated using (public.is_pic());
create policy "pic school write" on public.school_settings for all to authenticated using (public.is_pic()) with check (public.is_pic());
create policy "pic teachers write" on public.teachers for all to authenticated using (public.is_pic()) with check (public.is_pic());
create policy "pic classes write" on public.classes for all to authenticated using (public.is_pic()) with check (public.is_pic());
create policy "pic subjects write" on public.subjects for all to authenticated using (public.is_pic()) with check (public.is_pic());
create policy "pic instrument write" on public.instrument_versions for all to authenticated using (public.is_pic()) with check (public.is_pic());
create policy "pic observations read" on public.observations for select to authenticated using (public.is_pic());
create policy "pic observations update" on public.observations for update to authenticated using (public.is_pic()) with check (public.is_pic());
create policy "pic observations delete" on public.observations for delete to authenticated using (public.is_pic());
create policy "pic audit read" on public.master_audit_log for select to authenticated using (public.is_pic());

insert into public.school_settings(id,school_code,school_name,ppd,state,official_email)
values(1,'JBA5095','SEKOLAH KEBANGSAAN SUNGAI ABONG','MUAR','JOHOR','')
on conflict(id) do update set school_code=excluded.school_code,school_name=excluded.school_name,ppd=excluded.ppd,state=excluded.state;

insert into public.instrument_versions(id,year,code,active,is_default,config)
values('isppk-pdp-2026-v1',2026,'ISPPK-PDP-2026-V1',true,true,'{}'::jsonb)
on conflict(id) do update set year=excluded.year,code=excluded.code,active=true,is_default=true;

insert into public.teachers(name,gender,sort_order) values
('SITI ZALEHA BINTI RAMLAN','Perempuan',1),('NADZLIN HAFIZA BINTI MOHD YASIN','Perempuan',2),('DALMAN BIN DASIRON','Lelaki',3),('ZURIANA BINTI KAMARUDIN','Perempuan',4),('AHMAD AFFENDY BIN MOHAMED TAHIR','Lelaki',5),('AZIZAH BTE WAHID','Perempuan',6),('ERDALINA BT RAMLI','Perempuan',7),('NAJIHA BINTI ABD KADIR','Perempuan',8),('SITI SARIYANA BINTI MOHD.SAPIAN','Perempuan',9),('SUJATHA A/P RAJAMANIKAM','Perempuan',10),
('AHMAD BADRUL BIN JUSOH','Lelaki',11),('AHMAD NAIMUDDIN BIN A MANAF','Lelaki',12),('FADHLUN BT MOHAMAD','Perempuan',13),('HASLIZA BT MOHD.SHAH','Perempuan',14),('KHAIRUL NIZWAN BIN HAMALI','Lelaki',15),('MARDIANA BT SAMSURY','Perempuan',16),('MARIYANA BT DIN','Perempuan',17),('MASITAH BINTI IBRAHIM','Perempuan',18),('MOHD HASRUL ASRAF BIN OTHMAN','Lelaki',19),('MUHD.SHUKRI BIN SHAMSUDDIN','Lelaki',20),
('MOHD.SUKHAIRI BIN OSMAN','Lelaki',21),('MUHAMMAD RAIS BIN TAIB@SIDEK','Lelaki',22),('MUZLEHA BT.MD.MUKIER@MD.MUKIAR','Perempuan',23),('NOOR AFIQ BIN NOOR OTHMAN','Lelaki',24),('NOOR HIDAYAH BT JAMAL','Perempuan',25),('NOORZAIMAH BT NOORDIN','Perempuan',26),('NORDIN BIN ABDUL WAHAB','Lelaki',27),('NORLIZA BT TAIB','Perempuan',28),('RODIZAH BT HASHIM','Perempuan',29),('SAKNIAH BINTI MD.DALI','Perempuan',31),
('SHOKRI BIN SENIN','Lelaki',32),('SITI HAJAR BINTI SUBARI','Perempuan',33),('SITI KHALIJAH BT AB.AZIZ','Perempuan',34),('SITI ZAHARAH BT MANAP','Perempuan',35),('ZAINATUL FIRDAOS BINTI MUKAYAT','Perempuan',36),('ADINDA DEWI AWRA BINTI BAHAROLISHAM','Perempuan',37),('HAZIQAH BINTI NASIR','Perempuan',38),('NOR FARAHIN BINTI MOHD HALIL','Perempuan',39),('IZZAH NAZIRAH BINTI MOHD NAJIB','Perempuan',40),('NURUL IZZATI BINTI ABU JAIS','Perempuan',41),
('WAN NORASHAM BIN AHMAD MOKSINON','Lelaki',43),('RAHIMAH BT KAMILAN','Perempuan',44),('KAMAL ISHAK BIN ALI','Lelaki',45),('MOHD.ASRI BIN ABDUL HALIM@ABDULALIM','Lelaki',46),('SYUHADA BINTI MD SARIP','Perempuan',47)
on conflict(name) do update set gender=excluded.gender,sort_order=excluded.sort_order,active=true;

insert into public.classes(year,name)
select y,n from generate_series(1,6) y cross join (values('IBNU SINA'),('IBNU KHALDUN'),('IBNU BATTUTAH')) v(n)
on conflict(year,name) do update set active=true;

insert into public.subjects(name) values
('BAHASA MELAYU'),('BAHASA INGGERIS'),('MATEMATIK'),('SAINS'),('PENDIDIKAN ISLAM'),('PENDIDIKAN MORAL'),('SEJARAH'),('PENDIDIKAN JASMANI DAN PENDIDIKAN KESIHATAN'),('PENDIDIKAN SENI VISUAL'),('PENDIDIKAN MUZIK'),('REKA BENTUK DAN TEKNOLOGI'),('BAHASA ARAB')
on conflict(name) do update set active=true;

-- Selepas mencipta pengguna PIC dalam Supabase Authentication:
-- update public.profiles set role='pic' where id=(select id from auth.users where email='YOUR_PIC_EMAIL');
