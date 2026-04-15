"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { MapComponent } from "@/components/MapComponent";
import dynamic from "next/dynamic";

// Type definitions
interface User {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
}

interface Request {
  id: string;
  lat: number;
  lng: number;
  type: string;
  urgency: "low" | "medium" | "high";
  desc: string;
  status: "pending" | "assigned" | "resolved";
  distance?: number;
  createdByName?: string;
}

interface SidebarItem {
  id: string;
  name: string;
  type: "helper" | "seeker";
  urgency?: "low" | "medium" | "high";
  status: "pending" | "assigned" | "completed";
  distance?: number;
  description?: string;
  avatar?: string;
}

export function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          displayName: currentUser.displayName || undefined,
          email: currentUser.email || undefined,
          photoURL: currentUser.photoURL || undefined,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Geolocation
  useEffect(() => {
    if (!user) return;

    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      return;
    }

    // Get current position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Watch position for continuous updates
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => console.error("Watch position error:", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user]);

  // Fetch Firestore data
  useEffect(() => {
    if (!user || !location) return;

    // Subscribe to active requests
    const q = query(
      collection(db, "requests"),
      where("status", "in", ["pending", "assigned"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      } as Request));

      // Calculate distances
      const withDistances = data.map((req) => ({
        ...req,
        distance: calculateDistance(location.lat, location.lng, req.lat, req.lng),
      }));

      setRequests(withDistances.filter((r) => r.distance! <= 2)); // Within 2km
    });

    return unsubscribe;
  }, [user, location]);

  // Logout
  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Helper function: Calculate distance (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Convert requests to sidebar items
  const sidebarItems: SidebarItem[] = requests.map((req) => ({
    id: req.id,
    name: req.createdByName || "Unknown",
    type: "seeker",
    urgency: req.urgency as "low" | "medium" | "high",
    status: (req.status === "pending" ? "pending" : "assigned") as
      | "pending"
      | "assigned"
      | "completed",
    distance: req.distance,
    description: req.desc,
  }));

  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">📍</div>
          <p className="text-slate-300">Loading ReliefMap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Header */}
      <Header user={user} onLogout={handleLogout} location={location} />

      {/* Main Content */}
      <div className="flex h-full pt-20 lg:pt-0">
        {/* Sidebar */}
        <Sidebar
          items={sidebarItems}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          selectedItem={selectedRequest}
          onItemSelect={setSelectedRequest}
        />

        {/* Map - Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 lg:m-4 mt-4 mx-4 lg:mt-0">
            <MapComponent 
              userLocation={location} 
              requests={requests.map(r => ({
                ...r,
                description: r.desc
              }))} 
            />
          </div>

          {/* Bottom Info Bar - Mobile */}
          {location && (
            <div className="lg:hidden bg-glass-light backdrop-blur-md border-t border-glass mx-4 mb-4 rounded-xl p-4 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span>📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
                <span className="text-cyan-400 font-semibold">
                  {requests.length} requests nearby
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");

        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        body {
          background: linear-gradient(135deg, #03070e 0%, #0f172a 100%);
          font-family: "Inter", sans-serif;
          color: #f1f5f9;
          margin: 0;
          padding: 0;
        }

        #root,
        html,
        body {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        /* Leaflet Map Adjustments */
        .leaflet-container {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
          border-radius: 1rem;
        }

        .leaflet-marker-icon {
          background: none !important;
          border: none !important;
        }

        .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(6, 182, 212, 0.2) !important;
          backdrop-filter: blur(20px);
          border-radius: 12px;
          color: #f1f5f9;
        }

        .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95) !important;
        }

        /* Scrollbar Styling */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.4);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }
      `}</style>
    </div>
  );
}
