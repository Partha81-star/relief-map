"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MapPin, MessageSquare, CheckCircle } from "lucide-react";

interface ListItem {
  id: string;
  name: string;
  type: "helper" | "seeker";
  urgency?: "low" | "medium" | "high";
  status: "pending" | "assigned" | "completed";
  distance?: number;
  description?: string;
  avatar?: string;
}

interface SidebarProps {
  items: ListItem[];
  isOpen: boolean;
  onToggle: () => void;
  selectedItem?: string;
  onItemSelect: (id: string) => void;
}

export function Sidebar({
  items,
  isOpen,
  onToggle,
  selectedItem,
  onItemSelect,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<"all" | "helpers" | "seekers">(
    "all"
  );

  const filteredItems = items.filter((item) => {
    if (activeTab === "helpers") return item.type === "helper";
    if (activeTab === "seekers") return item.type === "seeker";
    return true;
  });

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case "high":
        return "urgent";
      case "medium":
        return "secondary";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "assigned":
        return <MapPin className="w-4 h-4 text-cyan-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <>
      {/* Sidebar Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed left-4 top-20 z-50 lg:hidden bg-glass-light backdrop-blur-md border border-glass hover:border-cyan-500/50 rounded-xl p-2 transition-all duration-200"
      >
        <svg
          className="w-5 h-5 text-cyan-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-80 bg-glass-light backdrop-blur-md border-r border-glass z-40 transition-all duration-300 overflow-hidden",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-slate-700/30">
            <h2 className="text-lg font-bold text-slate-50 mb-4">
              Relief Network
            </h2>

            {/* Tab Buttons */}
            <div className="flex gap-2">
              {(
                ["all", "helpers", "seekers"] as const
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border",
                    activeTab === tab
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                      : "bg-slate-800/30 border-slate-700/30 text-slate-400 hover:border-slate-600/50"
                  )}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400 mt-3">
              {filteredItems.length} {activeTab === "all" ? "items" : activeTab}
            </div>
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto space-y-2 p-4">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onItemSelect(item.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all duration-200 group hover:border-cyan-500/50 hover:bg-cyan-500/10",
                    selectedItem === item.id
                      ? "bg-cyan-500/20 border-cyan-500/50"
                      : "bg-slate-800/20 border-slate-700/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm text-slate-50 group-hover:text-cyan-400 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.type === "helper" ? "🆘 Helper" : "🗺️ Request"}
                      </p>
                    </div>
                    {getStatusIcon(item.status)}
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-400 mb-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    {item.urgency && (
                      <Badge
                        variant={getUrgencyColor(item.urgency)}
                        className="text-xs"
                      >
                        {item.urgency}
                      </Badge>
                    )}
                    {item.distance && (
                      <span className="text-xs text-cyan-400">
                        {item.distance.toFixed(1)} km
                      </span>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-400">
                <div className="text-center">
                  <p className="text-sm">No items found</p>
                  <p className="text-xs mt-1">Try changing filters</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-700/30 space-y-2">
            <Button variant="default" className="w-full" size="sm">
              Create Request
            </Button>
            <Button variant="outline" className="w-full" size="sm">
              Become Helper
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}
