import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import SearchSelect from '../components/SearchSelect'
import { DatePicker, TimePicker } from '../components/Pickers'
import RubricCard from '../components/RubricCard'
import StudentScoreCard from '../components/StudentScoreCard'
import SignaturePad from '../components/SignaturePad'
import { picIsLoggedIn } from '../lib/auth'
import { deleteObservation, getClasses, getEvaluators, getInstrumentVersions, getObservation, getSchoolSettings, getSubjects, getTeachers, saveObservation } from '../lib/store'
import type { Evaluator, InstrumentVersion, Observation, SchoolClass, SchoolSettings, Subject, Teacher } from '../lib/types'
import { achievementLabel, attendanceBucket, formatDateMY, levelBucket, scoreSummary, studentAchievementLabel, upper } from '../lib/utils'

export default function RecordEditor(){
  const {id=''}=useParams(); const navigate=useNavigate()
  const [obs,setObs]=useState<Observation|null>(null)
  const [instruments,setInstruments]=useState<InstrumentVersion[]>([])
  const [teachers,setTeachers]=useState<Teacher[]>([])
  const [evaluators,setEvaluators]=useState<Evaluator[]>([])
  const [classes,setClasses]=useState<SchoolClass[]>([])
  const [subjects,setSubjects]=useState<Subject[]>([])
  const [school,setSchool]=useState<SchoolSettings|null>(null)
  const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [saved,setSaved]=useState(false)
  const [section,setSection]=useState<'info'|'teacher'|'student'|'observer'|'google'>('info')

  useEffect(()=>{ picIsLoggedIn().then(async ok=>{
    if(!ok){navigate('/pic');return}
    try{
      const [o,iv,t,e,c,s,sc]=await Promise.all([getObservation(id),getInstrumentVersions(),getTeachers(),getEvaluators(),getClasses(),getSubjects(),getSchoolSettings()])
      if(!o){setError('Rekod tidak ditemui.');return}
      if(!Object.keys(o.finalTeacherScores||{}).length) o.finalTeacherScores={...o.selfTeacherScores}
      if(!Object.keys(o.finalStudentScores||{}).length) o.finalStudentScores={...o.selfStudentScores}
      setObs(o);setInstruments(iv);setTeachers(t);setEvaluators(e);setClasses(c);setSubjects(s);setSchool(sc)
    }catch(e:any){setError(e.message)}
  }) },[id,navigate])

  const instrument=instruments.find(v=>v.id===obs?.instrumentVersionId)
  const summary=useMemo(()=>obs&&instrument?scoreSummary(obs,instrument):null,[obs,instrument])
  const teacher=teachers.find(t=>t.id===obs?.teacherId)
  const schoolClass=classes.find(c=>c.id===obs?.classId)
  const subject=subjects.find(s=>s.id===obs?.subjectId)

  const validateObserver=()=>{
    if(!obs)return 'Rekod belum dimuatkan.'
    if(!obs.evaluatorId||!obs.observerName.trim()||!obs.observerPosition.trim())return 'Pilih Nama Pemantau dalam Bahagian A.'
    if(!obs.observationDate)return 'Pilih Tarikh pencerapan.'
    if(!obs.reflection1.trim()||!obs.reflection2.trim())return 'Lengkapkan kedua-dua soalan Bahagian F – Refleksi.'
    if(!obs.observerSummary.trim())return 'Lengkapkan Rumusan Keseluruhan Pemantau untuk borang Guru.'
    if(!obs.studentObserverSummary.trim())return 'Lengkapkan Rumusan Keseluruhan Pemantau untuk borang Murid.'
    if(!obs.observerSignatureDataUrl)return 'Pemantau perlu tandatangan pada pad tandatangan digital.'
    return ''
  }

  const save=async(verify=false)=>{
    if(!obs)return
    if(verify){const v=validateObserver();if(v){setError(v);setSection('observer');return}}
    setBusy(true);setError('');setSaved(false)
    try{
      const updated={...obs,status:verify?'verified':obs.status,updatedAt:new Date().toISOString()} as Observation
      await saveObservation(updated);setObs(updated);setSaved(true);setTimeout(()=>setSaved(false),2000)
    }catch(e:any){setError(e.message)}finally{setBusy(false)}
  }
  const setGoogle=async(status:'pending'|'sent')=>{if(!obs)return;const next={...obs,googleFormStatus:status,updatedAt:new Date().toISOString()};setObs(next);await saveObservation(next)}
  const removeRecord=async()=>{if(!obs)return;if(!window.confirm(`Padam rekod ${teacher?.name||obs.teacherNameSnapshot||''}?\n\nTindakan ini tidak boleh dibatalkan.`))return;setBusy(true);setError('');try{await deleteObservation(obs.id);navigate('/pic',{replace:true})}catch(e:any){setError(e.message||'Gagal memadam rekod.');setBusy(false)}}

  if(error&&!obs)return <main className="container"><div className="notice error">{error}</div><Link to="/pic" className="btn btn-secondary" style={{marginTop:14}}>Kembali</Link></main>
  if(!obs)return <main className="container"><div className="card">Memuatkan rekod...</div></main>
  if(!instrument)return <main className="container"><div className="notice error">Versi instrumen tidak ditemui.</div></main>

  const tabs:Array<[typeof section,string]>=[['info','Bahagian A-D'],['teacher','Skor Guru'],['student','Skor Murid'],['observer','Mod Pemantau'],['google','Google Form']]
  const mapping=instrument.googleFormMapping

  return <main className="container">
    <div className="section-title"><div><Link to="/pic" className="helper">← Dashboard PIC</Link><h1 style={{marginTop:6}}>{teacher?.name||obs.teacherNameSnapshot||'Rekod ISPPK'}</h1><p><span className="version-chip">{instrument.year}</span> {subject?.name||obs.subjectNameSnapshot} · {schoolClass?`TAHUN ${schoolClass.year} - ${schoolClass.name}`:obs.classNameSnapshot}</p></div><div className="record-actions"><button className="btn btn-delete-record" onClick={removeRecord} disabled={busy}>Padam Rekod</button><button className="btn btn-secondary" onClick={()=>save(false)} disabled={busy}>{busy?'Menyimpan...':'Simpan'}</button><button className="btn btn-primary" onClick={()=>save(true)} disabled={busy}>{busy?'Menyimpan...':'Simpan & Sahkan'}</button></div></div>
    {error&&<div className="notice error" style={{marginBottom:14}}>{error}</div>}{saved&&<div className="notice success" style={{marginBottom:14}}>Perubahan disimpan.</div>}
    <div className="summary-bar"><div className="metric"><span>Guru</span><strong>{summary?.teacherTotal||0}/{summary?.teacherMax||50}</strong></div><div className="metric"><span>Guru %</span><strong>{summary?.teacherPercent||0}%</strong></div><div className="metric"><span>Murid</span><strong>{summary?.student||0}/{summary?.studentMax||70}</strong></div><div className="metric"><span>Murid %</span><strong>{summary?.studentPercent||0}%</strong></div></div>
    <div className="toolbar" style={{marginBottom:16}}>{tabs.map(([k,l])=><button key={k} className={`btn ${section===k?'btn-primary':'btn-secondary'}`} onClick={()=>setSection(k)}>{l}</button>)}</div>

    {section==='info'&&<div className="card">
      <div className="official-info-block"><h2>Bahagian A – Maklumat Pemantau</h2><div className="form-grid">
        <div className="field span-2"><label>1. Nama Pemantau</label><SearchSelect value={obs.evaluatorId||''} onChange={v=>{const e=evaluators.find(x=>x.id===v);setObs({...obs,evaluatorId:v,observerName:e?.name||'',observerPosition:e?.position||''})}} options={evaluators.filter(e=>e.active).sort((a,b)=>a.sortOrder-b.sortOrder).map(e=>({value:e.id,label:e.name}))} placeholder="Cari nama pemantau..."/></div>
        <div className="field span-2"><label>2. Jawatan</label><input className="input official-readonly" readOnly value={obs.observerPosition}/></div>
        <div className="field"><label>3. Tarikh</label><DatePicker value={obs.observationDate} onChange={v=>setObs({...obs,observationDate:v})}/></div>
      </div></div>
      <div className="official-info-block"><h2>Bahagian B – Maklumat Sekolah</h2><div className="form-grid">
        <div className="field"><label>1. Nama Sekolah</label><input className="input official-readonly" readOnly value={school?.schoolName||''}/></div><div className="field"><label>2. Alamat Sekolah</label><input className="input official-readonly" readOnly value={school?.address||''}/></div>
        <div className="field"><label>3. No. Tel.</label><input className="input official-readonly" readOnly value={school?.phone||''}/></div><div className="field"><label>4. No. Faks</label><input className="input official-readonly" readOnly value={school?.fax||''}/></div>
        <div className="field span-2"><label>5. E-mel</label><input className="input official-readonly" readOnly value={school?.officialEmail||''}/></div><div className="field"><label>6. Kod Sekolah</label><input className="input official-readonly" readOnly value={school?.schoolCode||''}/></div><div className="field"><label>7. Gred Sekolah</label><input className="input official-readonly" readOnly value={school?.grade||''}/></div>
        <div className="field"><label>8. Jenis Sekolah</label><input className="input official-readonly" readOnly value={school?.schoolType||''}/></div><div className="field"><label>9. Lokasi Sekolah</label><input className="input official-readonly" readOnly value={school?.location||''}/></div><div className="field"><label>10. PPD</label><input className="input official-readonly" readOnly value={school?.ppd||''}/></div><div className="field"><label>11. Negeri</label><input className="input official-readonly" readOnly value={school?.state||''}/></div><div className="field span-2"><label>12. Program Sekolah</label><input className="input official-readonly" readOnly value={school?.schoolProgram||''}/></div>
      </div></div>
      <div className="official-info-block"><h2>Bahagian C – Maklumat Guru Yang Dicerap</h2><div className="form-grid">
        <div className="field span-2"><label>1. Nama</label><SearchSelect value={obs.teacherId} onChange={v=>{const t=teachers.find(x=>x.id===v);setObs({...obs,teacherId:v,teacherNameSnapshot:t?.name||'',gender:t?.gender||obs.gender,optionName:t?.optionName||obs.optionName})}} options={teachers.filter(t=>t.active).map(t=>({value:t.id,label:t.name}))}/></div>
        <div className="field"><label>2. Jantina</label><select className="select" value={obs.gender} onChange={e=>setObs({...obs,gender:e.target.value as any})}><option value="">Pilih</option><option>Lelaki</option><option>Perempuan</option></select></div><div className="field"><label>3. No. Tel.</label><input className="input" value={obs.teacherPhone} onChange={e=>setObs({...obs,teacherPhone:e.target.value})}/></div>
        <div className="field span-2"><label>4. E-mel</label><input className="input" value={obs.teacherEmail} onChange={e=>setObs({...obs,teacherEmail:e.target.value})}/></div><div className="field span-2"><label>5. Kelulusan Akademik Tertinggi</label><input className="input" value={obs.academicQualification} onChange={e=>setObs({...obs,academicQualification:upper(e.target.value)})}/></div>
        <div className="field"><label>6. Kelulusan Ikhtisas</label><input className="input" value={obs.professionalQualification} onChange={e=>setObs({...obs,professionalQualification:upper(e.target.value)})}/></div><div className="field"><label>7. Opsyen</label><input className="input" value={obs.optionName} onChange={e=>setObs({...obs,optionName:upper(e.target.value)})}/></div>
        <div className="field"><label>8. Pengalaman Mengajar (tahun)</label><input className="input" type="number" min="0" value={obs.teachingExperienceYears??''} onChange={e=>setObs({...obs,teachingExperienceYears:e.target.value===''?null:Number(e.target.value)})}/></div><div className="field"><label>9. Mata Pelajaran Yang Dicerap</label><SearchSelect value={obs.subjectId} onChange={v=>{const s=subjects.find(x=>x.id===v);setObs({...obs,subjectId:v,subjectNameSnapshot:s?.name||''})}} options={subjects.filter(s=>s.active).map(s=>({value:s.id,label:s.name}))}/></div>
        <div className="field"><label>10. Pengalaman Mengajar Mata Pelajaran (tahun)</label><input className="input" type="number" min="0" value={obs.subjectTeachingExperienceYears??''} onChange={e=>setObs({...obs,subjectTeachingExperienceYears:e.target.value===''?null:Number(e.target.value)})}/></div><div className="field span-2"><label>11. Jawatan Khas</label><input className="input" value={obs.specialPosition} onChange={e=>setObs({...obs,specialPosition:upper(e.target.value)})}/></div>
      </div></div>
      <div className="official-info-block"><h2>Bahagian D – Maklumat Kelas Yang Dicerap</h2><div className="form-grid">
        <div className="field"><label>12. Bil. Murid</label><input className="input" type="number" min="0" value={obs.studentsPresent??''} onChange={e=>setObs({...obs,studentsPresent:e.target.value===''?null:Number(e.target.value),studentsTotal:e.target.value===''?null:Number(e.target.value)})}/></div><div className="field"><label>Lelaki</label><input className="input" type="number" min="0" value={obs.studentsMale??''} onChange={e=>setObs({...obs,studentsMale:e.target.value===''?null:Number(e.target.value)})}/></div><div className="field"><label>Perempuan</label><input className="input" type="number" min="0" value={obs.studentsFemale??''} onChange={e=>setObs({...obs,studentsFemale:e.target.value===''?null:Number(e.target.value)})}/></div>
        <div className="field span-2"><label>13. Tahun/Tingkatan</label><SearchSelect value={obs.classId} onChange={v=>{const c=classes.find(x=>x.id===v);setObs({...obs,classId:v,classNameSnapshot:c?.name||'',classYearSnapshot:c?.year})}} options={classes.filter(c=>c.active).map(c=>({value:c.id,label:`TAHUN ${c.year} - ${c.name}`,group:`Tahun ${c.year}`}))}/></div><div className="field span-2"><label>14. Tajuk/Topik</label><input className="input" value={obs.topic} onChange={e=>setObs({...obs,topic:upper(e.target.value)})}/></div><div className="field"><label>15. Masa</label><TimePicker value={obs.pdpTime} onChange={v=>setObs({...obs,pdpTime:v})}/></div>
      </div></div>
    </div>}

    {section==='teacher'&&<div>{instrument.teacherRubric.map(item=><RubricCard key={item.id} item={item} value={obs.finalTeacherScores[item.id]} onChange={n=>setObs({...obs,finalTeacherScores:{...obs.finalTeacherScores,[item.id]:n}})} scoreLabels={instrument.scoreLabels}/>)}</div>}
    {section==='student'&&<div><div className="student-guide"><strong>PANDUAN SKOR</strong>{instrument.studentScoreGuide.map((g,i)=><div key={i}>{g}</div>)}</div>{instrument.studentRubric.map((item,i)=><StudentScoreCard key={item.id} item={item} index={i} value={obs.finalStudentScores[item.id]} onChange={n=>setObs({...obs,finalStudentScores:{...obs.finalStudentScores,[item.id]:n}})} scoreGuide={instrument.studentScoreGuide}/>)}</div>}

    {section==='observer'&&<div className="grid">
      <div className="notice"><strong>Mod Pemantau – PC PIC.</strong> Bahagian A telah ditetapkan semasa pengisian awal. Pemantau di PC PIC hanya melengkapkan Bahagian F, Rumusan Guru, Rumusan Murid dan tandatangan digital.</div>
      <div className="card"><div className="official-section-title">Guru – Bahagian E – Pengiraan Skor dan Pencapaian</div><p><strong>{summary?.teacherTotal||0}/{summary?.teacherMax||50} · {summary?.teacherPercent||0}%</strong></p><div className="notice">{achievementLabel(summary?.teacherPercent||0,instrument)}</div></div>
      <div className="card"><div className="official-section-title">Murid – Pengiraan Skor dan Pencapaian</div><p><strong>{summary?.student||0}/{summary?.studentMax||70} · {summary?.studentPercent||0}%</strong></p><div className="notice">{studentAchievementLabel(summary?.studentPercent||0,instrument)}</div></div>
      <div className="card"><div className="official-section-title">Guru – Bahagian F – Refleksi</div><p className="helper">Diisi oleh pemantau semasa menemu bual guru sekolah.</p><div className="field"><label>1. Apa pandangan anda mengenai pengajaran dan pembelajaran (PdP) KBAT yang telah anda laksanakan tadi? *</label><textarea rows={7} value={obs.reflection1} onChange={e=>setObs({...obs,reflection1:e.target.value})}/></div><div className="field" style={{marginTop:14}}><label>2. Bagaimana anda boleh membuat penambahbaikan terhadap PdP KBAT anda? (Nyatakan perancangan anda.) *</label><textarea rows={7} value={obs.reflection2} onChange={e=>setObs({...obs,reflection2:e.target.value})}/></div></div>
      <div className="card"><div className="official-section-title">Guru – Bahagian G – Rumusan</div><div className="field"><label>Rumusan Keseluruhan Pemantau *</label><textarea rows={6} value={obs.observerSummary} onChange={e=>setObs({...obs,observerSummary:e.target.value})}/></div></div>
      <div className="card"><div className="official-section-title">Murid – Bahagian G – Rumusan</div><div className="field"><label>Rumusan Keseluruhan Pemantau *</label><textarea rows={6} value={obs.studentObserverSummary} onChange={e=>setObs({...obs,studentObserverSummary:e.target.value})}/></div></div>
      <div className="card"><div className="official-section-title">Tandatangan Pemantau</div><SignaturePad value={obs.observerSignatureDataUrl} onChange={data=>setObs({...obs,observerSignatureDataUrl:data,observerSignedAt:data?new Date().toISOString():''})}/><div className="form-grid" style={{marginTop:14}}><div className="field"><label>Nama Pemantau</label><input className="input official-readonly" readOnly value={obs.observerName}/></div><div className="field"><label>Tarikh</label><input className="input official-readonly" readOnly value={formatDateMY(obs.observationDate)}/></div></div></div>
    </div>}

    {section==='google'&&<div className="grid grid-2"><div className="card"><h2>Data Untuk Chrome Extension</h2>{mapping?<table style={{minWidth:0}}><tbody><tr><td>Guru</td><td><strong>{teacher?.name||obs.teacherNameSnapshot}</strong></td></tr><tr><td>Subjek</td><td>{subject?.name||obs.subjectNameSnapshot}</td></tr><tr><td>Kehadiran</td><td>{attendanceBucket(obs.studentsPresent)}</td></tr><tr><td>Tahap</td><td>{schoolClass?levelBucket(schoolClass.year):''}</td></tr>{instrument.domains.map(d=><tr key={d.id}><td>Skor {d.label}</td><td>{summary?.domains[d.id]||0}</td></tr>)}<tr><td>Skor Murid</td><td>{summary?.student||0}</td></tr></tbody></table>:<div className="notice">Google Form belum dipetakan.</div>}</div><div className="card"><h2>Status Google Form</h2><p><strong>{obs.googleFormStatus==='sent'?'✅ SUDAH DIHANTAR':'⏳ BELUM DIHANTAR'}</strong></p><div className="toolbar"><button className="btn btn-secondary" onClick={()=>setGoogle('pending')}>Tanda Belum</button><button className="btn btn-primary" onClick={()=>setGoogle('sent')} disabled={!mapping}>Tanda Sudah</button></div></div></div>}
  </main>
}
