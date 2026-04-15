import { useState } from 'react'
import { urgencyScore } from '../App'
import { haversineDistance } from '../geohash'

const EMOJI = { food: '🍱', water: '💧', shelter: '🏠', medical: '🚑', charging: '🔋', other: '📦' }

function timeAgo(ts, tr) {
  if (!ts) return tr('feed.justNow')
  const ms = Date.now() - (ts?.toMillis?.() || ts)
  const m = Math.floor(ms / 60000)
  if (m < 1) return tr('feed.justNow')
  if (m < 60) return m + tr('feed.timeSuffixM')
  if (m < 1440) return Math.floor(m / 60) + tr('feed.timeSuffixH')
  return Math.floor(m / 1440) + tr('feed.timeSuffixD')
}

export default function RequestCard({ r, user, userProfile, location, tr, onClaim, onResolve, onFlag, onDelete, onAdminResolve, onAdminUnflag, context = 'feed' }) {
  const [showTrans, setShowTrans] = useState(false)
  const isMine = r.createdBy === user?.uid
  const role = userProfile?.role
  const canClaim = role === 'helper' && r.status === 'pending' && !isMine
  const canResolve = role === 'helper' && r.status === 'assigned' && r.claimedBy === user?.uid
  const urgColor = r.urgency === 'high' ? '#ef5350' : r.urgency === 'medium' ? '#FF9800' : '#66BB6A'
  const statusColor = r.status === 'assigned' ? '#42A5F5' : r.status === 'resolved' ? '#66BB6A' : '#888'
  const distKm = r.distKm ?? (location ? haversineDistance(location.lat, location.lng, r.lat, r.lng) : undefined)

  const urgLabel = { high: tr('post.urgencyHigh'), medium: tr('post.urgencyMedium'), low: tr('post.urgencyLow') }
  const statusLabel = { pending: tr('status.pending'), assigned: tr('status.assigned'), resolved: tr('status.resolved'), flagged: tr('status.flagged') }

  return (
    <div className={`card${r.flagged ? ' card-flagged' : ''}`}>
      {r.flagged && <div className="flag-banner">⚠ {tr('status.flagged')}</div>}
      <div className="card-header">
        <div className="type-badge" data-type={r.type}>{EMOJI[r.type]} {r.type}</div>
        <div className="badges-right">
          {urgencyScore(r) > 200 && <span className="ai-badge">✨ AI Priority</span>}
          <span className="badge" style={{ background: `${urgColor}20`, color: urgColor, border: `1px solid ${urgColor}40` }}>{urgLabel[r.urgency] || r.urgency}</span>
          <span className="badge" style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}>{statusLabel[r.status] || r.status}</span>
        </div>
      </div>
      <div className="card-desc">
        {showTrans
          ? <span style={{ color: 'var(--teal)' }}>🔄 {r.desc}</span>
          : <span>{r.desc}</span>
        }
      </div>
      {r.qty && <div className="card-qty">{r.qty}</div>}
      <div className="card-meta">
        {distKm !== undefined && <span className="meta-chip">{distKm.toFixed(2)} km</span>}
        <span className="meta-chip">{timeAgo(r.createdAt, tr)}</span>
        <span className="meta-chip">{tr('feed.by')} {r.createdByName || 'Anonymous'}</span>
        {r.status === 'assigned' && r.claimedByName && <span className="meta-chip meta-assigned">→ {r.claimedByName}</span>}
      </div>

      {/* ETA tracker for seeker */}
      {r.status === 'assigned' && isMine && r.helperEtaMin && (
        <ETATracker r={r} tr={tr} />
      )}

      <div className="card-actions">
        {canClaim && <button className="btn btn-primary" onClick={() => onClaim(r.id)}>{tr('actions.claim')}</button>}
        {canResolve && <button className="btn btn-success" onClick={() => onResolve(r.id)}>{tr('actions.resolve')}</button>}
        <button className="btn btn-ghost" onClick={() => setShowTrans(v => !v)}>{showTrans ? tr('actions.showOriginal') : tr('actions.translate')}</button>
        {isMine && r.status === 'pending' && <button className="btn btn-danger" onClick={() => onDelete(r.id)}>{tr('actions.delete')}</button>}
        {!isMine && r.status !== 'resolved' && <button className="btn btn-ghost" onClick={() => onFlag(r.id)}>{tr('actions.flag')}</button>}
        {context === 'admin' && <>
          <button className="btn btn-ghost" onClick={() => onAdminResolve(r.id)}>Force resolve</button>
          <button className="btn btn-ghost" onClick={() => onAdminUnflag(r.id)}>Unflag</button>
        </>}
      </div>
    </div>
  )
}

function ETATracker({ r, tr }) {
  const etaMin = r.helperEtaMin || 0
  const distKm = r.helperDistKm || 0
  const helperName = r.helperName || r.claimedByName || 'Helper'
  const updatedAt = r.helperUpdatedAt || Date.now()
  const elapsed = Math.floor((Date.now() - updatedAt) / 60000)
  const remaining = Math.max(0, etaMin - elapsed)
  const progress = Math.min(100, (elapsed / etaMin) * 100)

  return (
    <div className="eta-tracker">
      <div className="eta-tracker-header">
        <img src={r.helperPhoto || ''} onError={e => e.target.style.display = 'none'} className="eta-helper-avatar" alt="" />
        <div className="eta-helper-info">
          <div className="eta-helper-name">{helperName} {tr('map.onTheWay')}</div>
          <div className="eta-helper-dist">{distKm.toFixed(1)} {tr('map.kmAway')}</div>
        </div>
        <div className="eta-countdown">
          <div className="eta-min">{remaining}</div>
          <div className="eta-label">{remaining === 0 ? tr('map.arriving') : tr('map.minETA')}</div>
        </div>
      </div>
      <div className="eta-progress-bar">
        <div className="eta-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="eta-status-row">
        <span className="eta-dot-pulse" />
        <span className="eta-status-text">{tr('map.helperNavigating')}</span>
      </div>
    </div>
  )
}
