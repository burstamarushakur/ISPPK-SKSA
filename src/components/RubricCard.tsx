import type { RubricItem } from '../lib/types'

const roman = ['i.','ii.','iii.','iv.','v.','vi.']

export default function RubricCard({ item, value, onChange, scoreLabels }: { item: RubricItem, value?: number, onChange: (n: number) => void, scoreLabels: string[] }) {
  return <div className="rubric official-rubric-card">
    <div className="rubric-head">
      <div><span className="rubric-id">{item.id}</span><span className="rubric-title">{item.title}</span></div>
      <div className="helper" style={{marginTop:6}}>SK@S: {item.skas}</div>
      <div className="criteria official-criteria">{item.criteria.map((c,i) => <div key={i} className="criterion"><span>{roman[i] || `${i+1}.`}</span><span>{c}</span></div>)}</div>
    </div>
    <div className="official-score-grid">
      {[1,2,3,4,5].map(n => <button type="button" key={n} className={`official-score-option ${value===n?'selected':''}`} onClick={() => onChange(n)}>
        <div className="official-score-number">{n}</div>
        <div className="official-score-label">{scoreLabels[n-1] || `SKOR ${n}`}</div>
        <div className="official-score-description">{item.scoreDescriptions[n-1]}</div>
      </button>)}
    </div>
  </div>
}
