import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSupabaseConfigured } from '../lib/supabase'
import { picIsLoggedIn, picLogin, picLogout } from '../lib/auth'
import { getClasses, getInstrumentVersions, getObservations, getSchoolSettings, getSubjects, getTeachers, saveClass, saveInstrumentVersion, saveSchoolSettings, saveSubject, saveTeacher } from '../lib/store'
import type { InstrumentVersion, Observation, SchoolClass, SchoolSettings, Subject, Teacher } from '../lib/types'
import { cloneInstrumentForYear } from '../instruments/registry'
import { formatDateMY, scoreSummary, uid, upper } from '../lib/utils'

export default function Pic() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'records'|'versions'|'teachers'|'classes'|'subjects'|'school'>('records')
  const [obs, setObs] = useState<Observation[]>([])
  const [instruments, setInstruments] = useState<InstrumentVersion[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [school, setSchool] = useState<SchoolSettings | null>(null)
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('all')
  const navigate = useNavigate()

  const load = async () => {
    const [o,iv,t,c,s,sc] = await Promise.all([getObservations(), getInstrumentVersions(), getTeachers(), getClasses(), getSubjects(), getSchoolSettings()])
    setObs(o); setInstruments(iv); setTeachers(t); setClasses(c); setSubjects(s); setSchool(sc)
  }
  useEffect(() => { picIsLoggedIn().then(v => { setAuthed(v); if (v) load().catch(e=>setError(e.message)) }) }, [])

  const login = async (e: React.FormEvent) => { e.preventDefault(); setError(''); try { await picLogin(email,password); setAuthed(true); await load() } catch(e:any) { setError(e.message) } }
  const logout = async () => { await picLogout(); setAuthed(false) }

  const filtered = useMemo(() => obs.filter(o => {
    const t = teachers.find(x=>x.id===o.teacherId)?.name || o.teacherNameSnapshot || ''
    const sub = subjects.find(x=>x.id===o.subjectId)?.name || o.subjectNameSnapshot || ''
    const matchText = `${t} ${sub} ${o.topic} ${o.instrumentYearSnapshot}`.toLowerCase().includes(search.toLowerCase())
    const matchYear = yearFilter === 'all' || String(o.instrumentYearSnapshot) === yearFilter
    return matchText && matchYear
  }), [obs,teachers,subjects,search,yearFilter])

  if (authed === null) return <main className="container"><div className="card">Memuatkan...</div></main>
  if (!authed) return <main className="container"><div className="card" style={{maxWidth:500,margin:'55px auto'}}>
    <h1>Log Masuk PIC</h1><p className="helper">Akses dashboard pengesahan, master data, versi instrumen dan PDF rasmi.</p>
    {error && <div className="notice error" style={{marginBottom:12}}>{error}</div>}
    <form onSubmit={login} className="grid">
      {isSupabaseConfigured && <div className="field"><label>E-mel PIC</label><input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div>}
      <div className="field"><label>{isSupabaseConfigured?'Kata Laluan':'PIN PIC (demo)'}</label><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></div>
      {!isSupabaseConfigured && <div className="notice">Mode demo tempatan. PIN lalai dalam fail <code>.env.example</code> ialah <strong>2468</strong>. Data hanya tersimpan dalam browser ini sehingga Supabase disambungkan.</div>}
      <button className="btn btn-primary">Masuk Dashboard</button>
    </form>
  </div></main>

  const counts = { submitted: obs.filter(x=>x.status==='submitted').length, verified: obs.filter(x=>x.status==='verified').length, pending: obs.filter(x=>x.googleFormStatus==='pending').length }
  const tabs: Array<[typeof tab,string]> = [['records','Rekod'],['versions','Versi Instrumen'],['teachers','Guru'],['classes','Kelas'],['subjects','Mata Pelajaran'],['school','Sekolah']]
  const years = Array.from(new Set([...instruments.map(x=>x.year), ...obs.map(x=>x.instrumentYearSnapshot)])).sort((a,b)=>b-a)

  return <main className="container">
    <div className="section-title"><div><h1>Dashboard PIC</h1><p>Semakan dan pengurusan ISPPK multi-tahun</p></div><button className="btn btn-ghost" onClick={logout}>Log Keluar</button></div>
    {!isSupabaseConfigured && <div className="notice" style={{marginBottom:14}}>⚠️ Projek ini sedang berjalan dalam <strong>mode demo tempatan</strong>. Struktur multi-tahun boleh diuji sekarang; penggunaan ramai guru memerlukan Supabase.</div>}
    <div className="toolbar" style={{marginBottom:16}}>{tabs.map(([id,label])=><button key={id} className={`btn ${tab===id?'btn-primary':'btn-secondary'}`} onClick={()=>setTab(id)}>{label}</button>)}</div>

    {tab==='records' && <>
      <div className="summary-bar"><div className="metric"><span>Semua Rekod</span><strong>{obs.length}</strong></div><div className="metric"><span>Menunggu Semakan</span><strong>{counts.submitted}</strong></div><div className="metric"><span>Disahkan</span><strong>{counts.verified}</strong></div><div className="metric"><span>Belum Google Form</span><strong>{counts.pending}</strong></div><div className="metric"><span>Versi Aktif</span><strong>{instruments.filter(x=>x.active).length}</strong></div></div>
      <div className="card" style={{marginBottom:14}}><div className="form-grid"><div className="field"><label>Cari rekod</label><input className="input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nama guru, mata pelajaran atau topik..."/></div><div className="field"><label>Tahun Instrumen</label><select className="select" value={yearFilter} onChange={e=>setYearFilter(e.target.value)}><option value="all">Semua tahun</option>{years.map(y=><option key={y} value={y}>{y}</option>)}</select></div></div></div>
      <div className="table-wrap"><table><thead><tr><th>Tahun</th><th>Guru</th><th>Tarikh</th><th>Subjek / Kelas</th><th>Skor</th><th>Status</th><th>Google Form</th><th></th></tr></thead><tbody>
        {filtered.map(o=>{const t=teachers.find(x=>x.id===o.teacherId);const c=classes.find(x=>x.id===o.classId);const s=subjects.find(x=>x.id===o.subjectId);const iv=instruments.find(x=>x.id===o.instrumentVersionId);const sc=iv?scoreSummary(o,iv):null;return <tr key={o.id}><td><span className="version-chip">{o.instrumentYearSnapshot}</span></td><td><strong>{t?.name||o.teacherNameSnapshot||'Guru'}</strong><div className="helper">{o.topic}</div></td><td>{formatDateMY(o.observationDate)}</td><td>{s?.name||o.subjectNameSnapshot}<div className="helper">{c?`TAHUN ${c.year} - ${c.name}`:o.classNameSnapshot}</div></td><td><strong>{sc?`${sc.total}/${sc.maxTotal}`:'—'}</strong></td><td><span className={`status status-${o.status}`}>{o.status==='verified'?'DISAHKAN':o.status==='submitted'?'MENUNGGU':'DRAF'}</span></td><td>{o.googleFormStatus==='sent'?'✅ SUDAH':'⏳ BELUM'}</td><td><button className="btn btn-secondary" onClick={()=>navigate(`/pic/rekod/${o.id}`)}>Buka</button></td></tr>})}
        {filtered.length===0 && <tr><td colSpan={8}><div className="empty">Belum ada rekod.</div></td></tr>}
      </tbody></table></div>
    </>}

    {tab==='versions' && <InstrumentVersionsPanel items={instruments} refresh={async()=>setInstruments(await getInstrumentVersions())}/>} 
    {tab==='teachers' && <MasterTeachers items={teachers} refresh={async()=>setTeachers(await getTeachers())}/>} 
    {tab==='classes' && <MasterClasses items={classes} refresh={async()=>setClasses(await getClasses())}/>} 
    {tab==='subjects' && <MasterSubjects items={subjects} refresh={async()=>setSubjects(await getSubjects())}/>} 
    {tab==='school' && school && <SchoolPanel value={school} onSaved={async()=>setSchool(await getSchoolSettings())}/>} 
  </main>
}

