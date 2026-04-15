import { useState } from 'react'
import FeedTab from './FeedTab'
import MapTab from './MapTab'
import PostTab from './PostTab'
import MyPostsTab from './MyPostsTab'
import ProfileTab from './ProfileTab'
import SOSModal from './SOSModal'

export default function AppShell(props) {
  const { user, location, tr, onLogout } = props
  const [tab, setTab] = useState('feed')
  const [showSOS, setShowSOS] = useState(false)

  const tabs = [
    { id: 'feed', icon: '📡', label: tr('nav.feed') },
    { id: 'map',  icon: '🗺',  label: tr('nav.map') },
    { id: 'post', icon: '✚',  label: tr('nav.post') },
    { id: 'mine', icon: '📋', label: tr('nav.myPosts') },
    { id: 'profile', icon: '👤', label: tr('nav.profile') },
  ]

  return (
    <div id="screen-app">
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-logo">
          <span style={{ color: 'var(--accent)' }}>📍</span>
          <span>Relief<span className="logo-dot">·</span>Map</span>
        </div>
        <div className="loc-badge">
          <div className="live-dot" />
          <span>{location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Locating…'}</span>
        </div>
        <div className="topbar-right">
          <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 'bold' }} onClick={() => setShowSOS(true)}>SOS</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '4px' }}>
            <img src={user.photoURL || ''} onError={e => e.target.style.display = 'none'} className="avatar-img" alt="" />
            <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)' }}>{user.displayName || 'User'}</span>
          </div>
          <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={onLogout}>Sign out</button>
        </div>
      </div>

      {/* Tab content */}
      <div className="scroll-area">
        {tab === 'feed'    && <FeedTab {...props} />}
        {tab === 'map'     && <MapTab {...props} />}
        {tab === 'post'    && <PostTab {...props} onSuccess={() => setTab('feed')} />}
        {tab === 'mine'    && <MyPostsTab {...props} />}
        {tab === 'profile' && <ProfileTab {...props} />}
      </div>

      {/* Bottom nav */}
      <div className="bottom-nav">
        {tabs.map(({ id, icon, label }) => (
          <button key={id} className={`nav-btn${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>
            <span className="nav-icon">{icon}</span>{label}
          </button>
        ))}
      </div>

      {showSOS && <SOSModal onClose={() => setShowSOS(false)} tr={tr} />}
    </div>
  )
}
