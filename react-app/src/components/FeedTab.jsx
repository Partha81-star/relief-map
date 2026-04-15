import { useState } from 'react'
import RequestCard from './RequestCard'

const FILTERS = ['all', 'food', 'water', 'medical', 'shelter', 'charging', 'other']

export default function FeedTab(props) {
  const { requests, tr, location } = props
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? requests : requests.filter(r => r.type === filter)

  return (
    <div id="tab-feed" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Welcome section */}
      {filtered.length === 0 && (
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(0,200,83,0.1))',
          borderBottom: '1px solid var(--border)',
          padding: '1.5rem 1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🌍</div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
            {tr('feed.welcome') || 'Welcome to Relief Network'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px', lineHeight: '1.5' }}>
            {location 
              ? `You're located at ${location.lat.toFixed(4)}°, ${location.lng.toFixed(4)}°. Within 2 km radius, you can help or request aid.`
              : 'Enable location to see requests near you'
            }
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', fontSize: '12px' }}>
            <span style={{ background: 'rgba(37,99,235,0.15)', color: '#2563eb', padding: '4px 12px', borderRadius: '20px' }}>📡 View Feed</span>
            <span style={{ background: 'rgba(0,200,83,0.15)', color: '#00C853', padding: '4px 12px', borderRadius: '20px' }}>🗺️ See Map</span>
            <span style={{ background: 'rgba(239,83,80,0.15)', color: '#ef5350', padding: '4px 12px', borderRadius: '20px' }}>✚ Create Post</span>
          </div>
        </div>
      )}

      {/* Filter row */}
      <div className="filter-row">
        {FILTERS.map(f => (
          <button key={f} className={`filter-chip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {tr(`filter.${f}`)}
          </button>
        ))}
      </div>

      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 1rem 4px' }}>
        <span className="section-label">{tr('feed.title')} · <span>{filtered.length}</span> {filtered.length === 1 ? 'request' : 'requests'}</span>
        <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{tr('feed.sorted')}</span>
      </div>

      {/* Feed list */}
      <div className="feed-list">
        {filtered.length === 0
          ? <div className="empty-state"><div className="empty-icon">📡</div><div>{tr('feed.empty')}</div><div className="empty-sub">{tr('feed.areaEmpty')}</div></div>
          : filtered.map(r => <RequestCard key={r.id} r={r} {...props} />)
        }
      </div>
    </div>
  )
}