function InstrumentVersionsPanel({items,refresh}:{items:InstrumentVersion[],refresh:()=>Promise<void>}) {
  const [year,setYear]=useState(new Date().getFullYear()+1)
  const [sourceId,setSourceId]=useState(items[0]?.id||'')
  const [error,setError]=useState('')
  useEffect(()=>{if(!sourceId&&items[0])setSourceId(items[0].id)},[items,sourceId])

  const duplicate=async()=>{
    setError('')
    try{
      if(items.some(x=>x.year===year)) throw new Error(`Versi tahun ${year} sudah wujud.`)
      const source=items.find(x=>x.id===sourceId)
      if(!source) throw new Error('Pilih versi sumber.')
      await saveInstrumentVersion(cloneInstrumentForYear(source,year)); await refresh()
    }catch(e:any){setError(e.message)}
  }
  const toggle=async(item:InstrumentVersion)=>{
    setError('')
    try {
      if(!item.active && !item.templatePdfPath) throw new Error(`Versi ${item.year} belum mempunyai template PDF rasmi. Lengkapkan konfigurasi versi dahulu.`)
      await saveInstrumentVersion({...item,active:!item.active,updatedAt:new Date().toISOString()});await refresh()
    } catch(e:any) { setError(e.message) }
  }
  const makeDefault=async(item:InstrumentVersion)=>{
    setError('')
    try {
      if(!item.templatePdfPath) throw new Error(`Versi ${item.year} belum mempunyai template PDF rasmi.`)
      await saveInstrumentVersion({...item,active:true,isDefault:true,updatedAt:new Date().toISOString()});await refresh()
    } catch(e:any) { setError(e.message) }
  }

  return <div className="grid">
    <div className="card"><h2>Versi Instrumen</h2><p>Setiap rekod menyimpan <strong>ID versi + tahun snapshot</strong>. Menambah 2027 tidak mengubah rekod 2026.</p>{error&&<div className="notice error" style={{marginBottom:12}}>{error}</div>}
      <div className="table-wrap"><table><thead><tr><th>Tahun</th><th>Kod</th><th>Status</th><th>PDF</th><th>Google Form</th><th></th></tr></thead><tbody>{[...items].sort((a,b)=>b.year-a.year).map(v=><tr key={v.id}><td><strong>{v.year}</strong>{v.isDefault&&<div className="helper">DEFAULT</div>}</td><td>{v.code}<div className="helper">{v.shortTitle}</div></td><td>{v.active?'✅ Aktif':'📝 Draf/Tidak aktif'}</td><td>{v.templatePdfPath?<span>✅ {v.pdfLayoutKey}</span>:'❌ Belum ada'}</td><td>{v.googleFormMapping?<span>✅ Dipetakan</span>:'⚠️ Belum dipetakan'}</td><td><div className="toolbar"><button className="btn btn-secondary" onClick={()=>toggle(v)}>{v.active?'Nyahaktif':'Aktifkan'}</button>{!v.isDefault&&<button className="btn btn-primary" onClick={()=>makeDefault(v)}>Jadikan Default</button>}</div></td></tr>)}</tbody></table></div>
    </div>
    <div className="card"><h2>Sediakan Tahun Baharu</h2><p className="helper">Duplikasi hanya menyediakan struktur awal. Versi baharu dicipta <strong>tidak aktif</strong> dan mapping Google Form dikosongkan. Semak dokumen rasmi tahun baharu sebelum aktifkan.</p><div className="form-grid"><div className="field"><label>Duplikasi daripada</label><select className="select" value={sourceId} onChange={e=>setSourceId(e.target.value)}>{[...items].sort((a,b)=>b.year-a.year).map(v=><option key={v.id} value={v.id}>{v.year} · {v.code}</option>)}</select></div><div className="field"><label>Tahun baharu</label><input className="input" type="number" min="2026" value={year} onChange={e=>setYear(Number(e.target.value))}/></div></div><div className="toolbar" style={{marginTop:14}}><button className="btn btn-primary" onClick={duplicate}>Duplikasi Sebagai Draf</button></div></div>
  </div>
}

