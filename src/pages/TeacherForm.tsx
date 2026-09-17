import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SearchSelect from '../components/SearchSelect'
import { DatePicker, TimePicker } from '../components/Pickers'
import RubricCard from '../components/RubricCard'
import StudentScoreCard from '../components/StudentScoreCard'
import { getClasses, getEvaluators, getInstrumentVersions, getSchoolSettings, getSubjects, getTeachers, saveObservation } from '../lib/store'
import type { Evaluator, Gender, InstrumentVersion, Observation, SchoolClass, SchoolSettings, ScoreMap, Subject, Teacher } from '../lib/types'
import { getDefaultInstrumentFromList } from '../instruments/registry'
import { achievementLabel, scoreSummary, uid, upper } from '../lib/utils'

function todayIso() {
  const d = new Date(); const off = d.getTimezoneOffset(); const local = new Date(d.getTime() - off * 60000); return local.toISOString().slice(0,10)
}

export default function TeacherForm() {
  const [instruments,setInstruments]=useState<InstrumentVersion[]>([])
  const [instrumentVersionId,setInstrumentVersionId]=useState('')
  const [teachers,setTeachers]=useState<Teacher[]>([])
  const [evaluators,setEvaluators]=useState<Evaluator[]>([])
  const [classes,setClasses]=useState<SchoolClass[]>([])
  const [subjects,setSubjects]=useState<Subject[]>([])
  const [school,setSchool]=useState<SchoolSettings|null>(null)
  const [step,setStep]=useState(0)
  const [submittedId,setSubmittedId]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')

  // Bahagian A – Maklumat Pencerap
  const [evaluatorId,setEvaluatorId]=useState('')
  const [observerName,setObserverName]=useState('')
  const [observerPosition,setObserverPosition]=useState('')
  const [observationDate,setObservationDate]=useState(todayIso())
  const [observationTime,setObservationTime]=useState('')

  // Bahagian C – Maklumat Guru Yang Dicerap
  const [teacherId,setTeacherId]=useState('')
  const [gender,setGender]=useState<Gender|''>('')
  const [optionName,setOptionName]=useState('')

  // Bahagian D – Maklumat Kelas Yang Dicerap
  const [subjectId,setSubjectId]=useState('')
  const [studentsPresent,setStudentsPresent]=useState<number|null>(null)
  const [studentsTotal,setStudentsTotal]=useState<number|null>(null)
  const [classId,setClassId]=useState('')
  const [topic,setTopic]=useState('')
  const [pdpTime,setPdpTime]=useState('')

  const [teacherScores,setTeacherScores]=useState<ScoreMap>({})
  const [studentScores,setStudentScores]=useState<ScoreMap>({})

  useEffect(()=>{
    Promise.all([getInstrumentVersions(),getTeachers(),getEvaluators(),getClasses(),getSubjects(),getSchoolSettings()])
      .then(([iv,t,e,c,s,sc])=>{setInstruments(iv);const def=getDefaultInstrumentFromList(iv);if(def)setInstrumentVersionId(def.id);setTeachers(t);setEvaluators(e);setClasses(c);setSubjects(s);setSchool(sc)})
      .catch(e=>setError(e.message))
  },[])

  const instrument=instruments.find(x=>x.id===instrumentVersionId)
  const teacher=teachers.find(t=>t.id===teacherId)
  const evaluator=evaluators.find(e=>e.id===evaluatorId)
  const schoolClass=classes.find(c=>c.id===classId)
  const subject=subjects.find(s=>s.id===subjectId)

  useEffect(()=>{if(!teacher)return;setGender(teacher.gender);setOptionName(teacher.optionName||'')},[teacherId,teacher])
  useEffect(()=>{if(!evaluator)return;setObserverName(evaluator.name);setObserverPosition(evaluator.position)},[evaluatorId,evaluator])

  const changeInstrument=(id:string)=>{setInstrumentVersionId(id);setTeacherScores({});setStudentScores({});setStep(0)}

  const previewObs=useMemo<Observation|null>(()=>instrument?({
    id:'preview',instrumentVersionId:instrument.id,instrumentYearSnapshot:instrument.year,instrumentTitleSnapshot:instrument.shortTitle,
    evaluatorId,observerName,observerPosition,observationDate,observationTime,
    teacherId,teacherNameSnapshot:teacher?.name||'',gender,
    teacherPhone:'',teacherEmail:'',academicQualification:'',professionalQualification:'',optionName,teachingExperienceYears:null,
    subjectId,subjectNameSnapshot:subject?.name||'',subjectTeachingExperienceYears:null,specialPosition:'',
    classId,classNameSnapshot:schoolClass?.name||'',classYearSnapshot:schoolClass?.year,topic,
    studentsPresent,studentsTotal,studentsMale:null,studentsFemale:null,pdpTime,
    selfTeacherScores:teacherScores,selfStudentScores:studentScores,finalTeacherScores:{},finalStudentScores:{},
    reflection1:'',reflection2:'',observerSummary:'',studentObserverSummary:'',observerSignatureDataUrl:'',observerSignedAt:'',
    status:'submitted',googleFormStatus:'pending',createdAt:'',updatedAt:''
  }):null,[instrument,evaluatorId,observerName,observerPosition,observationDate,observationTime,teacherId,teacher,gender,optionName,subjectId,subject,classId,schoolClass,topic,studentsPresent,studentsTotal,pdpTime,teacherScores,studentScores])

  const sums=instrument&&previewObs?scoreSummary(previewObs,instrument):null

  const validateInfo=()=>{
    if(!instrument)return 'Pilih versi instrumen.'
    if(!evaluatorId||!observerName.trim()||!observerPosition.trim()||!observationDate||!observationTime)return 'Lengkapkan Bahagian A – Maklumat Pencerap.'
    if(!teacherId||!gender||!optionName.trim())return 'Lengkapkan Bahagian C – Maklumat Guru Yang Dicerap.'
    if(!subjectId||studentsPresent==null||studentsTotal==null||!classId||!topic.trim()||!pdpTime)return 'Lengkapkan Bahagian D – Maklumat Kelas Yang Dicerap.'
    if(studentsPresent<0||studentsTotal<1||studentsPresent>studentsTotal)return 'Bil. Murid Hadir mesti antara 0 hingga jumlah murid.'
    return ''
  }
  const canNext=()=>{if(!instrument)return false;if(step===0)return !validateInfo();if(step===1)return instrument.teacherRubric.every(i=>teacherScores[i.id]>=1&&teacherScores[i.id]<=5);if(step===2)return instrument.studentRubric.every(i=>studentScores[i.id]>=1&&studentScores[i.id]<=5);return true}
  const next=()=>{setError('');const v=step===0?validateInfo():'';if(v){setError(v);return}if(!canNext()){setError('Sila lengkapkan bahagian ini sebelum meneruskan.');return}setStep(s=>Math.min(3,s+1));window.scrollTo({top:0,behavior:'smooth'})}

  const submit=async()=>{
    if(!instrument||!teacher||!evaluator||!schoolClass||!subject){setError('Maklumat instrumen/pencerap/guru/kelas/subjek belum lengkap.');return}
    if(!canNext()){setError('Sila lengkapkan semua skor sebelum menghantar.');return}
    setBusy(true);setError('')
    try{
      const now=new Date().toISOString();const obs:Observation={
        id:uid(),instrumentVersionId:instrument.id,instrumentYearSnapshot:instrument.year,instrumentTitleSnapshot:instrument.shortTitle,
        evaluatorId:evaluator.id,observerName:upper(evaluator.name),observerPosition:upper(evaluator.position),observationDate,observationTime,
        teacherId,teacherNameSnapshot:teacher.name,gender,
        teacherPhone:'',teacherEmail:'',academicQualification:'',professionalQualification:'',optionName:upper(optionName.trim()),teachingExperienceYears:null,
        subjectId,subjectNameSnapshot:subject.name,subjectTeachingExperienceYears:null,specialPosition:'',
        classId,classNameSnapshot:schoolClass.name,classYearSnapshot:schoolClass.year,topic:upper(topic.trim()),studentsPresent,studentsTotal,studentsMale:null,studentsFemale:null,pdpTime,
        selfTeacherScores:teacherScores,selfStudentScores:studentScores,finalTeacherScores:{},finalStudentScores:{},
        reflection1:'',reflection2:'',observerSummary:'',studentObserverSummary:'',observerSignatureDataUrl:'',observerSignedAt:'',
        status:'submitted',googleFormStatus:'pending',createdAt:now,updatedAt:now
      }
      await saveObservation(obs);setSubmittedId(obs.id)
    }catch(e:any){setError(e.message||'Gagal menyimpan rekod.')}finally{setBusy(false)}
  }

  if(submittedId)return <main className="container"><div className="card" style={{maxWidth:720,margin:'50px auto',textAlign:'center'}}><div style={{fontSize:58}}>✅</div><h1>Pengisian berjaya dihantar</h1><p>Rekod telah dihantar kepada PIC. Pencerap akan melengkapkan Bahagian H – Refleksi, Bahagian I – Rumusan dan tandatangan pada PC PIC.</p><p>ID rekod: <strong>{submittedId.slice(0,8).toUpperCase()}</strong></p><div className="toolbar" style={{justifyContent:'center',marginTop:20}}><Link to="/" className="btn btn-secondary">Kembali Utama</Link><button className="btn btn-primary" onClick={()=>location.reload()}>Isi Rekod Baharu</button></div></div></main>

  return <main className="container">
    <div className="section-title"><div><h1>Pengisian ISPPK</h1><p>{instrument?`${instrument.shortTitle} · SK Sungai Abong`:'Memuatkan versi instrumen...'}</p></div></div>
    <div className="card" style={{marginBottom:14}}><div className="field"><label>Versi Instrumen</label><select className="select" value={instrumentVersionId} onChange={e=>changeInstrument(e.target.value)}>{instruments.filter(x=>x.active).sort((a,b)=>b.year-a.year).map(x=><option key={x.id} value={x.id}>{x.year} · {x.shortTitle}</option>)}</select></div></div>
    <div className="steps"><span className={`step-pill ${step===0?'active':''}`}>1 · Bahagian A-D</span><span className={`step-pill ${step===1?'active':''}`}>2 · Bahagian E Guru</span><span className={`step-pill ${step===2?'active':''}`}>3 · Bahagian F Murid</span><span className={`step-pill ${step===3?'active':''}`}>4 · Bahagian G & Hantar</span></div>
    {error&&<div className="notice error" style={{marginBottom:14}}>{error}</div>}

    {step===0&&<div className="card">
      <div className="official-info-block"><h2>Bahagian A – Maklumat Pencerap</h2><div className="form-grid">
        <div className="field span-2"><label>1. Nama Pencerap *</label><SearchSelect value={evaluatorId} onChange={setEvaluatorId} options={evaluators.filter(e=>e.active).sort((a,b)=>a.sortOrder-b.sortOrder).map(e=>({value:e.id,label:e.name}))} placeholder="Cari nama pencerap..."/><div className="helper">Senarai diambil daripada Pegawai Penilai. Nama pencerap tidak dikunci mengikut PYD.</div></div>
        <div className="field span-2"><label>2. Jawatan</label><input className="input official-readonly" readOnly value={observerPosition}/></div>
        <div className="field"><label>3. Tarikh Pencerapan *</label><DatePicker value={observationDate} onChange={setObservationDate}/></div>
        <div className="field"><label>4. Masa Pencerapan *</label><TimePicker value={observationTime} onChange={setObservationTime}/></div>
      </div></div>

      <div className="official-info-block"><h2>Bahagian B – Maklumat Sekolah</h2><div className="form-grid">
        <div className="field"><label>1. Kod Sekolah</label><input className="input official-readonly" readOnly value={school?.schoolCode||''}/></div>
        <div className="field"><label>2. Nama Sekolah</label><input className="input official-readonly" readOnly value={school?.schoolName||''}/></div>
        <div className="field"><label>3. PPD</label><input className="input official-readonly" readOnly value={school?.ppd||''}/></div>
        <div className="field"><label>4. Negeri</label><input className="input official-readonly" readOnly value={school?.state||''}/></div>
        <div className="field span-2"><label>5. E-mel Rasmi Sekolah</label><input className="input official-readonly" readOnly value={school?.officialEmail||''}/></div>
      </div></div>

      <div className="official-info-block"><h2>Bahagian C – Maklumat Guru Yang Dicerap</h2><div className="form-grid">
        <div className="field span-2"><label>1. Nama *</label><SearchSelect value={teacherId} onChange={setTeacherId} options={teachers.filter(t=>t.active).sort((a,b)=>a.sortOrder-b.sortOrder).map(t=>({value:t.id,label:t.name}))} placeholder="Cari nama guru..."/></div>
        <div className="field"><label>2. Jantina *</label><select className="select" value={gender} onChange={e=>setGender(e.target.value as Gender)}><option value="">Pilih</option><option>Lelaki</option><option>Perempuan</option></select></div>
        <div className="field"><label>3. Opsyen *</label><input className="input" value={optionName} onChange={e=>setOptionName(upper(e.target.value))}/></div>
      </div></div>

      <div className="official-info-block"><h2>Bahagian D – Maklumat Kelas Yang Dicerap</h2><div className="form-grid">
        <div className="field span-2"><label>1. Mata Pelajaran Dicerap *</label><SearchSelect value={subjectId} onChange={setSubjectId} options={subjects.filter(s=>s.active).map(s=>({value:s.id,label:s.name}))}/></div>
        <div className="field"><label>2. Bil. Murid Hadir *</label><input className="input" type="number" min="0" value={studentsPresent??''} onChange={e=>setStudentsPresent(e.target.value===''?null:Number(e.target.value))}/></div>
        <div className="field"><label>Daripada Jumlah Murid *</label><input className="input" type="number" min="1" value={studentsTotal??''} onChange={e=>setStudentsTotal(e.target.value===''?null:Number(e.target.value))}/></div>
        <div className="field span-2"><label>3. Tahun/Tingkatan *</label><SearchSelect value={classId} onChange={setClassId} options={classes.filter(c=>c.active).map(c=>({value:c.id,label:`TAHUN ${c.year} - ${c.name}`,group:`Tahun ${c.year}`}))}/><div className="helper">Nama kelas disimpan untuk kegunaan Google Form; tahap Tahun 1-6 diambil daripada pilihan ini.</div></div>
        <div className="field span-2"><label>4. Tajuk/Topik *</label><input className="input" value={topic} onChange={e=>setTopic(upper(e.target.value))}/></div>
        <div className="field"><label>5. Masa PdP *</label><TimePicker value={pdpTime} onChange={setPdpTime}/></div>
      </div></div>
    </div>}

    {step===1&&instrument&&<div><div className="card" style={{marginBottom:14,textAlign:'center'}}><strong>Bahagian E – Rubrik Penilaian Guru</strong><div className="helper" style={{marginTop:6}}>Pilih skor 1 hingga 5 berdasarkan rubrik rasmi 2026.</div></div>{instrument.teacherRubric.map(item=><RubricCard key={item.id} item={item} value={teacherScores[item.id]} onChange={n=>setTeacherScores({...teacherScores,[item.id]:n})} scoreLabels={instrument.scoreLabels}/>)}</div>}

    {step===2&&instrument&&<div><div className="student-guide"><strong>Bahagian F – Rubrik Penilaian Murid</strong>{instrument.studentScoreGuide.map((g,i)=><div key={i}>{g}</div>)}</div><div className="card" style={{marginBottom:14}}><strong>Murid Sebagai Pembelajar Aktif</strong></div>{instrument.studentRubric.map((item,i)=><StudentScoreCard key={item.id} item={item} index={i} value={studentScores[item.id]} onChange={n=>setStudentScores({...studentScores,[item.id]:n})} scoreGuide={instrument.studentScoreGuide}/>)}</div>}

    {step===3&&instrument&&<div className="grid">
      <div className="card"><div className="official-section-title">Bahagian G – Pengiraan Skor dan Pencapaian</div><div className="table-wrap"><table style={{minWidth:0}}><thead><tr><th>Komponen</th><th>Domain</th><th>Skor Diperoleh</th><th>Skor Maksimum</th></tr></thead><tbody>{instrument.domains.map((d,i)=><tr key={d.id}><td>Guru</td><td>{i+1}. {d.label}</td><td>{sums?.domains[d.id]||0}</td><td>{d.maxScore}</td></tr>)}<tr><td>Murid</td><td>Murid Sebagai Pembelajar Aktif</td><td>{sums?.student||0}</td><td>50</td></tr><tr><td colSpan={2}><strong>Jumlah Skor Keseluruhan</strong></td><td><strong>{sums?.total||0}</strong></td><td><strong>100</strong></td></tr><tr><td colSpan={2}><strong>Peratus Pencapaian</strong></td><td colSpan={2}><strong>{sums?.percent||0}%</strong></td></tr></tbody></table></div><div className="notice" style={{marginTop:12}}>{achievementLabel(sums?.percent||0,instrument)}</div></div>
      <div className="card"><div className="official-section-title">Bahagian Selepas Hantar</div><p>Selepas dihantar, PIC membuka rekod pada PC PIC dan pencerap melengkapkan <strong>Bahagian H – Refleksi, Bahagian I – Rumusan serta tandatangan digital</strong>.</p></div>
    </div>}

    <div className="sticky-actions"><button className="btn btn-secondary" disabled={step===0||busy} onClick={()=>{setStep(s=>Math.max(0,s-1));window.scrollTo({top:0,behavior:'smooth'})}}>← Kembali</button>{step<3?<button className="btn btn-primary" onClick={next} disabled={busy}>Seterusnya →</button>:<button className="btn btn-primary" onClick={submit} disabled={busy}>{busy?'Menyimpan...':'Hantar Kepada PIC'}</button>}</div>
  </main>
}
