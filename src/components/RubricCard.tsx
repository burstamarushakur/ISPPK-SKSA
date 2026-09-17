import type { RubricItem } from '../lib/types'

export default function RubricCard({ item, value, onChange, scoreLabels }: { item: RubricItem, value?: number, onChange: (n: number) => void, scoreLabels: string[] }) {
  return <div className="rubric">
    <div className="rubric-head">
      <div><span className="rubric-id">{item.id}</span><span className="rubric-title">{item.title}</span></div>
      <div className="helper" style={{marginTop:6}}>SK@S: {item.skas}</div>
      <ol className="criteria">{item.criteria.map((c,i) => <li key={i}>{c}</li>)}</ol>
    </div>
    <div className="score-grid">
      {[1,2,3,4,5].map(n => <button type="button" key={n} className={`score-option ${value===n?'selected':''}`} onClick={() => onChange(n)}>
        <strong>{n}</strong><small>{scoreLabels[n-1] || `SKOR ${n}`}</small>
      </button>)}
    </div>
    {value ? <div className="score-desc"><strong>Rubrik dipilih:</strong> {item.scoreDescriptions[value-1]}</div> : <div className="score-desc">Pilih skor 1 hingga 5 berdasarkan rubrik instrumen.</div>}
  </div>
}
