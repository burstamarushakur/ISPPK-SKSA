-- v2.5.0: Optional RPH attachments (applied to production Supabase 2026-09-18)

alter table public.observations
  add column if not exists rph_path text not null default '',
  add column if not exists rph_file_name text not null default '',
  add column if not exists rph_mime_type text not null default '',
  add column if not exists rph_size_bytes bigint;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'rph-uploads', 'rph-uploads', false, 10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.rph_object_is_writable(object_name text)
returns boolean
language sql
security definer
set search_path = public, private, pg_temp
as $$
  select
    object_name ~ '^observations/[0-9a-fA-F-]{36}/rph\.(pdf|doc|docx|jpg|jpeg|png)$'
    and not exists (select 1 from public.observations o where o.rph_path = object_name);
$$;

revoke all on function private.rph_object_is_writable(text) from public;
grant usage on schema private to anon;
grant execute on function private.rph_object_is_writable(text) to anon, authenticated;

drop policy if exists "anon rph insert" on storage.objects;
create policy "anon rph insert"
on storage.objects for insert to anon
with check (bucket_id = 'rph-uploads' and private.rph_object_is_writable(name));

drop policy if exists "anon rph retry update" on storage.objects;

drop policy if exists "pic rph read" on storage.objects;
create policy "pic rph read"
on storage.objects for select to authenticated
using (bucket_id = 'rph-uploads' and private.is_pic());

drop policy if exists "pic rph delete" on storage.objects;
create policy "pic rph delete"
on storage.objects for delete to authenticated
using (bucket_id = 'rph-uploads' and private.is_pic());

create or replace function private.protect_teacher_submission_from_pic()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if private.is_pic() and old.status in ('submitted','verified') then
    if row(
      new.instrument_version_id,
      new.instrument_year_snapshot,
      new.instrument_title_snapshot,
      new.evaluator_id,
      new.observer_name,
      new.observer_position,
      new.observation_date,
      new.observation_time,
      new.teacher_id,
      new.teacher_name_snapshot,
      new.gender,
      new.teacher_phone,
      new.teacher_email,
      new.academic_qualification,
      new.professional_qualification,
      new.option_name,
      new.teaching_experience_years,
      new.subject_id,
      new.subject_name_snapshot,
      new.subject_teaching_experience_years,
      new.special_position,
      new.class_id,
      new.class_name_snapshot,
      new.class_year_snapshot,
      new.topic,
      new.students_present,
      new.students_total,
      new.students_male,
      new.students_female,
      new.pdp_time,
      new.self_teacher_scores,
      new.self_student_scores,
      new.final_teacher_scores,
      new.final_student_scores,
      new.rph_path,
      new.rph_file_name,
      new.rph_mime_type,
      new.rph_size_bytes
    ) is distinct from row(
      old.instrument_version_id,
      old.instrument_year_snapshot,
      old.instrument_title_snapshot,
      old.evaluator_id,
      old.observer_name,
      old.observer_position,
      old.observation_date,
      old.observation_time,
      old.teacher_id,
      old.teacher_name_snapshot,
      old.gender,
      old.teacher_phone,
      old.teacher_email,
      old.academic_qualification,
      old.professional_qualification,
      old.option_name,
      old.teaching_experience_years,
      old.subject_id,
      old.subject_name_snapshot,
      old.subject_teaching_experience_years,
      old.special_position,
      old.class_id,
      old.class_name_snapshot,
      old.class_year_snapshot,
      old.topic,
      old.students_present,
      old.students_total,
      old.students_male,
      old.students_female,
      old.pdp_time,
      old.self_teacher_scores,
      old.self_student_scores,
      old.final_teacher_scores,
      old.final_student_scores,
      old.rph_path,
      old.rph_file_name,
      old.rph_mime_type,
      old.rph_size_bytes
    ) then
      raise exception 'Rekod asal guru telah dikunci. PIC tidak dibenarkan mengubah maklumat, skor atau lampiran RPH yang dihantar guru.';
    end if;
  end if;
  return new;
end;
$$;

drop policy if exists "anonymous observation insert" on public.observations;
create policy "anonymous observation insert"
on public.observations for insert to anon
with check (
  status = 'submitted'
  and google_form_status = 'pending'
  and evaluator_id is not null
  and observer_name <> ''
  and observer_position <> ''
  and observation_date is not null
  and observation_time is not null
  and reflection_1 = ''
  and reflection_2 = ''
  and observer_summary = ''
  and student_observer_summary = ''
  and observer_signature_data_url = ''
  and observer_signed_at is null
  and final_teacher_scores = '{}'::jsonb
  and final_student_scores = '{}'::jsonb
  and exists (select 1 from public.instrument_versions iv where iv.id = observations.instrument_version_id and iv.active = true)
  and exists (select 1 from public.evaluators e where e.id = observations.evaluator_id and e.active = true)
  and (
    rph_path = ''
    or (
      rph_path like ('observations/' || id::text || '/rph.%')
      and rph_file_name <> ''
      and rph_mime_type in (
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
      )
      and rph_size_bytes between 1 and 10485760
    )
  )
  and (
    instrument_year_snapshot <> 2026
    or (
      self_student_scores ?& array['M1','M2','M3','M4','M5','M6','M7','M8','M9','M10']
      and not (self_student_scores ?| array['M11','M12','M13','M14'])
    )
  )
);
