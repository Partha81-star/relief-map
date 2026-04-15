import RequestCard from './RequestCard'

export default function MyPostsTab(props) {
  const { myRequests, tr } = props
  return (
    <div id="tab-mine">
      <div style={{ padding: '8px 1rem 4px' }}>
        <span className="section-label">{tr('myPosts.title')}</span>
      </div>
      <div className="feed-list">
        {myRequests.length === 0
          ? <div className="empty-state"><div className="empty-icon">📋</div><div>{tr('myPosts.empty')}</div></div>
          : myRequests.map(r => <RequestCard key={r.id} r={r} {...props} context="mine" />)
        }
      </div>
    </div>
  )
}
