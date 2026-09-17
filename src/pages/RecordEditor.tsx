import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import SearchSelect from '../components/SearchSelect'
import { DatePicker, TimePicker } from '../components/Pickers'
import RubricCard from '../components/RubricCard'
import StudentScoreCard from '../components/StudentScoreCard'
import { picIsLoggedIn } from '../lib/auth'
import { downloadBlob, generateOfficialPdf } from '../lib/pdf'
import { deleteObservation, getClasses, getInstrumentVersions, getObservation, getSchoolSettings, getSubjects, getTeachers, saveObservation } from '../lib/store'
import type { InstrumentVersion, Observation, SchoolClass, SchoolSettings, Subject, Teacher } from '../lib/types'
import { achievementLabel, attendanceBucket, formatDateMY, levelBucket, scoreSummary, upper } from '../lib/utils'

export default function RecordEditor(){
  const {id=''}=useParams(); const navigate=useNavigate()
  const [obs,setObs]=useState<Observation|null>(null)
  const [instruments,setInstruments]=useState<InstrumentVersion[]>([])
  const [teachers,setTeachers]=useState<Teacher[]>([])
  const [classes,setClasses]=useState<SchoolClass[]>([])
  const [subjects,setSubjects]=useState<Subject[]>([])
  const [school,setSchool]=useState<SchoolSettings|null>(null)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [saved,setSaved]=useState(false)
  const [section,setSection]=useState<'info'|'teacher'|'student'|'reflection'|'google'>('info')

  useEffect(()=>{
    picIsLoggedIn().then(async ok=>{
      if(!ok){navigate('/pic');return}
      try{
        const [o,iv,t,c,s,sc]=await Promise.all([getObservation(id),getInstrumentVersions(),getTeachers(),getClasses(),getSubjects(),getSchoolSettings()])
        if(!o){setError('Rekod tidak ditemui.');return}
        if(!Object.keys(o.finalTeacherScores||{}).length) o.finalTeacherScores={...o.selfTeacherScores}
        if(!Object.keys(o.finalStudentScores||{}).length) o.finalStudentScores={...o.selfStudentScores}
        setObs(o);setInstruments(iv);setTeachers(t);setClasses(c);setSubjects(s);setSchool(sc)
      }catch(e:any){setError(e.message)}
    })
  },[id,navigate])

  const instrument=instruments.find(v=>v.id===obs?.instrumentVersionId)
  const summary=useMemo(()=>obs&&instrument?scoreSummary(obs,instrument):null,[obs,instrument])
  const teacher=teachers.find(t=>t.id===obs?.teacherId)
  const schoolClass=classes.find(c=>c.id===obs?.classId)
  const subject=subjects.find(s=>s.id===obs?.subjectId)

  const save=async(verify=false)=>{
    if(!obs)return
    setBusy(true);setError('');setSaved(false)
    try{
      const updated={...obs,status:verify?'verified':obs.status,updatedAt:new Date().toISOString()} as Observation
      await saveObservation(updated);setObs(updated);setSaved(true);setTimeout(()=>setSaved(false),2000)
    }catch(e:any){setError(e.message)}finally{setBusy(false)}
  }

  const pdf=async()=>{
    if(!obs||!instrument||!teacher||!schoolClass||!subject||!school)return
    if(!obs.observerName.trim()||!obs.observerPosition.trim()||!obs.observationDate||!obs.observationTime||!obs.reflection1.trim()||!obs.reflection2.trim()||!obs.observerSummary.trim()){
      setError('Lengkapkan Bahagian A, Bahagian H dan Bahagian I sebelum menjana PDF rasmi.');setSection('info');return
    }
    setBusy(true);setError('')
    try{
      const updated={...obs,status:'verified' as const,updatedAt:new Date().toISOString()}
      await saveObservation(updated);setObs(updated)
      const blob=await generateOfficialPdf(updated,teacher,schoolClass,subject,school,instrument)
      downloadBlob(blob,`ISPPK_${instrument.year}_${teacher.name.replace(/[^A-Z0-9]+/gi,'_')}.pdf`)
    }catch(e:any){setError(e.message||'Gagal menjana PDF.')}finally{setBusy(false)}
  }

  const setGoogle=async(status:'pending'|'sent')=>{if(!obs)return;const next={...obs,googleFormStatus:status,updatedAt:new Date().toISOString()};setObs(next);await saveObservation(next)}

  const removeRecord=async()=>{
    if(!obs)return
    const ok=window.confirm(`Padam rekod ${teacher?.name||obs.teacherNameSnapshot||''}?\n\nTindakan ini tidak boleh dibatalkan.`)
    if(!ok)return
    setBusy(true);setError('')
    try{await deleteObservation(obs.id);navigate('/pic',{replace:true})}catch(e:any){setError(e.message||'Gagal memadam rekod.');setBusy(false)}
  }

  if(error&&!obs)return <main className="container"><div className="notice error">{error}</div><Link to="/pic" className="btn btn-secondary" style={{marginTop:14}}>Kembali</Link></main>
  if(!obs)return <main className="container"><div className="card">Memuatkan rekod...</div></main>
  if(!instrument)return <main className="container"><div className="notice error">Versi instrumen <strong>{obs.instrumentVersionId}</strong> tidak ditemui. Rekod tahun {obs.instrumentYearSnapshot} tidak boleh diproses sehingga konfigurasi versinya dipulihkan.</div><Link to="/pic" className="btn btn-secondary" style={{marginTop:14}}>Kembali</Link></main>

  const completeScores=instrument.teacherRubric.every(i=>obs.finalTeacherScores[i.id]>=1&&obs.finalTeacherScores[i.id]<=5)&&instrument.studentRubric.every(i=>obs.finalStudentScores[i.id]>=1&&obs.finalStudentScores[i.id]<=5)
  const tabs:Array<[typeof section,string]>=[['info','Bahagian A-D'],['teacher','Bahagian E · Guru'],['student','Bahagian F · Murid'],['reflection','Bahagian G-I'],['google','Google Form']]
  const mapping=instrument.googleFormMapping

  return <main className="container">
    <div className="section-title"><div><Link to="/pic" className="helper">← Dashboard PIC</Link><h1 style={{marginTop:6}}>{teacher?.name||obs.teacherNameSnapshot||'Rekod ISPPK'}</h1><p><span className="version-chip">{instrument.year}</span> {subject?.name||obs.subjectNameSnapshot} · {schoolClass?`TAHUN ${schoolClass.year} - ${schoolClass.name}`:obs.classNameSnapshot}</p></div><div className="record-actions"><button className="btn btn-delete-record" onClick={removeRecord} disabled={busy}>Padam Rekod</button><button className="btn btn-secondary" onClick={()=>save(false)} disabled={busy}>Simpan</button><button className="btn btn-primary" onClick={pdf} disabled={busy||!completeScores}>{busy?'Memproses...':'Sahkan & Muat Turun PDF'}</button></div></div>
    {error&&<div className="notice error" style={{marginBottom:14}}>{error}</div>}{saved&&<div className="notice success" style={{marginBottom:14}}>Perubahan disimpan.</div>}
    <div className="summary-bar">{instrument.domains.map(domain=><div className="metric" key={domain.id}><span>{domain.label}</span><strong>{summary?.domains[domain.id]||0}/{domain.maxScore}</strong></div>)}<div className="metric"><span>Murid</span><strong>{summary?.student||0}/{instrument.studentMaxScore}</strong></div><div className="metric"><span>Jumlah</span><strong>{summary?.total||0}/{instrument.totalMaxScore}</strong></div></div>
    <div className="notice" style={{marginBottom:14}}><strong>Tahap:</strong> {achievementLabel(summary?.percent||0,instrument)}</div>
    <div className="toolbar" style={{marginBottom:16}}>{tabs.map(([k,l])=><button key={k} className={`btn ${section===k?'btn-primary':'btn-secondary'}`} onClick={()=>setSection(k)}>{l}</button>)}</div>

    {section==='info'&&<div className="card">
      <div className="official-info-block"><h2>Bahagian A – Maklumat Pencerap</h2><div className="form-grid">
        <div className="field span-2"><label>1. Nama Pencerap</label><input className="input" value={obs.observerName} onChange={e=>setObs({...obs,observerName:upper(e.target.value)})}/></div>
        <div className="field span-2"><label>2. Jawatan</label><input className="input" value={obs.observerPosition} onChange={e=>setObs({...obs,observerPosition:upper(e.target.value)})}/></div>
        <div className="field"><label>3. Tarikh Pencerapan</label><DatePicker value={obs.observationDate} onChange={v=>setObs({...obs,observationDate:v})}/></div>
        <div className="field"><label>4. Masa Pencerapan</label><TimePicker value={obs.observationTime} onChange={v=>setObs({...obs,observationTime:v})}/></div>
      </div></div>
      <div className="official-info-block"><h2>Bahagian B – Maklumat Sekolah</h2><div className="form-grid">
        <div className="field"><label>1. Kod Sekolah</label><input className="input official-readonly" readOnly value={school?.schoolCode||''}/></div><div className="field"><label>2. Nama Sekolah</label><input className="input official-readonly" readOnly value={school?.schoolName||''}/></div>
        <div className="field"><label>3. PPD</label><input className="input official-readonly" readOnly value={school?.ppd||''}/></div><div className="field"><label>4. Negeri</label><input className="input official-readonly" readOnly value={school?.state||''}/></div>
        <div className="field span-2"><label>5. E-mel Rasmi Sekolah</label><input className="input official-readonly" readOnly value={school?.officialEmail||''}/></div>
      </div></div>
      <div className="official-info-block"><h2>Bahagian C – Maklumat Guru Yang Dicerap</h2><div className="form-grid">
        <div className="field span-2"><label>1. Nama</label><SearchSelect value={obs.teacherId} onChange={v=>{const t=teachers.find(x=>x.id===v);setObs({...obs,teacherId:v,teacherNameSnapshot:t?.name||obs.teacherNameSnapshot,gender:t?.gender||obs.gender,optionName:t?.optionName||obs.optionName})}} options={teachers.filter(t=>t.active).map(t=>({value:t.id,label:t.name}))}/></div>
        <div className="field"><label>2. Jantina</label><select className="select" value={obs.gender} onChange={e=>setObs({...obs,gender:e.target.value as any})}><option>Lelaki</option><option>Perempuan</option></select></div>
        <div className="field"><label>3. Opsyen</label><input className="input" value={obs.optionName} onChange={e=>setObs({...obs,optionName:upper(e.target.value)})}/></div>
      </div></div>
      <div className="official-info-block"><h2>Bahagian D – Maklumat Kelas Yang Dicerap</h2><div className="form-grid">
        <div className="field span-2"><label>1. Mata Pelajaran Dicerap</label><SearchSelect value={obs.subjectId} onChange={v=>{const s=subjects.find(x=>x.id===v);setObs({...obs,subjectId:v,subjectNameSnapshot:s?.name||obs.subjectNameSnapshot})}} options={subjects.filter(s=>s.active).map(s=>({value:s.id,label:s.name}))}/></div>
        <div className="field"><label>2. Bil. Murid Hadir</label><input className="input" type="number" value={obs.studentsPresent??''} onChange={e=>setObs({...obs,studentsPresent:e.target.value===''?null:Number(e.target.value)})}/></div>
        <div className="field"><label>___ / ___ orang (Jumlah Murid)</label><input className="input" type="number" value={obs.studentsTotal??''} onChange={e=>setObs({...obs,studentsTotal:e.target.value===''?null:Number(e.target.value)})}/></div>
        <div className="field span-2"><label>3. Tahun/Tingkatan</label><SearchSelect value={obs.classId} onChange={v=>{const c=classes.find(x=>x.id===v);setObs({...obs,classId:v,classNameSnapshot:c?.name||obs.classNameSnapshot,classYearSnapshot:c?.year||obs.classYearSnapshot})}} options={classes.filter(c=>c.active).map(c=>({value:c.id,label:`TAHUN ${c.year} - ${c.name}`,group:`Tahun ${c.year}`}))}/></div>
        <div className="field span-2"><label>4. Tajuk/Topik</label><input className="input" value={obs.topic} onChange={e=>setObs({...obs,topic:upper(e.target.value)})}/></div>
        <div className="field"><label>5. Masa PdP</label><TimePicker value={obs.pdpTime} onChange={v=>setObs({...obs,pdpTime:v})}/></div>
      </div></div>
    </div>}

    {section==='teacher'&&<div><div className="official-section-title">Bahagian E – Rubrik Penilaian Guru</div><div className="card" style={{marginBottom:14,textAlign:'center'}}><strong>RUBRIK INSTRUMEN STANDARD PENILAIAN PEMBUDAYAAN<br/>KEMAHIRAN BERFIKIR ARAS TINGGI (KBAT) DALAM PENGAJARAN DAN PEMBELAJARAN (GURU)<br/>TAHUN {instrument.year}</strong></div>{instrument.teacherRubric.map(item=><RubricCard key={item.id} item={item} value={obs.finalTeacherScores[item.id]} onChange={n=>setObs({...obs,finalTeacherScores:{...obs.finalTeacherScores,[item.id]:n}})} scoreLabels={instrument.scoreLabels}/>)}</div>}

    {section==='student'&&<div><div className="official-section-title">Bahagian F – Rubrik Penilaian Murid</div><div className="student-guide"><strong>PANDUAN SKOR</strong>{instrument.studentScoreGuide.map((g,i)=><div key={i}>{g}</div>)}</div><div className="card" style={{marginBottom:14}}><strong>Murid Sebagai Pembelajar Aktif</strong></div>{instrument.studentRubric.map((item,i)=><StudentScoreCard key={item.id} item={item} index={i} value={obs.finalStudentScores[item.id]} onChange={n=>setObs({...obs,finalStudentScores:{...obs.finalStudentScores,[item.id]:n}})} scoreGuide={instrument.studentScoreGuide}/>)}</div>}

    {section==='reflection'&&<div className="grid">
      <div className="card"><div className="official-section-title">Bahagian G – Pengiraan Skor dan Pencapaian</div><div className="table-wrap"><table style={{minWidth:0}}><thead><tr><th>Komponen</th><th>Domain</th><th>Skor Diperoleh</th><th>Skor Maksimum</th></tr></thead><tbody><tr><td rowSpan={3}>Guru</td><td>1. Perancangan</td><td>{summary?.domains.planning||0}</td><td>20</td></tr><tr><td>2. Pelaksanaan</td><td>{summary?.domains.implementation||0}</td><td>25</td></tr><tr><td>3. Refleksi</td><td>{summary?.domains.reflection||0}</td><td>5</td></tr><tr><td>Murid</td><td>Murid Sebagai Pembelajar Aktif</td><td>{summary?.student||0}</td><td>50</td></tr><tr><td colSpan={2}><strong>Jumlah Skor Keseluruhan</strong></td><td><strong>{summary?.total||0}</strong></td><td><strong>100</strong></td></tr><tr><td colSpan={2}><strong>Peratus Pencapaian (%)</strong></td><td colSpan={2}><strong>{summary?.percent||0}%</strong></td></tr></tbody></table></div><div style={{marginTop:14}}><strong>RUJUKAN TAHAP PENCAPAIAN:</strong><div className="table-wrap" style={{marginTop:8}}><table style={{minWidth:0}}><thead><tr><th>Skor</th><th>Penerangan</th></tr></thead><tbody>{instrument.achievementBands.map((b,i)=><tr key={i} className={(summary?.percent||0)>=b.min&&(summary?.percent||0)<=b.max?'achievement-active':''}><td><strong>{i===0?'≤ 40%':`${b.min}% - ${b.max}%`}</strong></td><td>{b.label}</td></tr>)}</tbody></table></div></div></div>
      <div className="card"><div className="official-section-title">Bahagian H – Refleksi (Diisi oleh pencerap semasa menemu bual guru sekolah)</div><div className="field"><label>1. Apa pandangan anda mengenai pengajaran dan pembelajaran (PdP) KBAT yang telah anda laksanakan tadi?</label><textarea rows={6} value={obs.reflection1} onChange={e=>setObs({...obs,reflection1:e.target.value})}/></div><div className="field" style={{marginTop:14}}><label>2. Bagaimana anda boleh membuat penambahbaikan/pemantapan terhadap PdP KBAT anda? (Nyatakan perancangan anda.)</label><textarea rows={6} value={obs.reflection2} onChange={e=>setObs({...obs,reflection2:e.target.value})}/></div></div>
      <div className="card"><div className="official-section-title">Bahagian I – Rumusan</div><div className="field"><label>Rumusan Keseluruhan Pencerap:</label><textarea rows={5} value={obs.observerSummary} onChange={e=>setObs({...obs,observerSummary:e.target.value})}/></div><div className="form-grid" style={{marginTop:14}}><div className="field"><label>Tandatangan Pencerap:</label><input className="input official-readonly" readOnly value="Ditandatangani pada salinan PDF / cetakan"/></div><div className="field"><label>Tarikh :</label><input className="input official-readonly" readOnly value={formatDateMY(obs.observationDate)}/></div></div></div>
    </div>}

    {section==='google'&&<div className="grid grid-2"><div className="card"><h2>Data Untuk Chrome Extension</h2>{mapping?<><div className="notice success" style={{marginBottom:12}}>Mapping Google Form tersedia untuk versi <strong>{instrument.year}</strong>.</div><p className="helper">Form: {mapping.title}</p><table style={{minWidth:0}}><tbody>
      <tr><td>Negeri</td><td><strong>{mapping.fixed.state?.value||school?.state}</strong></td></tr><tr><td>PPD</td><td><strong>{mapping.fixed.ppd?.value||school?.ppd}</strong></td></tr><tr><td>Sekolah</td><td><strong>{school?.schoolCode} · {school?.schoolName}</strong></td></tr>
      <tr><td>Guru</td><td><strong>{teacher?.name||obs.teacherNameSnapshot}</strong></td></tr><tr><td>Jantina</td><td>{obs.gender}</td></tr><tr><td>Opsyen</td><td>{obs.optionName}</td></tr><tr><td>Subjek</td><td>{subject?.name||obs.subjectNameSnapshot}</td></tr><tr><td>Kehadiran</td><td>{attendanceBucket(obs.studentsPresent)}</td></tr><tr><td>Tahap</td><td>{schoolClass?levelBucket(schoolClass.year):obs.classYearSnapshot?levelBucket(obs.classYearSnapshot):''}</td></tr><tr><td>Kelas</td><td>{schoolClass?.name||obs.classNameSnapshot}</td></tr>{instrument.domains.map(d=><tr key={d.id}><td>Skor {d.label}</td><td>{summary?.domains[d.id]||0}</td></tr>)}<tr><td>Skor Murid</td><td>{summary?.student||0}</td></tr>
    </tbody></table></>:<div className="notice">⚠️ Google Form untuk versi {instrument.year} belum dipetakan. Rekod dan PDF masih boleh digunakan, tetapi extension tidak akan autofill versi ini sehingga mapping disediakan.</div>}</div><div className="card"><h2>Status Google Form</h2><p>Status semasa: <strong>{obs.googleFormStatus==='sent'?'✅ SUDAH DIHANTAR':'⏳ BELUM DIHANTAR'}</strong></p><p className="helper">Status disimpan mengikut rekod dan versi instrumen. Extension akan berhenti sebelum Submit supaya PIC boleh semak.</p><div className="toolbar"><button className="btn btn-secondary" onClick={()=>setGoogle('pending')}>Tanda Belum</button><button className="btn btn-primary" onClick={()=>setGoogle('sent')} disabled={!mapping}>Tanda Sudah Dihantar</button></div></div></div>}
  </main>
}
