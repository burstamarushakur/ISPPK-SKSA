import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import RubricCard from '../components/RubricCard'
import StudentScoreCard from '../components/StudentScoreCard'
import SignaturePad from '../components/SignaturePad'
import { picIsLoggedIn } from '../lib/auth'
import { deleteObservation, getClasses, getInstrumentVersions, getObservation, getSchoolSettings, getSubjects, getTeachers, saveObservation } from '../lib/store'
import type { InstrumentVersion, Observation, SchoolClass, SchoolSettings, Subject, Teacher } from '../lib/types'
import { achievementLabel, attendanceBucket, formatDateMY, formatTime, levelBucket, scoreSummary } from '../lib/utils'
import { downloadBlob, generateOfficialPdf } from '../lib/pdf'

export default function RecordEditor(){
  const {id=''}=useParams(); const navigate=useNavigate()
  const [obs,setObs]=useState<Observation|null>(null)
  const [instruments,setInstruments]=useState<InstrumentVersion[]>([])
  const [teachers,setTeachers]=useState<Teacher[]>([])
  const [classes,setClasses]=useState<SchoolClass[]>([])
  const [subjects,setSubjects]=useState<Subject[]>([])
  const [school,setSchool]=useState<SchoolSettings|null>(null)
  const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [saved,setSaved]=useState(false)
  const [section,setSection]=useState<'info'|'teacher'|'student'|'observer'|'google'>('info')

  useEffect(()=>{ picIsLoggedIn().then(async ok=>{
    if(!ok){navigate('/pic');return}
    try{
      const [o,iv,t,c,s,sc]=await Promise.all([getObservation(id),getInstrumentVersions(),getTeachers(),getClasses(),getSubjects(),getSchoolSettings()])
      if(!o){setError('Rekod tidak ditemui.');return}
      setObs(o);setInstruments(iv);setTeachers(t);setClasses(c);setSubjects(s);setSchool(sc)
    }catch(e:any){setError(e.message)}
  }) },[id,navigate])

  const instrument=instruments.find(v=>v.id===obs?.instrumentVersionId)
  const summary=useMemo(()=>obs&&instrument?scoreSummary(obs,instrument):null,[obs,instrument])
  const teacher=teachers.find(t=>t.id===obs?.teacherId)
  const schoolClass=classes.find(c=>c.id===obs?.classId)
  const subject=subjects.find(s=>s.id===obs?.subjectId)
  const mapping=instrument?.googleFormMapping
  const legacyStudentSchema=!!(obs&&instrument&&Object.keys(obs.selfStudentScores||{}).some(k=>!instrument.studentRubric.some(i=>i.id===k)))

  const validateObserver=()=>{
    if(!obs)return 'Rekod tidak ditemui.'
    if(!obs.reflection1.trim()||!obs.reflection2.trim())return 'Lengkapkan kedua-dua soalan Bahagian H – Refleksi.'
    if(!obs.observerSummary.trim())return 'Lengkapkan Bahagian I – Rumusan Keseluruhan Pencerap.'
    if(!obs.observerSignatureDataUrl)return 'Lengkapkan tandatangan digital pencerap.'
    return ''
  }

  const save=async(verify:boolean)=>{
    if(!obs)return
    setError('');setSaved(false)
    if(verify){const v=validateObserver();if(v){setError(v);setSection('observer');return}}
    setBusy(true)
    try{
      const next={...obs,status:verify?'verified' as const:obs.status,updatedAt:new Date().toISOString()}
      await saveObservation(next);setObs(next);setSaved(true)
    }catch(e:any){setError(e.message||'Gagal menyimpan.')}finally{setBusy(false)}
  }

  const removeRecord=async()=>{
    if(!obs)return
    if(!confirm(`Padam rekod ${teacher?.name||obs.teacherNameSnapshot||''}? Tindakan ini tidak boleh dibatalkan.`))return
    setBusy(true);setError('')
    try{await deleteObservation(obs.id);navigate('/pic')}catch(e:any){setError(e.message||'Gagal memadam rekod.');setBusy(false)}
  }

  const setGoogle=async(status:'pending'|'sent')=>{
    if(!obs)return
    setBusy(true);setError('')
    try{const next={...obs,googleFormStatus:status,updatedAt:new Date().toISOString()};await saveObservation(next);setObs(next);setSaved(true)}catch(e:any){setError(e.message||'Gagal mengubah status Google Form.')}finally{setBusy(false)}
  }

  const makePdf=async()=>{
    if(!obs||!instrument||!teacher||!schoolClass||!subject||!school)return
    const v=validateObserver();if(v){setError(v);setSection('observer');return}
    setBusy(true);setError('')
    try{
      const blob=await generateOfficialPdf(obs,teacher,schoolClass,subject,school,instrument)
      downloadBlob(blob,`ISPPK_${instrument.year}_${(teacher.name||'GURU').replace(/[^A-Z0-9]+/gi,'_')}.pdf`)
    }catch(e:any){setError(e.message||'Gagal menjana PDF.')}finally{setBusy(false)}
  }

  if(error&&!obs)return <main className="container"><div className="notice error">{error}</div></main>
  if(!obs||!instrument)return <main className="container"><div className="empty">Memuatkan rekod...</div></main>

  const tabs:Array<[typeof section,string]>=[['info','Bahagian A-D'],['teacher','Bahagian E · Guru'],['student','Bahagian F · Murid'],['observer','Bahagian H-I · Pencerap'],['google','Google Form']]

  return <main className="container">
    <div className="section-title"><div><Link to="/pic" className="helper">← Dashboard PIC</Link><h1 style={{marginTop:6}}>{teacher?.name||obs.teacherNameSnapshot||'Rekod ISPPK'}</h1><p><span className="version-chip">{instrument.year}</span> {subject?.name||obs.subjectNameSnapshot} · {schoolClass?`TAHUN ${schoolClass.year} - ${schoolClass.name}`:obs.classNameSnapshot}</p></div><div className="record-actions"><button className="btn btn-delete-record" onClick={removeRecord} disabled={busy}>Padam Rekod</button><button className="btn btn-secondary" onClick={()=>save(false)} disabled={busy}>{busy?'Menyimpan...':'Simpan Pencerap'}</button><button className="btn btn-primary" onClick={()=>save(true)} disabled={busy}>{busy?'Menyimpan...':'Simpan & Sahkan'}</button>{obs.status==='verified'&&<button className="btn btn-secondary" onClick={makePdf} disabled={busy}>Jana PDF Rasmi</button>}</div></div>
    {error&&<div className="notice error" style={{marginBottom:14}}>{error}</div>}
    {saved&&<div className="notice success" style={{marginBottom:14}}>Rekod berjaya disimpan.</div>}
    {legacyStudentSchema&&<div className="notice error" style={{marginBottom:14}}><strong>Rekod ujian lama dikesan.</strong> Rekod ini dibuat ketika webapp masih menggunakan rubrik Murid /70. Jangan hantar rekod ini ke Google Form; padam dan isi semula menggunakan instrumen rasmi 2026 /50.</div>}
    <div className="steps">{tabs.map(([key,label])=><button key={key} className={`step-pill ${section===key?'active':''}`} onClick={()=>setSection(key)}>{label}</button>)}</div>

    {section==='info'&&<div className="card"><div className="notice"><strong>Data asal guru – baca sahaja.</strong> PIC tidak boleh mengubah maklumat yang telah dihantar.</div>
      <div className="official-info-block"><h2>Bahagian A – Maklumat Pencerap</h2><div className="form-grid">
        <div className="field span-2"><label>1. Nama Pencerap</label><input className="input official-readonly" readOnly value={obs.observerName}/></div>
        <div className="field span-2"><label>2. Jawatan</label><input className="input official-readonly" readOnly value={obs.observerPosition}/></div>
        <div className="field"><label>3. Tarikh Pencerapan</label><input className="input official-readonly" readOnly value={formatDateMY(obs.observationDate)}/></div>
        <div className="field"><label>4. Masa Pencerapan</label><input className="input official-readonly" readOnly value={formatTime(obs.observationTime)}/></div>
      </div></div>
      <div className="official-info-block"><h2>Bahagian B – Maklumat Sekolah</h2><div className="form-grid">
        <div className="field"><label>1. Kod Sekolah</label><input className="input official-readonly" readOnly value={school?.schoolCode||''}/></div>
        <div className="field"><label>2. Nama Sekolah</label><input className="input official-readonly" readOnly value={school?.schoolName||''}/></div>
        <div className="field"><label>3. PPD</label><input className="input official-readonly" readOnly value={school?.ppd||''}/></div>
        <div className="field"><label>4. Negeri</label><input className="input official-readonly" readOnly value={school?.state||''}/></div>
        <div className="field span-2"><label>5. E-mel Rasmi Sekolah</label><input className="input official-readonly" readOnly value={school?.officialEmail||''}/></div>
      </div></div>
      <div className="official-info-block"><h2>Bahagian C – Maklumat Guru Yang Dicerap</h2><div className="form-grid">
        <div className="field span-2"><label>1. Nama</label><input className="input official-readonly" readOnly value={teacher?.name||obs.teacherNameSnapshot||''}/></div>
        <div className="field"><label>2. Jantina</label><input className="input official-readonly" readOnly value={obs.gender}/></div>
        <div className="field"><label>3. Opsyen</label><input className="input official-readonly" readOnly value={obs.optionName}/></div>
      </div></div>
      <div className="official-info-block"><h2>Bahagian D – Maklumat Kelas Yang Dicerap</h2><div className="form-grid">
        <div className="field span-2"><label>1. Mata Pelajaran Dicerap</label><input className="input official-readonly" readOnly value={subject?.name||obs.subjectNameSnapshot||''}/></div>
        <div className="field"><label>2. Bil. Murid Hadir</label><input className="input official-readonly" readOnly value={`${obs.studentsPresent??''} / ${obs.studentsTotal??''} orang`}/></div>
        <div className="field"><label>3. Tahun/Tingkatan</label><input className="input official-readonly" readOnly value={schoolClass?`TAHUN ${schoolClass.year} - ${schoolClass.name}`:obs.classNameSnapshot||''}/></div>
        <div className="field span-2"><label>4. Tajuk/Topik</label><input className="input official-readonly" readOnly value={obs.topic}/></div>
        <div className="field"><label>5. Masa PdP</label><input className="input official-readonly" readOnly value={formatTime(obs.pdpTime)}/></div>
      </div></div>
    </div>}

    {section==='teacher'&&<div className="grid"><div className="notice"><strong>Bahagian E – Rubrik Penilaian Guru.</strong> Skor asal guru adalah baca sahaja.</div><fieldset className="pic-readonly-zone" disabled><div>{instrument.teacherRubric.map(item=><RubricCard key={item.id} item={item} value={obs.selfTeacherScores[item.id]} onChange={()=>{}} scoreLabels={instrument.scoreLabels}/>)}</div></fieldset></div>}

    {section==='student'&&<div className="grid"><div className="notice"><strong>Bahagian F – Rubrik Penilaian Murid.</strong> 10 item, maksimum 50 markah.</div><fieldset className="pic-readonly-zone" disabled><div><div className="student-guide"><strong>PANDUAN SKOR</strong>{instrument.studentScoreGuide.map((g,i)=><div key={i}>{g}</div>)}</div>{instrument.studentRubric.map((item,i)=><StudentScoreCard key={item.id} item={item} index={i} value={obs.selfStudentScores[item.id]} onChange={()=>{}} scoreGuide={instrument.studentScoreGuide}/>)}</div></fieldset></div>}

    {section==='observer'&&<div className="grid">
      <div className="notice"><strong>Mod Pencerap – PC PIC.</strong> Data Bahagian A-G kekal seperti yang dihantar. Pencerap hanya melengkapkan Bahagian H, Bahagian I dan tandatangan digital.</div>
      <div className="card"><div className="official-section-title">Bahagian G – Pengiraan Skor dan Pencapaian</div><div className="table-wrap"><table style={{minWidth:0}}><thead><tr><th>Komponen</th><th>Domain</th><th>Skor</th><th>Maks.</th></tr></thead><tbody>{instrument.domains.map((d,i)=><tr key={d.id}><td>Guru</td><td>{i+1}. {d.label}</td><td>{summary?.domains[d.id]||0}</td><td>{d.maxScore}</td></tr>)}<tr><td>Murid</td><td>Murid Sebagai Pembelajar Aktif</td><td>{summary?.student||0}</td><td>50</td></tr><tr><td colSpan={2}><strong>Jumlah Skor Keseluruhan</strong></td><td><strong>{summary?.total||0}</strong></td><td><strong>100</strong></td></tr><tr><td colSpan={2}><strong>Peratus Pencapaian</strong></td><td colSpan={2}><strong>{summary?.percent||0}%</strong></td></tr></tbody></table></div><div className="notice" style={{marginTop:12}}>{achievementLabel(summary?.percent||0,instrument)}</div></div>
      <div className="card"><div className="official-section-title">Bahagian H – Refleksi</div><p className="helper">Diisi oleh pencerap semasa menemu bual guru sekolah.</p><div className="field"><label>1. Apa pandangan anda mengenai pengajaran dan pembelajaran (PdP) KBAT yang telah anda laksanakan tadi? *</label><textarea rows={7} value={obs.reflection1} onChange={e=>setObs({...obs,reflection1:e.target.value})}/></div><div className="field" style={{marginTop:14}}><label>2. Bagaimana anda boleh membuat penambahbaikan/pemantapan terhadap PdP KBAT anda? (Nyatakan perancangan anda.) *</label><textarea rows={7} value={obs.reflection2} onChange={e=>setObs({...obs,reflection2:e.target.value})}/></div></div>
      <div className="card"><div className="official-section-title">Bahagian I – Rumusan</div><div className="field"><label>Rumusan Keseluruhan Pencerap *</label><textarea rows={6} value={obs.observerSummary} onChange={e=>setObs({...obs,observerSummary:e.target.value})}/></div></div>
      <div className="card"><div className="official-section-title">Tandatangan Pencerap</div><SignaturePad value={obs.observerSignatureDataUrl} onChange={data=>setObs({...obs,observerSignatureDataUrl:data,observerSignedAt:data?new Date().toISOString():''})}/><div className="form-grid" style={{marginTop:14}}><div className="field"><label>Nama Pencerap</label><input className="input official-readonly" readOnly value={obs.observerName}/></div><div className="field"><label>Tarikh</label><input className="input official-readonly" readOnly value={formatDateMY(obs.observerSignedAt?obs.observerSignedAt.slice(0,10):obs.observationDate)}/></div></div></div>
    </div>}

    {section==='google'&&<div className="grid grid-2"><div className="card"><h2>Data Untuk Chrome Extension</h2>{mapping&&!legacyStudentSchema?<table style={{minWidth:0}}><tbody><tr><td>Guru</td><td><strong>{teacher?.name||obs.teacherNameSnapshot}</strong></td></tr><tr><td>Subjek</td><td>{subject?.name||obs.subjectNameSnapshot}</td></tr><tr><td>Kehadiran</td><td>{attendanceBucket(obs.studentsPresent)}</td></tr><tr><td>Tahap</td><td>{schoolClass?levelBucket(schoolClass.year):''}</td></tr>{instrument.domains.map(d=><tr key={d.id}><td>Skor {d.label}</td><td>{summary?.domains[d.id]||0}</td></tr>)}<tr><td>Skor Murid</td><td>{summary?.student||0} / 50</td></tr></tbody></table>:<div className="notice error">{legacyStudentSchema?'Rekod ujian lama /70 tidak boleh dihantar. Padam dan isi semula.':'Google Form belum dipetakan.'}</div>}</div><div className="card"><h2>Status Google Form</h2><p><strong>{obs.googleFormStatus==='sent'?'✅ SUDAH DIHANTAR':'⏳ BELUM DIHANTAR'}</strong></p><div className="toolbar"><button className="btn btn-secondary" onClick={()=>setGoogle('pending')}>Tanda Belum</button><button className="btn btn-primary" onClick={()=>setGoogle('sent')} disabled={!mapping||legacyStudentSchema}>Tanda Sudah</button></div></div></div>}
  </main>
}
