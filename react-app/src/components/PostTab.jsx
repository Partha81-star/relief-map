import { useState } from 'react'

export default function PostTab({ tr, onSubmit, onSuccess }) {
  const [type, setType] = useState('food')
  const [desc, setDesc] = useState('')
  const [qty, setQty] = useState('')
  const [urgency, setUrgency] = useState('medium')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    const ok = await onSubmit({ type, desc, qty, urgency })
    setSubmitting(false)
    if (ok) { setDesc(''); setQty(''); onSuccess() }
  }

  return (
    <div id="tab-post">
      <div className="tab-inner">
        <div className="form-section">
          <div className="form-title">{tr('post.title')}</div>

          <div className="form-group">
            <label className="form-label">{tr('post.typeLabel')}</label>
            <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
              <option value="food">🍱 Food</option>
              <option value="water">💧 Water</option>
              <option value="shelter">🏠 Shelter</option>
              <option value="medical">🚑 Medical help</option>
              <option value="charging">🔋 Phone / device charging</option>
              <option value="other">📦 Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{tr('post.descLabel')}</label>
            <textarea className="form-textarea" value={desc} onChange={e => setDesc(e.target.value)} placeholder={tr('post.descPlaceholder')} />
          </div>

          <div className="form-group">
            <label className="form-label">{tr('post.qtyLabel')}</label>
            <input className="form-input" value={qty} onChange={e => setQty(e.target.value)} placeholder={tr('post.qtyPlaceholder')} />
          </div>

          <div className="form-group">
            <label className="form-label">{tr('post.urgencyLabel')}</label>
            <div className="urg-row">
              {['low', 'medium', 'high'].map(u => (
                <button key={u} className={`urg-btn${urgency === u ? ' active' : ''}`} data-urgency={u} onClick={() => setUrgency(u)}>
                  {tr(`post.urgency${u.charAt(0).toUpperCase() + u.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="info-note">{tr('post.info')}</div>

          <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? tr('post.submittingBtn') : tr('post.submitBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
