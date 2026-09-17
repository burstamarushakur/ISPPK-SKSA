import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SearchSelect from '../components/SearchSelect'
import { DatePicker, TimePicker } from '../components/Pickers'
import RubricCard from '../components/RubricCard'
import StudentScoreCard from '../components/StudentScoreCard'
import { getClasses, getInstrumentVersions, getSubjects, getTeachers, saveObservation } from '../lib/store'
import type { Gender, InstrumentVersion, Observation, SchoolClass, ScoreMap, Subject, Teacher } from '../lib/types'
import { getDefaultInstrumentFromList } from '../instruments/registry'
import { scoreSummary, uid, upper } from '../lib/utils'

function todayIso() {
  const d = new Date(); const off = d.getTimezoneOffset(); const local = new Date(d.getTime() - off * 60000); return local.toISOString().slice(0,10)
}

export default function TeacherForm() {
  const [instruments, setInstruments] = useState<InstrumentVersion[]>([])
  const [instrumentVersionId, setInstrumentVersionId] = useState('')
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [step, setStep] = useState(0)
  const [submittedId, setSubmittedId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [teacherId, setTeacherId] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [optionName, setOptionName] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [classId, setClassId] = useState('')
  const [topic, setTopic] = useState('')
  const [studentsPresent, setStudentsPresent] = useState<number | null>(null)
  const [studentsTotal, setStudentsTotal] = useState<number | null>(null)
  const [observationDate, setObservationDate] = useState(todayIso())
  const [observationTime, setObservationTime] = useState('')
  const [pdpTime, setPdpTime] = useState('')
  const [teacherScores, setTeacherScores] = useState<ScoreMap>({})
  const [studentScores, setStudentScores] = useState<ScoreMap>({})
  const [reflection1, setReflection1] = useState('')
  const [reflection2, setReflection2] = useState('')

  useEffect(() => {
    Promise.all([getInstrumentVersions(), getTeachers(), getClasses(), getSubjects()])
      .then(([iv,t,c,s]) => {
        setInstruments(iv)
        const def = getDefaultInstrumentFromList(iv)
        if (def) setInstrumentVersionId(def.id)
        setTeachers(t); setClasses(c); setSubjects(s)
      })
      .catch(e => setError(e.message))
  }, [])

  const instrument = instruments.find(x => x.id === instrumentVersionId)
  const teacher = teachers.find(t => t.id === teacherId)
  const schoolClass = classes.find(c => c.id === classId)
  const subject = subjects.find(s => s.id === subjectId)

  useEffect(() => {
    if (!teacher) return
    setGender(teacher.gender)
    if (teacher.optionName) setOptionName(teacher.optionName)
  }, [teacherId, teacher])

  const changeInstrument = (id: string) => {
    setInstrumentVersionId(id)
    setTeacherScores({})
    setStudentScores({})
    setStep(0)
  }

  const previewObs = useMemo<Observation | null>(() => instrument ? ({
    id:'preview', instrumentVersionId: instrument.id, instrumentYearSnapshot: instrument.year, instrumentTitleSnapshot: instrument.shortTitle,
    teacherId, teacherNameSnapshot: teacher?.name || '', gender, optionName, subjectId, subjectNameSnapshot: subject?.name || '', classId,
    classNameSnapshot: schoolClass?.name || '', classYearSnapshot: schoolClass?.year, topic, studentsPresent, studentsTotal, pdpTime, observationDate, observationTime,
    selfTeacherScores:teacherScores, selfStudentScores:studentScores, finalTeacherScores:{}, finalStudentScores:{}, reflection1, reflection2,
    observerName:'', observerPosition:'', observerSummary:'', status:'submitted', googleFormStatus:'pending', createdAt:'', updatedAt:''
  }) : null, [instrument, teacherId, teacher, gender, optionName, subjectId, subject, classId, schoolClass, topic, studentsPresent, studentsTotal, pdpTime, observationDate, observationTime, teacherScores, studentScores, reflection1, reflection2])

  const sums = instrument && previewObs ? scoreSummary(previewObs, instrument) : null

  const validateStep0 = () => {
    if (!instrument) return 'Pilih versi instrumen.'
    if (!teacherId || !gender || !subjectId || !classId || !topic.trim() || studentsPresent == null || studentsTotal == null || !observationDate || !pdpTime) return 'Lengkapkan semua maklumat wajib.'
    if (studentsPresent < 0 || studentsTotal < 1 || studentsPresent > studentsTotal) return 'Semak bilangan murid hadir dan jumlah murid.'
    return ''
  }
  const canNext = () => {
    if (!instrument) return false
    if (step === 0) return !validateStep0()
    if (step === 1) return instrument.teacherRubric.every(i => teacherScores[i.id] >= 1 && teacherScores[i.id] <= 5)
    if (step === 2) return instrument.studentRubric.every(i => studentScores[i.id] >= 1 && studentScores[i.id] <= 5)
    return reflection1.trim().length > 0 && reflection2.trim().length > 0
  }

  const next = () => {
    setError('')
    const v = step===0 ? validateStep0() : ''
    if (v) { setError(v); return }
    if (!canNext()) { setError('Sila lengkapkan bahagian ini sebelum meneruskan.'); return }
    setStep(s => Math.min(3, s+1)); window.scrollTo({top:0,behavior:'smooth'})
  }

  const submit = async () => {
    if (!instrument || !teacher || !schoolClass || !subject) { setError('Maklumat instrumen/guru/kelas/subjek belum lengkap.'); return }
    if (!canNext()) { setError('Sila lengkapkan refleksi sebelum menghantar.'); return }
    setBusy(true); setError('')
    try {
      const now = new Date().toISOString()
      const obs: Observation = {
        id: uid(),
        instrumentVersionId: instrument.id,
        instrumentYearSnapshot: instrument.year,
        instrumentTitleSnapshot: instrument.shortTitle,
        teacherId,
        teacherNameSnapshot: teacher.name,
        gender,
        optionName: upper(optionName.trim()),
        subjectId,
        subjectNameSnapshot: subject.name,
        classId,
        classNameSnapshot: schoolClass.name,
        classYearSnapshot: schoolClass.year,
        topic: upper(topic.trim()),
        studentsPresent,
        studentsTotal,
        pdpTime,
        observationDate,
        observationTime,
        selfTeacherScores: teacherScores,
        selfStudentScores: studentScores,
        finalTeacherScores:{},
        finalStudentScores:{},
        reflection1: reflection1.trim(),
        reflection2: reflection2.trim(),
        observerName:'', observerPosition:'', observerSummary:'', status:'submitted', googleFormStatus:'pending', createdAt:now, updatedAt:now
      }
      await saveObservation(obs); setSubmittedId(obs.id)
    } catch (e:any) { setError(e.message || 'Gagal menyimpan rekod.') } finally { setBusy(false) }
  }

  if (submittedId) return <main className="container"><div className="card" style={{maxWidth:720,margin:'50px auto',textAlign:'center'}}>
    <div style={{fontSize:58}}>✅</div><h1>Pengisian berjaya dihantar</h1><p>Rekod telah disimpan untuk semakan PIC. ID rekod: <strong>{submittedId.slice(0,8).toUpperCase()}</strong></p>
    <div className="toolbar" style={{justifyContent:'center',marginTop:20}}><Link to="/" className="btn btn-secondary">Kembali Utama</Link><button className="btn btn-primary" onClick={() => location.reload()}>Isi Rekod Baharu</button></div>
  </div></main>

  return <main className="container">
    <div className="section-title"><div><h1>Pengisian ISPPK</h1><p>{instrument ? `${instrument.shortTitle} · SK Sungai Abong` : 'Memuatkan versi instrumen...'}</p></div></div>
    <div className="steps">{['Maklumat PdP','Rubrik Guru','Rubrik Murid','Refleksi & Semak'].map((s,i)=><span key={s} className={`step-pill ${step===i?'active':''}`}>{i+1}. {s}</span>)}</div>
    {error && <div className="notice error" style={{marginBottom:14}}>{error}</div>}

    {step === 0 && <div className="card">
      <h2>Maklumat Guru & PdP</h2>
      <div className="notice" style={{marginBottom:16}}>Profil sekolah ditetapkan automatik: <strong>JOHOR · PPD MUAR · JBA5095 · SEKOLAH KEBANGSAAN SUNGAI ABONG</strong>.</div>
      <div className="form-grid">
        <div className="field span-2"><label>Versi Instrumen *</label><select className="select" value={instrumentVersionId} onChange={e=>changeInstrument(e.target.value)}>
          {instruments.filter(x=>x.active).sort((a,b)=>b.year-a.year).map(x=><option key={x.id} value={x.id}>{x.year} · {x.shortTitle}</option>)}
        </select><span className="helper">Setiap rekod dikunci kepada versi instrumen yang dipilih supaya data tahun lama tidak berubah apabila versi baharu ditambah.</span></div>
        <div className="field span-2"><label>Nama Guru *</label><SearchSelect value={teacherId} onChange={setTeacherId} options={teachers.filter(t=>t.active).sort((a,b)=>a.sortOrder-b.sortOrder).map(t=>({value:t.id,label:t.name}))} placeholder="Cari nama guru..." /></div>
        <div className="field"><label>Jantina *</label><select className="select" value={gender} onChange={e=>setGender(e.target.value as Gender)}><option value="">Pilih</option><option>Lelaki</option><option>Perempuan</option></select></div>
        <div className="field"><label>Opsyen</label><input className="input" value={optionName} onChange={e=>setOptionName(upper(e.target.value))} placeholder="Contoh: BAHASA MELAYU" /></div>
        <div className="field"><label>Mata Pelajaran Dicerap *</label><SearchSelect value={subjectId} onChange={setSubjectId} options={subjects.filter(s=>s.active).map(s=>({value:s.id,label:s.name}))} /></div>
        <div className="field"><label>Kelas *</label><SearchSelect value={classId} onChange={setClassId} options={classes.filter(c=>c.active).map(c=>({value:c.id,label:`TAHUN ${c.year} - ${c.name}`,group:`Tahun ${c.year}`}))} /></div>
        <div className="field span-2"><label>Tajuk / Topik *</label><input className="input" value={topic} onChange={e=>setTopic(upper(e.target.value))} placeholder="TAJUK PDP" /></div>
        <div className="field"><label>Bil. Murid Hadir *</label><input className="input" type="number" min="0" value={studentsPresent ?? ''} onChange={e=>setStudentsPresent(e.target.value===''?null:Number(e.target.value))}/></div>
        <div className="field"><label>Jumlah Murid Dalam Kelas *</label><input className="input" type="number" min="1" value={studentsTotal ?? ''} onChange={e=>setStudentsTotal(e.target.value===''?null:Number(e.target.value))}/></div>
        <div className="field"><label>Tarikh Pencerapan *</label><DatePicker value={observationDate} onChange={setObservationDate}/></div>
        <div className="field"><label>Masa PdP *</label><TimePicker value={pdpTime} onChange={setPdpTime}/></div>
        <div className="field"><label>Masa Pencerapan</label><TimePicker value={observationTime} onChange={setObservationTime}/></div>
      </div>
    </div>}

    {step === 1 && instrument && <div>
      <div className="section-title"><div><h2>Rubrik Penilaian Guru · {instrument.year}</h2><p>Pilih skor berdasarkan evidens dan rubrik versi ini.</p></div></div>
      {instrument.teacherRubric.map(item=><RubricCard key={item.id} item={item} value={teacherScores[item.id]} onChange={n=>setTeacherScores({...teacherScores,[item.id]:n})} scoreLabels={instrument.scoreLabels}/>) }
    </div>}

    {step === 2 && instrument && <div>
      <div className="section-title"><div><h2>Rubrik Penilaian Murid · {instrument.year}</h2><p>Panduan skor mengikut peratus bilangan murid yang mencapai item.</p></div></div>
      {instrument.studentRubric.map((item,i)=><StudentScoreCard key={item.id} item={item} index={i} value={studentScores[item.id]} onChange={n=>setStudentScores({...studentScores,[item.id]:n})} scoreGuide={instrument.studentScoreGuide}/>) }
    </div>}

    {step === 3 && instrument && <div className="grid grid-2">
      <div className="card"><h2>Bahagian H - Refleksi</h2><div className="field"><label>1. Apa pandangan anda mengenai PdP KBAT yang telah dilaksanakan?</label><textarea rows={7} value={reflection1} onChange={e=>setReflection1(e.target.value)} /></div><div className="field" style={{marginTop:14}}><label>2. Bagaimana anda boleh membuat penambahbaikan/pemantapan terhadap PdP KBAT?</label><textarea rows={7} value={reflection2} onChange={e=>setReflection2(e.target.value)} /></div></div>
      <div className="card"><h2>Semakan Skor</h2><div className="version-chip">Versi {instrument.year} · {instrument.code}</div><div style={{marginTop:14}}>{instrument.domains.map(domain=><p key={domain.id}>{domain.label}: <strong>{sums?.domains[domain.id] || 0}/{domain.maxScore}</strong></p>)}<p>Murid: <strong>{sums?.student || 0}/{instrument.studentMaxScore}</strong></p><hr/><p style={{fontSize:24}}>Jumlah: <strong>{sums?.total || 0}/{instrument.totalMaxScore}</strong></p></div></div>
    </div>}

    <div className="sticky-actions"><button className="btn btn-secondary" disabled={step===0||busy} onClick={()=>{setStep(s=>Math.max(0,s-1));window.scrollTo({top:0,behavior:'smooth'})}}>← Kembali</button>{step<3?<button className="btn btn-primary" onClick={next} disabled={busy}>Seterusnya →</button>:<button className="btn btn-primary" onClick={submit} disabled={busy}>{busy?'Menyimpan...':'Hantar Kepada PIC'}</button>}</div>
  </main>
}
