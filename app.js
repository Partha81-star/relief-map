import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
    import { getAuth, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
    import { getFirestore, enableIndexedDbPersistence, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, orderBy, serverTimestamp, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

    // ── FIREBASE CONFIG ─────────────────────────────────────────
    // Replace with your own Firebase project config from console.firebase.google.com
   
    const firebaseConfig = {
  apiKey: "AIzaSyCXl4_cO_F8xXMuHzAghWGG1k_xJfYSvYY",
  authDomain: "relief-map-dafa2.firebaseapp.com",
  projectId: "relief-map-dafa2",
  storageBucket: "relief-map-dafa2.firebasestorage.app",
  messagingSenderId: "1088851741935",
  appId: "1:1088851741935:web:4c4070f1a17d4dc43d9f1a",
  measurementId: "G-HCF00YJENZ"
    };
    // ────────────────────────────────────────────────────────────

    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    const auth = getAuth(app);
    const db = getFirestore(app);
    window._db = db; // expose for ai-features.js
    
    // Enable offline persistence (caches data and queues writes)
    enableIndexedDbPersistence(db).catch((err) => {
      console.warn("Offline persistence failed to enable:", err);
    });

    // ── GEOHASH UTILITIES ────────────────────────────────────────
    const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

    function encodeGeohash(lat, lng, precision = 9) {
      let idx = 0, bit = 0, evenBit = true;
      let geohash = '';
      let latMin = -90, latMax = 90, lngMin = -180, lngMax = 180;
      while (geohash.length < precision) {
        if (evenBit) {
          const lngMid = (lngMin + lngMax) / 2;
          if (lng >= lngMid) { idx = idx * 2 + 1; lngMin = lngMid; }
          else { idx = idx * 2; lngMax = lngMid; }
        } else {
          const latMid = (latMin + latMax) / 2;
          if (lat >= latMid) { idx = idx * 2 + 1; latMin = latMid; }
          else { idx = idx * 2; latMax = latMid; }
        }
        evenBit = !evenBit;
        if (++bit === 5) { geohash += BASE32[idx]; bit = 0; idx = 0; }
      }
      return geohash;
    }

    function getGeohashRange(lat, lng, radiusKm) {
      const latDeg = radiusKm / 110.574;
      const lngDeg = radiusKm / (111.320 * Math.cos(lat * Math.PI / 180));
      const minHash = encodeGeohash(lat - latDeg, lng - lngDeg, 5);
      const maxHash = encodeGeohash(lat + latDeg, lng + lngDeg, 5);
      return { minHash, maxHash };
    }

    function getNearbyGeohashPrefixes(lat, lng, radiusKm) {
      let precision = 7;
      if (radiusKm >= 20) precision = 3;
      else if (radiusKm >= 4) precision = 4;
      else if (radiusKm >= 1) precision = 5;
      else precision = 6;

      const latOffset = radiusKm / 110.574;
      const lngOffset = radiusKm / (111.320 * Math.cos(lat * Math.PI / 180));
      const points = [
        [lat, lng],
        [lat + latOffset, lng],
        [lat - latOffset, lng],
        [lat, lng + lngOffset],
        [lat, lng - lngOffset],
        [lat + latOffset, lng + lngOffset],
        [lat + latOffset, lng - lngOffset],
        [lat - latOffset, lng + lngOffset],
        [lat - latOffset, lng - lngOffset],
      ];
      return [...new Set(points.map(([pLat, pLng]) => encodeGeohash(pLat, pLng, precision)))];
    }

    function geohashPrefixEnd(prefix) {
      return prefix + '\uf8ff';
    }

    function normalizeUnsubscribe(unsubscribe) {
      if (!unsubscribe) return;
      if (Array.isArray(unsubscribe)) {
        unsubscribe.forEach(fn => fn && fn());
      } else {
        unsubscribe();
      }
    }

    function haversineDistance(lat1, lng1, lat2, lng2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    // ── APP STATE ────────────────────────────────────────────────
    window.STATE = {
      user: null,
      userProfile: null,
      location: null,
      requests: [],
      myRequests: [],
      currentTab: 'feed',
      filter: 'all',
      sortMode: 'urgency',
      unsubscribeFeed: null,
      map: null,
      markers: {},
      radiusCircle: null,
      locationWatcher: null
    };

    // ── AUTH ─────────────────────────────────────────────────────
    window.loginGoogle = async () => {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } catch(e) { showToast((window.i18n ? window.i18n.t('toast.loginFailed', {error: e.message}) : 'Login failed: ' + e.message), 'error'); }
    };

    window.logout = async () => {
      try {
        normalizeUnsubscribe(STATE.unsubscribeFeed);
        STATE.unsubscribeFeed = null;
        if (STATE.locationWatcher) {
          navigator.geolocation.clearWatch(STATE.locationWatcher);
          STATE.locationWatcher = null;
        }
        if (STATE.map) {
          STATE.map.remove();
          STATE.map = null;
          STATE.markers = {};
          STATE.radiusCircle = null;
        }
        await signOut(auth);
        STATE.requests = [];
        STATE.myRequests = [];
        STATE.user = null;
        STATE.userProfile = null;
        STATE.location = null;
        document.getElementById('screen-app').style.display = 'none';
        document.getElementById('screen-auth').style.display = 'flex';
      } catch(e) {
        showToast('Sign out failed: ' + e.message, 'error');
      }
    };

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        STATE.user = user;
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          const profile = {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            role: 'helper',
            createdAt: serverTimestamp(),
            isVerified: false
          };
          await setDoc(ref, profile);
          STATE.userProfile = profile;
        } else {
          STATE.userProfile = snap.data();
        }
        document.getElementById('screen-auth').style.display = 'none';
        document.getElementById('screen-app').style.display = 'block';
        initLocation();
        renderUserHeader();
      } else {
        document.getElementById('screen-auth').style.display = 'flex';
        document.getElementById('screen-app').style.display = 'none';
        document.getElementById('screen-app').style.flexDirection = '';
      }
    });

    window.updateRole = async (role) => {
      await updateDoc(doc(db, 'users', STATE.user.uid), { role });
      STATE.userProfile.role = role;
      document.querySelectorAll('.role-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.role === role);
      });
      showToast((window.i18n ? window.i18n.t('toast.roleUpdated', {role: role}) : 'Role updated to ' + role), 'success');
      renderAll();
    };

    // ── LOCATION ─────────────────────────────────────────────────
    function initLocation() {
      if (!navigator.geolocation) {
        showToast('Geolocation not supported', 'error');
        return;
      }
      STATE.locationWatcher = navigator.geolocation.watchPosition(
        pos => {
          const { latitude: lat, longitude: lng } = pos.coords;
          const changed = !STATE.location || Math.abs(STATE.location.lat - lat) > 0.0001;
          STATE.location = { lat, lng };
          if (changed) {
            updateLocationUI();
            subscribeToFeed();
            if (STATE.map) updateMapCenter();
          }
        },
        err => {
          console.warn('Geo error:', err);
          showToast('Could not get location — using default', 'warn');
          STATE.location = { lat: 18.5204, lng: 73.8567 }; // Pune default
          updateLocationUI();
          subscribeToFeed();
        },
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
      );
    }

    function updateLocationUI() {
      const el = document.getElementById('loc-display');
      if (el && STATE.location) {
        el.textContent = STATE.location.lat.toFixed(4) + ', ' + STATE.location.lng.toFixed(4);
      }
    }

    // ── FIRESTORE FEED ───────────────────────────────────────────
    function subscribeToFeed() {
      normalizeUnsubscribe(STATE.unsubscribeFeed);
      if (!STATE.location) return;

      const RADIUS_KM = 2;
      const prefixes = getNearbyGeohashPrefixes(STATE.location.lat, STATE.location.lng, RADIUS_KM);
      const requestMap = new Map();
      const unsubscribeFns = prefixes.map(prefix => {
        const q = query(
          collection(db, 'requests'),
          where('geohash', '>=', prefix),
          where('geohash', '<', geohashPrefixEnd(prefix))
        );

        return onSnapshot(q, snap => {
          snap.docChanges().forEach(change => {
            const id = change.doc.id;
            const data = { id, ...change.doc.data() };
            if (change.type === 'removed') {
              requestMap.delete(id);
              return;
            }
            if (!['pending', 'assigned'].includes(data.status)) return;

            const dist = haversineDistance(
              STATE.location.lat, STATE.location.lng,
              data.lat, data.lng
            );
            if (dist <= RADIUS_KM) {
              data.distKm = dist;
              requestMap.set(id, data);
            } else {
              requestMap.delete(id);
            }
          });

          STATE.requests = [...requestMap.values()].sort((a, b) => urgencyScore(b) - urgencyScore(a));
          renderFeed();
          renderMapPins();
          updateStats();
        });
      });

      STATE.unsubscribeFeed = unsubscribeFns;

      // My posts listener
      const myQ = query(
        collection(db, 'requests'),
        where('createdBy', '==', STATE.user.uid)
      );
      onSnapshot(myQ, snap => {
        STATE.myRequests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderMyPosts();
      });
    }
    window.subscribeToFeed = subscribeToFeed;

    function urgencyScore(r) {
      let u = r.urgency === 'high' ? 300 : r.urgency === 'medium' ? 200 : 100;
      const ageMs = Date.now() - (r.createdAt?.toMillis?.() || Date.now());
      const ageBonus = Math.min(ageMs / 3600000 * 10, 50);
      const statusBonus = r.status === 'pending' ? 50 : 0;
      
      // AI Priority Ranking Heuristics
      let aiBonus = 0;
      const textObj = ((r.desc || '') + ' ' + (r.qty || '')).toLowerCase();
      const criticalWords = ['critical', 'dying', 'bleeding', 'fire', 'baby', 'trapped', 'unconscious', 'emergency', 'urgent'];
      criticalWords.forEach(kw => { if (textObj.includes(kw)) aiBonus += 40; });
      
      const numMatch = textObj.match(/\d+/);
      if (numMatch && parseInt(numMatch[0]) > 5) aiBonus += 25;
      
      return u + ageBonus + statusBonus + Math.min(aiBonus, 150);
    }

    // ── POST REQUEST ─────────────────────────────────────────────
    window.submitRequest = async () => {
      if (!STATE.user || !STATE.location) {
        showToast((window.i18n ? window.i18n.t('toast.needLocation') : 'Need location access to post'), 'error'); return;
      }
      const type = document.getElementById('p-type').value;
      const desc = document.getElementById('p-desc').value.trim();
      const qty = document.getElementById('p-qty').value.trim();
      const urgency = STATE.selectedUrgency || 'medium';
      if (!desc) { showToast((window.i18n ? window.i18n.t('toast.needDesc') : 'Please add a description'), 'error'); return; }

      const btn = document.getElementById('submit-btn');
      btn.disabled = true;
      btn.textContent = 'Posting...';

      try {
        const { lat, lng } = STATE.location;
        const savedGeohash = encodeGeohash(lat, lng, 7);
        console.log('📍 Posting request from:', [lat, lng], 'geohash:', savedGeohash);
        await addDoc(collection(db, 'requests'), {
          type, desc, qty, urgency,
          lat, lng,
          geohash: savedGeohash,
          status: 'pending',
          createdBy: STATE.user.uid,
          createdByName: STATE.user.displayName,
          createdByPhoto: STATE.user.photoURL || '',
          claimedBy: null,
          claimedByName: null,
          flagged: false,
          flagCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        document.getElementById('p-desc').value = '';
        document.getElementById('p-qty').value = '';
        showToast((window.i18n ? window.i18n.t('post.successMsg') : 'Request posted — helpers nearby will see it'), 'success');
        switchTab('feed');
      } catch(e) {
        showToast((window.i18n ? window.i18n.t('toast.error', {message: e.message}) : 'Error: ' + e.message), 'error');
      }
      btn.disabled = false;
      btn.textContent = 'Post need to nearby helpers';
    };

    // ── CLAIM ────────────────────────────────────────────────────
    window.claimRequest = async (id) => {
      try {
        await updateDoc(doc(db, 'requests', id), {
          status: 'assigned',
          claimedBy: STATE.user.uid,
          claimedByName: STATE.user.displayName,
          claimedByPhoto: STATE.user.photoURL || '',
          updatedAt: serverTimestamp()
        });
        showToast((window.i18n ? window.i18n.t('toast.claimed') : 'Claimed! Calculating safest route…'), 'success');
        // Switch to map and trigger route calculation
        switchTab('map');
        setTimeout(() => { if (window.updateRouteETA) window.updateRouteETA(); }, 800);
      } catch(e) { showToast(e.message, 'error'); }
    };

    // ── RESOLVE ──────────────────────────────────────────────────
    window.resolveRequest = async (id) => {
      try {
        await updateDoc(doc(db, 'requests', id), {
          status: 'resolved',
          resolvedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        showToast((window.i18n ? window.i18n.t('toast.resolved') : 'Marked resolved — great work!'), 'success');
      } catch(e) { showToast(e.message, 'error'); }
    };

    // ── FLAG ─────────────────────────────────────────────────────
    window.flagRequest = async (id) => {
      const r = STATE.requests.find(x => x.id === id);
      if (!r) return;
      await updateDoc(doc(db, 'requests', id), {
        flagCount: (r.flagCount || 0) + 1,
        flagged: (r.flagCount || 0) + 1 >= 3
      });
      showToast((window.i18n ? window.i18n.t('toast.flagged') : 'Post flagged for review'), 'warn');
    };

    // ── DELETE ───────────────────────────────────────────────────
    window.deleteRequest = async (id) => {
      if (!confirm('Delete this post?')) return;
      await deleteDoc(doc(db, 'requests', id));
      showToast((window.i18n ? window.i18n.t('toast.deleted') : 'Post deleted'), 'success');
    };

    // ── ADMIN: resolve any ────────────────────────────────────────
    window.adminResolve = async (id) => {
      await updateDoc(doc(db, 'requests', id), {
        status: 'resolved', resolvedAt: serverTimestamp(), updatedAt: serverTimestamp()
      });
      showToast((window.i18n ? window.i18n.t('toast.adminResolved') : 'Admin resolved'), 'success');
    };

    window.adminUnflag = async (id) => {
      await updateDoc(doc(db, 'requests', id), { flagged: false, flagCount: 0 });
      showToast((window.i18n ? window.i18n.t('toast.adminUnflagged') : 'Post unflagged'), 'success');
    };

    // ── MAP ──────────────────────────────────────────────────────
    window.initMap = () => {
      if (STATE.map) return;
      const center = STATE.location || { lat: 18.5204, lng: 73.8567 };
      STATE.map = L.map('leaflet-map', { zoomControl: true }).setView([center.lat, center.lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(STATE.map);

      if (STATE.location) {
        L.marker([STATE.location.lat, STATE.location.lng], {
          icon: L.divIcon({
            html: '<div class="you-marker"></div>',
            className: '', iconSize: [20, 20], iconAnchor: [10, 10]
          })
        }).addTo(STATE.map).bindPopup('<b>Your location</b>');

        STATE.radiusCircle = L.circle([STATE.location.lat, STATE.location.lng], {
          radius: 2000,
          color: '#2563eb',
          fillColor: '#2563eb',
          fillOpacity: 0.07,
          weight: 2,
          dashArray: '6,6'
        }).addTo(STATE.map);
      }
      setTimeout(() => { 
        STATE.map.invalidateSize(); 
        renderMapPins();
      }, 100);
    };

    function updateMapCenter() {
      if (!STATE.map || !STATE.location) return;
      STATE.map.setView([STATE.location.lat, STATE.location.lng], 14);
      if (STATE.radiusCircle) {
        STATE.radiusCircle.setLatLng([STATE.location.lat, STATE.location.lng]);
      }
    }

    function renderMapPins() {
      if (!STATE.map) return;
      Object.values(STATE.markers).forEach(m => STATE.map.removeLayer(m));
      STATE.markers = {};
      STATE.requests.forEach(r => {
        const color = r.urgency === 'high' ? '#ef5350' : r.urgency === 'medium' ? '#FF9800' : '#66BB6A';
        const icon = L.divIcon({
          html: `<div class="pin-marker" style="background:${color}">${EMOJI[r.type]}</div>`,
          className: '', iconSize: [36, 36], iconAnchor: [18, 36]
        });
        const m = L.marker([r.lat, r.lng], { icon }).addTo(STATE.map);
        m.bindPopup(`
          <div style="font-family:DM Sans,sans-serif;min-width:180px">
            <div style="font-weight:600;font-size:14px;margin-bottom:4px">${r.desc}</div>
            <div style="color:#888;font-size:12px">${r.qty || ''}</div>
            <div style="margin-top:8px;display:flex;gap:6px">
              <span style="background:${color};color:#fff;padding:2px 8px;border-radius:20px;font-size:11px">${r.urgency}</span>
              <span style="background:#333;color:#fff;padding:2px 8px;border-radius:20px;font-size:11px">${r.status}</span>
            </div>
            <div style="font-size:11px;color:#888;margin-top:6px">${r.distKm?.toFixed(2)} km away · by ${r.createdByName}</div>
          </div>
        `);
        STATE.markers[r.id] = m;
      });
      if (window.renderAIHeatmap) window.renderAIHeatmap();
      if (window.updateRouteETA) window.updateRouteETA();
    }

    // ── RENDER ───────────────────────────────────────────────────
    const EMOJI = { food:'🍱', water:'💧', shelter:'🏠', medical:'🚑', charging:'🔋', other:'📦' };

    function timeAgo(ts) {
      if (!ts) return window.i18n ? window.i18n.t('feed.justNow') : 'just now';
      const ms = Date.now() - (ts?.toMillis?.() || ts);
      const m = Math.floor(ms / 60000);
      if (m < 1) return window.i18n ? window.i18n.t('feed.justNow') : 'just now';
      if (m < 60) return m + (window.i18n ? window.i18n.t('feed.timeSuffixM') : 'm ago');
      if (m < 1440) return Math.floor(m/60) + (window.i18n ? window.i18n.t('feed.timeSuffixH') : 'h ago');
      return Math.floor(m/1440) + (window.i18n ? window.i18n.t('feed.timeSuffixD') : 'd ago');
    }

    function getUrgencyDisplay(urgency) {
      if (!window.i18n) return urgency;
      const map = {
        'high': window.i18n.t('post.urgencyHigh'),
        'medium': window.i18n.t('post.urgencyMedium'),
        'low': window.i18n.t('post.urgencyLow')
      };
      return map[urgency] || urgency;
    }

    function getStatusDisplay(status) {
      if (!window.i18n) return status;
      const map = {
        'pending': window.i18n.t('status.pending'),
        'assigned': window.i18n.t('status.assigned'),
        'resolved': window.i18n.t('status.resolved'),
        'flagged': window.i18n.t('status.flagged')
      };
      return map[status] || status;
    }

    function cardHTML(r, context = 'feed') {
      const isMine = r.createdBy === STATE.user?.uid;
      const role = STATE.userProfile?.role;
      const canClaim = role === 'helper' && r.status === 'pending' && !isMine;
      const canResolve = role === 'helper' && r.status === 'assigned' && r.claimedBy === STATE.user?.uid;
      const urgColor = r.urgency === 'high' ? '#ef5350' : r.urgency === 'medium' ? '#FF9800' : '#66BB6A';
      const statusColor = r.status === 'assigned' ? '#42A5F5' : r.status === 'resolved' ? '#66BB6A' : '#888';

      return `<div class="card ${r.flagged ? 'card-flagged' : ''}" id="card-${r.id}">
        ${r.flagged ? '<div class="flag-banner">⚠ ' + (window.i18n ? window.i18n.t('status.flagged') : 'Flagged for review') + '</div>' : ''}
        <div class="card-header">
          <div class="type-badge" data-type="${r.type}">${EMOJI[r.type]} ${r.type}</div>
          <div class="badges-right">
            ${urgencyScore(r) > 200 ? '<span class="ai-badge">✨ AI Priority</span>' : ''}
            <span class="badge" style="background:${urgColor}20;color:${urgColor};border:1px solid ${urgColor}40">${getUrgencyDisplay(r.urgency)}</span>
            <span class="badge" style="background:${statusColor}20;color:${statusColor};border:1px solid ${statusColor}40">${getStatusDisplay(r.status)}</span>
          </div>
        </div>
        <div class="card-desc">
          <span class="orig-text">${r.desc}</span>
          <span class="trans-text" style="display:none; color:var(--teal)">🔄 Translated: [AI] ${r.desc}</span>
        </div>
        ${r.qty ? `<div class="card-qty">${r.qty}</div>` : ''}
        <div class="card-meta">
          <span class="meta-chip">${r.distKm !== undefined ? r.distKm.toFixed(2) + ' ' + (window.i18n ? window.i18n.t('map.kmAway').split(' ')[0] : 'km') : '–'}</span>
          <span class="meta-chip">${timeAgo(r.createdAt)}</span>
          <span class="meta-chip">${window.i18n ? window.i18n.t('feed.by') : 'by'} ${r.createdByName || 'Anonymous'}</span>
          ${r.status === 'assigned' && r.claimedByName ? `<span class="meta-chip meta-assigned">→ ${r.claimedByName}</span>` : ''}
        </div>
        <div class="card-actions">
          ${canClaim ? `<button class="btn btn-primary" onclick="claimRequest('${r.id}')">${window.i18n ? window.i18n.t('actions.claim') : 'Claim request'}</button>` : ''}
          ${canResolve ? `<button class="btn btn-success" onclick="resolveRequest('${r.id}')">${window.i18n ? window.i18n.t('actions.resolve') : 'Mark resolved'}</button>` : ''}
          <button class="btn btn-ghost" onclick="toggleTranslation(this)">${window.i18n ? window.i18n.t('actions.translate') : 'Translate'}</button>
          ${isMine && r.status === 'pending' ? `<button class="btn btn-danger" onclick="deleteRequest('${r.id}')">${window.i18n ? window.i18n.t('actions.delete') : 'Delete'}</button>` : ''}
          ${!isMine && r.status !== 'resolved' ? `<button class="btn btn-ghost" onclick="flagRequest('${r.id}')">${window.i18n ? window.i18n.t('actions.flag') : 'Flag'}</button>` : ''}
          ${context === 'admin' ? `<button class="btn btn-ghost" onclick="adminResolve('${r.id}')">Force resolve</button><button class="btn btn-ghost" onclick="adminUnflag('${r.id}')">Unflag</button>` : ''}
        </div>
          ${!isMine && r.status !== 'resolved' ? `<button class="btn btn-ghost" onclick="flagRequest('${r.id}')">${window.i18n ? window.i18n.t('actions.flag') : 'Flag'}</button>` : ''}
          ${context === 'admin' ? `<button class="btn btn-ghost" onclick="adminResolve('${r.id}')">Force resolve</button><button class="btn btn-ghost" onclick="adminUnflag('${r.id}')">Unflag</button>` : ''}
        </div>
      </div>`;
    }

    window.renderFeed = () => {
      const el = document.getElementById('feed-list');
      if (!el) return;
      let list = [...STATE.requests];
      if (STATE.filter !== 'all') list = list.filter(r => r.type === STATE.filter);
      if (!list.length) {
        const emptyText = window.i18n ? window.i18n.t('feed.empty') : 'No active requests within 2 km';
        const emptySubText = window.i18n ? window.i18n.t('feed.areaEmpty') : 'Your area is clear — check back during emergencies';
        el.innerHTML = `<div class="empty-state"><div class="empty-icon">📡</div><div>${emptyText}</div><div class="empty-sub">${emptySubText}</div></div>`;
        return;
      }
      el.innerHTML = list.map(r => cardHTML(r)).join('');
      document.getElementById('feed-count').textContent = list.length;
      setTimeout(() => { if (window.injectSeekerETA) window.injectSeekerETA(); }, 50);
    };

    window.renderMyPosts = () => {
      const el = document.getElementById('mine-list');
      if (!el) return;
      const list = STATE.myRequests;
      if (!list.length) {
        const emptyText = window.i18n ? window.i18n.t('myPosts.empty') : 'No posts yet';
        const emptySubText = 'Go to "Post Need" to submit a request for help';
        el.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div>${emptyText}</div><div class="empty-sub">${emptySubText}</div></div>`;
        return;
      }
      el.innerHTML = list.map(r => {
        const d = { ...r, distKm: STATE.location ? haversineDistance(STATE.location.lat, STATE.location.lng, r.lat, r.lng) : undefined };
        return cardHTML(d, 'mine');
      }).join('');
      // Inject live ETA tracker for seekers
      setTimeout(() => { if (window.injectSeekerETA) window.injectSeekerETA(); }, 50);
    };

    window.renderAdminPanel = () => {
      const el = document.getElementById('admin-list');
      if (!el) return;
      const all = [...STATE.requests, ...STATE.myRequests.filter(r => r.status === 'resolved')];
      const unique = [...new Map(all.map(r => [r.id, r])).values()];
      el.innerHTML = unique.map(r => {
        const d = { ...r, distKm: STATE.location ? haversineDistance(STATE.location.lat, STATE.location.lng, r.lat, r.lng) : undefined };
        return cardHTML(d, 'admin');
      }).join('') || `<div class="empty-state"><div>${window.i18n ? window.i18n.t('profile.adminEmpty') : 'No posts to manage'}</div></div>`;
    };

    function updateStats() {
      const pending = STATE.requests.filter(r => r.status === 'pending').length;
      const assigned = STATE.requests.filter(r => r.status === 'assigned').length;
      document.getElementById('stat-pending').textContent = pending;
      document.getElementById('stat-assigned').textContent = assigned;
      document.getElementById('stat-total').textContent = STATE.requests.length;
    }

    function renderUserHeader() {
      const u = STATE.user;
      if (!u) return;
      const el = document.getElementById('user-info');
      el.innerHTML = `
        <img src="${u.photoURL || ''}" onerror="this.style.display='none'" class="avatar-img">
        <div class="user-details">
          <div class="user-name">${u.displayName}</div>
          <div class="user-role">${STATE.userProfile?.role || 'helper'}</div>
        </div>
      `;
    }

    window.renderAll = () => {
      renderFeed();
      renderMyPosts();
      updateStats();
      renderUserHeader();
    };

    // ── TAB SWITCHING ────────────────────────────────────────────
    STATE.tabHistory = STATE.tabHistory || [];
    window.switchTab = (tab) => {
      if (STATE.currentTab && STATE.currentTab !== tab) {
        STATE.tabHistory.push(STATE.currentTab);
      }
      STATE.currentTab = tab;
      document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      const tabEl = document.getElementById('tab-' + tab);
      if(tabEl) tabEl.style.display = tab === 'map' ? 'flex' : 'block';
      const navBtn = document.querySelector('[data-tab="' + tab + '"]');
      if (navBtn) navBtn.classList.add('active');
      
      const backBtn = document.getElementById('back-btn');
      if (backBtn) backBtn.style.display = tab === 'feed' ? 'none' : 'inline-block';

      if (tab === 'map') {
        setTimeout(() => { 
          initMap(); 
          if(STATE.map) STATE.map.invalidateSize();
          renderMapPins();
        }, 150);
      }
      if (tab === 'admin') renderAdminPanel();
    };

    window.goBack = () => {
      if (STATE.tabHistory.length > 0) {
        const prevTab = STATE.tabHistory.pop();
        STATE.currentTab = prevTab;
        document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const tabEl = document.getElementById('tab-' + prevTab);
        if(tabEl) tabEl.style.display = prevTab === 'map' ? 'flex' : 'block';
        const navBtn = document.querySelector('[data-tab="' + prevTab + '"]');
        if (navBtn) navBtn.classList.add('active');
        
        const backBtn = document.getElementById('back-btn');
        if (backBtn) backBtn.style.display = tab === 'feed' ? 'none' : 'inline-block';
        
        if (prevTab === 'map') {
          setTimeout(() => { 
            initMap(); 
            if(STATE.map) STATE.map.invalidateSize();
            renderMapPins(); 
          }, 150);
        }
      }
    };

    window.setFilter = (f, el) => {
      STATE.filter = f;
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
      renderFeed();
    };

    window.setUrgency = (u) => {
      STATE.selectedUrgency = u;
      document.querySelectorAll('.urg-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.urgency === u);
      });
    };

    // ── TOAST ────────────────────────────────────────────────────
    window.showToast = (msg, type = 'info') => {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.className = 'toast show toast-' + type;
      clearTimeout(window._toastTimer);
      window._toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
    };

    // ── OFFLINE PWA ──────────────────────────────────────────────
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').then(() => {
        console.log('SW registered');
      }).catch(e => console.warn('SW error:', e));
    }

    // ── i18n INTEGRATION ──────────────────────────────────────────
    /**
     * Change application language and re-render UI
     * @param {string} lang - Language code ('en', 'hi', 'mr')
     */
    window.changeLanguage = (lang) => {
      if (window.i18n) {
        window.i18n.setLanguage(lang);
        // Update language selector value
        const selector = document.getElementById('lang-selector');
        if (selector) selector.value = lang;
        // Re-render ALL UI with new language
        console.log('🔄 Changing language to:', lang);
        window.reRenderUI();
      }
    };

    /**
     * Re-render all UI text with current language
     * Called when language changes or app initializes
     */
    window.reRenderUI = function() {
      if (!window.i18n) return;

      // Update language selector to current language
      const selector = document.getElementById('lang-selector');
      if (selector) selector.value = window.i18n.currentLanguage;

      // Update static HTML text using i18n
      const i = window.i18n;

      // Auth screen
      const authLogo = document.querySelector('.auth-logo-text h1');
      if (authLogo) authLogo.textContent = i.t('misc.appName');
      const authTagline = document.querySelector('.auth-logo-text p');
      if (authTagline) authTagline.textContent = i.t('misc.relief');
      const authHeading = document.querySelector('#screen-auth .auth-card h2');
      if (authHeading) authHeading.textContent = i.t('auth.heading');
      const authSubheading = document.querySelector('#screen-auth .auth-card > p');
      if (authSubheading) authSubheading.textContent = i.t('auth.subheading');
      const googleBtn = document.querySelector('.btn-google');
      if (googleBtn) googleBtn.textContent = i.t('auth.loginBtn');

      // Back button
      const backBtn = document.getElementById('back-btn');
      if (backBtn) backBtn.textContent = i.t('actions.back');

      // Filter chips - update text
      document.querySelectorAll('.filter-chip').forEach(chip => {
        const onclick = chip.getAttribute('onclick');
        if (onclick.includes("'all'")) chip.textContent = i.t('filter.all');
        else if (onclick.includes("'food'")) chip.textContent = i.t('filter.food');
        else if (onclick.includes("'water'")) chip.textContent = i.t('filter.water');
        else if (onclick.includes("'medical'")) chip.textContent = i.t('filter.medical');
        else if (onclick.includes("'shelter'")) chip.textContent = i.t('filter.shelter');
        else if (onclick.includes("'charging'")) chip.textContent = i.t('filter.charging');
        else if (onclick.includes("'other'")) chip.textContent = i.t('filter.other');
      });

      // Feed title - update "Active nearby" text (but preserve count)
      const feedLabelContainer = document.querySelector('div[style*="display:flex;align-items:center;justify-content:space-between;padding:8px 1rem 4px"]');
      if (feedLabelContainer) {
        const feedSection = feedLabelContainer.querySelector('.section-label');
        const count = document.getElementById('feed-count')?.textContent || '0';
        if (feedSection) {
          feedSection.innerHTML = `${i.t('feed.title')} · <span id="feed-count">${count}</span> ${i.t('feed.count').replace('{count}', '')}`;
        }
      }

      // Post form - title
      const postTitle = document.querySelector('#tab-post .form-title');
      if (postTitle) postTitle.textContent = i.t('post.title');

      // Post form - labels and input placeholders
      const descLabel = Array.from(document.querySelectorAll('.form-label')).find(l => l.textContent.includes('Description'));
      if (descLabel) descLabel.textContent = i.t('post.descLabel');
      const descInput = document.getElementById('p-desc');
      if (descInput) descInput.placeholder = i.t('post.descPlaceholder');

      const qtyLabel = Array.from(document.querySelectorAll('.form-label')).find(l => l.textContent.includes('Quantity'));
      if (qtyLabel) qtyLabel.textContent = i.t('post.qtyLabel');
      const qtyInput = document.getElementById('p-qty');
      if (qtyInput) qtyInput.placeholder = i.t('post.qtyPlaceholder');

      const typeLabel = Array.from(document.querySelectorAll('.form-label')).find(l => l.textContent.includes('Type'));
      if (typeLabel) typeLabel.textContent = i.t('post.typeLabel');

      const urgLabel = Array.from(document.querySelectorAll('.form-label')).find(l => l.textContent.includes('Urgency'));
      if (urgLabel) urgLabel.textContent = i.t('post.urgencyLabel');

      // Urgency buttons
      document.querySelectorAll('.urg-btn').forEach(btn => {
        if (btn.dataset.urgency === 'low') btn.textContent = i.t('post.urgencyLow');
        else if (btn.dataset.urgency === 'medium') btn.textContent = i.t('post.urgencyMedium');
        else if (btn.dataset.urgency === 'high') btn.textContent = i.t('post.urgencyHigh');
      });

      // Post info note
      const infoNote = document.querySelector('.info-note');
      if (infoNote) infoNote.textContent = i.t('post.info');

      // Submit button
      const submitBtn = document.getElementById('submit-btn');
      if (submitBtn && submitBtn.textContent === 'Post need to nearby helpers' || submitBtn.textContent.includes('Posting')) {
        submitBtn.textContent = i.t('post.submitBtn');
      }

      // My posts title
      const mineTitle = document.querySelector('#tab-mine .section-label');
      if (mineTitle) mineTitle.textContent = i.t('myPosts.title');

      // Profile section - role label
      const roleLabel = Array.from(document.querySelectorAll('.form-label')).find(l => l.textContent.includes('Your role'));
      if (roleLabel) roleLabel.textContent = i.t('profile.roleLabel');

      // Role buttons
      document.querySelectorAll('.role-btn').forEach(btn => {
        if (btn.dataset.role === 'helper') {
          btn.innerHTML = `${i.t('profile.roleHelper')}<br><small style=\"font-size:11px;opacity:0.6\">${i.t('profile.helperDesc')}</small>`;
        } else if (btn.dataset.role === 'seeker') {
          btn.innerHTML = `${i.t('profile.roleSeeker')}<br><small style=\"font-size:11px;opacity:0.6\">${i.t('profile.seekerDesc')}</small>`;
        }
      });

      // Language label & selector title
      const langLabel = document.getElementById('lang-label');
      if (langLabel) langLabel.textContent = i.t('profile.languageLabel');

      // Admin label
      const adminLabel = Array.from(document.querySelectorAll('.section-label')).find(l => l.textContent.includes('Admin'));
      if (adminLabel) adminLabel.textContent = i.t('profile.adminLabel');

      // Admin refresh button
      const adminRefreshBtn = document.querySelector('[onclick="renderAdminPanel()"]');
      if (adminRefreshBtn) adminRefreshBtn.textContent = i.t('profile.adminRefresh');

      // Sign out button
      const signOutBtn = document.querySelector('[onclick="window.logout()"]');
      if (signOutBtn) signOutBtn.textContent = i.t('profile.signOut');

      // SOS button
      const sosBtn = document.querySelector('[onclick="document.getElementById(\'sos-modal\').style.display=\'flex\'"]');
      if (sosBtn) sosBtn.textContent = i.t('actions.sos');

      // Tabs
      document.querySelectorAll('.nav-btn').forEach(btn => {
        const tab = btn.dataset.tab;
        const text = {
          feed: i.t('nav.feed'),
          map: i.t('nav.map'),
          post: i.t('nav.post'),
          mine: i.t('nav.myPosts'),
          profile: i.t('nav.profile')
        };
        if (text[tab]) {
          const icon = btn.querySelector('.nav-icon');
          if (icon) btn.innerHTML = icon.outerHTML + ' ' + text[tab];
        }
      });

      // Emergency modal title
      const eModal = document.querySelector('#sos-modal h3');
      if (eModal) eModal.textContent = i.t('emergency.title');

      // Re-render all dynamic content with new language
      if (window.renderAll) window.renderAll();
      
      console.log('✅ UI re-rendered in language:', i.currentLanguage);
    };

    // Set language selector value on profile load
    window.addEventListener('profileLoad', () => {
      const selector = document.getElementById('lang-selector');
      if (selector && window.i18n) {
        selector.value = window.i18n.currentLanguage;
      }
    });

    // Initialize language on page load
    document.addEventListener('DOMContentLoaded', () => {
      if (window.i18n) {
        const selector = document.getElementById('lang-selector');
        if (selector) selector.value = window.i18n.currentLanguage;
      }
    });