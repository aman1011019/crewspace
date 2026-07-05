"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageSquare, X, Send, Bot, User, ArrowUpRight } from "lucide-react";
import { useMockDb } from "@/lib/mockDb";
import { useRouter } from "next/navigation";

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { askAI, aiHistory, isOnboarded } = useMockDb();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Scroll to bottom when history updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiHistory, isOpen, isTyping]);

  if (!isOnboarded) return null; // Only show when user has completed onboarding

  const suggestions = [
    "When is lunch? 🍕",
    "Where is Hall B? 📍",
    "Who knows React? 💻",
    "Show AI projects 🤖",
    "Mentoring help? 👨‍🏫",
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setQuery("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      askAI(text);
      setIsTyping(false);
    }, 1000);
  };

  const handleSuggestionClick = (sug: string) => {
    // Remove emojis from suggestion for query search
    const cleanQuery = sug.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim();
    handleSend(cleanQuery);
  };

  const handleLinkClick = (url: string) => {
    setIsOpen(false);
    router.push(url);
  };

  return (
    <>
      {/* Floating Sparkles Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-28 right-6 z-40 p-4 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#A855F7] text-white shadow-lg hover:shadow-purple-500/35 transition-shadow flex items-center justify-center cursor-pointer border border-white/10"
      >
        <Sparkles className="h-6 w-6 animate-pulse" />
      </motion.button>

      {/* Chat Dialog Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-md cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-24 right-4 left-4 md:left-auto md:right-6 z-40 w-[calc(100vw-32px)] md:w-[360px] h-[500px] rounded-3xl glass-premium shadow-2xl border border-white/10 flex flex-col overflow-hidden"
            >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white font-display">CrewSpace AI</h3>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Live Context Active
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {aiHistory.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center p-4">
                  <Bot size={36} className="text-purple-400 mb-2 opacity-60 animate-bounce" />
                  <h4 className="text-sm font-semibold text-zinc-300 font-display">How can I help you?</h4>
                  <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">
                    Ask about the schedule, venue halls, developer skills, or request mentoring.
                  </p>
                </div>
              ) : (
                aiHistory.map((item, index) => (
                  <div key={index} className="space-y-3">
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="max-w-[80%] bg-purple-600/30 border border-purple-500/20 text-white rounded-2xl px-3 py-2 text-xs flex gap-2 items-start shadow-sm">
                        <p>{item.query}</p>
                        <User size={12} className="mt-0.5 text-purple-300 flex-shrink-0" />
                      </div>
                    </div>

                    {/* AI Reply */}
                    <div className="flex justify-start">
                      <div className="max-w-[85%] bg-white/5 border border-white/5 text-zinc-100 rounded-2xl px-3 py-2 text-xs space-y-2 shadow-sm">
                        <div className="flex gap-2 items-start">
                          <Bot size={14} className="mt-0.5 text-purple-400 flex-shrink-0" />
                          <p className="whitespace-pre-line leading-relaxed">{item.reply}</p>
                        </div>

                        {/* Interactive Suggestion Links */}
                        {item.links && (
                          <div className="pt-2 pl-5 flex flex-wrap gap-2">
                            {item.links.map((link, lIdx) => (
                              <button
                                key={lIdx}
                                onClick={() => handleLinkClick(link.url)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-white transition-all text-[10px]"
                              >
                                {link.label}
                                <ArrowUpRight size={10} />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Typing state */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/5 text-zinc-400 rounded-2xl px-3 py-2.5 text-xs flex gap-2 items-center">
                    <Bot size={14} className="text-purple-400 animate-spin" />
                    <span className="flex gap-1">
                      <span className="h-1 w-1 bg-zinc-400 rounded-full animate-bounce"></span>
                      <span className="h-1 w-1 bg-zinc-400 rounded-full animate-bounce delay-75"></span>
                      <span className="h-1 w-1 bg-zinc-400 rounded-full animate-bounce delay-150"></span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggestion Chips */}
            {aiHistory.length === 0 && (
              <div className="px-4 py-2 border-t border-white/5 bg-white/[0.01]">
                <p className="text-[10px] text-zinc-500 mb-1.5 font-medium">SUGGESTED QUESTIONS</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(sug)}
                      className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white text-[10px] transition-all cursor-pointer font-medium"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 border-t border-white/10 bg-white/[0.02] flex gap-2">
              <input
                type="text"
                placeholder="Ask CrewSpace AI..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend(query)}
                className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
              <button
                onClick={() => handleSend(query)}
                disabled={!query.trim()}
                className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 text-white disabled:text-zinc-500 transition-colors flex items-center justify-center cursor-pointer"
              >
                <Send size={14} />
              </button>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
