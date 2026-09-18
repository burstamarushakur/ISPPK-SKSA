import type { MouseEvent } from 'react'

function openPicker(event: MouseEvent<HTMLInputElement>) {
  const input = event.currentTarget as HTMLInputElement & { showPicker?: () => void }
  try { input.showPicker?.() } catch { /* Native control still works without showPicker(). */ }
}

export function DatePicker({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  return <div className="picker">
    <input
      className="picker-native"
      type="date"
      value={value}
      onChange={e => onChange(e.currentTarget.value)}
      onClick={openPicker}
      aria-label="Pilih tarikh"
    />
  </div>
}

export function TimePicker({ value, onChange, placeholder = 'Pilih masa' }: { value: string, onChange: (v: string) => void, placeholder?: string }) {
  return <div className="picker">
    <input
      className="picker-native"
      type="time"
      value={value}
      onChange={e => onChange(e.currentTarget.value)}
      onClick={openPicker}
      aria-label={placeholder}
    />
  </div>
}
