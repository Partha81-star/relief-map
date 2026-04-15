"use client";

import { useEffect, useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup } from "firebase/auth";
import { Dashboard } from "@/components/Dashboard";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";

export function ClientRoot() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setError("");
    }, (err) => {
      console.error("Auth error:", err);
      setError(err.message);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-slate-300">Loading ReliefMap...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl mb-4 shadow-lg shadow-cyan-500/20">
              <span className="text-3xl">📍</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-50 mb-2">ReliefMap</h1>
            <p className="text-cyan-400 font-mono text-sm">Hyper-local crisis aid hub</p>
          </div>

          {/* Card */}
          <div className="bg-glass-light backdrop-blur-md border border-glass rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-slate-50 mb-4 text-center">
              Sign in to help or get help
            </h2>

            <p className="text-slate-300 text-sm mb-6 text-center leading-relaxed">
              Connect with people within 2 km during local emergencies. Real-time, GPS-based, community-driven.
            </p>

            {/* Features List */}
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-0.5">→</span>
                <span className="text-slate-300 text-sm">Post needs — food, water, shelter, medical</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-0.5">→</span>
                <span className="text-slate-300 text-sm">See active requests within 2 km of you</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-0.5">→</span>
                <span className="text-slate-300 text-sm">Claim and resolve requests in real time</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-0.5">→</span>
                <span className="text-slate-300 text-sm">Works offline, syncs when back online</span>
              </li>
            </ul>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm font-mono">{error}</p>
              </div>
            )}

            {/* Sign In Button */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white text-slate-950 hover:bg-slate-100 mb-4 h-11 font-semibold"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  <span className="mr-2">🔐</span>
                  Continue with Google
                </>
              )}
            </Button>

            {/* Info */}
            <p className="text-xs text-slate-400 text-center font-mono">
              Secure. Verified with Google. No spam.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-slate-400 text-xs">
              Made with ❤️ for community relief
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
