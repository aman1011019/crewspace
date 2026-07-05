"use client";

import React from "react";
import { motion } from "framer-motion";
import { Home, Users, Sparkles, Award, MessageSquare, User } from "lucide-react";

export type TabName = "feed" | "network" | "showcase" | "jury" | "feedback" | "profile";

interface BottomNavProps {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "feed", icon: Home, label: "Feed" },
    { id: "network", icon: Users, label: "Network" },
    { id: "showcase", icon: Sparkles, label: "Projects" },
    { id: "jury", icon: Award, label: "Jury" },
    { id: "feedback", icon: MessageSquare, label: "Feedback" },
    { id: "profile", icon: User, label: "Profile" },
  ] as const;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-around w-full max-w-lg h-16 px-4 rounded-full glass-nav shadow-2xl border border-white/10 relative overflow-hidden">
        
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center justify-center h-12 w-12 rounded-full text-zinc-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
            >
              {/* Active Back Glow pill */}
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 rounded-full z-0"
                />
              )}

              {/* Animated Icon wrapper */}
              <motion.div
                animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -1 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="relative z-10"
              >
                <Icon size={20} className={isActive ? "text-[#8B5CF6]" : ""} />
              </motion.div>
              
              {/* Mini active point */}
              {isActive && (
                <motion.span
                  layoutId="active-dot"
                  className="absolute bottom-1.5 h-1 w-1 rounded-full bg-[#8B5CF6] z-10"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
