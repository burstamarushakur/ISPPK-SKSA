import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SearchSelect from '../components/SearchSelect'
import { DatePicker, TimePicker } from '../components/Pickers'
import RubricCard from '../components/RubricCard'
import StudentScoreCard from '../components/StudentScoreCard'
import { getClasses, getInstrumentVersions, getSchoolSettings, getSubjects, getTeachers, saveObservation } from '../lib/store'
import type { Gender, InstrumentVersion, Observation, SchoolClass, SchoolSettings, ScoreMap, Subject, Teacher } from '../lib/types'
import { getDefaultInstrumentFromList } from '../instruments/registry'
import { achievementLabel, scoreSummary, uid, upper } from '../lib/utils'

function todayIso() {
  const d = new Date(); const off = d.getTimezoneOffset(); const local = new Date(d.getTime() - off * 60000); return local.toISOString().slice(0,10)
}

export default function TeacherForm() {
  const [instruments, setInstruments] = useState<InstrumentVersion[]>([])
  const [instrumentVersionId, setInstrumentVersionId] = useState('')
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [school, setSchool] = useState<SchoolSettings | null>(null)
  const [step, setStep] = useState(0)
  const [submittedId, setSubmittedId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Bahagian A
  const [observerName, setObserverName] = useState('')
  const [observerPosition, setObserverPosition] = useState('')
  const [observationDate, setObservationDate] = useState(todayIso())
  const [observationTime, setObservationTime] = useState('')

  // Bahagian C & D
  const [teacherId, setTeacherId] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [optionName, setOptionName] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [classId, setClassId] = useState('')
  const [topic, setTopic] = useState('')
  const [studentsPresent, setStudentsPresent] = useState<number | null>(null)
  const [studentsTotal, setStudentsTotal] = useState<number | null>(null)
  const [pdpTime, setPdpTime] = useState('')

  // Bahagian E-I
  const [teacherScores, setTeacherScores] = useState<ScoreMap>({})
  const [studentScores, setStudentScores] = useState<ScoreMap>({})
  const [reflection1, setReflection1] = useState('')
  const [reflection2, setReflection2] = useState('')
  const [observerSummary, setObserverSummary] = useState('')

  useEffect(() => {
    Promise.all([getInstrumentVersions(), getTeachers(), getClasses(), getSubjects(), getSchoolSettings()])
      .then(([iv,t,c,s,sc]) => {
        setInstruments(iv)
        const def = getDefaultInstrumentFromList(iv)
        if (def) setInstrumentVersionId(def.id)
        setTeachers(t); setClasses(c); setSubjects(s); setSchool(sc)
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
    observerName, observerPosition, observerSummary, status:'submitted', googleFormStatus:'pending', createdAt:'', updatedAt:''
  }) : null, [instrument, teacherId, teacher, gender, optionName, subjectId, subject, classId, schoolClass, topic, studentsPresent, studentsTotal, pdpTime, observationDate, observationTime, teacherScores, studentScores, reflection1, reflection2, observerName, observerPosition, observerSummary])

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
        observerName: upper(observerName.trim()),
        observerPosition: upper(observerPosition.trim()),
        observerSummary: observerSummary.trim(),
        status:'submitted', googleFormStatus:'pending', createdAt:now, updatedAt:now
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
    <div className="card" style={{marginBottom:14}}><div className="field"><label>Versi Instrumen</label><select className="select" value={instrumentVersionId} onChange={e=>changeInstrument(e.target.value)}>
      {instruments.filter(x=>x.active).sort((a,b)=>b.year-a.year).map(x=><option key={x.id} value={x.id}>{x.year} · {x.shortTitle}</option>)}
    </select></div></div>
    <div className="steps">{['Bahagian A-D · Maklumat','Bahagian E · Guru','Bahagian F · Murid','Bahagian G-I · Skor & Refleksi'].map((s,i)=><span key={s} className={`step-pill ${step===i?'active':''}`}>{i+1}. {s}</span>)}</div>
    {error && <div className="notice error" style={{marginBottom:14}}>{error}</div>}

    {step === 0 && <div className="card">
      <div className="official-info-block"><h2>Bahagian A – Maklumat Pencerap</h2><div className="form-grid">
        <div className="field span-2"><label>1. Nama Pencerap</label><input className="input" value={observerName} onChange={e=>setObserverName(upper(e.target.value))}/></div>
        <div className="field span-2"><label>2. Jawatan</label><input className="input" value={observerPosition} onChange={e=>setObserverPosition(upper(e.target.value))}/></div>
        <div className="field"><label>3. Tarikh Pencerapan *</label><DatePicker value={observationDate} onChange={setObservationDate}/></div>
        <div className="field"><label>4. Masa Pencerapan</label><TimePicker value={observationTime} onChange={setObservationTime}/></div>
      </div></div>

      <div className="official-info-block"><h2>Bahagian B – Maklumat Sekolah</h2><div className="form-grid">
        <div className="field"><label>1. Kod Sekolah</label><input className="input official-readonly" readOnly value={school?.schoolCode || ''}/></div>
        <div className="field"><label>2. Nama Sekolah</label><input className="input official-readonly" readOnly value={school?.schoolName || ''}/></div>
        <div className="field"><label>3. PPD</label><input className="input official-readonly" readOnly value={school?.ppd || ''}/></div>
        <div className="field"><label>4. Negeri</label><input className="input official-readonly" readOnly value={school?.state || ''}/></div>
        <div className="field span-2"><label>5. E-mel Rasmi Sekolah</label><input className="input official-readonly" readOnly value={school?.officialEmail || ''}/></div>
      </div></div>

      <div className="official-info-block"><h2>Bahagian C – Maklumat Guru Yang Dicerap</h2><div className="form-grid">
        <div className="field span-2"><label>1. Nama *</label><SearchSelect value={teacherId} onChange={setTeacherId} options={teachers.filter(t=>t.active).sort((a,b)=>a.sortOrder-b.sortOrder).map(t=>({value:t.id,label:t.name}))} placeholder="Cari nama guru..." /></div>
        <div className="field"><label>2. Jantina *</label><select className="select" value={gender} onChange={e=>setGender(e.target.value as Gender)}><option value="">Pilih</option><option>Lelaki</option><option>Perempuan</option></select></div>
        <div className="field"><label>3. Opsyen</label><input className="input" value={optionName} onChange={e=>setOptionName(upper(e.target.value))}/></div>
      </div></div>

      <div className="official-info-block"><h2>Bahagian D – Maklumat Kelas Yang Dicerap</h2><div className="form-grid">
        <div className="field span-2"><label>1. Mata Pelajaran Dicerap *</label><SearchSelect value={subjectId} onChange={setSubjectId} options={subjects.filter(s=>s.active).map(s=>({value:s.id,label:s.name}))} /></div>
        <div className="field"><label>2. Bil. Murid Hadir *</label><input className="input" type="number" min="0" value={studentsPresent ?? ''} onChange={e=>setStudentsPresent(e.target.value===''?null:Number(e.target.value))}/></div>
        <div className="field"><label>___ / ___ orang (Jumlah Murid)</label><input className="input" type="number" min="1" value={studentsTotal ?? ''} onChange={e=>setStudentsTotal(e.target.value===''?null:Number(e.target.value))}/></div>
        <div className="field span-2"><label>3. Tahun/Tingkatan *</label><SearchSelect value={classId} onChange={setClassId} options={classes.filter(c=>c.active).map(c=>({value:c.id,label:`TAHUN ${c.year} - ${c.name}`,group:`Tahun ${c.year}`}))} /></div>
        <div className="field span-2"><label>4. Tajuk/Topik *</label><input className="input" value={topic} onChange={e=>setTopic(upper(e.target.value))}/></div>
        <div className="field"><label>5. Masa PdP *</label><TimePicker value={pdpTime} onChange={setPdpTime}/></div>
      </div></div>
    </div>}

    {step === 1 && instrument && <div>
      <div className="official-section-title">Bahagian E – Rubrik Penilaian Guru</div>
      <div className="card" style={{marginBottom:14,textAlign:'center'}}><strong>RUBRIK INSTRUMEN STANDARD PENILAIAN PEMBUDAYAAN<br/>KEMAHIRAN BERFIKIR ARAS TINGGI (KBAT) DALAM PENGAJARAN DAN PEMBELAJARAN (GURU)<br/>TAHUN {instrument.year}</strong></div>
      {instrument.teacherRubric.map(item=><RubricCard key={item.id} item={item} value={teacherScores[item.id]} onChange={n=>setTeacherScores({...teacherScores,[item.id]:n})} scoreLabels={instrument.scoreLabels}/>) }
    </div>}

    {step === 2 && instrument && <div>
      <div className="official-section-title">Bahagian F – Rubrik Penilaian Murid</div>
      <div className="student-guide"><strong>PANDUAN SKOR</strong>{instrument.studentScoreGuide.map((g,i)=><div key={i}>{g}</div>)}</div>
      <div className="card" style={{marginBottom:14}}><strong>Murid Sebagai Pembelajar Aktif</strong></div>
      {instrument.studentRubric.map((item,i)=><StudentScoreCard key={item.id} item={item} index={i} value={studentScores[item.id]} onChange={n=>setStudentScores({...studentScores,[item.id]:n})} scoreGuide={instrument.studentScoreGuide}/>) }
    </div>}

    {step === 3 && instrument && <div className="grid">
      <div className="card"><div className="official-section-title">Bahagian G – Pengiraan Skor dan Pencapaian</div>
        <div className="table-wrap"><table style={{minWidth:0}}><thead><tr><th>Komponen</th><th>Domain</th><th>Skor Diperoleh</th><th>Skor Maksimum</th></tr></thead><tbody>
          <tr><td rowSpan={3}>Guru</td><td>1. Perancangan</td><td>{sums?.domains.planning || 0}</td><td>20</td></tr>
          <tr><td>2. Pelaksanaan</td><td>{sums?.domains.implementation || 0}</td><td>25</td></tr>
          <tr><td>3. Refleksi</td><td>{sums?.domains.reflection || 0}</td><td>5</td></tr>
          <tr><td>Murid</td><td>Murid Sebagai Pembelajar Aktif</td><td>{sums?.student || 0}</td><td>50</td></tr>
          <tr><td colSpan={2}><strong>Jumlah Skor Keseluruhan</strong></td><td><strong>{sums?.total || 0}</strong></td><td><strong>100</strong></td></tr>
          <tr><td colSpan={2}><strong>Peratus Pencapaian (%)</strong></td><td colSpan={2}><strong>{sums?.percent || 0}%</strong></td></tr>
        </tbody></table></div>
        <div style={{marginTop:14}}><strong>RUJUKAN TAHAP PENCAPAIAN:</strong><div className="table-wrap" style={{marginTop:8}}><table style={{minWidth:0}}><thead><tr><th>Skor</th><th>Penerangan</th></tr></thead><tbody>{instrument.achievementBands.map((b,i)=><tr key={i} className={(sums?.percent || 0)>=b.min&&(sums?.percent || 0)<=b.max?'achievement-active':''}><td><strong>{i===0?'≤ 40%':`${b.min}% - ${b.max}%`}</strong></td><td>{b.label}</td></tr>)}</tbody></table></div></div>
      </div>

      <div className="card"><div className="official-section-title">Bahagian H – Refleksi (Diisi oleh pencerap semasa menemu bual guru sekolah)</div>
        <div className="field"><label>1. Apa pandangan anda mengenai pengajaran dan pembelajaran (PdP) KBAT yang telah anda laksanakan tadi?</label><textarea rows={7} value={reflection1} onChange={e=>setReflection1(e.target.value)} /></div>
        <div className="field" style={{marginTop:14}}><label>2. Bagaimana anda boleh membuat penambahbaikan/pemantapan terhadap PdP KBAT anda? (Nyatakan perancangan anda.)</label><textarea rows={7} value={reflection2} onChange={e=>setReflection2(e.target.value)} /></div>
      </div>

      <div className="card"><div className="official-section-title">Bahagian I – Rumusan</div>
        <div className="field"><label>Rumusan Keseluruhan Pencerap:</label><textarea rows={5} value={observerSummary} onChange={e=>setObserverSummary(e.target.value)} /></div>
        <div className="form-grid" style={{marginTop:14}}><div className="field"><label>Tandatangan Pencerap:</label><input className="input official-readonly" readOnly value="Ditandatangani pada salinan PDF / cetakan"/></div><div className="field"><label>Tarikh :</label><input className="input official-readonly" readOnly value={observationDate}/></div></div>
      </div>
    </div>}

    <div className="sticky-actions"><button className="btn btn-secondary" disabled={step===0||busy} onClick={()=>{setStep(s=>Math.max(0,s-1));window.scrollTo({top:0,behavior:'smooth'})}}>← Kembali</button>{step<3?<button className="btn btn-primary" onClick={next} disabled={busy}>Seterusnya →</button>:<button className="btn btn-primary" onClick={submit} disabled={busy}>{busy?'Menyimpan...':'Hantar Kepada PIC'}</button>}</div>
  </main>
}
