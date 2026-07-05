"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMockDb } from "@/lib/mockDb";
import { X } from "lucide-react";

export const NotificationSystem: React.FC = () => {
  const { notifications, clearNotification } = useMockDb();

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-none flex flex-col gap-3">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="pointer-events-auto w-full glass-premium rounded-2xl p-4 flex items-start gap-3 shadow-2xl border border-white/10"
          >
            <div className="text-2xl p-1 bg-white/5 rounded-lg flex items-center justify-center">
              {notif.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white font-display">
                {notif.title}
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                {notif.message}
              </p>
            </div>

            <button
              onClick={() => clearNotification(notif.id)}
              className="text-zinc-500 hover:text-white transition-colors p-1"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
