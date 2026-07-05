"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMockDb, UserRole } from "@/lib/mockDb";
import { Terminal, Sparkles } from "lucide-react";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
  </svg>
);

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const PhoneIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState<"google" | "github" | "phone" | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("Participant");
  const { login, user } = useMockDb();
  const router = useRouter();

  // Mobile Phone OTP Sim States
  const [showMobileInput, setShowMobileInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");

  // Splash screen timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  // Redirect if user is already logged in and not splash
  useEffect(() => {
    if (!showSplash && user) {
      router.push("/home");
    }
  }, [showSplash, user, router]);

  const handleLogin = async (provider: "google" | "github" | "phone") => {
    setIsLoggingIn(provider);
    try {
      await login(provider, selectedRole);
      setIsLoggingIn(null);
      router.push("/home");
    } catch {
      setIsLoggingIn(null);
    }
  };

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || phoneNumber.length < 8) {
      setOtpError("Please enter a valid phone number");
      return;
    }
    setOtpError("");
    setIsLoggingIn("phone");
    setTimeout(() => {
      setIsLoggingIn(null);
      setOtpSent(true);
    }, 1000);
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setOtpError("OTP code must be 6 digits");
      return;
    }
    setOtpError("");
    setIsLoggingIn("phone");
    try {
      await login("phone", selectedRole);
      setIsLoggingIn(null);
      router.push("/home");
    } catch {
      setIsLoggingIn(null);
      setOtpError("Could not complete mobile sign-in. Please try again.");
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center min-h-screen px-6 relative overflow-hidden bg-[#0B0B0F]">
      
      {/* Background radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {showSplash ? (
          /* 1. SPLASH SCREEN */
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center z-10"
          >
            {/* Animated Glow Logo */}
            <motion.div
              initial={{ scale: 0.85, filter: "blur(10px)" }}
              animate={{ scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative mb-6"
            >
              <div className="absolute inset-0 bg-[#8B5CF6]/30 blur-[40px] rounded-full" />
              <h1 className="text-6xl md:text-7xl font-extrabold tracking-tighter text-white font-display relative select-none">
                Crew<span className="text-[#8B5CF6] drop-shadow-[0_0_20px_rgba(139,92,246,0.5)]">Space</span>
              </h1>
            </motion.div>

            {/* Tagline Fade-In */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="text-zinc-400 text-sm md:text-base tracking-widest font-medium select-none flex items-center gap-2"
            >
              EVERY EVENT. ONE SPACE.
            </motion.p>
          </motion.div>
        ) : (
          /* 2. LOGIN PAGE (CLEAN DESIGN - REVOLVING ICONS REMOVED) */
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-sm flex flex-col items-center text-center z-10"
          >
            
            {/* 2b. Login Card Container */}
            <div className="w-full p-8 rounded-3xl glass shadow-2xl border border-white/5 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#8B5CF6]/40 to-transparent" />

              {!showMobileInput ? (
                /* Primary Authentication Buttons */
                <>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white font-display">Enter the Event</h3>
                    <p className="text-xs text-zinc-400">Scan QR or demo events instantly without passwords.</p>
                  </div>

                  <div className="space-y-3">
                    {/* Google Login */}
                    <button
                      disabled={isLoggingIn !== null}
                      onClick={() => handleLogin("google")}
                      className="w-full py-3 px-4 rounded-xl bg-white text-black hover:bg-zinc-200 font-semibold text-sm flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {isLoggingIn === "google" ? (
                        <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <GoogleIcon />
                      )}
                      {isLoggingIn === "google" ? "Authenticating..." : "Continue with Google"}
                    </button>

                    {/* GitHub Login */}
                    <button
                      disabled={isLoggingIn !== null}
                      onClick={() => handleLogin("github")}
                      className="w-full py-3 px-4 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/20 hover:bg-zinc-800/80 text-white font-semibold text-sm flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {isLoggingIn === "github" ? (
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <GithubIcon />
                      )}
                      {isLoggingIn === "github" ? "Authenticating..." : "Continue with GitHub"}
                    </button>

                    {/* Mobile Login */}
                    <button
                      disabled={isLoggingIn !== null}
                      onClick={() => {
                        setShowMobileInput(true);
                        setOtpSent(false);
                        setOtpCode("");
                        setPhoneNumber("");
                        setOtpError("");
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/20 hover:bg-zinc-800/80 text-white font-semibold text-sm flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      <PhoneIcon className="text-zinc-400" />
                      Continue with Mobile Number
                    </button>
                  </div>
                </>
              ) : (
                /* Interactive Mobile Phone + OTP Code Login Flow */
                <div className="space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                      {!otpSent ? "Mobile Phone Auth" : "Verification Code"}
                    </h3>
                    <button 
                      onClick={() => {
                        setShowMobileInput(false);
                        setOtpError("");
                      }}
                      className="text-[11px] text-zinc-500 hover:text-white transition-colors cursor-pointer"
                    >
                      Back to options
                    </button>
                  </div>

                  {otpError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                      {otpError}
                    </div>
                  )}

                  {!otpSent ? (
                    <form onSubmit={handleMobileSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Phone Number</label>
                        <div className="relative">
                          <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                          <input
                            type="tel"
                            placeholder="+1 (555) 019-2834"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 focus:border-[#8B5CF6]/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-750 focus:outline-none transition-colors"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoggingIn !== null}
                        className="w-full py-3 px-4 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-sm transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isLoggingIn === "phone" ? (
                          <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          "Send OTP Code"
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleOtpVerify} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Verification Code</label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 focus:border-[#8B5CF6]/50 rounded-xl px-4 py-2.5 text-center text-lg font-mono tracking-[0.5em] text-white placeholder-zinc-750 focus:outline-none transition-colors animate-pulse"
                          required
                        />
                        <p className="text-[10px] text-zinc-500 text-center mt-1">We sent a 6-digit simulation code to {phoneNumber}</p>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoggingIn !== null}
                        className="w-full py-3 px-4 rounded-xl bg-[#8B5CF6] hover:bg-purple-500 text-white font-bold text-sm transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isLoggingIn === "phone" ? (
                          <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          "Verify & Enter Space"
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* 2e. Terms info */}
              <div className="pt-2 border-t border-white/5 select-none">
                <p className="text-[10px] text-zinc-600 leading-normal font-medium">
                  By continuing, you agree to our{" "}
                  <a href="#" className="underline hover:text-zinc-400 transition-colors">Terms of Services</a> and{" "}
                  <a href="#" className="underline hover:text-zinc-400 transition-colors">Privacy Policy</a>
                </p>
              </div>
            </div>

            {/* Branding details */}
            <p className="text-[10px] text-zinc-600 mt-12 flex items-center gap-1 select-none">
              <Terminal size={10} /> Secure passwordless credentials via OAuth 2.0
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
