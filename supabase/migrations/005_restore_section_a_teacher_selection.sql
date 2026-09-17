-- Bahagian A kembali diisi pada pengisian awal. Pemantau melengkapkan F/G dan tandatangan kemudian pada PC PIC.
drop policy if exists "anonymous observation insert" on public.observations;
create policy "anonymous observation insert" on public.observations for insert to anon with check (
  status='submitted' and google_form_status='pending'
  and evaluator_id is not null
  and observer_name<>'' and observer_position<>''
  and observation_date is not null
  and reflection_1='' and reflection_2=''
  and observer_summary='' and student_observer_summary=''
  and observer_signature_data_url='' and observer_signed_at is null
  and final_teacher_scores='{}'::jsonb and final_student_scores='{}'::jsonb
  and exists(select 1 from public.instrument_versions iv where iv.id=instrument_version_id and iv.active=true)
  and exists(select 1 from public.evaluators e where e.id=evaluator_id and e.active=true)
);
