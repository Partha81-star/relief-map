"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { signOut, User } from "firebase/auth";
import { Bell, LogOut, ChevronDown, User as UserIcon, Map, Users, Plus } from "lucide-react";
import MapComponent from "./MapComponent";
import dynamic from "next/dynamic";

const UserProfileDropdown = dynamic(
  () => import("./UserProfileDropdown"),
  { ssr: false }
);

interface Request {
  id: string;
  lat: number;
  lng: number;
  type: string;
  desc: string;
  urgency: string;
  status: string;
  createdByName: string;
  createdAt: Timestamp;
}

interface Location {
  lat: number;
  lng: number;
}

export default function Dashboard({ user }: { user: User }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"map" | "helpers" | "seekers">(
    "map"
  );
  const watcherRef = useRef<number | null>(null);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => {
        console.error("Geolocation error");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );

    watcherRef.current = navigator.geolocation.watchPosition(
      (pos) =>
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watcherRef.current) {
        navigator.geolocation.clearWatch(watcherRef.current);
      }
    };
  }, []);

  // Fetch requests near user
  useEffect(() => {
    if (!location) return;

    const q = query(
      collection(db, "requests"),
      where("status", "in", ["pending", "assigned"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Request[];

      setRequests(
        data.filter((r) => {
          const dist = Math.sqrt(
            Math.pow(r.lat - location.lat, 2) +
              Math.pow(r.lng - location.lng, 2)
          );
          return dist < 0.05; // ~5km in lat/lng degrees
        })
      );
    });

    return unsubscribe;
  }, [location]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="w-screen h-screen bg-slate-950 flex overflow-hidden">
      {/* Floating Header */}
      <div className="fixed top-4 left-4 right-4 z-40 flex items-center justify-between">
        {/* Logo/Title */}
        <div className="glass-lg px-6 py-3 flex items-center gap-3">
          <Map className="w-6 h-6 text-indigo-400" />
          <div>
            <h1 className="font-bold text-lg text-white">ReliefMap</h1>
            <p className="text-xs text-slate-400">Disaster Relief Network</p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="glass-lg px-4 py-3 flex items-center gap-4">
          <div className="relative">
            <Bell className="w-5 h-5 text-slate-300 cursor-pointer hover:text-indigo-400 transition" />
            {requests.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {requests.length}
              </span>
            )}
          </div>

          <UserProfileDropdown user={user} onLogout={handleLogout} />
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen bg-slate-900/80 backdrop-blur-md border-r border-indigo-500/20 transition-all duration-300 z-30 ${
          sidebarOpen ? "w-80" : "w-0 overflow-hidden"
        }`}
      >
        <div className="p-6 pt-24 overflow-y-auto h-full scrollbar-hide">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {(["map", "helpers", "seekers"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {tab === "map" && <Map className="w-4 h-4" />}
                {tab === "helpers" && <Users className="w-4 h-4" />}
                {tab === "seekers" && <UserIcon className="w-4 h-4" />}
              </button>
            ))}
          </div>

          {/* Active Requests List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">
              Active Requests ({requests.length})
            </h3>
            {requests.length === 0 ? (
              <div className="glass-sm p-4 rounded-lg text-center text-slate-400 text-sm">
                No active requests nearby
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="glass-sm p-4 rounded-lg cursor-pointer hover:bg-white/20 transition group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-white text-sm group-hover:text-indigo-300 transition">
                        {req.desc}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        by {req.createdByName}
                      </p>
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded-full text-white font-medium"
                      style={{
                        backgroundColor:
                          req.urgency === "high"
                            ? "#ef5350"
                            : req.urgency === "medium"
                            ? "#FF9800"
                            : "#66BB6A",
                      }}
                    >
                      {req.urgency}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    <span className="bg-indigo-600/50 px-2 py-1 rounded">
                      {req.type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? "ml-80" : ""
        } mt-20`}
      >
        {location ? (
          <MapComponent location={location} requests={requests} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
            <div className="text-center">
              <div className="animate-spin mb-4">
                <Map className="w-12 h-12 text-indigo-400 mx-auto" />
              </div>
              <p className="text-slate-300">Fetching your location...</p>
              <p className="text-slate-500 text-sm mt-2">
                Please enable location services
              </p>
            </div>
          </div>
        )}
      </div>

      {/* FAB - New Request */}
      <button className="fixed bottom-8 right-8 z-40 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-xl hover:shadow-indigo-500/50 transition-all hover:scale-110">
        <Plus className="w-6 h-6" />
      </button>

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-4 top-24 z-30 glass-sm p-2 text-indigo-400 hover:text-indigo-300 transition"
      >
        <ChevronDown
          className={`w-6 h-6 transition-transform ${
            sidebarOpen ? "rotate-90" : ""
          }`}
        />
      </button>
    </div>
  );
}

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => {
        console.error("Geolocation error");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );

    watcherRef.current = navigator.geolocation.watchPosition(
      (pos) =>
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watcherRef.current) {
        navigator.geolocation.clearWatch(watcherRef.current);
      }
    };
  }, []);

  // Fetch requests near user
  useEffect(() => {
    if (!location) return;

    const q = query(
      collection(db, "requests"),
      where("status", "in", ["pending", "assigned"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Request[];

      setRequests(
        data.filter((r) => {
          const dist = Math.sqrt(
            Math.pow(r.lat - location.lat, 2) +
              Math.pow(r.lng - location.lng, 2)
          );
          return dist < 0.05; // ~5km in lat/lng degrees
        })
      );
    });

    return unsubscribe;
  }, [location]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="w-screen h-screen bg-slate-950 flex overflow-hidden">
      {/* Floating Header */}
      <div className="fixed top-4 left-4 right-4 z-40 flex items-center justify-between">
        {/* Logo/Title */}
        <div className="glass-lg px-6 py-3 flex items-center gap-3">
          <Map className="w-6 h-6 text-indigo-400" />
          <div>
            <h1 className="font-bold text-lg text-white">ReliefMap</h1>
            <p className="text-xs text-slate-400">Disaster Relief Network</p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="glass-lg px-4 py-3 flex items-center gap-4">
          <div className="relative">
            <Bell className="w-5 h-5 text-slate-300 cursor-pointer hover:text-indigo-400 transition" />
            {requests.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {requests.length}
              </span>
            )}
          </div>

          <UserProfileDropdown user={user} onLogout={handleLogout} />
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen bg-slate-900/80 backdrop-blur-md border-r border-indigo-500/20 transition-all duration-300 z-30 ${
          sidebarOpen ? "w-80" : "w-0 overflow-hidden"
        }`}
      >
        <div className="p-6 pt-24 overflow-y-auto h-full scrollbar-hide">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {(["map", "helpers", "seekers"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {tab === "map" && <Map className="w-4 h-4" />}
                {tab === "helpers" && <Users className="w-4 h-4" />}
                {tab === "seekers" && <User className="w-4 h-4" />}
              </button>
            ))}
          </div>

          {/* Active Requests List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">
              Active Requests ({requests.length})
            </h3>
            {requests.length === 0 ? (
              <div className="glass-sm p-4 rounded-lg text-center text-slate-400 text-sm">
                No active requests nearby
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="glass-sm p-4 rounded-lg cursor-pointer hover:bg-white/20 transition group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-white text-sm group-hover:text-indigo-300 transition">
                        {req.desc}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        by {req.createdByName}
                      </p>
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded-full text-white font-medium"
                      style={{
                        backgroundColor:
                          req.urgency === "high"
                            ? "#ef5350"
                            : req.urgency === "medium"
                            ? "#FF9800"
                            : "#66BB6A",
                      }}
                    >
                      {req.urgency}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    <span className="bg-indigo-600/50 px-2 py-1 rounded">
                      {req.type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? "ml-80" : ""
        } mt-20`}
      >
        {location ? (
          <MapComponent location={location} requests={requests} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
            <div className="text-center">
              <div className="animate-spin mb-4">
                <Map className="w-12 h-12 text-indigo-400 mx-auto" />
              </div>
              <p className="text-slate-300">Fetching your location...</p>
              <p className="text-slate-500 text-sm mt-2">
                Please enable location services
              </p>
            </div>
          </div>
        )}
      </div>

      {/* FAB - New Request */}
      <button className="fixed bottom-8 right-8 z-40 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-xl hover:shadow-indigo-500/50 transition-all hover:scale-110">
        <Plus className="w-6 h-6" />
      </button>

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-4 top-24 z-30 glass-sm p-2 text-indigo-400 hover:text-indigo-300 transition"
      >
        <ChevronDown
          className={`w-6 h-6 transition-transform ${
            sidebarOpen ? "rotate-90" : ""
          }`}
        />
      </button>
    </div>
  );
}
