import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { haversineDistance } from '../geohash'
import { updateDoc, doc } from 'firebase/firestore'

const EMOJI = { food: '🍱', water: '💧', shelter: '🏠', medical: '🚑', charging: '🔋', other: '📦' }

function getRiskScore(lat, lng, requests) {
  let risk = 0
  requests.forEach(r => {
    const d = haversineDistance(lat, lng, r.lat, r.lng)
    if (d < 0.3) { risk += r.urgency === 'high' ? 10 : r.urgency === 'medium' ? 4 : 1; if (r.flagged) risk += 5 }
    else if (d < 0.6) { risk += r.urgency === 'high' ? 4 : r.urgency === 'medium' ? 1 : 0 }
  })
  return risk
}

async function fetchOSRMRoute(oLat, oLng, dLat, dLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson&alternatives=true`
    const res = await fetch(url)
    const data = await res.json()
    if (data.code !== 'Ok' || !data.routes.length) return null
    return data.routes
  } catch { return null }
}

export default function MapTab({ location, requests, user, userProfile, tr, db }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({})
  const routeLayersRef = useRef([])
  const [routePanel, setRoutePanel] = useState(null)

  // Init map
  useEffect(() => {
    if (mapInstanceRef.current) return
    const center = location || { lat: 18.5204, lng: 73.8567 }
    const map = L.map(mapRef.current, { zoomControl: true }).setView([center.lat, center.lng], 14)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 19
    }).addTo(map)
    mapInstanceRef.current = map
    setTimeout(() => map.invalidateSize(), 100)
  }, [])

  // Update center when location changes
  useEffect(() => {
    if (!mapInstanceRef.current || !location) return
    mapInstanceRef.current.setView([location.lat, location.lng], 14)
  }, [location?.lat, location?.lng])

  // Render pins
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clear old markers
    Object.values(markersRef.current).forEach(m => map.removeLayer(m))
    markersRef.current = {}

    // User location marker
    if (location) {
      const youIcon = L.divIcon({ html: '<div class="you-marker"></div>', className: '', iconSize: [20, 20], iconAnchor: [10, 10] })
      L.marker([location.lat, location.lng], { icon: youIcon }).addTo(map).bindPopup('<b>📍 Your location</b>')
      // 2km radius circle - clearly visible
      const radiusCircle = L.circle([location.lat, location.lng], { 
        radius: 2000, 
        color: '#2563eb', 
        fillColor: '#2563eb', 
        fillOpacity: 0.1, 
        weight: 3,
        dashArray: '8,5'
      })
      radiusCircle.addTo(map)
      radiusCircle.bindPopup('<b>📏 2 km Radius</b><br>Help requests within this area')
    }

    requests.forEach(r => {
      const color = r.urgency === 'high' ? '#ef5350' : r.urgency === 'medium' ? '#FF9800' : '#66BB6A'
      const icon = L.divIcon({
        html: `<div class="pin-marker" style="background:${color}">${EMOJI[r.type]}</div>`,
        className: '', iconSize: [36, 36], iconAnchor: [18, 36]
      })
      const m = L.marker([r.lat, r.lng], { icon }).addTo(map)
      m.bindPopup(`<div style="font-family:DM Sans,sans-serif;min-width:180px">
        <div style="font-weight:600;font-size:14px;margin-bottom:4px">${r.desc}</div>
        <div style="color:#888;font-size:12px">${r.qty || ''}</div>
        <div style="margin-top:8px;display:flex;gap:6px">
          <span style="background:${color};color:#fff;padding:2px 8px;border-radius:20px;font-size:11px">${r.urgency}</span>
          <span style="background:#333;color:#fff;padding:2px 8px;border-radius:20px;font-size:11px">${r.status}</span>
        </div>
        <div style="font-size:11px;color:#888;margin-top:6px">${r.distKm?.toFixed(2)} km · ${r.createdByName}</div>
      </div>`)
      markersRef.current[r.id] = m
    })

    setTimeout(() => map.invalidateSize(), 100)
  }, [requests, location])

  // Route calculation for helpers
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !location || userProfile?.role !== 'helper') return

    const myTask = requests.find(r => r.status === 'assigned' && r.claimedBy === user?.uid)
    routeLayersRef.current.forEach(l => map.removeLayer(l))
    routeLayersRef.current = []

    if (!myTask) { setRoutePanel(null); return }

    const { lat: oLat, lng: oLng } = location
    const { lat: dLat, lng: dLng } = myTask
    const distKm = haversineDistance(oLat, oLng, dLat, dLng)

    fetchOSRMRoute(oLat, oLng, dLat, dLng).then(async routes => {
      let fastEtaMin, safeEtaMin, safeDistKm

      if (routes?.length) {
        const fastRoute = routes[0]
        fastEtaMin = Math.round(fastRoute.duration / 60)
        const fastCoords = fastRoute.geometry.coordinates.map(c => [c[1], c[0]])

        const scored = routes.map(rt => {
          const sample = rt.geometry.coordinates.filter((_, i) => i % 5 === 0)
          const totalRisk = sample.reduce((sum, c) => sum + getRiskScore(c[1], c[0], requests), 0)
          return { rt, totalRisk }
        }).sort((a, b) => a.totalRisk - b.totalRisk)

        const safeRoute = scored[0].rt
        safeEtaMin = Math.round(safeRoute.duration / 60) + Math.round(scored[0].totalRisk * 0.5)
        safeDistKm = (safeRoute.distance / 1000).toFixed(2)
        const safeCoords = safeRoute.geometry.coordinates.map(c => [c[1], c[0]])

        const fastLayer = L.polyline(fastCoords, { color: '#FF9800', weight: 5, opacity: 0.85, dashArray: '8,5' }).addTo(map)
        fastLayer.bindTooltip('⚡ Fastest Route', { permanent: false, sticky: true })
        const safeLayer = L.polyline(safeCoords, { color: '#00C853', weight: 6, opacity: 0.95 }).addTo(map)
        safeLayer.bindTooltip('🛡 Safest Route', { permanent: false, sticky: true })
        routeLayersRef.current = [fastLayer, safeLayer]
        map.fitBounds(safeLayer.getBounds(), { padding: [40, 40] })

        // Write ETA to Firestore
        try {
          await updateDoc(doc(db, 'requests', myTask.id), {
            helperEtaMin: safeEtaMin, helperDistKm: parseFloat(safeDistKm),
            helperName: user.displayName, helperPhoto: user.photoURL || '',
            helperUpdatedAt: Date.now()
          })
        } catch { /* non-critical */ }

        setRoutePanel({ safeDistKm, safeEtaMin, fastEtaMin, fastDistKm: distKm.toFixed(2), task: myTask })
      } else {
        fastEtaMin = Math.round(distKm * 3)
        safeEtaMin = Math.round(distKm * 4)
        safeDistKm = distKm.toFixed(2)
        setRoutePanel({ safeDistKm, safeEtaMin, fastEtaMin, fastDistKm: distKm.toFixed(2), task: myTask })
      }
    })
  }, [requests, location, userProfile?.role, user?.uid])

  return (
    <div id="tab-map">
      {routePanel && (
        <div className="route-info-panel">
          <div className="route-panel-header">
            <span className="route-panel-title">🗺 {tr('map.navigationTitle')}</span>
            <span className="route-dest">{routePanel.task.type} · {routePanel.task.createdByName}</span>
          </div>
          <div className="route-options">
            <div className="route-option route-safe active">
              <div className="route-option-label">{tr('map.safeRoute')}</div>
              <div className="route-option-stats">
                <span>{routePanel.safeDistKm} km</span>
                <span className="route-eta-big">{routePanel.safeEtaMin} min</span>
              </div>
              <div className="route-option-sub">{tr('map.safeDesc')}</div>
            </div>
            <div className="route-option route-fast">
              <div className="route-option-label">{tr('map.fastRoute')}</div>
              <div className="route-option-stats">
                <span>{routePanel.fastDistKm} km</span>
                <span className="route-eta-big">{routePanel.fastEtaMin} min</span>
              </div>
              <div className="route-option-sub">{tr('map.fastDesc')}</div>
            </div>
          </div>
        </div>
      )}
      <div className="map-container">
        <div ref={mapRef} id="leaflet-map" />
      </div>
    </div>
  )
}
