"use client";

import dynamic from "next/dynamic";

const ClientRoot = dynamic(() => import("@/components/ClientRoot").then(mod => ({ default: mod.ClientRoot })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">📍</div>
        <p className="text-slate-300">Loading ReliefMap...</p>
      </div>
    </div>
  )
});

export default function Home() {
  return (
    <main className="w-full h-screen overflow-hidden">
      <ClientRoot />
    </main>
  );
}
