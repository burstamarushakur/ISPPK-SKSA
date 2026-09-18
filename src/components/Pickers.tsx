import { formatDateMY, formatTime } from '../lib/utils'

export function DatePicker({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  return <div className="picker">
    <div className="picker-button" aria-hidden="true">
      <span>{value ? formatDateMY(value) : 'DD/MM/YYYY'}</span><span>📅</span>
    </div>
    <input
      className="picker-native"
      type="date"
      value={value}
      onChange={e => onChange(e.currentTarget.value)}
      aria-label="Pilih tarikh"
    />
  </div>
}

export function TimePicker({ value, onChange, placeholder = 'Pilih masa' }: { value: string, onChange: (v: string) => void, placeholder?: string }) {
  return <div className="picker">
    <div className="picker-button" aria-hidden="true">
      <span>{value ? formatTime(value) : placeholder}</span><span>🕒</span>
    </div>
    <input
      className="picker-native"
      type="time"
      value={value}
      onChange={e => onChange(e.currentTarget.value)}
      aria-label="Pilih masa"
    />
  </div>
}