function MasterTeachers({items,refresh}:{items:Teacher[],refresh:()=>Promise<void>}) {
  const blank: Teacher = { id: uid(), name:'', gender:'', optionName:'', active:true, sortOrder:999 }
  const [edit,setEdit]=useState<Teacher|null>(null); const [error,setError]=useState('')
  const submit=async(e:React.FormEvent)=>{e.preventDefault();if(!edit)return;setError('');try{await saveTeacher({...edit,name:upper(edit.name.trim()),optionName:upper(edit.optionName.trim())});setEdit(null);await refresh()}catch(err:any){setError(err.message)}}
  return <div className="card"><div className="section-title"><div><h2>Master Guru</h2><p>Nama ini digunakan dalam dropdown guru dan extension nanti.</p></div><button className="btn btn-primary" onClick={()=>setEdit(blank)}>+ Tambah Guru</button></div>
    {error&&<div className="notice error">{error}</div>}<div className="table-wrap"><table><thead><tr><th>#</th><th>Nama</th><th>Jantina</th><th>Opsyen</th><th>Status</th><th></th></tr></thead><tbody>{[...items].sort((a,b)=>a.sortOrder-b.sortOrder).map((t,i)=><tr key={t.id}><td>{i+1}</td><td><strong>{t.name}</strong></td><td>{t.gender||'-'}</td><td>{t.optionName||'-'}</td><td>{t.active?'Aktif':'Tidak aktif'}</td><td><button className="btn btn-secondary" onClick={()=>setEdit({...t})}>Edit</button></td></tr>)}</tbody></table></div>
    {edit&&<div className="modal-backdrop"><form className="modal" onSubmit={submit}><h2>{items.some(x=>x.id===edit.id)?'Edit Guru':'Tambah Guru'}</h2><div className="grid"><div className="field"><label>Nama</label><input className="input" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})} required/></div><div className="field"><label>Jantina</label><select className="select" value={edit.gender} onChange={e=>setEdit({...edit,gender:e.target.value as any})}><option value="">Belum ditetapkan</option><option>Lelaki</option><option>Perempuan</option></select></div><div className="field"><label>Opsyen</label><input className="input" value={edit.optionName} onChange={e=>setEdit({...edit,optionName:e.target.value})}/></div><label><input type="checkbox" checked={edit.active} onChange={e=>setEdit({...edit,active:e.target.checked})}/> Aktif</label><div className="toolbar"><button type="button" className="btn btn-secondary" onClick={()=>setEdit(null)}>Batal</button><button className="btn btn-primary">Simpan</button></div></div></form></div>}
  </div>
}

