-- PIC/pemantau workflow: teacher submits first; observer completes A/F/G on PIC PC.
alter table public.observations add column if not exists student_observer_summary text not null default '';
alter table public.observations add column if not exists observer_signature_data_url text not null default '';
alter table public.observations add column if not exists observer_signed_at timestamptz;

update public.school_settings
set school_name='SEKOLAH KEBANGSAAN SUNGAI ABONG',
    address='Jln Sungai Abong, 84000, Muar, Johor',
    phone='069549634',
    fax='069540854',
    official_email='jba5095@moe.edu.my',
    school_code='JBA5095',
    grade='B',
    school_type='SK',
    location='Luar Bandar',
    ppd='MUAR',
    state='JOHOR',
    school_program=''
where id=1;

drop policy if exists "anonymous observation insert" on public.observations;
create policy "anonymous observation insert" on public.observations for insert to anon with check (
  status='submitted' and google_form_status='pending'
  and evaluator_id is null
  and observer_name='' and observer_position=''
  and reflection_1='' and reflection_2=''
  and observer_summary='' and student_observer_summary=''
  and observer_signature_data_url='' and observer_signed_at is null
  and final_teacher_scores='{}'::jsonb and final_student_scores='{}'::jsonb
  and exists(select 1 from public.instrument_versions iv where iv.id=instrument_version_id and iv.active=true)
);
