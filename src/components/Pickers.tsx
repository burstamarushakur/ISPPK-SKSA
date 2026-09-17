import { useRef } from 'react'
import { formatDateMY, formatTime } from '../lib/utils'

export function DatePicker({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  return <div className="picker">
    <input ref={ref} type="date" value={value} onChange={e => onChange(e.target.value)} tabIndex={-1} />
    <button type="button" className="picker-button" onClick={() => ref.current?.showPicker?.()}>
      <span>{value ? formatDateMY(value) : 'DD/MM/YYYY'}</span><span>📅</span>
    </button>
  </div>
}

export function TimePicker({ value, onChange, placeholder = 'Pilih masa' }: { value: string, onChange: (v: string) => void, placeholder?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  return <div className="picker">
    <input ref={ref} type="time" value={value} onChange={e => onChange(e.target.value)} tabIndex={-1} />
    <button type="button" className="picker-button" onClick={() => ref.current?.showPicker?.()}>
      <span>{value ? formatTime(value) : placeholder}</span><span>🕒</span>
    </button>
  </div>
}
