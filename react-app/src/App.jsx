import { useState, useEffect, useCallback, useRef } from 'react'
import { auth, db, googleProvider } from './firebase'
import {
  signInWithPopup, signOut, onAuthStateChanged
} from 'firebase/auth'
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, where, serverTimestamp, getDoc, setDoc
} from 'firebase/firestore'
import { encodeGeohash, getNearbyGeohashPrefixes, geohashPrefixEnd, haversineDistance } from './geohash'
import { t } from './translations'
import AuthScreen from './components/AuthScreen'
import AppShell from './components/AppShell'
import Toast from './components/Toast'

const ADMIN_EMAIL = 'utkarshnarwade2006@gmail.com'

export default function App() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [location, setLocation] = useState(null)
  const [requests, setRequests] = useState([])
  const [myRequests, setMyRequests] = useState([])
  const [lang, setLang] = useState(() => localStorage.getItem('userLanguage') || 'en')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)
  const unsubscribeRef = useRef([])
  const watcherRef = useRef(null)

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const tr = useCallback((key, params) => t(lang, key, params), [lang])

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const ref = doc(db, 'users', u.uid)
        const snap = await getDoc(ref)
        if (!snap.exists()) {
          const profile = { displayName: u.displayName, email: u.email, photoURL: u.photoURL, role: 'helper', createdAt: serverTimestamp(), isVerified: false }
          await setDoc(ref, profile)
          setUserProfile(profile)
        } else {
          setUserProfile(snap.data())
        }
        setUser(u)
      } else {
        setUser(null)
        setUserProfile(null)
        setRequests([])
        setMyRequests([])
      }
      setLoading(false)
    })
    return unsub
  }, [])

  // Location
  useEffect(() => {
    if (!user) return
    if (!navigator.geolocation) { showToast('Geolocation not supported', 'error'); return }
    
    // Request permissions first if available (iOS 13+)
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(permission => {
          if (permission.state === 'granted') {
            getLocationWithHighAccuracy()
          } else if (permission.state === 'denied') {
            showToast('Enable location permissions in settings', 'warn')
          } else if (permission.state === 'prompt') {
            getLocationWithHighAccuracy()
          }
        })
        .catch(() => getLocationWithHighAccuracy())
    } else {
      getLocationWithHighAccuracy()
    }

    function getLocationWithHighAccuracy() {
      // First, get current position immediately
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => { 
          console.error('getCurrentPosition error:', err)
          showToast(tr('toast.geoError'), 'warn')
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
      
      // Then watch for continuous updates
      watcherRef.current = navigator.geolocation.watchPosition(
        pos => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          console.log('Location updated:', pos.coords.latitude, pos.coords.longitude)
        },
        (err) => { 
          console.error('watchPosition error:', err.message)
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
      )
    }

    return () => { if (watcherRef.current) navigator.geolocation.clearWatch(watcherRef.current) }
  }, [user, tr])

  // Feed subscription
  useEffect(() => {
    if (!user || !location) return
    unsubscribeRef.current.forEach(fn => fn?.())
    unsubscribeRef.current = []

    const RADIUS_KM = 2
    const prefixes = getNearbyGeohashPrefixes(location.lat, location.lng, RADIUS_KM)
    const requestMap = new Map()

    const fns = prefixes.map(prefix => {
      const q = query(
        collection(db, 'requests'),
        where('geohash', '>=', prefix),
        where('geohash', '<', geohashPrefixEnd(prefix))
      )
      return onSnapshot(q, snap => {
        snap.docChanges().forEach(change => {
          const id = change.doc.id
          const data = { id, ...change.doc.data() }
          if (change.type === 'removed') { requestMap.delete(id); return }
          if (!['pending', 'assigned'].includes(data.status)) { requestMap.delete(id); return }
          const dist = haversineDistance(location.lat, location.lng, data.lat, data.lng)
          if (dist <= RADIUS_KM) { data.distKm = dist; requestMap.set(id, data) }
          else requestMap.delete(id)
        })
        setRequests([...requestMap.values()].sort((a, b) => urgencyScore(b) - urgencyScore(a)))
      })
    })
    unsubscribeRef.current = fns

    // My posts
    const myQ = query(collection(db, 'requests'), where('createdBy', '==', user.uid))
    const myUnsub = onSnapshot(myQ, snap => {
      setMyRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    unsubscribeRef.current.push(myUnsub)

    return () => { unsubscribeRef.current.forEach(fn => fn?.()) }
  }, [user, location?.lat, location?.lng])

  const loginGoogle = async () => {
    try { await signInWithPopup(auth, googleProvider) }
    catch (e) { showToast(tr('toast.loginFailed', { error: e.message }), 'error') }
  }

  const logout = async () => {
    try {
      unsubscribeRef.current.forEach(fn => fn?.())
      if (watcherRef.current) navigator.geolocation.clearWatch(watcherRef.current)
      await signOut(auth)
    } catch (e) { showToast('Sign out failed: ' + e.message, 'error') }
  }

  const submitRequest = async ({ type, desc, qty, urgency }) => {
    if (!user || !location) { showToast(tr('toast.needLocation'), 'error'); return false }
    if (!desc.trim()) { showToast(tr('toast.needDesc'), 'error'); return false }
    const { lat, lng } = location
    await addDoc(collection(db, 'requests'), {
      type, desc: desc.trim(), qty: qty.trim(), urgency,
      lat, lng, geohash: encodeGeohash(lat, lng, 7),
      status: 'pending',
      createdBy: user.uid, createdByName: user.displayName, createdByPhoto: user.photoURL || '',
      claimedBy: null, claimedByName: null, flagged: false, flagCount: 0,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    })
    showToast(tr('post.successMsg'), 'success')
    return true
  }

  const claimRequest = async (id) => {
    await updateDoc(doc(db, 'requests', id), {
      status: 'assigned', claimedBy: user.uid, claimedByName: user.displayName,
      claimedByPhoto: user.photoURL || '', updatedAt: serverTimestamp()
    })
    showToast(tr('toast.claimed'), 'success')
  }

  const resolveRequest = async (id) => {
    await updateDoc(doc(db, 'requests', id), { status: 'resolved', resolvedAt: serverTimestamp(), updatedAt: serverTimestamp() })
    showToast(tr('toast.resolved'), 'success')
  }

  const flagRequest = async (id) => {
    const r = requests.find(x => x.id === id) || myRequests.find(x => x.id === id)
    if (!r) return
    await updateDoc(doc(db, 'requests', id), { flagCount: (r.flagCount || 0) + 1, flagged: (r.flagCount || 0) + 1 >= 3 })
    showToast(tr('toast.flagged'), 'warn')
  }

  const deleteRequest = async (id) => {
    if (!window.confirm('Delete this post?')) return
    await deleteDoc(doc(db, 'requests', id))
    showToast(tr('toast.deleted'), 'success')
  }

  const adminResolve = async (id) => {
    await updateDoc(doc(db, 'requests', id), { status: 'resolved', resolvedAt: serverTimestamp(), updatedAt: serverTimestamp() })
    showToast(tr('toast.adminResolved'), 'success')
  }

  const adminUnflag = async (id) => {
    await updateDoc(doc(db, 'requests', id), { flagged: false, flagCount: 0 })
    showToast(tr('toast.adminUnflagged'), 'success')
  }

  const updateRole = async (role) => {
    await updateDoc(doc(db, 'users', user.uid), { role })
    setUserProfile(p => ({ ...p, role }))
    showToast(tr('toast.roleUpdated', { role }), 'success')
  }

  const changeLang = (l) => { setLang(l); localStorage.setItem('userLanguage', l) }

  if (loading) return <div className="loading-screen"><div className="loading-logo">📍</div></div>

  return (
    <>
      {!user
        ? <AuthScreen onLogin={loginGoogle} tr={tr} />
        : <AppShell
            user={user} userProfile={userProfile} location={location}
            requests={requests} myRequests={myRequests}
            lang={lang} tr={tr} onChangeLang={changeLang}
            onLogout={logout} onSubmit={submitRequest}
            onClaim={claimRequest} onResolve={resolveRequest}
            onFlag={flagRequest} onDelete={deleteRequest}
            onAdminResolve={adminResolve} onAdminUnflag={adminUnflag}
            onUpdateRole={updateRole} showToast={showToast}
            isAdmin={user.email === ADMIN_EMAIL}
            db={db}
          />
      }
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </>
  )
}

function urgencyScore(r) {
  let u = r.urgency === 'high' ? 300 : r.urgency === 'medium' ? 200 : 100
  const ageMs = Date.now() - (r.createdAt?.toMillis?.() || Date.now())
  const ageBonus = Math.min(ageMs / 3600000 * 10, 50)
  const statusBonus = r.status === 'pending' ? 50 : 0
  let aiBonus = 0
  const text = ((r.desc || '') + ' ' + (r.qty || '')).toLowerCase()
  const criticalWords = ['critical', 'dying', 'bleeding', 'fire', 'baby', 'trapped', 'unconscious', 'emergency', 'urgent']
  criticalWords.forEach(kw => { if (text.includes(kw)) aiBonus += 40 })
  const numMatch = text.match(/\d+/)
  if (numMatch && parseInt(numMatch[0]) > 5) aiBonus += 25
  return u + ageBonus + statusBonus + Math.min(aiBonus, 150)
}

export { urgencyScore }
