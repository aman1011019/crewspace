"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useMockDb,
  FeedPost,
  Connection,
  TeamProject,
  JuryMentor,
  EventStage,
  UserRole,
  UserProfile,
  HackathonEvent,
} from "@/lib/mockDb";
import { BottomNav, TabName } from "@/components/BottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, Bookmark, Share2, Map, Send, CheckCircle2, QrCode, Search, Sparkles, 
  ExternalLink, Download, UserCheck, Image, MapPin, Clock, Award, 
  HelpCircle, Star, ThumbsUp, Camera, Play, Users, Trophy, FileText, ChevronRight, LogOut, Bell,
  User, ShieldAlert, Edit2
} from "lucide-react";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

// Main wrapper to satisfy Next.js useSearchParams in Suspense
export default function SpacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SpaceContent />
    </Suspense>
  );
}

function SpaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as TabName | null;
  
  const { 
    user, eventState, setEventStage, posts, addPost, likePost, bookmarkPost,
    connections, sendConnectionRequest, projects, likeProject, bookmarkProject,
    mentors, requestMentoring, announcements, activityTicker, submitFeedback, 
    feedbackSubmitted, logout
  } = useMockDb();

  const [activeTab, setActiveTab] = useState<TabName>("feed");
  const [showMap, setShowMap] = useState(false);
  const [showMemories, setShowMemories] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showScannedProfile, setShowScannedProfile] = useState(false);

  // Sync tab with URL query parameter
  useEffect(() => {
    if (tabParam) {
      const timeout = window.setTimeout(() => setActiveTab(tabParam), 0);
      return () => window.clearTimeout(timeout);
    }
  }, [tabParam]);

  // Update query parameter when tab changes
  const handleTabChange = (tab: TabName) => {
    setActiveTab(tab);
    router.push(`/space?tab=${tab}`);
  };

  // Redirect to login if user isn't authenticated
  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0B0B0F] pb-28 relative">
      
      {/* 1. TOP EVENT BAR */}
      <header className="sticky top-0 z-20 w-full glass backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-purple-500 animate-ping"></span>
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-purple-500"></span>
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-display font-black text-purple-400">
              CS
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide font-display">
              {eventState.name}
            </h1>
            <p className="text-[10px] text-zinc-500 flex items-center gap-1 font-medium">
              <MapPin size={10} /> {eventState.venue}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* QR Code button */}
          <button 
            onClick={() => {
              setShowQRModal(true);
              setShowScannedProfile(false);
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer border border-white/5 flex items-center justify-center hover:scale-[1.05] active:scale-[0.95]"
            title="My QR Code"
          >
            <QrCode size={15} className="text-purple-400" />
          </button>

          {/* Organiser Notifications Bell button */}
          <button 
            onClick={() => setShowNotifications(true)}
            className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer border border-white/5 flex items-center justify-center hover:scale-[1.05] active:scale-[0.95]"
            title="Organiser Broadcasts"
          >
            <Bell size={15} className="text-purple-400" />
            {announcements.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 border border-[#0B0B0F] animate-pulse" />
            )}
          </button>
          
          <button 
            onClick={logout}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer border border-white/5"
            title="Log Out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* 2. DYNAMIC TABS DISPLAY */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === "feed" && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Event Progress Timeline */}
              <EventTimeline stage={eventState.stage} setStage={setEventStage} />

              {/* Event Stats grid */}
              <EventStats 
                stats={eventState.stats} 
                countdown={eventState.countdown} 
                progressPercent={eventState.progressPercent}
                milestoneText={eventState.milestoneText}
              />

              {/* Live Ticker Feed */}
              <LiveTicker ticker={activityTicker} />

              {/* Trending Projects Widget */}
              <TrendingProjects 
                onSelectProject={(name) => {
                  setProjectSearch(name);
                  handleTabChange("showcase");
                }} 
              />


              {/* Create Post */}
              <CreatePostForm onPost={addPost} user={user} />

              {/* Timeline Feed */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Live Updates</h3>
                {posts.map((post) => (
                  <FeedPostCard 
                    key={post.id} 
                    post={post} 
                    onLike={likePost} 
                    onBookmark={bookmarkPost} 
                  />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "network" && (
            <motion.div
              key="network"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <NetworkView connections={connections} onConnect={sendConnectionRequest} />
            </motion.div>
          )}

          {activeTab === "showcase" && (
            <motion.div
              key="showcase"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <ShowcaseView 
                projects={projects} 
                onLike={likeProject} 
                onBookmark={bookmarkProject} 
                search={projectSearch}
                setSearch={setProjectSearch}
              />
            </motion.div>
          )}

          {activeTab === "jury" && (
            <motion.div
              key="jury"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <JuryView mentors={mentors} onRequest={requestMentoring} />
            </motion.div>
          )}

          {activeTab === "feedback" && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <FeedbackView 
                role={user.role} 
                onSubmit={submitFeedback} 
                submitted={feedbackSubmitted} 
              />
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <ProfileView 
                user={user} 
                eventState={eventState}
                onMemoriesToggle={() => setShowMemories(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Bottom Nav */}
      <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* 3. STATIC EVENT MAP OVERLAY */}
      <AnimatePresence>
        {showMap && (
          <StaticMapOverlay onClose={() => setShowMap(false)} />
        )}
      </AnimatePresence>

      {/* 4. EVENT MEMORIES OVERLAY */}
      <AnimatePresence>
        {showMemories && (
          <EventMemoriesOverlay onClose={() => setShowMemories(false)} user={user} />
        )}
      </AnimatePresence>

      {/* 5. ORGANISER BROADCASTS OVERLAY */}
      <AnimatePresence>
        {showNotifications && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-sm glass-premium rounded-[32px] p-6 border border-white/10 shadow-2xl space-y-4 text-left max-h-[75vh] overflow-y-auto relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-purple-400 animate-pulse" />
                  <h3 className="text-xs font-bold font-display text-white uppercase tracking-wider">Organiser Broadcasts</h3>
                </div>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest font-extrabold cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Broadcasts List */}
              <div className="space-y-3.5 pr-1">
                {announcements.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-xs font-semibold">
                    No announcements from organiser admin panel.
                  </div>
                ) : (
                  announcements.map((ann) => (
                    <div 
                      key={ann.id} 
                      className={`p-4 rounded-2xl border transition-all ${
                        ann.priority === "High"
                          ? "bg-purple-500/10 border-purple-500/20"
                          : "bg-white/5 border-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded ${
                          ann.priority === "High"
                            ? "bg-purple-500/20 text-purple-300"
                            : "bg-zinc-500/20 text-zinc-400"
                        }`}>
                          {ann.priority} Priority
                        </span>
                        <span className="text-[9px] text-zinc-500 font-medium">{ann.time}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white leading-tight">{ann.title}</h4>
                      <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">{ann.description}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. YOUR DIGITAL BADGE QR MODAL */}
      <AnimatePresence>
        {showQRModal && !showScannedProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-sm glass-premium rounded-[32px] p-6 border border-white/10 shadow-2xl space-y-5 text-center relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5 text-left">
                <div className="flex items-center gap-2">
                  <QrCode size={16} className="text-purple-400" />
                  <h3 className="text-xs font-bold font-display text-white uppercase tracking-wider">Digital Badge QR</h3>
                </div>
                <button 
                  onClick={() => setShowQRModal(false)}
                  className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest font-extrabold cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Glowing High Tech Mock QR Code Image */}
              <div className="relative w-48 h-48 mx-auto bg-white p-3 rounded-2xl border-4 border-purple-500/30 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                {/* Simulated scan line */}
                <div className="absolute left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_10px_rgba(139,92,246,1)] animate-scan z-10" />
                
                {/* Uploaded QR code image */}
                <img 
                  src={user?.personalQrDataUrl || "/user-qr.png"} 
                  alt="User Badge QR" 
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-white leading-tight font-display">{user.name}</h4>
                <p className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest">{user.role}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. SIMULATED PEER DEVICE DECODE OVERLAY */}
      <AnimatePresence>
        {showScannedProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-sm glass-premium rounded-[32px] p-6 border border-white/10 shadow-2xl space-y-5 text-center relative"
            >
              <div className="flex flex-col items-center space-y-1 text-center">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-extrabold">Simulated Scan Stream</span>
                <h3 className="text-sm font-bold font-display text-white uppercase tracking-wider mt-1">Profile Decoded!</h3>
              </div>

              {/* Scanned Card UI details */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-left space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-[8px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded">
                    {user.role}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-semibold font-mono">ID: CS-PEER-88</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Full Name</span>
                  <h4 className="text-lg font-black tracking-wide text-[#a78bfa] drop-shadow-[0_0_12px_rgba(139,92,246,0.35)] uppercase font-display leading-tight">
                    {user.name}
                  </h4>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Organisation</span>
                  <p className="text-xs text-white font-semibold">{user.college || "Mallareddy University"}</p>
                </div>
                
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                  <span>✓</span> Connection Secured and added to Digital Network!
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex gap-2">
                <button
                  onClick={() => {
                    setShowScannedProfile(false);
                    setShowQRModal(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-bold transition-colors cursor-pointer border border-white/5"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    setShowScannedProfile(false);
                    setShowQRModal(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md shadow-purple-600/10"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ==========================================================================
   SUBCOMPONENTS
   ========================================================================== */

// --- EVENT PROGRESS TIMELINE ---
interface TimelineProps {
  stage: EventStage;
  setStage: (stage: EventStage) => void;
}

const EventTimeline: React.FC<TimelineProps> = ({ stage, setStage }) => {
  const steps: { key: EventStage; label: string }[] = [
    { key: "REGISTRATION", label: "Registration" },
    { key: "OPENING", label: "Opening" },
    { key: "HACKING", label: "Hacking" },
    { key: "LUNCH", label: "Lunch" },
    { key: "JUDGING", label: "Judging" },
    { key: "COMPLETED", label: "Closing" },
  ];

  const getStageIndex = (s: EventStage) => steps.findIndex(x => x.key === s);
  const currentIdx = getStageIndex(stage);

  return (
    <div className="glass rounded-[28px] p-5 border border-white/5 space-y-4">
      <div className="flex justify-between items-center px-1">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Event Timeline</h4>
        <span className="text-[10px] text-purple-400 font-medium px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
          Demo: Tap stages to advance
        </span>
      </div>

      <div className="relative flex justify-between items-center pt-2">
        {/* Horizontal Connector Line */}
        <div className="absolute top-[21px] left-4 right-4 h-0.5 bg-zinc-800 z-0">
          <div 
            className="h-full bg-purple-500 transition-all duration-500" 
            style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          
          return (
            <button
              key={step.key}
              onClick={() => setStage(step.key)}
              className="relative z-10 flex flex-col items-center focus:outline-none cursor-pointer group"
            >
              <div 
                className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
                  isDone 
                    ? "bg-purple-600 border-purple-500 text-white" 
                    : isCurrent 
                      ? "bg-[#8B5CF6] border-[#8B5CF6] text-white shadow-neon-purple" 
                      : "bg-[#0B0B0F] border-zinc-800 text-zinc-600 group-hover:border-zinc-700"
                }`}
              >
                {isDone ? "✓" : idx + 1}
              </div>
              <span className={`text-[8px] font-bold mt-2 tracking-wider ${isCurrent ? "text-purple-400" : isDone ? "text-zinc-400" : "text-zinc-600"}`}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- EVENT STATS ---
const EventStats: React.FC<{ stats: HackathonEvent["stats"]; countdown: string; progressPercent: number; milestoneText: string }> = ({ stats, countdown, progressPercent, milestoneText }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Primary Hero countdown Card */}
      <div className="col-span-2 rounded-[28px] glass-premium p-5 border border-white/10 relative overflow-hidden flex flex-col justify-between">
        <div className="absolute -right-8 -bottom-8 p-4 opacity-5 pointer-events-none">
          <Clock size={120} className="text-white" />
        </div>
        
        <div className="flex justify-between items-center w-full z-10">
          <div>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block mr-1.5 animate-ping"></span>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-400">
              Hackathon ends in
            </span>
            <h2 className="text-3xl font-black font-mono tracking-widest text-white mt-1">
              {countdown}
            </h2>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-zinc-800/80 h-2 rounded-full overflow-hidden mt-4 z-10 relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
          />
        </div>

        {/* Milestone info */}
        <div className="flex justify-between items-center text-[10px] font-semibold mt-2.5 z-10 w-full">
          <span className="text-zinc-500">Progress: {progressPercent}%</span>
          <span className="text-[#8B5CF6] font-bold tracking-wide">{milestoneText}</span>
        </div>
      </div>

      {/* Mini stats */}
      <div className="col-span-2 rounded-[24px] glass p-4 border border-white/5 text-center">
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total Teams</p>
        <h4 className="text-2xl font-black font-display text-white mt-1">{stats.teams}</h4>
      </div>
    </div>
  );
};

// --- TRENDING PROJECTS ---
interface TrendingProjectsProps {
  onSelectProject: (projectName: string) => void;
}

const TrendingProjects: React.FC<TrendingProjectsProps> = ({ onSelectProject }) => {
  const trending = [
    { 
      title: "EcoTrace AI", 
      icon: "🌱", 
      tag: "AI Carbon Tracker",
      gradient: "from-emerald-500/15 via-[#0B0B0F] to-[#0B0B0F]",
      hoverBorder: "hover:border-emerald-500/30",
      dotColor: "bg-emerald-400",
      rotate: -1.5 
    },
    { 
      title: "Sovereign Pay", 
      icon: "💳", 
      tag: "Gasless Web3 Pay",
      gradient: "from-blue-500/15 via-[#0B0B0F] to-[#0B0B0F]",
      hoverBorder: "hover:border-blue-500/30",
      dotColor: "bg-blue-400",
      rotate: 1.5 
    },
    { 
      title: "CrewSpace OS", 
      icon: "⚡", 
      tag: "Social Hackathon OS",
      gradient: "from-purple-500/15 via-[#0B0B0F] to-[#0B0B0F]",
      hoverBorder: "hover:border-purple-500/30",
      dotColor: "bg-purple-400",
      rotate: -2 
    },
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Trending Projects</h4>
      <div className="grid grid-cols-3 gap-2 pt-1">
        {trending.map((t, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectProject(t.title)}
            style={{ transform: `rotate(${t.rotate}deg)` }}
            className={`rounded-[22px] p-4 border border-white/5 text-left transition-all flex flex-col justify-between min-h-[105px] cursor-pointer w-full card-tilted-stack bg-gradient-to-br ${t.gradient} ${t.hoverBorder} relative overflow-hidden group`}
          >
            <span className="text-lg z-10">{t.icon}</span>
            <div className="z-10 mt-2">
              <h5 className="text-[10px] font-bold text-white truncate font-display leading-tight">{t.title}</h5>
              <p className="text-[8px] text-[#B3B3B3] truncate mt-0.5">{t.tag}</p>
            </div>
            {/* Glowing Accent Dot */}
            <span className={`absolute bottom-3 right-3 h-1.5 w-1.5 rounded-full ${t.dotColor} shadow-[0_0_10px_currentColor] opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all`} />
          </button>
        ))}
      </div>
    </div>
  );
};

// --- LIVE ACTIVITY TICKER ---
const LiveTicker: React.FC<{ ticker: string[] }> = ({ ticker }) => {
  return (
    <div className="rounded-2xl bg-zinc-950/40 border border-white/5 py-2.5 px-4 overflow-hidden relative flex items-center h-9">
      <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#0B0B0F] to-transparent w-8 z-10" />
      <div className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-[#0B0B0F] to-transparent w-8 z-10" />
      
      <div className="w-max flex items-center gap-8 animate-ticker whitespace-nowrap text-[10px] font-bold text-zinc-400">
        {/* Render ticker items repeated to guarantee seamless wrapping */}
        {[...ticker, ...ticker].map((item, idx) => (
          <span key={idx} className="flex items-center gap-1.5">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

// --- CREATE FEED POST ---
const CreatePostForm: React.FC<{ onPost: (t: string, img?: string) => void; user: UserProfile }> = ({ onPost, user }) => {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onPost(text);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="glass rounded-[28px] p-4 border border-white/5 space-y-3">
      <div className="flex items-start gap-3">
        <img 
          src={user.photoUrl} 
          alt={user.name} 
          className="h-9 w-9 rounded-xl border border-white/10 object-cover" 
        />
        <textarea
          placeholder="Share a project update or ask a question..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          className="flex-1 bg-transparent border-0 text-xs text-white placeholder-zinc-500 focus:outline-none resize-none pt-1"
        />
      </div>

      <div className="pt-2 border-t border-white/5 flex justify-between items-center">
        <button 
          type="button" 
          onClick={() => alert("Image uploads require Firebase storage.")}
          className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1.5 text-[10px] font-semibold cursor-pointer"
        >
          <Image size={14} className="text-purple-400" /> Photo
        </button>
        <button
          type="submit"
          disabled={!text.trim()}
          className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 text-white disabled:text-zinc-600 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Send size={10} /> Post
        </button>
      </div>
    </form>
  );
};

// --- FEED POST CARD ---
const FeedPostCard: React.FC<{ post: FeedPost; onLike: (id: string) => void; onBookmark: (id: string) => void }> = ({ post, onLike, onBookmark }) => {
  const roleBadgeColors: Record<string, string> = {
    Organizer: "bg-purple-500/10 border-purple-500/20 text-purple-300",
    Mentor: "bg-blue-500/10 border-blue-500/20 text-blue-300",
    Judge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
    Participant: "bg-zinc-500/10 border-zinc-500/20 text-zinc-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-3xl p-5 border border-white/5 hover-glow space-y-3"
    >
      {/* Post Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={post.avatar} alt={post.name} className="h-9 w-9 rounded-xl object-cover border border-white/10" />
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-white font-display leading-tight">{post.name}</h4>
              <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${roleBadgeColors[post.role] || "bg-zinc-500/10 text-zinc-400"}`}>
                {post.role}
              </span>
            </div>
            <p className="text-[9px] text-zinc-500 mt-0.5 font-medium">{post.timestamp}</p>
          </div>
        </div>
      </div>

      {/* Post Text */}
      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{post.text}</p>

      {/* Optional Post Image */}
      {post.image && (
        <div className="rounded-2xl overflow-hidden border border-white/5 max-h-48">
          <img src={post.image} alt="Post Attachment" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Reaction Bar */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-zinc-500">
        <button 
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 text-[10px] font-bold p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer ${
            post.liked ? "text-purple-400" : "hover:text-white"
          }`}
        >
          <Heart size={13} className={post.liked ? "fill-purple-400" : ""} />
          <span>{post.likes}</span>
        </button>

        <button 
          onClick={() => onBookmark(post.id)}
          className={`flex items-center gap-1.5 text-[10px] font-bold p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer ${
            post.bookmarked ? "text-purple-400" : "hover:text-white"
          }`}
        >
          <Bookmark size={13} className={post.bookmarked ? "fill-purple-400" : ""} />
          <span>{post.bookmarked ? "Bookmarked" : "Save"}</span>
        </button>

        <button 
          onClick={() => alert("Copied update link to clipboard!")}
          className="flex items-center gap-1.5 text-[10px] font-bold p-1 rounded-lg hover:bg-white/5 transition-colors hover:text-white cursor-pointer"
        >
          <Share2 size={13} />
          <span>Share</span>
        </button>
      </div>
    </motion.div>
  );
};

// --- NETWORKING TAB ---
const NetworkView: React.FC<{ connections: Connection[]; onConnect: (id: string) => void }> = ({ connections, onConnect }) => {
  const [search, setSearch] = useState("");

  const filtered = connections.filter((c) => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.college.toLowerCase().includes(search.toLowerCase()) ||
    c.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold font-display text-white">Find Connections</h2>
        <p className="text-xs text-zinc-500">Scan nearby participants or browse recommendations</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search by name, college, or skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/5 focus:border-purple-500/50 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Cards list */}
      <div className="space-y-4">
        {filtered.map((person) => (
          <div key={person.id} className="glass rounded-[28px] p-5 border border-white/5 hover-glow space-y-4">
            
            {/* Person Bio */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img src={person.photoUrl} alt={person.name} className="h-12 w-12 rounded-2xl object-cover border border-white/10" />
                <div>
                  <h4 className="text-sm font-bold text-white font-display leading-tight">{person.name}</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">{person.college}</p>
                </div>
              </div>

              {/* Status Badge */}
              <span className="px-2 py-0.5 rounded bg-zinc-500/10 border border-zinc-500/20 text-zinc-400 text-[8px] font-bold uppercase tracking-wider">
                {person.role}
              </span>
            </div>

            {/* AI Suggestion Bubble */}
            {person.aiReason && person.status !== "connected" && (
              <div className="p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/10 text-[10px] text-purple-300 font-medium flex items-center gap-1.5">
                <Sparkles size={11} className="text-purple-400" />
                <span>AI Insights: {person.aiReason}</span>
              </div>
            )}

            {/* Skill Tags */}
            <div className="flex flex-wrap gap-1">
              {person.skills.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded-lg bg-white/5 text-zinc-400 text-[9px] font-semibold border border-white/5">
                  {s}
                </span>
              ))}
            </div>

            {/* Connect button */}
            <div className="pt-2 border-t border-white/5 flex justify-end">
              <button
                onClick={() => onConnect(person.id)}
                disabled={person.status !== "connect"}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                  person.status === "connected"
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                    : person.status === "requested"
                      ? "bg-purple-500/20 border border-purple-500/40 text-purple-300"
                      : "bg-[#8B5CF6] hover:bg-purple-500 text-white"
                }`}
              >
                {person.status === "connected" ? (
                  <>
                    <UserCheck size={12} /> Connected
                  </>
                ) : person.status === "requested" ? (
                  "Request Sent"
                ) : (
                  "Connect"
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- TEAM SHOWCASE TAB ---
const ShowcaseView: React.FC<{ 
  projects: TeamProject[]; 
  onLike: (id: string) => void; 
  onBookmark: (id: string) => void;
  search: string;
  setSearch: (search: string) => void;
}> = ({ projects, onLike, onBookmark, search, setSearch }) => {

  const filtered = projects.filter((p) =>
    p.projectName.toLowerCase().includes(search.toLowerCase()) ||
    p.teamName.toLowerCase().includes(search.toLowerCase()) ||
    p.techStack.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold font-display text-white">Project Showcase</h2>
        <p className="text-xs text-zinc-500">Explore team projects and view updates</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search projects or tech stacks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/5 focus:border-purple-500/50 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Projects List */}
      <div className="space-y-5">
        {filtered.map((proj) => (
          <div key={proj.id} className="glass rounded-[28px] overflow-hidden border border-white/5 hover-glow">
            
            {/* Gradient Header Banner */}
            <div className={`w-full h-24 bg-gradient-to-r ${proj.bannerColor} p-5 flex flex-col justify-end border-b border-white/5`}>
              <span className="text-[8px] uppercase tracking-widest font-extrabold text-zinc-400">Team: {proj.teamName}</span>
              <h3 className="text-lg font-black font-display text-white mt-1">{proj.projectName}</h3>
            </div>

            {/* Details */}
            <div className="p-5 space-y-4">
              {/* Problem */}
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Problem Statement</p>
                <p className="text-xs text-zinc-300 leading-relaxed">{proj.problemStatement}</p>
              </div>

              {/* Members */}
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Team Members</p>
                <p className="text-xs text-zinc-400 font-medium">{proj.members.join(", ")}</p>
              </div>

              {/* Tech stack */}
              <div className="flex flex-wrap gap-1">
                {proj.techStack.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-lg bg-white/5 text-purple-300 text-[9px] font-semibold border border-purple-500/10">
                    {t}
                  </span>
                ))}
              </div>

              {/* Latest update log */}
              {proj.updates.length > 0 && (
                <div className="p-3 rounded-xl bg-zinc-950/40 border border-white/5 text-[10px] text-zinc-400 space-y-1">
                  <span className="font-bold text-white text-[9px] tracking-wider uppercase block">Latest Milestone</span>
                  <div className="flex items-start gap-1.5">
                    <span className="text-purple-400 mt-0.5">✓</span>
                    <p>{proj.updates[0]}</p>
                  </div>
                </div>
              )}

              {/* Links & Reaction Footer */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                {/* External links */}
                <div className="flex gap-2">
                  <a 
                    href={proj.githubUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all"
                  >
                    <GithubIcon />
                  </a>
                  <a 
                    href={proj.demoUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-[#8B5CF6] border border-purple-500/30 text-purple-300 hover:text-white transition-all text-[10px] font-bold flex items-center gap-1"
                  >
                    <ExternalLink size={10} /> Live Demo
                  </a>
                </div>

                {/* Reaction Likes */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => onLike(proj.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border transition-all text-[10px] font-bold cursor-pointer ${
                      proj.liked 
                        ? "bg-purple-500/15 border-purple-500/30 text-purple-300"
                        : "bg-white/5 border-white/5 text-zinc-500 hover:text-white"
                    }`}
                  >
                    <Heart size={11} className={proj.liked ? "fill-purple-400" : ""} />
                    <span>{proj.likes}</span>
                  </button>

                  <button 
                    onClick={() => onBookmark(proj.id)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      proj.bookmarked 
                        ? "bg-purple-500/15 border-purple-500/30 text-purple-300"
                        : "bg-white/5 border-white/5 text-zinc-500 hover:text-white"
                    }`}
                  >
                    <Bookmark size={11} className={proj.bookmarked ? "fill-purple-400" : ""} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

// --- JURY TAB ---
const JuryView: React.FC<{ mentors: JuryMentor[]; onRequest: (id: string) => void }> = ({ mentors, onRequest }) => {
  const [selectedJudgeId, setSelectedJudgeId] = useState<string | null>(null);

  const selectedJudge = mentors.find((m) => m.id === selectedJudgeId);

  if (selectedJudge) {
    return (
      <div className="space-y-6">
        {/* Back navigation */}
        <button
          onClick={() => setSelectedJudgeId(null)}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="rotate-180">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          Back to Judges List
        </button>

        {/* Highlighted Profile Details Card */}
        <div className="glass rounded-[32px] p-6 border border-white/10 shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#8B5CF6]/50 to-transparent" />
          
          {/* Availability and Main Highlighted Name */}
          <div className="flex flex-col items-center text-center space-y-3">
            <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase border tracking-wider flex items-center gap-1 ${
              selectedJudge.availability === "Available"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}>
              {selectedJudge.availability}
            </span>

            <div className="space-y-1">
              {/* Highlighted Name */}
              <h3 className="text-2xl font-black font-display tracking-wide text-[#a78bfa] drop-shadow-[0_0_15px_rgba(139,92,246,0.45)] uppercase">
                {selectedJudge.name}
              </h3>
              <p className="text-xs text-purple-400 font-bold uppercase tracking-widest">
                {selectedJudge.company}
              </p>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="space-y-1 text-left">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Role / Designation</span>
              <p className="text-sm font-semibold text-zinc-200">{selectedJudge.designation}</p>
            </div>

            <div className="space-y-1 text-left">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Organisation</span>
              <p className="text-sm font-semibold text-zinc-200">{selectedJudge.company}</p>
            </div>

            <div className="space-y-2 text-left">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">LinkedIn Profile</span>
              <a 
                href={selectedJudge.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-xs font-semibold text-blue-400 hover:text-blue-300 w-full"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="flex-shrink-0">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                <span className="truncate underline">{selectedJudge.linkedin}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold font-display text-white">Jury & Mentors</h2>
        <p className="text-xs text-zinc-500">Tap View Profile to explore their credentials and portfolios</p>
      </div>

      <div className="space-y-3 pt-2">
        {mentors.map((jury) => (
          <div 
            key={jury.id}
            className="rounded-3xl glass p-4 border border-white/5 flex items-center justify-between hover-glow transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="text-left">
                <h4 className="text-sm font-bold text-white font-display tracking-wide">{jury.name}</h4>
                <p className="text-[10px] text-zinc-500 font-medium">
                  {jury.designation} at {jury.company}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedJudgeId(jury.id)}
              className="px-3.5 py-1.5 bg-[#8B5CF6]/15 hover:bg-[#8B5CF6] border border-[#8B5CF6]/30 hover:border-transparent text-purple-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              View Profile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- FEEDBACK TAB ---
interface FeedbackProps {
  role: UserRole;
  onSubmit: (stars: number, emoji: string, comments: string) => void;
  submitted: boolean;
}

const FeedbackView: React.FC<FeedbackProps> = ({ role, onSubmit, submitted }) => {
  const [stars, setStars] = useState(5);
  const [activeEmoji, setActiveEmoji] = useState("😎");
  const [comments, setComments] = useState("");

  const emojis = ["😡", "🙁", "😐", "🙂", "😎"];

  // Role-specific questions
  const roleQuestions: Record<UserRole, string[]> = {
    Participant: [
      "How would you rate the WiFi stability during building?",
      "Rate the quality of organizing team assistance.",
      "Any suggestions for mentoring improvements?",
    ],
    Mentor: [
      "How would you rate the technical standards of hackathon teams?",
      "How was the support for the mentors' lounge and food?",
      "Feedback for organizer scheduling coordination?",
    ],
    Judge: [
      "How would you rate the user interface and project evaluation flow?",
      "How would you rate the standard of team pitches overall?",
      "Any complaints regarding scoring timelines?",
    ],
  };

  const questions = roleQuestions[role] || roleQuestions.Participant;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(stars, activeEmoji, comments);
  };

  if (submitted) {
    return (
      <div className="glass rounded-[32px] p-8 text-center border border-white/5 space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
          ✓
        </div>
        <h3 className="text-lg font-bold font-display text-white">Feedback Submitted!</h3>
        <p className="text-xs text-zinc-500 leading-relaxed max-w-[240px] mx-auto">
          Thank you for providing evaluations. Your feedback helps organizers improve future technical events.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold font-display text-white">Event Feedback</h2>
        <p className="text-xs text-zinc-500">Dynamic questions tailored for you as a <span className="text-purple-400 font-semibold">{role}</span></p>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-[32px] p-6 border border-white/5 space-y-6">
        
        {/* Emoji scale */}
        <div className="space-y-2">
          <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold block text-center">
            Overall Experience
          </label>
          <div className="flex justify-between items-center px-6">
            {emojis.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setActiveEmoji(em)}
                className={`text-3xl p-1.5 rounded-2xl hover:bg-white/5 transition-all transform cursor-pointer ${
                  activeEmoji === em ? "bg-purple-500/25 border border-purple-500/30 scale-110" : "scale-100"
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        {/* Stars */}
        <div className="space-y-2">
          <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold block text-center">
            Stars Evaluation
          </label>
          <div className="flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setStars(val)}
                className="p-1 cursor-pointer transition-transform hover:scale-110"
              >
                <Star 
                  size={24} 
                  className={val <= stars ? "text-purple-400 fill-purple-400" : "text-zinc-600"} 
                />
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Questions */}
        <div className="space-y-4 pt-2 border-t border-white/5">
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Evaluations ({role})</h4>
          <ul className="space-y-3">
            {questions.map((q, idx) => (
              <li key={idx} className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-500">QUESTION {idx + 1}</span>
                <p className="text-xs text-white leading-relaxed">{q}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Textbox */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Write Comments</label>
          <textarea
            placeholder="Write details or requests..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            className="w-full bg-white/5 border border-white/5 focus:border-[#8B5CF6]/50 rounded-xl p-3 text-xs text-white focus:outline-none transition-colors"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3 px-4 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-md cursor-pointer"
        >
          Submit Feedback
        </button>

      </form>
    </div>
  );
};

// --- PROFILE TAB ---
interface ProfileViewProps {
  user: UserProfile;
  eventState: HackathonEvent;
  onMemoriesToggle: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, eventState, onMemoriesToggle }) => {
  const { updateProfile } = useMockDb();
  const [showCertViewer, setShowCertViewer] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit form states
  const [name, setName] = useState(user.name);
  const [college, setCollege] = useState(user.college || "");
  const [role, setRole] = useState<UserRole>(user.role);
  const [teamName, setTeamName] = useState(user.teamName || "");
  const [linkedinUrl, setLinkedinUrl] = useState(user.linkedinUrl || "");
  const [githubUrl, setGithubUrl] = useState(user.githubUrl || "");
  const [formError, setFormError] = useState("");

  const certificatesAvailable = eventState.stage === "COMPLETED";

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setFormError("Please enter your name.");
    if (!college.trim()) return setFormError("Please enter your college.");
    if (role === "Participant" && !teamName.trim()) {
      return setFormError("Participants require a Team Name.");
    }
    if (!linkedinUrl.trim()) return setFormError("Please enter your LinkedIn profile link.");
    if (!githubUrl.trim()) return setFormError("Please enter your GitHub profile link.");

    setFormError("");
    updateProfile({
      name,
      college,
      role,
      teamName: role === "Participant" ? teamName : undefined,
      linkedinUrl: linkedinUrl.trim(),
      githubUrl: githubUrl.trim(),
    });
    setShowEditModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Profile Hero */}
      <div className="glass rounded-[32px] p-6 border border-white/5 space-y-4 text-center relative overflow-hidden">
        {/* Edit profile button */}
        <button
          onClick={() => {
            setName(user.name);
            setCollege(user.college || "");
            setRole(user.role);
            setTeamName(user.teamName || "");
            setLinkedinUrl(user.linkedinUrl || "");
            setGithubUrl(user.githubUrl || "");
            setFormError("");
            setShowEditModal(true);
          }}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer z-10"
          title="Edit Profile"
        >
          <Edit2 size={14} />
        </button>

        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Users size={96} className="text-white" />
        </div>

        <div className="flex flex-col items-center">
          <img src={user.photoUrl} alt={user.name} className="h-20 w-20 rounded-3xl object-cover border-2 border-[#8B5CF6] shadow-xl shadow-purple-600/10 mb-3" />
          <h3 className="text-xl font-bold font-display text-white leading-tight">{user.name}</h3>
          <p className="text-xs text-zinc-500 mt-1">{user.college}</p>
          <span className="px-2.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[8px] font-extrabold uppercase tracking-widest w-fit mt-3">
            {user.role}
          </span>

          {/* Social Links */}
          {(user.linkedinUrl || user.githubUrl) && (
            <div className="flex justify-center gap-3 mt-4 z-10 relative">
              {user.linkedinUrl && (
                <a
                  href={user.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-[10px] font-bold text-blue-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  LinkedIn
                </a>
              )}
              {user.githubUrl && (
                <a
                  href={user.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-white/10 hover:bg-zinc-700 transition-all text-[10px] font-bold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <GithubIcon />
                  GitHub
                </a>
              )}
            </div>
          )}
        </div>

        {/* Short stats bar */}
        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5 text-center">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Events</span>
            <span className="text-sm font-extrabold text-white mt-0.5 block">1</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Connections</span>
            <span className="text-sm font-extrabold text-white mt-0.5 block">{eventState.stats.connections}</span>
          </div>
        </div>
      </div>


      {/* Memory Subpage button */}
      <button
        onClick={onMemoriesToggle}
        className="w-full py-4 px-5 rounded-[24px] bg-gradient-to-tr from-purple-950/30 to-indigo-950/20 hover:from-purple-900/40 border border-purple-500/20 hover:border-purple-500/35 text-white flex justify-between items-center transition-all group cursor-pointer"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
            <Trophy size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold font-display text-white">Event Memories</h4>
            <p className="text-[10px] text-zinc-500 mt-0.5">Explore winners, photo grid, and certificates</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
      </button>

      {/* Certificates Section */}
      <div className="glass rounded-[28px] p-5 border border-white/5 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 px-1">Certificates</h4>
          {!certificatesAvailable && (
            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5">
              Unlocked at closing
            </span>
          )}
        </div>

        {certificatesAvailable ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                <FileText size={20} />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">HackFest 2026 Certificate</h5>
                <p className="text-[9px] text-zinc-400 mt-0.5">Role: {user.role} Certification</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowCertViewer(true)}
              className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download size={14} /> Preview & Download
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border border-dashed border-white/10 text-center text-zinc-600 text-xs">
            🔒 Certificates will be generated once organizers declare HackFest 2026 complete.
          </div>
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
              className="w-full max-w-md rounded-t-[36px] glass-premium border-t border-white/15 p-8 pb-10 space-y-6 shadow-2xl relative text-left"
            >
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-2" />

              <div className="text-center">
                <h3 className="text-xl font-bold text-white font-display">Edit Profile</h3>
                <p className="text-xs text-zinc-500 mt-1">Update your hacker credentials</p>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <ShieldAlert size={14} className="flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Name Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Your Name</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Alex Rivera"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 focus:border-[#8B5CF6]/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* College / Organisation Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                    {role === "Participant" ? "College / University" : "Organisation"}
                  </label>
                  <div className="relative">
                    <Award size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder={role === "Participant" ? "Stanford University" : "e.g. Google, Sequoia"}
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 focus:border-[#8B5CF6]/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Role Switcher */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold block">Your Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Participant", "Mentor", "Judge"] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          role === r
                            ? "bg-[#8B5CF6] border-[#8B5CF6] text-white shadow-md shadow-purple-600/10"
                            : "bg-white/5 border-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team Name - Conditional for Participant */}
                {role === "Participant" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5"
                  >
                    <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Team Name</label>
                    <div className="relative">
                      <Sparkles size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B5CF6]" />
                      <input
                        type="text"
                        placeholder="Pixel Pioneers"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 focus:border-[#8B5CF6]/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-650 focus:outline-none transition-colors"
                      />
                    </div>
                  </motion.div>
                )}

                {/* LinkedIn Link */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold block">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 focus:border-[#8B5CF6]/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
                  />
                </div>

                {/* GitHub Link */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold block">GitHub Profile URL</label>
                  <input
                    type="url"
                    placeholder="https://github.com/username"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 focus:border-[#8B5CF6]/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
                  />
                </div>

                {/* Form Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border border-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. CERTIFICATE PREVIEW MODAL */}
      <AnimatePresence>
        {showCertViewer && (
          <CertificateModal onClose={() => setShowCertViewer(false)} user={user} eventState={eventState} />
        )}
      </AnimatePresence>

    </div>
  );
};

// --- CERTIFICATE PREVIEW & PRINT MODAL ---
interface CertModalProps {
  onClose: () => void;
  user: UserProfile;
  eventState: HackathonEvent;
}

const CertificateModal: React.FC<CertModalProps> = ({ onClose, user, eventState }) => {
  const printCertificate = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-center items-center p-4 backdrop-blur-md"
    >
      <div className="w-full max-w-lg flex flex-col gap-4">
        
        {/* Header toolbar */}
        <div className="flex justify-between items-center text-white px-2">
          <h4 className="text-sm font-bold font-display">Certificate View</h4>
          <button 
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-white bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Certificate Container (Custom Printable Pass layout) */}
        <div className="certificate-print w-full border border-[#8B5CF6]/30 bg-[#0B0B0F] p-8 rounded-3xl relative overflow-hidden flex flex-col items-center justify-between text-center min-h-[350px] shadow-2xl">
          
          {/* Decorative Corner vector */}
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Award size={180} className="text-white" />
          </div>
          <div className="absolute top-6 left-6 right-6 bottom-6 border border-[#8B5CF6]/10 rounded-2xl pointer-events-none" />

          {/* Heading */}
          <div className="space-y-1 z-10">
            <span className="text-[9px] uppercase tracking-widest text-[#8B5CF6] font-black">CREWSPACE OFFICIATING CERTIFICATION</span>
            <h2 className="text-2xl font-black text-white font-display mt-2">CERTIFICATE OF EXCELLENCE</h2>
          </div>

          {/* Body */}
          <div className="space-y-2 z-10 max-w-[280px]">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">This is certified to</p>
            <h3 className="text-xl font-bold font-display text-white underline decoration-[#8B5CF6]/50 decoration-2 underline-offset-4">{user.name}</h3>
            <p className="text-[10px] text-zinc-400 leading-relaxed mt-2">
              for outstanding participation as a <span className="text-[#8B5CF6] font-bold">{user.role}</span> in the 36-hour physical hackathon <span className="text-white font-bold">{eventState.name}</span>.
            </p>
          </div>

          {/* Footer details */}
          <div className="w-full flex justify-between items-end z-10 pt-4 px-2">
            <div className="text-left">
              <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Event Venue</p>
              <p className="text-[9px] text-white font-semibold">{eventState.venue}</p>
            </div>
            
            <div className="text-right">
              <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Date Completed</p>
              <p className="text-[9px] text-white font-semibold">{eventState.date}</p>
            </div>
          </div>

        </div>

        {/* CTA Print Button */}
        <button
          onClick={printCertificate}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-600/10 transition-colors cursor-pointer"
        >
          <Download size={14} /> Download Certificate (Print PDF)
        </button>

      </div>
    </motion.div>
  );
};

// --- STATIC EVENT VENUE MAP OVERLAY ---
const StaticMapOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-center items-center p-4 backdrop-blur-md"
    >
      <div className="w-full max-w-sm flex flex-col gap-4">
        
        <div className="flex justify-between items-center text-white px-1">
          <h3 className="text-base font-bold font-display flex items-center gap-1.5">
            <Map size={16} className="text-[#8B5CF6]" /> Innovation Hub Map
          </h3>
          <button 
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-white px-2 py-1 bg-white/5 border border-white/5 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Vector SVG Mock Venue layout */}
        <div className="w-full bg-[#0B0B0F] border border-white/10 rounded-3xl p-6 relative overflow-hidden min-h-[350px] shadow-2xl flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[8px] uppercase tracking-widest text-[#8B5CF6] font-bold">Static layout map</span>
            <h4 className="text-sm font-bold text-white font-display">Event Floor Plan</h4>
          </div>

          {/* Graphical representation */}
          <div className="flex-1 flex flex-col justify-center gap-4 my-6">
            
            {/* Hall A */}
            <div className="border border-purple-500/20 bg-purple-500/5 rounded-2xl p-3 flex justify-between items-center">
              <div>
                <h5 className="text-xs font-bold text-white font-display">Hall A: Hacking Arena</h5>
                <p className="text-[9px] text-zinc-500">Hacking Tables, Coffee Bar, Help Desk</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[8px] font-bold">Tables 1-50</span>
            </div>

            {/* Hall B */}
            <div className="border border-blue-500/20 bg-blue-500/5 rounded-2xl p-3 flex justify-between items-center">
              <div>
                <h5 className="text-xs font-bold text-white font-display">Hall B: Mentor Hub</h5>
                <p className="text-[9px] text-zinc-500">Jury Room, Restrooms, Workshop Area</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[8px] font-bold">Evaluation</span>
            </div>

            {/* Dining Lounge */}
            <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-3 flex justify-between items-center">
              <div>
                <h5 className="text-xs font-bold text-white font-display">Dining Hall & Lounge</h5>
                <p className="text-[9px] text-zinc-500">Food Counter, Drinks, Power Outlets</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[8px] font-bold">Pizza</span>
            </div>

          </div>

          {/* Footer note */}
          <div className="text-[9px] text-zinc-600 leading-relaxed flex items-center justify-between border-t border-white/5 pt-3">
            <span>SSID: CrewSpace_5G</span>
            <span>Emergency exit at the south side</span>
          </div>

        </div>

      </div>
    </motion.div>
  );
};

// --- EVENT MEMORIES PAGE / OVERLAY ---
interface MemoriesOverlayProps {
  onClose: () => void;
  user: UserProfile;
}

const EventMemoriesOverlay: React.FC<MemoriesOverlayProps> = ({ onClose, user }) => {
  const gallery = [
    { type: "image", url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&auto=format&fit=crop&q=80", title: "Kickoff Ceremony" },
    { type: "image", url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&auto=format&fit=crop&q=80", title: "Working through the night" },
    { type: "image", url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80", title: "Mentor Checkpoint" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-[#0B0B0F] flex flex-col p-4 overflow-y-auto"
    >
      <div className="w-full max-w-md mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex justify-between items-center text-white pt-4">
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Trophy size={20} className="text-[#8B5CF6]" /> Event Memories
          </h2>
          <button 
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-white px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg transition-colors cursor-pointer"
          >
            Back
          </button>
        </div>

        {/* Nostalgic welcome banner */}
        <div className="p-5 rounded-[28px] bg-gradient-to-tr from-purple-950/20 to-indigo-950/10 border border-purple-500/25 relative overflow-hidden">
          <h3 className="text-sm font-bold text-white font-display">HackFest 2026 Completed!</h3>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            The hacking is over, but the memories stay. Revisit photo feeds, winner announcements, and access certificates.
          </p>
        </div>

        {/* Winners Section */}
        <div className="glass rounded-[28px] p-5 border border-white/5 space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#8B5CF6]">🏆 Event Winners</h4>
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
            <div>
              <span className="text-[9px] text-[#22C55E] font-bold block uppercase tracking-wide">First Place</span>
              <h5 className="text-xs font-bold text-white">EcoTrace AI</h5>
              <p className="text-[9px] text-zinc-500 mt-0.5">Team: Alpha Crew (Priya & Rohan)</p>
            </div>
            <span className="text-xl">🥇</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
            <div>
              <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wide">Second Place</span>
              <h5 className="text-xs font-bold text-white">Sovereign Pay</h5>
              <p className="text-[9px] text-zinc-500 mt-0.5">Team: DeFi Wizards (Kabir)</p>
            </div>
            <span className="text-xl">🥈</span>
          </div>
        </div>

        {/* Photo Gallery Grid */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 px-1">📷 Captured Moments</h4>
          <div className="grid grid-cols-2 gap-3">
            {gallery.map((g, idx) => (
              <div key={idx} className="rounded-2xl overflow-hidden border border-white/5 bg-zinc-900 relative group min-h-[120px] flex flex-col justify-end">
                <img src={g.url} alt={g.title} className="absolute inset-0 w-full h-full object-cover filter brightness-75 group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <span className="relative z-10 p-3 text-[10px] font-bold text-white leading-tight block">
                  {g.title}
                </span>
              </div>
            ))}
            
            {/* Simulated Video Play Card */}
            <div className="rounded-2xl overflow-hidden border border-white/5 bg-gradient-to-tr from-purple-950 to-indigo-950 relative min-h-[120px] flex flex-col justify-center items-center text-center cursor-pointer hover:border-purple-500/30 transition-colors">
              <div className="p-2 rounded-full bg-white/10 text-white mb-1.5 flex items-center justify-center">
                <Play size={14} className="fill-white pl-0.5" />
              </div>
              <span className="text-[9px] font-bold text-zinc-400 tracking-wider uppercase block">Highlight Reel</span>
              <span className="text-[8px] text-zinc-500">2 min recap</span>
            </div>
          </div>
        </div>

        {/* Certificates Quick Access */}
        <div className="glass rounded-[28px] p-5 border border-white/5 space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 px-1">📄 Certification</h4>
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center text-xs">
            <div>
              <p className="font-semibold text-white">Your Certificate</p>
              <p className="text-[9px] text-zinc-500 mt-0.5">Role: {user.role}</p>
            </div>
            <button 
              onClick={() => alert("Please open Certificate Preview from the Profile Tab.")}
              className="px-3 py-1 bg-purple-500/20 hover:bg-[#8B5CF6] text-purple-300 hover:text-white transition-all rounded-lg text-[9px] font-bold cursor-pointer"
            >
              Get PDF
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
