import RequestCard from './RequestCard'

export default function ProfileTab(props) {
  const { user, userProfile, requests, myRequests, lang, tr, onChangeLang, onUpdateRole, onLogout, isAdmin } = props

  const adminAll = [...requests, ...myRequests.filter(r => r.status === 'resolved')]
  const adminUnique = [...new Map(adminAll.map(r => [r.id, r])).values()]

  return (
    <div id="tab-profile">
      <div className="tab-inner">
        <div className="form-section">
          {/* Profile header */}
          <div className="profile-header">
            <img src={user.photoURL || ''} onError={e => e.target.style.display = 'none'} className="profile-avatar" alt="" />
            <div>
              <div className="profile-name">{user.displayName}</div>
              <div className="profile-email">{user.email}</div>
            </div>
          </div>

          {/* Role */}
          <div className="form-group">
            <label className="form-label">{tr('profile.roleLabel')}</label>
            <div className="role-row">
              {['helper', 'seeker'].map(role => (
                <button key={role} className={`role-btn${userProfile?.role === role ? ' active' : ''}`} onClick={() => onUpdateRole(role)}>
                  {role === 'helper' ? tr('profile.roleHelper') : tr('profile.roleSeeker')}
                  <br /><small style={{ fontSize: '11px', opacity: 0.6 }}>{role === 'helper' ? tr('profile.helperDesc') : tr('profile.seekerDesc')}</small>
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="form-group">
            <label className="form-label">{tr('profile.languageLabel')}</label>
            <select className="form-select" value={lang} onChange={e => onChangeLang(e.target.value)}>
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>
          </div>

          {/* Admin panel */}
          {isAdmin && (
            <>
              <div className="section-label" style={{ marginTop: '1.5rem', marginBottom: '12px' }}>{tr('profile.adminLabel')}</div>
              <div className="feed-list" style={{ padding: 0 }}>
                {adminUnique.length === 0
                  ? <div className="empty-state"><div style={{ fontSize: '13px' }}>{tr('profile.adminEmpty')}</div></div>
                  : adminUnique.map(r => <RequestCard key={r.id} r={r} {...props} context="admin" />)
                }
              </div>
            </>
          )}
        </div>

        <div style={{ marginTop: '12px' }}>
          <button className="btn btn-danger" style={{ width: '100%' }} onClick={onLogout}>{tr('profile.signOut')}</button>
        </div>
      </div>
    </div>
  )
}
