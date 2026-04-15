// ai-features.js

window.STATE = window.STATE || {};
let heatLayer = null;
let safeRouteLayer = null;
let fastRouteLayer = null;
let etaCountdownInterval = null;

// ── TRANSLATION ──────────────────────────────────────────────────────────────
window.toggleTranslation = function(btn) {
    const card = btn.closest('.card');
    const orig = card.querySelector('.orig-text');
    const trans = card.querySelector('.trans-text');
    if (orig.style.display === 'none') {
        orig.style.display = 'block';
        trans.style.display = 'none';
        btn.textContent = 'Translate';
    } else {
        orig.style.display = 'none';
        trans.style.display = 'block';
        btn.textContent = 'Show Original';
    }
};

// ── AI HEATMAP ───────────────────────────────────────────────────────────────
window.renderAIHeatmap = function() {
    if (!window.STATE.map) return;
    if (heatLayer) window.STATE.map.removeLayer(heatLayer);
    if (!window.STATE.showHeatmap) return;
    if (!window.L || !L.heatLayer) return;
    const heatData = window.STATE.requests.map(r => {
        let intensity = r.urgency === 'high' ? 1.0 : r.urgency === 'medium' ? 0.6 : 0.3;
        if (r.flagged) intensity += 0.5;
        return [r.lat, r.lng, intensity];
    });
    if (heatData.length > 0) {
        heatLayer = L.heatLayer(heatData, {
            radius: 40, blur: 25, maxZoom: 15,
            gradient: {0.3: 'yellow', 0.6: 'orange', 1: 'red'}
        }).addTo(window.STATE.map);
    }
};

// ── AI SAFE ROUTE SCORING ────────────────────────────────────────────────────
// Returns a risk score for a given lat/lng based on nearby high-urgency requests
function getRiskScore(lat, lng) {
    let risk = 0;
    const requests = window.STATE.requests || [];
    requests.forEach(r => {
        const d = haversineKm(lat, lng, r.lat, r.lng);
        if (d < 0.3) { // within 300m
            if (r.urgency === 'high') risk += 10;
            else if (r.urgency === 'medium') risk += 4;
            else risk += 1;
            if (r.flagged) risk += 5;
        } else if (d < 0.6) {
            if (r.urgency === 'high') risk += 4;
            else if (r.urgency === 'medium') risk += 1;
        }
    });
    return risk;
}