function MasterClasses({items,refresh}:{items:SchoolClass[],refresh:()=>Promise<void>}) {
  const [edit,setEdit]=useState<SchoolClass|null>(null); const blank:SchoolClass={id:uid(),year:1,name:'',active:true}
  const submit=async(e:React.FormEvent)=>{e.preventDefault();if(!edit)return;await saveClass({...edit,name:upper(edit.name)});setEdit(null);await refresh()}
  return <div className="card"><div className="section-title"><div><h2>Master Kelas</h2><p>Tahun 1-6 × Ibnu Sina, Ibnu Khaldun, Ibnu Battutah.</p></div><button className="btn btn-primary" onClick={()=>setEdit(blank)}>+ Tambah</button></div><div className="table-wrap"><table><thead><tr><th>Tahun</th><th>Kelas</th><th>Status</th><th></th></tr></thead><tbody>{[...items].sort((a,b)=>a.year-b.year||a.name.localeCompare(b.name)).map(c=><tr key={c.id}><td>{c.year}</td><td><strong>{c.name}</strong></td><td>{c.active?'Aktif':'Tidak aktif'}</td><td><button className="btn btn-secondary" onClick={()=>setEdit({...c})}>Edit</button></td></tr>)}</tbody></table></div>{edit&&<div className="modal-backdrop"><form className="modal" onSubmit={submit}><h2>Edit Kelas</h2><div className="form-grid"><div className="field"><label>Tahun</label><select className="select" value={edit.year} onChange={e=>setEdit({...edit,year:Number(e.target.value)})}>{[1,2,3,4,5,6].map(y=><option key={y}>{y}</option>)}</select></div><div className="field"><label>Nama Kelas</label><input className="input" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})} required/></div></div><label><input type="checkbox" checked={edit.active} onChange={e=>setEdit({...edit,active:e.target.checked})}/> Aktif</label><div className="toolbar" style={{marginTop:14}}><button type="button" className="btn btn-secondary" onClick={()=>setEdit(null)}>Batal</button><button className="btn btn-primary">Simpan</button></div></form></div>}</div>
}

