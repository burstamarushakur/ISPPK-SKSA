-- Once submitted by a teacher, PIC may only add observer workflow data,
-- change workflow status / Google Form status, or delete the record.
-- Teacher-submitted content remains immutable in the webapp/database.
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
      new.final_student_scores
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
      old.final_student_scores
    ) then
      raise exception 'Rekod asal guru telah dikunci. PIC tidak dibenarkan mengubah maklumat atau skor yang dihantar guru.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_teacher_submission_from_pic on public.observations;
create trigger protect_teacher_submission_from_pic
before update on public.observations
for each row execute function private.protect_teacher_submission_from_pic();
