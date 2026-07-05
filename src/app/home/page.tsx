"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMockDb, UserRole } from "@/lib/mockDb";
import { QrCode, MapPin, Calendar, Clock, Sparkles, User, Award, ShieldAlert, LogOut } from "lucide-react";

export default function HomePage() {
  const { user, eventState, completeOnboarding, isOnboarded, logout, verifyEventCode } = useMockDb();
  const [qrScanned, setQrScanned] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [showOnboard, setShowOnboard] = useState(false);
  const router = useRouter();

  // Onboarding Form States
  const [name, setName] = useState(user?.name || "");
  const [college, setCollege] = useState("");
  const [teamName, setTeamName] = useState("");
  const [role, setRole] = useState<UserRole>(user?.role || "Participant");
  const [formError, setFormError] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  // Redirect to login if user is not authenticated, or to space if already onboarded
  useEffect(() => {
    if (!user) {
      router.push("/");
    } else if (isOnboarded) {
      router.push("/space");
    }
  }, [user, isOnboarded, router]);

  // Sync user name and role when loaded
  useEffect(() => {
    if (user) {
      const timeout = window.setTimeout(() => {
        if (user.name) setName(user.name);
        if (user.role) setRole(user.role);
      }, 0);
      return () => window.clearTimeout(timeout);
    }
  }, [user]);
  const [manualCode, setManualCode] = useState("");
  const [manualCodeError, setManualCodeError] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const handleManualCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setIsVerifyingCode(true);
    setManualCodeError("");

    try {
      const result = await verifyEventCode(manualCode);
      setIsVerifyingCode(false);
      if (result.ok) {
        setScanSuccess(true);
        setTimeout(() => {
          setQrScanned(true);
        }, 1000);
      } else {
        setManualCodeError(result.message || "Invalid event code. Please check your credentials.");
      }
    } catch {
      setIsVerifyingCode(false);
      setManualCodeError("Could not verify the event. Please try again.");
    }
  };

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const autoMatchTimerRef = React.useRef<number | null>(null);

  const startRealCamera = async () => {
    if (cameraActive) return;
    try {
      setIsScanning(true);
      setScanSuccess(false);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      setCameraStream(stream);
      setCameraActive(true);

      // Auto-match after 3.5 seconds of showing the camera stream
      autoMatchTimerRef.current = window.setTimeout(() => {
        setIsScanning(false);
        setScanSuccess(true);
        // stop camera
        stream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
        setCameraActive(false);

        // Show event card details
        setTimeout(() => {
          setQrScanned(true);
        }, 1000);
      }, 3500);

    } catch (err) {
      console.error("Camera access error:", err);
      alert("Could not access camera. Please check your browser permissions.");
      setIsScanning(false);
    }
  };

  const stopRealCamera = () => {
    if (autoMatchTimerRef.current) {
      window.clearTimeout(autoMatchTimerRef.current);
      autoMatchTimerRef.current = null;
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (cameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraActive, cameraStream]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (autoMatchTimerRef.current) window.clearTimeout(autoMatchTimerRef.current);
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const simulateScan = (success: boolean) => {
    stopRealCamera();
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      if (success) {
        setScanSuccess(true);
        // Show event card details
        setTimeout(() => {
          setQrScanned(true);
        }, 1000);
      } else {
        alert("Invalid QR code. Please try scanning the CrewSpace Event QR.");
      }
    }, 1500);
  };

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setFormError("Please enter your name.");
    if (!college.trim()) return setFormError("Please enter your college.");
    if (role === "Participant" && !teamName.trim()) {
      return setFormError("Participants require a Team Name.");
    }
    if (!linkedinUrl.trim()) {
      return setFormError("Please enter your LinkedIn profile link.");
    }
    if (!githubUrl.trim()) {
      return setFormError("Please enter your GitHub profile link.");
    }

    setFormError("");
    completeOnboarding({
      name,
      college,
      teamName: role === "Participant" ? teamName : undefined,
      role,
      linkedinUrl: linkedinUrl.trim(),
      githubUrl: githubUrl.trim(),
    });
    // The redirect is handled by the useEffect above
  };

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 relative min-h-screen">
      
      {/* Logout button at top right */}
      <button 
        onClick={logout} 
        className="absolute top-6 right-6 text-zinc-500 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer border border-white/5"
      >
        <LogOut size={14} /> Log Out
      </button>

      <AnimatePresence mode="wait">
        {!qrScanned ? (
          /* 1. SCANNER VIEW (FIRST PAGE) */
          <motion.div
            key="scanner-view"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm flex flex-col items-center space-y-6 z-10"
          >
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display text-white">
                Scan Event QR
              </h2>
            </div>

            {/* Viewfinder box with laser line (Interactive click for real webcam) */}
            <div 
              onClick={startRealCamera}
              className={`relative w-72 h-72 rounded-[32px] overflow-hidden border bg-black/60 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                cameraActive 
                  ? "border-purple-500 shadow-[0_0_20px_rgba(139,92,246,0.3)] animate-none" 
                  : "border-white/10 hover:border-purple-500/50"
              }`}
            >
              {/* Live Webcam stream */}
              {cameraActive && (
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  muted
                  className="absolute inset-0 w-full h-full object-cover" 
                />
              )}

              {/* Simulated scan line */}
              {isScanning && (
                <div className="absolute left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_15px_rgba(139,92,246,1)] animate-scan z-10" />
              )}

              {/* Overlaid texts and status */}
              <div className="text-center p-6 select-none z-20 relative">
                {scanSuccess ? (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-purple-400 font-display font-semibold flex flex-col items-center gap-2 bg-black/60 px-4 py-2.5 rounded-2xl backdrop-blur-sm"
                  >
                    <span className="text-4xl">🚀</span>
                    Event Matched!
                  </motion.div>
                ) : cameraActive ? (
                  null
                ) : isScanning ? (
                  <div className="text-zinc-400 text-xs flex flex-col items-center gap-2.5 bg-black/40 p-4 rounded-2xl backdrop-blur-sm">
                    <QrCode size={40} className="animate-pulse text-[#8B5CF6]" />
                    <span className="font-semibold text-zinc-300">Click Square to Start Camera</span>
                  </div>
                ) : (
                  <div className="text-zinc-500 text-xs">Scanner Offline</div>
                )}
              </div>

              {/* Viewfinder brackets */}
              <div className="absolute top-6 left-6 w-6 h-6 border-t-2 border-l-2 border-purple-500 rounded-tl-lg z-20" />
              <div className="absolute top-6 right-6 w-6 h-6 border-t-2 border-r-2 border-purple-500 rounded-tr-lg z-20" />
              <div className="absolute bottom-6 left-6 w-6 h-6 border-b-2 border-l-2 border-purple-500 rounded-bl-lg z-20" />
              <div className="absolute bottom-6 right-6 w-6 h-6 border-b-2 border-r-2 border-purple-500 rounded-br-lg z-20" />
            </div>

            {/* OR separator */}
            <div className="flex items-center w-full gap-3 select-none">
              <div className="h-[1px] flex-1 bg-white/10" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold">OR</span>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>

            {/* Manual Code Input Form */}
            <form onSubmit={handleManualCodeSubmit} className="w-full space-y-3">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold block text-center">
                  Enter Code Manually
                </label>
                <div className="relative flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. HACKFEST2026"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-white/5 border border-white/5 focus:border-[#8B5CF6]/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-700 font-mono tracking-wider focus:outline-none transition-colors uppercase text-center"
                  />
                  <button
                    type="submit"
                    disabled={isVerifyingCode || !manualCode.trim()}
                    className="px-4 py-2.5 bg-[#8B5CF6] hover:bg-purple-500 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center min-w-[70px]"
                  >
                    {isVerifyingCode ? (
                      <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      "Submit"
                    )}
                  </button>
                </div>
              </div>
              {manualCodeError && (
                <p className="text-[10px] text-red-400 text-center font-semibold mt-1">
                  {manualCodeError}
                </p>
              )}
            </form>

            {/* Simulation buttons */}
            <div className="w-full flex gap-3">
              <button
                onClick={() => simulateScan(true)}
                disabled={!isScanning}
                className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md shadow-purple-600/10 cursor-pointer disabled:opacity-50"
              >
                Demo QR Code
              </button>
              <button
                onClick={logout}
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/5 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        ) : (
          /* 2. PASSES VIEW (SHOWN AFTER SUCCESSFUL SCAN) */
          <motion.div
            key="passes-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm flex flex-col items-center"
          >
            {/* Title with Tickmark (Event Found) */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display text-white">
                Event Found
              </h2>
              <p className="text-xs text-zinc-500 mt-1">Tap the card to join the digital event space</p>
            </div>

            {/* APPLE WALLET JOIN EVENT CARD */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-full rounded-[32px] glass-premium p-6 relative overflow-hidden border border-white/15 cursor-pointer shadow-2xl"
              onClick={() => setShowOnboard(true)}
            >
              {/* Pass Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-ping"></span>
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-purple-400">
                    {eventState.status} Pass
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono tracking-wider">CREWSPACE #2026</div>
              </div>

              {/* Custom Uploaded Pass Image */}
              <div className="w-full rounded-2xl border border-white/10 overflow-hidden mb-6 relative shadow-inner">
                <img 
                  src="/talent-hunt-pass.png" 
                  alt="Talent Hunt 2K26 Vynedam Pass" 
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Details List */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-zinc-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Venue</p>
                    <p className="text-xs text-white truncate font-medium">{eventState.venue}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-zinc-500 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Date</p>
                    <p className="text-xs text-white font-medium">{eventState.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-purple-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-purple-400 uppercase tracking-wider font-bold">Hackathon ends in</p>
                    <p className="text-base font-extrabold text-white font-mono tracking-wider">{eventState.countdown}</p>
                  </div>
                </div>
              </div>

              {/* Join CTA */}
              <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                <div className="text-[10px] text-zinc-500">Click Join to Check-in</div>
                <button className="px-4 py-2 bg-[#8B5CF6] hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-600/20 glow-btn transition-colors cursor-pointer">
                  <Sparkles size={14} /> Join Event
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. ONBOARDING SLIDE-UP SHEET MODAL */}
      <AnimatePresence>
        {showOnboard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
              className="w-full max-w-md rounded-t-[36px] glass-premium border-t border-white/15 p-8 pb-10 space-y-6 shadow-2xl relative"
            >
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-2" />

              <div className="text-center">
                <h3 className="text-xl font-bold text-white font-display">Quick Check-in</h3>
                <p className="text-xs text-zinc-500 mt-1">Get into the hackathon space in 10 seconds</p>
              </div>

              <form onSubmit={handleOnboardSubmit} className="space-y-4">
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
                        className="w-full bg-white/5 border border-white/5 focus:border-[#8B5CF6]/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
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

                {/* Done CTA */}
                <button
                  type="submit"
                  className="w-full py-3 px-4 mt-2 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-sm transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg cursor-pointer"
                >
                  Done. Enter CrewSpace
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