function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Fetch a real road route from OSRM (free, no API key)
async function fetchOSRMRoute(fromLat, fromLng, toLat, toLng) {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&alternatives=true`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.code !== 'Ok' || !data.routes.length) return null;
        return data.routes; // array of routes, [0]=fastest
    } catch(e) {
        console.warn('OSRM fetch failed:', e);
        return null;
    }
}

// ── MAIN ROUTE + ETA ENGINE ──────────────────────────────────────────────────
window.updateRouteETA = async function() {
    if (!window.STATE.map || !window.STATE.location) return;

    const role = window.STATE.userProfile?.role;
    const uid = window.STATE.user?.uid;

    // Clear old route layers
    if (safeRouteLayer) { window.STATE.map.removeLayer(safeRouteLayer); safeRouteLayer = null; }
    if (fastRouteLayer) { window.STATE.map.removeLayer(fastRouteLayer); fastRouteLayer = null; }

    // ── HELPER VIEW: draw routes on map ─────────────────────────
    if (role === 'helper') {
        const myTask = window.STATE.requests.find(r => r.status === 'assigned' && r.claimedBy === uid);
        const panel = document.getElementById('route-panel');
        if (!myTask) { if (panel) panel.style.display = 'none'; return; }

        const { lat: oLat, lng: oLng } = window.STATE.location;
        const { lat: dLat, lng: dLng } = myTask;
        const distKm = haversineKm(oLat, oLng, dLat, dLng);

        // Fetch real routes from OSRM
        const routes = await fetchOSRMRoute(oLat, oLng, dLat, dLng);

        let fastEtaMin, safeEtaMin, safeDistKm;

        if (routes && routes.length >= 1) {
            const fastRoute = routes[0];
            fastEtaMin = Math.round(fastRoute.duration / 60);
            const fastCoords = fastRoute.geometry.coordinates.map(c => [c[1], c[0]]);

            // Score each route by risk
            const scoredRoutes = routes.map(rt => {
                const coords = rt.geometry.coordinates;
                // Sample every 5th point for performance
                const sample = coords.filter((_, i) => i % 5 === 0);
                const totalRisk = sample.reduce((sum, c) => sum + getRiskScore(c[1], c[0]), 0);
                return { rt, totalRisk, coords };
            });

            // Safest = lowest risk score
            scoredRoutes.sort((a, b) => a.totalRisk - b.totalRisk);
            const safeRoute = scoredRoutes[0].rt;
            safeEtaMin = Math.round(safeRoute.duration / 60) + Math.round(scoredRoutes[0].totalRisk * 0.5); // add risk penalty
            safeDistKm = (safeRoute.distance / 1000).toFixed(2);
            const safeCoords = safeRoute.geometry.coordinates.map(c => [c[1], c[0]]);

            // Draw fastest route (orange dashed)
            fastRouteLayer = L.polyline(fastCoords, {
                color: '#FF9800', weight: 5, opacity: 0.85, dashArray: '8,5'
            }).addTo(window.STATE.map);
            fastRouteLayer.bindTooltip('⚡ Fastest Route', { permanent: false, sticky: true });

            // Draw safest route (green solid)
            safeRouteLayer = L.polyline(safeCoords, {
                color: '#00C853', weight: 6, opacity: 0.95
            }).addTo(window.STATE.map);
            safeRouteLayer.bindTooltip('🛡 Safest Route', { permanent: false, sticky: true });

            // Fit map to safe route
            window.STATE.map.fitBounds(safeRouteLayer.getBounds(), { padding: [40, 40] });
        } else {
            // Fallback straight-line estimates
            fastEtaMin = Math.round(distKm * 3);
            safeEtaMin = Math.round(distKm * 4);
            safeDistKm = distKm.toFixed(2);
        }

        // Update route panel for helper
        if (panel) {
            panel.style.display = 'block';
            panel.innerHTML = `
                <div class="route-panel-header">
                    <span class="route-panel-title">🗺 Navigation</span>
                    <span class="route-dest">${myTask.type} · ${myTask.createdByName}</span>
                </div>
                <div class="route-options">
                    <div class="route-option route-safe active">
                        <div class="route-option-label">🛡 Safest Route</div>
                        <div class="route-option-stats">
                            <span>${safeDistKm} km</span>
                            <span class="route-eta-big">${safeEtaMin} min</span>
                        </div>
                        <div class="route-option-sub">Avoids high-risk zones</div>
                    </div>
                    <div class="route-option route-fast">
                        <div class="route-option-label">⚡ Fastest Route</div>
                        <div class="route-option-stats">
                            <span>${distKm.toFixed(2)} km</span>
                            <span class="route-eta-big">${fastEtaMin} min</span>
                        </div>
                        <div class="route-option-sub">Shortest path</div>
                    </div>
                </div>
            `;
        }

        // Write ETA back to Firestore so seeker can see it
        try {
            const { updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
            // We use the global db exposed from app.js
            if (window._db) {
                await updateDoc(doc(window._db, 'requests', myTask.id), {
                    helperEtaMin: safeEtaMin,
                    helperDistKm: parseFloat(safeDistKm),
                    helperName: window.STATE.user.displayName,
                    helperPhoto: window.STATE.user.photoURL || '',
                    helperUpdatedAt: Date.now()
                });
            }
        } catch(e) { /* non-critical */ }
    }
};

// ── SEEKER ETA TRACKER (Ola/Zomato style) ───────────────────────────────────
// Called from renderFeed / renderMyPosts to inject live tracker into assigned cards
window.injectSeekerETA = function() {
    if (!window.STATE.user) return;
    const uid = window.STATE.user.uid;

    // Find my assigned requests where I'm the seeker
    const myAssigned = window.STATE.myRequests.filter(r =>
        r.status === 'assigned' && r.createdBy === uid && r.helperEtaMin
    );

    myAssigned.forEach(r => {
        const card = document.getElementById('card-' + r.id);
        if (!card) return;

        // Remove old tracker if exists
        const old = card.querySelector('.eta-tracker');
        if (old) old.remove();

        const etaMin = r.helperEtaMin || 0;
        const distKm = r.helperDistKm || 0;
        const helperName = r.helperName || r.claimedByName || 'Helper';
        const helperPhoto = r.helperPhoto || '';
        const updatedAt = r.helperUpdatedAt || Date.now();
        const elapsedMin = Math.floor((Date.now() - updatedAt) / 60000);
        const remaining = Math.max(0, etaMin - elapsedMin);

        const tracker = document.createElement('div');
        tracker.className = 'eta-tracker';
        tracker.innerHTML = `
            <div class="eta-tracker-header">
                <img src="${helperPhoto}" onerror="this.style.display='none'" class="eta-helper-avatar">
                <div class="eta-helper-info">
                    <div class="eta-helper-name">${helperName} is on the way</div>
                    <div class="eta-helper-dist">${distKm.toFixed(1)} km away</div>
                </div>
                <div class="eta-countdown" id="eta-countdown-${r.id}">
                    <div class="eta-min">${remaining}</div>
                    <div class="eta-label">min</div>
                </div>
            </div>
            <div class="eta-progress-bar">
                <div class="eta-progress-fill" id="eta-fill-${r.id}" style="width:${Math.min(100, (elapsedMin/etaMin)*100)}%"></div>
            </div>
            <div class="eta-status-row">
                <span class="eta-dot-pulse"></span>
                <span class="eta-status-text">Helper is navigating to you via safest route</span>
            </div>
        `;
        card.insertBefore(tracker, card.querySelector('.card-actions'));

        // Live countdown tick
        clearInterval(window['_etaTick_' + r.id]);
        window['_etaTick_' + r.id] = setInterval(() => {
            const el = document.getElementById('eta-countdown-' + r.id);
            const fill = document.getElementById('eta-fill-' + r.id);
            if (!el) { clearInterval(window['_etaTick_' + r.id]); return; }
            const elapsed = Math.floor((Date.now() - updatedAt) / 60000);
            const rem = Math.max(0, etaMin - elapsed);
            el.querySelector('.eta-min').textContent = rem;
            if (fill) fill.style.width = Math.min(100, (elapsed / etaMin) * 100) + '%';
            if (rem === 0) {
                el.querySelector('.eta-label').textContent = 'arriving';
                clearInterval(window['_etaTick_' + r.id]);
            }
        }, 30000); // update every 30s
    });
};
