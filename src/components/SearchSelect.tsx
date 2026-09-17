import { useEffect, useRef, useState } from 'react'

export interface SearchOption {
  value: string
  label: string
  group?: string
  meta?: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  options: SearchOption[]
  placeholder?: string
  disabled?: boolean
}

export default function SearchSelect({ value, onChange, options, placeholder = 'Cari dan pilih...', disabled }: Props) {
  const selected = options.find(o => o.value === value)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(selected?.label || '')
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(selected?.label || '') }, [selected?.label])
  useEffect(() => {
    const close = (e: MouseEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const filtered = options.filter(o => `${o.label} ${o.group || ''} ${o.meta || ''}`.toLowerCase().includes(query.toLowerCase())).slice(0, 80)

  return <div className="search-select" ref={root}>
    <input
      className="input"
      value={query}
      disabled={disabled}
      placeholder={placeholder}
      onFocus={() => setOpen(true)}
      onChange={e => { setQuery(e.target.value); setOpen(true); if (selected && e.target.value !== selected.label) onChange('') }}
      autoComplete="off"
    />
    {open && !disabled && <div className="search-menu">
      {filtered.length === 0 && <div className="search-option" style={{color:'#796f81'}}>Tiada padanan.</div>}
      {filtered.map(o => <div key={o.value} className="search-option" onClick={() => { onChange(o.value); setQuery(o.label); setOpen(false) }}>
        <strong>{o.label}</strong>
        {(o.group || o.meta) && <div className="helper">{[o.group, o.meta].filter(Boolean).join(' · ')}</div>}
      </div>)}
    </div>}
  </div>
}
