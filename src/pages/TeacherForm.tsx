import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SearchSelect from '../components/SearchSelect'
import { TimePicker } from '../components/Pickers'
import RubricCard from '../components/RubricCard'
import StudentScoreCard from '../components/StudentScoreCard'
import { getClasses, getInstrumentVersions, getSchoolSettings, getSubjects, getTeachers, saveObservation } from '../lib/store'
import type { Gender, InstrumentVersion, Observation, SchoolClass, SchoolSettings, ScoreMap, Subject, Teacher } from '../lib/types'
import { getDefaultInstrumentFromList } from '../instruments/registry'
import { achievementLabel, scoreSummary, studentAchievementLabel, uid, upper } from '../lib/utils'

function todayIso() {
  const d = new Date(); const off = d.getTimezoneOffset(); const local = new Date(d.getTime() - off * 60000); return local.toISOString().slice(0,10)
}

export default function TeacherForm() {
  const [instruments,setInstruments]=useState<InstrumentVersion[]>([])
  const [instrumentVersionId,setInstrumentVersionId]=useState('')
  const [teachers,setTeachers]=useState<Teacher[]>([])
  const [classes,setClasses]=useState<SchoolClass[]>([])
  const [subjects,setSubjects]=useState<Subject[]>([])
  const [school,setSchool]=useState<SchoolSettings|null>(null)
  const [step,setStep]=useState(0); const [submittedId,setSubmittedId]=useState(''); const [busy,setBusy]=useState(false); const [error,setError]=useState('')

  // Bahagian C - Guru Yang Dicerap
  const [teacherId,setTeacherId]=useState('')
  const [gender,setGender]=useState<Gender|''>('')
  const [teacherPhone,setTeacherPhone]=useState('')
  const [teacherEmail,setTeacherEmail]=useState('')
  const [academicQualification,setAcademicQualification]=useState('')
  const [professionalQualification,setProfessionalQualification]=useState('')
  const [optionName,setOptionName]=useState('')
  const [teachingExperienceYears,setTeachingExperienceYears]=useState<number|null>(null)
  const [subjectId,setSubjectId]=useState('')
  const [subjectTeachingExperienceYears,setSubjectTeachingExperienceYears]=useState<number|null>(null)
  const [specialPosition,setSpecialPosition]=useState('')

  // Bahagian D - Kelas Yang Dicerap
  const [classId,setClassId]=useState('')
  const [topic,setTopic]=useState('')
  const [studentsPresent,setStudentsPresent]=useState<number|null>(null)
  const [studentsMale,setStudentsMale]=useState<number|null>(null)
  const [studentsFemale,setStudentsFemale]=useState<number|null>(null)
  const [pdpTime,setPdpTime]=useState('')

  const [teacherScores,setTeacherScores]=useState<ScoreMap>({})
  const [studentScores,setStudentScores]=useState<ScoreMap>({})

  useEffect(()=>{
    Promise.all([getInstrumentVersions(),getTeachers(),getClasses(),getSubjects(),getSchoolSettings()])
      .then(([iv,t,c,s,sc])=>{setInstruments(iv);const def=getDefaultInstrumentFromList(iv);if(def)setInstrumentVersionId(def.id);setTeachers(t);setClasses(c);setSubjects(s);setSchool(sc)})
      .catch(e=>setError(e.message))
  },[])

  const instrument=instruments.find(x=>x.id===instrumentVersionId)
  const teacher=teachers.find(t=>t.id===teacherId)
  const schoolClass=classes.find(c=>c.id===classId)
  const subject=subjects.find(s=>s.id===subjectId)

  useEffect(()=>{if(!teacher)return;setGender(teacher.gender);if(teacher.optionName)setOptionName(teacher.optionName)},[teacherId,teacher])

  const changeInstrument=(id:string)=>{setInstrumentVersionId(id);setTeacherScores({});setStudentScores({});setStep(0)}

  const previewObs=useMemo<Observation|null>(()=>instrument?({
    id:'preview',instrumentVersionId:instrument.id,instrumentYearSnapshot:instrument.year,instrumentTitleSnapshot:instrument.shortTitle,
    observerName:'',observerPosition:'',observationDate:todayIso(),observationTime:'',teacherId,teacherNameSnapshot:teacher?.name||'',gender,
    teacherPhone,teacherEmail,academicQualification,professionalQualification,optionName,teachingExperienceYears,subjectId,subjectNameSnapshot:subject?.name||'',subjectTeachingExperienceYears,specialPosition,
    classId,classNameSnapshot:schoolClass?.name||'',classYearSnapshot:schoolClass?.year,topic,studentsPresent,studentsTotal:studentsPresent,studentsMale,studentsFemale,pdpTime,
    selfTeacherScores:teacherScores,selfStudentScores:studentScores,finalTeacherScores:{},finalStudentScores:{},reflection1:'',reflection2:'',observerSummary:'',studentObserverSummary:'',observerSignatureDataUrl:'',observerSignedAt:'',status:'submitted',googleFormStatus:'pending',createdAt:'',updatedAt:''
  }):null,[instrument,teacherId,teacher,gender,teacherPhone,teacherEmail,academicQualification,professionalQualification,optionName,teachingExperienceYears,subjectId,subject,subjectTeachingExperienceYears,specialPosition,classId,schoolClass,topic,studentsPresent,studentsMale,studentsFemale,pdpTime,teacherScores,studentScores])

  const sums=instrument&&previewObs?scoreSummary(previewObs,instrument):null

  const validateInfo=()=>{
    if(!instrument)return 'Pilih versi instrumen.'
    if(!teacherId||!gender||!teacherPhone.trim()||!teacherEmail.trim()||!academicQualification.trim()||!professionalQualification.trim()||!optionName.trim()||teachingExperienceYears==null||!subjectId||subjectTeachingExperienceYears==null)return 'Lengkapkan semua maklumat Bahagian C - Maklumat Guru Yang Dicerap.'
    if(!classId||!topic.trim()||studentsPresent==null||studentsMale==null||studentsFemale==null||!pdpTime)return 'Lengkapkan semua maklumat Bahagian D - Maklumat Kelas Yang Dicerap.'
    if(studentsPresent<1||studentsMale<0||studentsFemale<0||studentsMale+studentsFemale!==studentsPresent)return 'Bilangan murid Lelaki + Perempuan mesti sama dengan Bil. Murid.'
    return ''
  }
  const canNext=()=>{if(!instrument)return false;if(step===0)return !validateInfo();if(step===1)return instrument.teacherRubric.every(i=>teacherScores[i.id]>=1&&teacherScores[i.id]<=5);if(step===2)return instrument.studentRubric.every(i=>studentScores[i.id]>=1&&studentScores[i.id]<=5);return true}
  const next=()=>{setError('');const v=step===0?validateInfo():'';if(v){setError(v);return}if(!canNext()){setError('Sila lengkapkan bahagian ini sebelum meneruskan.');return}setStep(s=>Math.min(3,s+1));window.scrollTo({top:0,behavior:'smooth'})}

  const submit=async()=>{
    if(!instrument||!teacher||!schoolClass||!subject){setError('Maklumat instrumen/guru/kelas/subjek belum lengkap.');return}
    if(!canNext()){setError('Sila lengkapkan semua skor sebelum menghantar.');return}
    setBusy(true);setError('')
    try{
      const now=new Date().toISOString();const obs:Observation={
        id:uid(),instrumentVersionId:instrument.id,instrumentYearSnapshot:instrument.year,instrumentTitleSnapshot:instrument.shortTitle,
        observerName:'',observerPosition:'',observationDate:todayIso(),observationTime:'',
        teacherId,teacherNameSnapshot:teacher.name,gender,teacherPhone:teacherPhone.trim(),teacherEmail:teacherEmail.trim(),academicQualification:upper(academicQualification.trim()),professionalQualification:upper(professionalQualification.trim()),optionName:upper(optionName.trim()),teachingExperienceYears,
        subjectId,subjectNameSnapshot:subject.name,subjectTeachingExperienceYears,specialPosition:upper(specialPosition.trim()),classId,classNameSnapshot:schoolClass.name,classYearSnapshot:schoolClass.year,topic:upper(topic.trim()),studentsPresent,studentsTotal:studentsPresent,studentsMale,studentsFemale,pdpTime,
        selfTeacherScores:teacherScores,selfStudentScores:studentScores,finalTeacherScores:{},finalStudentScores:{},reflection1:'',reflection2:'',observerSummary:'',studentObserverSummary:'',observerSignatureDataUrl:'',observerSignedAt:'',status:'submitted',googleFormStatus:'pending',createdAt:now,updatedAt:now
      };await saveObservation(obs);setSubmittedId(obs.id)
    }catch(e:any){setError(e.message||'Gagal menyimpan rekod.')}finally{setBusy(false)}
  }

  if(submittedId)return <main className="container"><div className="card" style={{maxWidth:720,margin:'50px auto',textAlign:'center'}}><div style={{fontSize:58}}>✅</div><h1>Pengisian berjaya dihantar</h1><p>Rekod telah dihantar kepada PIC. Bahagian Pemantau, Refleksi, Rumusan dan Tandatangan akan dilengkapkan oleh pemantau bersama PIC.</p><p>ID rekod: <strong>{submittedId.slice(0,8).toUpperCase()}</strong></p><div className="toolbar" style={{justifyContent:'center',marginTop:20}}><Link to="/" className="btn btn-secondary">Kembali Utama</Link><button className="btn btn-primary" onClick={()=>location.reload()}>Isi Rekod Baharu</button></div></div></main>

  return <main className="container">
    <div className="section-title"><div><h1>Pengisian ISPPK</h1><p>{instrument?`${instrument.shortTitle} · SK Sungai Abong`:'Memuatkan versi instrumen...'}</p></div></div>
    <div className="card" style={{marginBottom:14}}><div className="field"><label>Versi Instrumen</label><select className="select" value={instrumentVersionId} onChange={e=>changeInstrument(e.target.value)}>{instruments.filter(x=>x.active).sort((a,b)=>b.year-a.year).map(x=><option key={x.id} value={x.id}>{x.year} · {x.shortTitle}</option>)}</select></div></div>
    <div className="steps"><span className={`step-pill ${step===0?'active':''}`}>1 · Maklumat</span><span className={`step-pill ${step===1?'active':''}`}>2 · Skor Guru</span><span className={`step-pill ${step===2?'active':''}`}>3 · Skor Murid</span><span className={`step-pill ${step===3?'active':''}`}>4 · Semakan & Hantar</span></div>
    {error&&<div className="notice error" style={{marginBottom:14}}>{error}</div>}

    {step===0&&<div className="card">
      <div className="notice" style={{marginBottom:16}}><strong>Bahagian A – Maklumat Pemantau</strong>, <strong>Bahagian F – Refleksi</strong> dan <strong>Bahagian G – Rumusan/Tandatangan</strong> akan diisi oleh pemantau menggunakan PC PIC selepas rekod ini dihantar.</div>
      <div className="official-info-block"><h2>Bahagian B - Maklumat Sekolah</h2><div className="form-grid">
        <div className="field"><label>1. Nama Sekolah</label><input className="input official-readonly" readOnly value={school?.schoolName||''}/></div><div className="field"><label>2. Alamat Sekolah</label><input className="input official-readonly" readOnly value={school?.address||''}/></div>
        <div className="field"><label>3. No. Tel.</label><input className="input official-readonly" readOnly value={school?.phone||''}/></div><div className="field"><label>4. No. Faks</label><input className="input official-readonly" readOnly value={school?.fax||''}/></div>
        <div className="field span-2"><label>5. E-mel</label><input className="input official-readonly" readOnly value={school?.officialEmail||''}/></div><div className="field"><label>6. Kod Sekolah</label><input className="input official-readonly" readOnly value={school?.schoolCode||''}/></div><div className="field"><label>7. Gred Sekolah</label><input className="input official-readonly" readOnly value={school?.grade||''}/></div>
        <div className="field"><label>8. Jenis Sekolah</label><input className="input official-readonly" readOnly value={school?.schoolType||''}/></div><div className="field"><label>9. Lokasi Sekolah</label><input className="input official-readonly" readOnly value={school?.location||''}/></div><div className="field"><label>10. PPD</label><input className="input official-readonly" readOnly value={school?.ppd||''}/></div><div className="field"><label>11. Negeri</label><input className="input official-readonly" readOnly value={school?.state||''}/></div><div className="field span-2"><label>12. Program Sekolah</label><input className="input official-readonly" readOnly value={school?.schoolProgram||''}/></div>
      </div></div>
      <div className="official-info-block"><h2>Bahagian C - Maklumat Guru Yang Dicerap</h2><div className="form-grid">
        <div className="field span-2"><label>1. Nama *</label><SearchSelect value={teacherId} onChange={setTeacherId} options={teachers.filter(t=>t.active).sort((a,b)=>a.sortOrder-b.sortOrder).map(t=>({value:t.id,label:t.name}))} placeholder="Cari nama guru..."/></div>
        <div className="field"><label>2. Jantina *</label><select className="select" value={gender} onChange={e=>setGender(e.target.value as Gender)}><option value="">Pilih</option><option>Lelaki</option><option>Perempuan</option></select></div><div className="field"><label>3. No. Tel. *</label><input className="input" value={teacherPhone} onChange={e=>setTeacherPhone(e.target.value)}/></div>
        <div className="field span-2"><label>4. E-mel *</label><input className="input" type="email" value={teacherEmail} onChange={e=>setTeacherEmail(e.target.value)}/></div><div className="field span-2"><label>5. Kelulusan Akademik Tertinggi *</label><input className="input" value={academicQualification} onChange={e=>setAcademicQualification(upper(e.target.value))}/></div>
        <div className="field"><label>6. Kelulusan Ikhtisas *</label><input className="input" value={professionalQualification} onChange={e=>setProfessionalQualification(upper(e.target.value))}/></div><div className="field"><label>7. Opsyen *</label><input className="input" value={optionName} onChange={e=>setOptionName(upper(e.target.value))}/></div>
        <div className="field"><label>8. Pengalaman Mengajar (tahun) *</label><input className="input" type="number" min="0" value={teachingExperienceYears??''} onChange={e=>setTeachingExperienceYears(e.target.value===''?null:Number(e.target.value))}/></div><div className="field"><label>9. Mata Pelajaran Yang Dicerap *</label><SearchSelect value={subjectId} onChange={setSubjectId} options={subjects.filter(s=>s.active).map(s=>({value:s.id,label:s.name}))}/></div>
        <div className="field"><label>10. Pengalaman Mengajar Mata Pelajaran (tahun) *</label><input className="input" type="number" min="0" value={subjectTeachingExperienceYears??''} onChange={e=>setSubjectTeachingExperienceYears(e.target.value===''?null:Number(e.target.value))}/></div><div className="field span-2"><label>11. Jawatan Khas</label><input className="input" value={specialPosition} onChange={e=>setSpecialPosition(upper(e.target.value))} placeholder="Contoh: GURU CEMERLANG / TIADA"/></div>
      </div></div>
      <div className="official-info-block"><h2>Bahagian D - Maklumat Kelas Yang Dicerap</h2><div className="form-grid">
        <div className="field"><label>12. Bil. Murid *</label><input className="input" type="number" min="1" value={studentsPresent??''} onChange={e=>setStudentsPresent(e.target.value===''?null:Number(e.target.value))}/></div><div className="field"><label>Lelaki *</label><input className="input" type="number" min="0" value={studentsMale??''} onChange={e=>setStudentsMale(e.target.value===''?null:Number(e.target.value))}/></div><div className="field"><label>Perempuan *</label><input className="input" type="number" min="0" value={studentsFemale??''} onChange={e=>setStudentsFemale(e.target.value===''?null:Number(e.target.value))}/></div>
        <div className="field span-2"><label>13. Tahun/Tingkatan *</label><SearchSelect value={classId} onChange={setClassId} options={classes.filter(c=>c.active).map(c=>({value:c.id,label:`TAHUN ${c.year} - ${c.name}`,group:`Tahun ${c.year}`}))}/></div><div className="field span-2"><label>14. Tajuk/Topik *</label><input className="input" value={topic} onChange={e=>setTopic(upper(e.target.value))}/></div><div className="field"><label>15. Masa *</label><TimePicker value={pdpTime} onChange={setPdpTime}/></div>
      </div></div>
    </div>}

    {step===1&&instrument&&<div><div className="card" style={{marginBottom:14,textAlign:'center'}}><strong>PENARAFAN SEKOLAH SEBAGAI SEKOLAH YANG MEMBUDAYAKAN KBAT<br/>BORANG SKOR PENGAJARAN DAN PEMBELAJARAN (GURU)</strong><div className="helper" style={{marginTop:6}}>Bulatkan/pilih pada skala yang dipilih.</div></div>{instrument.teacherRubric.map(item=><RubricCard key={item.id} item={item} value={teacherScores[item.id]} onChange={n=>setTeacherScores({...teacherScores,[item.id]:n})} scoreLabels={instrument.scoreLabels}/>)}</div>}

    {step===2&&instrument&&<div><div className="student-guide"><strong>PANDUAN SKOR</strong>{instrument.studentScoreGuide.map((g,i)=><div key={i}>{g}</div>)}<div style={{marginTop:8}}>Bulatkan/pilih pada skala yang dipilih.</div></div><div className="card" style={{marginBottom:14}}><strong>A. MURID SEBAGAI PEMBELAJAR AKTIF</strong></div>{instrument.studentRubric.map((item,i)=><StudentScoreCard key={item.id} item={item} index={i} value={studentScores[item.id]} onChange={n=>setStudentScores({...studentScores,[item.id]:n})} scoreGuide={instrument.studentScoreGuide}/>)}</div>}

    {step===3&&instrument&&<div className="grid">
      <div className="card"><div className="official-section-title">Guru - Bahagian E - Pengiraan Skor dan Pencapaian</div><div className="table-wrap"><table style={{minWidth:0}}><thead><tr><th>Domain</th><th>Skor</th></tr></thead><tbody>{instrument.domains.map((d,i)=><tr key={d.id}><td>Domain {i+1}: {d.label}</td><td>{sums?.domains[d.id]||0}</td></tr>)}<tr><td><strong>Jumlah Skor</strong></td><td><strong>{sums?.teacherTotal||0} / {sums?.teacherMax||50}</strong></td></tr><tr><td><strong>Peratus Pencapaian</strong></td><td><strong>{sums?.teacherPercent||0}%</strong></td></tr></tbody></table></div><div className="notice" style={{marginTop:12}}>{achievementLabel(sums?.teacherPercent||0,instrument)}</div></div>
      <div className="card"><div className="official-section-title">Murid - Pengiraan Skor dan Pencapaian</div><div className="table-wrap"><table style={{minWidth:0}}><tbody><tr><td><strong>Jumlah Skor</strong></td><td><strong>{sums?.student||0} / {instrument.studentMaxScore}</strong></td></tr><tr><td><strong>Peratus Pencapaian</strong></td><td><strong>{sums?.studentPercent||0}%</strong></td></tr></tbody></table></div><div className="notice" style={{marginTop:12}}>{studentAchievementLabel(sums?.studentPercent||0,instrument)}</div></div>
      <div className="card"><div className="official-section-title">Bahagian Pemantau</div><p>Selepas dihantar, PIC akan membuka rekod ini pada PC PIC. Pemantau akan melengkapkan <strong>Bahagian A, Bahagian F, Rumusan Guru, Rumusan Murid dan tandatangan digital</strong>.</p></div>
    </div>}

    <div className="sticky-actions"><button className="btn btn-secondary" disabled={step===0||busy} onClick={()=>{setStep(s=>Math.max(0,s-1));window.scrollTo({top:0,behavior:'smooth'})}}>← Kembali</button>{step<3?<button className="btn btn-primary" onClick={next} disabled={busy}>Seterusnya →</button>:<button className="btn btn-primary" onClick={submit} disabled={busy}>{busy?'Menyimpan...':'Hantar Kepada PIC'}</button>}</div>
  </main>
}