function MasterSubjects({items,refresh}:{items:Subject[],refresh:()=>Promise<void>}) {
  const [edit,setEdit]=useState<Subject|null>(null); const blank:Subject={id:uid(),name:'',active:true}
  const submit=async(e:React.FormEvent)=>{e.preventDefault();if(!edit)return;await saveSubject({...edit,name:upper(edit.name)});setEdit(null);await refresh()}
  return <div className="card"><div className="section-title"><div><h2>Master Mata Pelajaran</h2><p>Guru hanya melihat mata pelajaran aktif dalam dropdown.</p></div><button className="btn btn-primary" onClick={()=>setEdit(blank)}>+ Tambah</button></div><div className="table-wrap"><table><thead><tr><th>Mata Pelajaran</th><th>Status</th><th></th></tr></thead><tbody>{[...items].sort((a,b)=>a.name.localeCompare(b.name)).map(s=><tr key={s.id}><td><strong>{s.name}</strong></td><td>{s.active?'Aktif':'Tidak aktif'}</td><td><button className="btn btn-secondary" onClick={()=>setEdit({...s})}>Edit</button></td></tr>)}</tbody></table></div>{edit&&<div className="modal-backdrop"><form className="modal" onSubmit={submit}><h2>Edit Mata Pelajaran</h2><div className="field"><label>Nama</label><input className="input" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})} required/></div><label style={{display:'block',marginTop:14}}><input type="checkbox" checked={edit.active} onChange={e=>setEdit({...edit,active:e.target.checked})}/> Aktif</label><div className="toolbar" style={{marginTop:14}}><button type="button" className="btn btn-secondary" onClick={()=>setEdit(null)}>Batal</button><button className="btn btn-primary">Simpan</button></div></form></div>}</div>
}

function SchoolPanel({value,onSaved}:{value:SchoolSettings,onSaved:()=>Promise<void>}) {
  const [edit,setEdit]=useState(value); const [saved,setSaved]=useState(false)
  useEffect(()=>setEdit(value),[value])
  const submit=async(e:React.FormEvent)=>{e.preventDefault();await saveSchoolSettings({...edit,schoolCode:upper(edit.schoolCode),schoolName:upper(edit.schoolName),ppd:upper(edit.ppd),state:upper(edit.state)});await onSaved();setSaved(true);setTimeout(()=>setSaved(false),2000)}
  return <form className="card" onSubmit={submit}><h2>Profil Sekolah</h2>{saved&&<div className="notice success" style={{marginBottom:12}}>Disimpan.</div>}<div className="form-grid"><div className="field"><label>Kod Sekolah</label><input className="input" value={edit.schoolCode} onChange={e=>setEdit({...edit,schoolCode:e.target.value})}/></div><div className="field"><label>Nama Sekolah</label><input className="input" value={edit.schoolName} onChange={e=>setEdit({...edit,schoolName:e.target.value})}/></div><div className="field"><label>PPD</label><input className="input" value={edit.ppd} onChange={e=>setEdit({...edit,ppd:e.target.value})}/></div><div className="field"><label>Negeri</label><input className="input" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})}/></div><div className="field span-2"><label>E-mel Rasmi Sekolah</label><input className="input" type="email" value={edit.officialEmail} onChange={e=>setEdit({...edit,officialEmail:e.target.value})}/></div></div><div className="toolbar" style={{marginTop:16}}><button className="btn btn-primary">Simpan Profil</button></div></form>
}
