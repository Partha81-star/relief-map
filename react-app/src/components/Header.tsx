"use client";

import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogOut, Settings, User } from "lucide-react";

interface HeaderProps {
  user: {
    displayName?: string;
    email?: string;
    photoURL?: string;
  } | null;
  onLogout: () => void;
  location?: { lat: number; lng: number } | null;
}

export function Header({ user, onLogout, location }: HeaderProps) {
  const userInitials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      <div className="p-4 mx-auto max-w-7xl w-full pointer-events-auto">
        {/* Glassmorphism Floating Header */}
        <div className="flex items-center justify-between bg-glass-light backdrop-blur-md border border-glass rounded-2xl px-6 py-3.5 shadow-2xl animate-glassmorphism">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="text-lg font-bold text-slate-950">📍</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-slate-50">Relief</h1>
              <p className="text-xs text-cyan-400">Map</p>
            </div>
          </div>

          {/* Location Badge */}
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-300 bg-slate-900/40 px-4 py-2 rounded-full border border-slate-700/30">
            <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
            <span className="font-mono text-xs">
              {location
                ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                : "Locating..."}
            </span>
          </div>

          {/* Right Section - Profile Dropdown */}
          {user ? (
            <div className="flex items-center gap-3">
              {/* SOS Button */}
              <Button
                variant="danger"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => {
                  // TODO: Implement SOS functionality
                  alert("SOS triggered!");
                }}
              >
                🆘 SOS
              </Button>

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-slate-800/50 rounded-lg p-1 transition-colors">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.photoURL || ""} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-slate-50 leading-none">
                        {user.displayName || "User"}
                      </p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-slate-50">
                      {user.displayName || "User"}
                    </p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>

                  <div className="border-t border-slate-600/30 my-1.5"></div>

                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <User className="w-4 h-4" />
                    <span>Profile Settings</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    <span>Preferences</span>
                  </DropdownMenuItem>

                  <div className="border-t border-slate-600/30 my-1.5"></div>

                  <DropdownMenuItem
                    className="gap-2 cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300"
                    onClick={onLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button variant="default" size="sm">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
