import { useState } from 'react'
import RequestCard from './RequestCard'

const FILTERS = ['all', 'food', 'water', 'medical', 'shelter', 'charging', 'other']

export default function FeedTab(props) {
  const { requests, tr } = props
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? requests : requests.filter(r => r.type === filter)

  return (
    <div id="tab-feed">
      <div className="filter-row">
        {FILTERS.map(f => (
          <button key={f} className={`filter-chip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {tr(`filter.${f}`)}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 1rem 4px' }}>
        <span className="section-label">{tr('feed.title')} · <span>{filtered.length}</span> posts</span>
        <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{tr('feed.sorted')}</span>
      </div>
      <div className="feed-list">
        {filtered.length === 0
          ? <div className="empty-state"><div className="empty-icon">📡</div><div>{tr('feed.empty')}</div><div className="empty-sub">{tr('feed.areaEmpty')}</div></div>
          : filtered.map(r => <RequestCard key={r.id} r={r} {...props} />)
        }
      </div>
    </div>
  )
}
