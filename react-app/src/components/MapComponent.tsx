"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

interface MapComponentProps {
  userLocation: { lat: number; lng: number } | null;
  requests?: Array<{
    id: string;
    lat: number;
    lng: number;
    type: string;
    urgency: "low" | "medium" | "high";
    description: string;
  }>;
}

export function MapComponent({ userLocation, requests = [] }: MapComponentProps) {
  const mapRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Fix leaflet icon issue in Next.js
    if (typeof window !== "undefined") {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet-icon-2x.png",
        iconUrl: "/leaflet-icon.png",
        shadowUrl: "/leaflet-shadow.png",
      });
      setIsLoaded(true);
    }
  }, []);

  if (!isLoaded || !userLocation) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <div className="text-3xl mb-4">📍</div>
          <p>Locating you...</p>
        </div>
      </div>
    );
  }

  const customUserIcon = L.divIcon({
    className: "custom-user-icon",
    html: `
      <div class="w-6 h-6 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full border-2 border-white shadow-lg animate-pulse-glow flex items-center justify-center">
        <div class="w-2 h-2 bg-white rounded-full"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  const requestIcon = (urgency: string) =>
    L.divIcon({
      className: "custom-request-icon",
      html: `
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-lg ${
          urgency === "high"
            ? "bg-red-500"
            : urgency === "medium"
            ? "bg-yellow-500"
            : "bg-green-500"
        }">
          📌
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={14}
        style={{ width: "100%", height: "100%" }}
        ref={mapRef}
        className="rounded-2xl"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location Marker with Pulse Animation */}
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={customUserIcon}
        >
          <Popup>
            <div className="text-xs font-medium">📍 Your Location</div>
          </Popup>
        </Marker>

        {/* 2km Radius Circle */}
        <Circle
          center={[userLocation.lat, userLocation.lng]}
          radius={2000}
          pathOptions={{
            color: "#06b6d4",
            weight: 2,
            opacity: 0.4,
            fillOpacity: 0.05,
            dashArray: "8,5",
          }}
        >
          <Popup>
            <div className="text-xs font-medium">📏 2km Radius</div>
          </Popup>
        </Circle>

        {/* Request Markers */}
        {requests.map((request) => (
          <Marker
            key={request.id}
            position={[request.lat, request.lng]}
            icon={requestIcon(request.urgency)}
          >
            <Popup>
              <div className="w-48">
                <h3 className="font-semibold text-sm mb-1">{request.type}</h3>
                <p className="text-xs text-gray-600 mb-2">{request.description}</p>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    request.urgency === "high"
                      ? "bg-red-100 text-red-700"
                      : request.urgency === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {request.urgency.charAt(0).toUpperCase() +
                    request.urgency.slice(1)}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Glassmorphism Overlay Gradient */}
      <style jsx>{`
        :global(.leaflet-container) {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        }

        :global(.custom-user-icon),
        :global(.custom-request-icon) {
          background: none !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
