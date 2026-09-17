import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getInstrumentVersions } from '../lib/store'
import type { InstrumentVersion } from '../lib/types'
import { getDefaultInstrumentFromList } from '../instruments/registry'

export default function Home() {
  const [versions, setVersions] = useState<InstrumentVersion[]>([])
  useEffect(()=>{ getInstrumentVersions().then(setVersions).catch(()=>{}) },[])
  const current = getDefaultInstrumentFromList(versions)

  return <main className="container">
    <section className="hero">
      <div>
        <span className="hero-badge">INSTRUMEN STANDARD PENILAIAN PEMBUDAYAAN KBAT</span>
        <h1>Satu kali isi. Data siap untuk semakan, PDF rasmi dan Google Form.</h1>
        <p>Webapp dalaman SK Sungai Abong untuk pengisian ISPPK PdP Guru & Murid. Sistem dibina secara multi-tahun supaya rekod 2026 kekal utuh dan versi 2027 serta tahun seterusnya boleh ditambah tanpa mengubah data lama.</p>
        <div className="toolbar" style={{marginTop:22}}>
          <Link className="btn btn-primary" to="/borang">Mula Isi Instrumen</Link>
          <Link className="btn btn-secondary" to="/pic">Dashboard PIC</Link>
        </div>
      </div>
      <aside className="hero-card">
        <div className="big">{current?.year || '—'}</div>
        <strong>Versi instrumen aktif</strong>
        <p>{current?.shortTitle || 'Memuatkan konfigurasi instrumen...'}</p>
        <hr style={{borderColor:'rgba(255,255,255,.2)'}}/>
        <div><strong>Profil tetap sekolah</strong><p>JOHOR · PPD MUAR · JBA5095 · SEKOLAH KEBANGSAAN SUNGAI ABONG</p></div>
      </aside>
    </section>
    <section className="grid grid-3">
      <Link to="/borang" className="card action-card"><h3>👩‍🏫 Guru</h3><p>Pilih versi instrumen, nama, kelas dan mata pelajaran. Lengkapkan rubrik tanpa perlu menaip maklumat yang berulang.</p></Link>
      <Link to="/pic" className="card action-card"><h3>✅ PIC / Pencerap</h3><p>Semak rekod mengikut tahun, ubah skor muktamad, urus master data dan versi instrumen.</p></Link>
      <div className="card"><h3>🖨️ PDF Mengikut Versi</h3><p>Setiap rekod terikat kepada template PDF dan konfigurasi tahun yang betul. Rekod lama tidak ditukar apabila versi baharu ditambah.</p></div>
    </section>
  </main>
}
