import { useEffect, useMemo, useState } from 'react'
import { saveGoogleFormOverrides } from '../lib/store'
import type { InstrumentVersion, Observation, SchoolSettings } from '../lib/types'
import { scoreSummary } from '../lib/utils'

type Field = { key: string; label: string; original: string; kind?: 'date' | 'time' | 'number' }
type Props = {
  observation: Observation
  instrument: InstrumentVersion
  school: SchoolSettings | null
  onSaved: (values: Record<string, string>) => void
}

const upper = (value: string) => String(value || '').toLocaleUpperCase('ms-MY')
const topicForForm = (value: string) => upper(value).replace(/[^A-Z0-9\s@'"(),\/-]/g, ' ').replace(/\s+/g, ' ').trim()
const attendance = (n: number | null) => n == null ? '' : n <= 10 ? '0 – 10 orang' : n <= 20 ? '11 – 20 orang' : n <= 30 ? '21 – 30 orang' : n <= 50 ? '31 – 50 orang' : 'Lebih 50 orang'
const level = (n?: number) => !n ? '' : n <= 3 ? 'Sekolah Rendah Tahap 1 (Tahun 1-3)' : 'Sekolah Rendah Tahap 2 (Tahun 4-6)'
const classForForm = (year?: number, name?: string) => !name ? '' : /^\d+\s/.test(upper(name).trim()) ? upper(name).trim() : String(year || '') + ' ' + upper(name).trim()

export default function GoogleFormOverrides({ observation, instrument, school, onSaved }: Props) {
  const [draft, setDraft] = useState<Record<string, string>>(observation.googleFormOverrides || {})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => { setDraft(observation.googleFormOverrides || {}); setError(''); setNotice('') }, [observation.id])
  const fields = useMemo<Field[]>(() => {
    const result = scoreSummary(observation, instrument)
    const scores = result.domains
    const domains = instrument.domains
    const domain = (id: string, index: number) => String(scores[id] ?? scores[domains[index]?.id] ?? 0)
    const fixed = instrument.googleFormMapping?.fixed
    return [
      { key: 'state', label: 'Negeri', original: fixed?.state?.value || school?.state || '' },
      { key: 'ppd', label: 'PPD', original: fixed?.ppd?.value || (school?.ppd ? 'PPD ' + school.ppd.replace(/^PPD\s+/i, '') : '') },
      { key: 'school', label: 'Kod dan nama sekolah', original: fixed?.school?.value || (school ? school.schoolCode + ' ' + school.schoolName : '') },
      { key: 'observationDate', label: 'Tarikh pencerapan', original: observation.observationDate || '', kind: 'date' },
      { key: 'teacherName', label: 'Nama guru', original: upper(observation.teacherNameSnapshot || '') },
      { key: 'gender', label: 'Jantina', original: observation.gender === 'Perempuan' ? 'PEREMPUAN' : 'LELAKI' },
      { key: 'optionName', label: 'Opsyen', original: upper(observation.optionName) },
      { key: 'subject', label: 'Mata pelajaran', original: upper(observation.subjectNameSnapshot || '') },
      { key: 'attendance', label: 'Bilangan murid hadir (pilihan Google Form)', original: attendance(observation.studentsPresent) },
      { key: 'level', label: 'Tahun / tingkatan (pilihan Google Form)', original: level(observation.classYearSnapshot) },
      { key: 'className', label: 'Nama kelas', original: classForForm(observation.classYearSnapshot, observation.classNameSnapshot).trim() },
      { key: 'topic', label: 'Tajuk / topik', original: topicForForm(observation.topic) },
      { key: 'pdpTime', label: 'Masa PdP', original: (observation.pdpTime || '').slice(0, 5), kind: 'time' },
      { key: 'planningScore', label: 'Skor Perancangan', original: domain('planning', 0), kind: 'number' },
      { key: 'implementationScore', label: 'Skor Pelaksanaan', original: domain('implementation', 1), kind: 'number' },
      { key: 'reflectionScore', label: 'Skor Refleksi', original: domain('reflection', 2), kind: 'number' },
      { key: 'studentScore', label: 'Skor Murid', original: String(result.student), kind: 'number' }
    ]
  }, [observation, instrument, school])

  const locked = observation.googleFormStatus === 'sent'
  const changed = fields.filter(f => draft[f.key]?.trim() && draft[f.key].trim() !== f.original)

  const submit = async () => {
    if (locked || busy) return
    setError(''); setNotice('')
    const next: Record<string, string> = {}
    for (const f of fields) {
      const val = (draft[f.key] || '').trim()
      if (!val || val === f.original) continue
      if (val.length > 500) { setError('Nilai ' + f.label + ' terlalu panjang.'); return }
      if (f.kind === 'number' && (!/^\d+$/.test(val) || Number(val) > 100)) { setError(f.label + ' mesti nombor bulat 0 hingga 100.'); return }
      next[f.key] = val
    }
    if (fields.some(f => f.kind === 'number' && next[f.key]) &&
        !window.confirm('Skor pembetulan Google Form berbeza daripada skor asal guru. Pastikan skor yang dihantar benar-benar betul. Teruskan?')) return
    setBusy(true)
    try {
      await saveGoogleFormOverrides(observation.id, next)
      onSaved(next)
      setDraft(next)
      setNotice('Pembetulan telah disimpan. Extension ISPPK versi 2.0.1 akan menggunakan nilai pembetulan ini.')
    } catch (e: any) {
      setError(e.message || 'Gagal menyimpan pembetulan.')
    } finally { setBusy(false) }
  }

  return <div className="card">
    <h2>Pembetulan Khas Google Form</h2>
    <p>PIC boleh betulkan hanya nilai yang ditolak Google Form. <strong>Maklumat asal guru, skor asal dan PDF rasmi tidak berubah.</strong> Pembetulan disimpan berasingan dan diaudit di Supabase.</p>
    <div className="notice" style={{marginBottom:14}}>Ruangan kosong bermaksud guna nilai asal. Bagi radio atau dropdown, nilai pembetulan mestilah <strong>sebiji seperti pilihan dalam Google Form</strong>; ia tidak boleh memintas sekatan Google.</div>
    {locked && <div className="notice">Rekod sudah ditanda dihantar. Pembetulan dikunci.</div>}
    {error && <div className="notice error" style={{marginBottom:14}}>{error}</div>}
    {notice && <div className="notice success" style={{marginBottom:14}}>{notice}</div>}
    <div className="form-grid">
      {fields.map(f => <div className={'field ' + (['teacherName', 'topic', 'school'].includes(f.key) ? 'span-2' : '')} key={f.key}>
        <label>{f.label}{draft[f.key]?.trim() && draft[f.key].trim() !== f.original ? ' · DIBETULKAN' : ''}</label>
        <div className="helper" style={{marginBottom:5}}>Asal: <strong>{f.original || '—'}</strong></div>
        <input className="input" type={f.kind || 'text'} value={draft[f.key] || ''}
          onChange={e => {setDraft(old => ({...old, [f.key]:e.target.value}));setNotice('')}}
          placeholder={f.kind === 'date' ? undefined : 'Kosong = nilai asal'} disabled={locked || busy} />
      </div>)}
    </div>
    <div className="toolbar" style={{marginTop:16}}>
      <button className="btn btn-primary" disabled={locked || busy} onClick={submit}>{busy ? 'Menyimpan...' : 'Simpan Pembetulan' + (changed.length ? ' (' + changed.length + ')' : '')}</button>
      <button className="btn btn-secondary" disabled={locked || busy} onClick={() => {setDraft({});setNotice('Klik Simpan Pembetulan untuk membuang semua pembetulan.') }}>Kosongkan Semua</button>
    </div>
  </div>
}
