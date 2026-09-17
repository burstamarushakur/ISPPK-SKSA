import type { StudentItem } from '../lib/types'

function compactGuide(text: string, n: number) {
  return text.replace(new RegExp(`^Skor ${n}:\\s*`, 'i'), '')
}

export default function StudentScoreCard({ item, index, value, onChange, scoreGuide }: { item: StudentItem, index: number, value?: number, onChange: (n:number)=>void, scoreGuide: string[] }) {
  return <div className="rubric student-rubric-row">
    <div className="rubric-head"><span className="rubric-id">{index+1}</span><span className="rubric-title">{item.title}</span></div>
    <div className="score-grid student-score-grid">
      {[1,2,3,4,5].map(n => <button type="button" key={n} className={`score-option ${value===n?'selected':''}`} onClick={() => onChange(n)}>
        <strong>{n}</strong><small>{compactGuide(scoreGuide[n-1] || `SKOR ${n}`, n)}</small>
      </button>)}
    </div>
  </div>
}
