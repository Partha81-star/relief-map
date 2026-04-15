"use client";

import { useState, useRef, useEffect } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { LogOut, User, Settings } from "lucide-react";

interface UserProfileDropdownProps {
  user: FirebaseUser;
  onLogout: () => void;
}

export default function UserProfileDropdown({
  user,
  onLogout,
}: UserProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm hover:ring-2 ring-indigo-400 transition"
      >
        {user?.displayName?.charAt(0).toUpperCase() || (
          <User className="w-5 h-5" />
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-3 w-64 glass-lg p-0 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-indigo-600/20 to-blue-600/20 p-4 border-b border-indigo-500/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {user?.displayName?.charAt(0).toUpperCase() || <User className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">
                  {user?.displayName || "Anonymous User"}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2 space-y-1">
            <button className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition flex items-center gap-3">
              <User className="w-4 h-4" />
              Profile Settings
            </button>
            <button className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition flex items-center gap-3">
              <Settings className="w-4 h-4" />
              Preferences
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-indigo-500/20"></div>

          {/* Logout Button */}
          <button
            onClick={() => {
              onLogout();
              setOpen(false);
            }}
            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition flex items-center gap-3"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm hover:ring-2 ring-indigo-400 transition"
      >
        {user?.displayName?.charAt(0).toUpperCase() || (
          <User className="w-5 h-5" />
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-3 w-64 glass-lg p-0 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-indigo-600/20 to-blue-600/20 p-4 border-b border-indigo-500/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {user?.displayName?.charAt(0).toUpperCase() || <User className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">
                  {user?.displayName || "Anonymous User"}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2 space-y-1">
            <button className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition flex items-center gap-3">
              <User className="w-4 h-4" />
              Profile Settings
            </button>
            <button className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition flex items-center gap-3">
              <Settings className="w-4 h-4" />
              Preferences
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-indigo-500/20"></div>

          {/* Logout Button */}
          <button
            onClick={() => {
              onLogout();
              setOpen(false);
            }}
            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition flex items-center gap-3"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
