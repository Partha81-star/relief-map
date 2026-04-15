"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AlertCircle, MapPin, Zap } from "lucide-react";

interface Request {
  id: string;
  lat: number;
  lng: number;
  type: "food" | "water" | "shelter" | "medical" | "charging" | "other";
  desc: string;
  urgency: "high" | "medium" | "low";
  status: "pending" | "assigned";
  createdByName: string;
}

interface Location {
  lat: number;
  lng: number;
}

const EMOJI = {
  food: "🍱",
  water: "💧",
  shelter: "🏠",
  medical: "🚑",
  charging: "🔋",
  other: "📦",
};

const urgencyColors = {
  high: "#ef5350",
  medium: "#FF9800",
  low: "#66BB6A",
};

function MapUpdater({ location }: { location: Location }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.setView([location.lat, location.lng], 14, { animate: true });
    }
  }, [location, map]);

  return null;
}

export default function MapComponent({
  location,
  requests,
}: {
  location: Location | null;
  requests: Request[];
}) {
  const mapRef = useRef(null);
  const [mapKey, setMapKey] = useState(0);

  // Force re-render on location change
  useEffect(() => {
    setMapKey((prev) => prev + 1);
  }, [location?.lat, location?.lng]);

  const customIcon = (emoji: string, urgency: string) => {
    const color = urgencyColors[urgency as keyof typeof urgencyColors];
    return L.divIcon({
      html: `
        <div style="
          background: ${color};
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          border: 2px solid white;
          z-index: 1000;
        ">
          ${emoji}
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -22],
      className: "custom-icon",
    });
  };

  const userIcon = L.divIcon({
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 0 0 2px #3b82f6;
        animation: pulse-ring 2s infinite;
        z-index: 1001;
      ">
        <div style="
          width: 6px;
          height: 6px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
    className: "user-location-marker",
  });

  const defaultCenter: [number, number] = [18.5204, 73.8567];
  const center = location ? [location.lat, location.lng] : defaultCenter;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        key={mapKey}
        center={center as [number, number]}
        zoom={14}
        className="w-full h-full"
        ref={mapRef}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {location && <MapUpdater location={location} />}

        {/* User Location Marker */}
        {location && (
          <>
            <Marker position={[location.lat, location.lng]} icon={userIcon}>
              <Popup>
                <div className="glass-sm p-2 rounded text-white text-sm">
                  <p className="font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Your Location
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* 2km Radius Circle */}
            <Circle
              center={[location.lat, location.lng]}
              radius={2000}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.1,
                weight: 2,
                dashArray: "8,4",
              }}
            />
          </>
        )}

        {/* Request Markers */}
        {requests.map((request) => (
          <Marker
            key={request.id}
            position={[request.lat, request.lng]}
            icon={customIcon(EMOJI[request.type], request.urgency)}
          >
            <Popup>
              <div className="bg-slate-900 text-white rounded-lg p-3 min-w-60 border border-indigo-500/30">
                <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                  {EMOJI[request.type]} {request.desc}
                </h3>
                <div className="flex gap-2 mb-2">
                  <span
                    className="text-xs px-3 py-1 rounded-full text-white font-medium"
                    style={{
                      backgroundColor: urgencyColors[request.urgency],
                    }}
                  >
                    {request.urgency.toUpperCase()}
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full bg-indigo-600 text-white font-medium">
                    {request.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-400">by {request.createdByName}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Controls Overlay */}
      <style jsx>{`
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          70% {
            box-shadow: 0 0 0 20px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
      `}</style>
    </div>
  );
}
