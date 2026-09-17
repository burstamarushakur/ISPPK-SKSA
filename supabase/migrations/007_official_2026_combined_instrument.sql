-- Official 2026 source-of-truth: combined Guru & Murid instrument.
-- Guru: /50, Murid: 10 items /50, overall /100.
update public.instrument_versions
set config = coalesce(config,'{}'::jsonb) || jsonb_build_object(
  'studentMaxScore', 50,
  'totalMaxScore', 100,
  'domains', jsonb_build_array(
    jsonb_build_object('id','planning','label','Perancangan','itemIds',jsonb_build_array('1.1','1.2','1.3','1.4'),'maxScore',20),
    jsonb_build_object('id','implementation','label','Pelaksanaan','itemIds',jsonb_build_array('2.1','2.2','2.3','2.4','2.5'),'maxScore',25),
    jsonb_build_object('id','reflection','label','Refleksi','itemIds',jsonb_build_array('3.1'),'maxScore',5)
  ),
  'sourceNote','V2 Borang Instrumen ISPPK 2026 (Guru & Murid) - official combined instrument',
  'pdfLayoutKey','isppk-pdp-2026',
  'templatePdfPath','/templates/2026/ISPPK.pdf'
), updated_at = now()
where code = 'ISPPK-PDP-2026-V1';

-- Teacher/public submissions must carry official 2026 observer time and may not
-- contain the obsolete 2023 Murid items M11-M14.
drop policy if exists "anonymous observation insert" on public.observations;
create policy "anonymous observation insert" on public.observations for insert to anon with check (
  status='submitted' and google_form_status='pending'
  and evaluator_id is not null
  and observer_name<>'' and observer_position<>''
  and observation_date is not null and observation_time is not null
  and reflection_1='' and reflection_2=''
  and observer_summary='' and student_observer_summary=''
  and observer_signature_data_url='' and observer_signed_at is null
  and final_teacher_scores='{}'::jsonb and final_student_scores='{}'::jsonb
  and exists(select 1 from public.instrument_versions iv where iv.id=instrument_version_id and iv.active=true)
  and exists(select 1 from public.evaluators e where e.id=evaluator_id and e.active=true)
  and (
    instrument_year_snapshot <> 2026
    or (
      self_student_scores ?& array['M1','M2','M3','M4','M5','M6','M7','M8','M9','M10']
      and not (self_student_scores ?| array['M11','M12','M13','M14'])
    )
  )
);
