"use client";

import dynamic from "next/dynamic";

const App = dynamic(() => import("@/App"), {
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

export function ClientRoot() {
  return <App />;
}
