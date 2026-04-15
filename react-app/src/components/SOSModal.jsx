const CONTACTS = [
  { section: 'Universal', items: [{ label: '🆘 Universal Emergency (Police / Fire / Ambulance)', num: '112' }] },
  { section: 'Police & Fire', items: [{ label: '👮 Police', num: '100' }, { label: '🚒 Fire Brigade', num: '101' }] },
  { section: 'Medical', items: [{ label: '🚑 Ambulance', num: '102' }, { label: '🚑 Ambulance (alternate)', num: '108' }, { label: '🏥 Health Helpline', num: '104' }] },
  { section: 'Disaster Management', items: [{ label: '🌪 Disaster Response', num: '108 / 112' }, { label: '🏛 State Disaster Management', num: '1070' }, { label: '🌊 Flood Relief', num: '1078' }] },
  { section: 'Women & Children', items: [{ label: '👩 Women Helpline', num: '1091' }, { label: '👩 Women in Distress (State)', num: '181' }, { label: '🧒 Child Helpline', num: '1098' }] },
]

export default function SOSModal({ onClose }) {
  return (
    <div style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000, alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--bg2)', width: '100%', maxWidth: '400px', borderRadius: 'var(--r2)', border: '1px solid #ef5350', overflow: 'hidden' }}>
        <div style={{ background: '#ef5350', padding: '15px', textAlign: 'center', position: 'relative' }}>
          <h3 style={{ color: 'white', margin: 0, fontFamily: 'var(--font-display)' }}>🚨 EMERGENCY CONTACTS</h3>
          <button onClick={onClose} style={{ position: 'absolute', right: '15px', top: '15px', background: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '70vh', overflowY: 'auto' }}>
          {CONTACTS.map(({ section, items }) => (
            <div key={section}>
              <div style={{ fontSize: '10px', color: '#aaa', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 0 2px' }}>{section}</div>
              {items.map(({ label, num }) => (
                <a key={num} href={`tel:${num.split(' ')[0]}`} className="btn btn-ghost" style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '4px' }}>
                  <span>{label}</span><span>{num}</span>
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
