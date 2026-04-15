const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

export function encodeGeohash(lat, lng, precision = 9) {
  let idx = 0, bit = 0, evenBit = true, geohash = '';
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

export function getNearbyGeohashPrefixes(lat, lng, radiusKm) {
  let precision = 5;
  if (radiusKm >= 20) precision = 3;
  else if (radiusKm >= 4) precision = 4;
  else if (radiusKm >= 1) precision = 5;
  else precision = 6;

  const latOffset = radiusKm / 110.574;
  const lngOffset = radiusKm / (111.320 * Math.cos(lat * Math.PI / 180));
  const points = [
    [lat, lng],
    [lat + latOffset, lng], [lat - latOffset, lng],
    [lat, lng + lngOffset], [lat, lng - lngOffset],
    [lat + latOffset, lng + lngOffset], [lat + latOffset, lng - lngOffset],
    [lat - latOffset, lng + lngOffset], [lat - latOffset, lng - lngOffset],
  ];
  return [...new Set(points.map(([pLat, pLng]) => encodeGeohash(pLat, pLng, precision)))];
}

export function geohashPrefixEnd(prefix) {
  return prefix + '\uf8ff';
}

export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
