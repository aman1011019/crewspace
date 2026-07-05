"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import confetti from "canvas-confetti";
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  onValue,
  push,
  ref as realtimeRef,
  serverTimestamp as realtimeServerTimestamp,
  set as realtimeSet,
} from "firebase/database";
import { getFirebaseServices, isFirebaseConfigured } from "@/lib/firebase/client";
import {
  ACTIVE_EVENT_ID,
  createEventQrDataUrl,
  createPersonalQrDataUrl,
  getJoinUrl,
} from "@/lib/firebase/qr";
import { registerFcmToken } from "@/lib/firebase/messaging";

export type UserRole = "Participant" | "Mentor" | "Judge";

export interface UserProfile {
  id: string;
  name: string;
  college: string;
  teamName?: string;
  role: UserRole;
  photoUrl: string;
  skills: string[];
  techStack: string[];
  interests: string[];
  email?: string;
  eventId?: string;
  provider?: "google" | "github" | "phone";
  personalQrDataUrl?: string;
  eventPassUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

export type EventStage =
  | "REGISTRATION"
  | "OPENING"
  | "HACKING"
  | "LUNCH"
  | "JUDGING"
  | "COMPLETED";

export interface HackathonEvent {
  id: string;
  name: string;
  venue: string;
  date: string;
  countdown: string;
  endTime?: number;
  status: "LIVE" | "COMPLETED" | "UPCOMING";
  stage: EventStage;
  progressPercent: number;
  milestoneText: string;
  joinCode: string;
  joinUrl: string;
  eventQrDataUrl?: string;
  stats: {
    teams: number;
    participants: number;
    connections: number;
    posts: number;
  };
}

export interface FeedPost {
  id: string;
  name: string;
  role: string;
  avatar: string;
  timestamp: string;
  text: string;
  image?: string;
  likes: number;
  liked: boolean;
  bookmarked: boolean;
  type: "participant" | "organizer" | "mentor" | "judge";
  eventId?: string;
}

export interface Connection {
  id: string;
  name: string;
  college: string;
  role: UserRole;
  skills: string[];
  techStack: string[];
  interests: string[];
  photoUrl: string;
  status: "connect" | "requested" | "connected";
  aiReason?: string;
}

export interface TeamProject {
  id: string;
  teamName: string;
  projectName: string;
  bannerColor: string;
  members: string[];
  problemStatement: string;
  techStack: string[];
  githubUrl: string;
  demoUrl: string;
  updates: string[];
  likes: number;
  liked: boolean;
  bookmarked: boolean;
}

export interface JuryMentor {
  id: string;
  name: string;
  company: string;
  designation: string;
  photoUrl: string;
  expertise: string[];
  linkedin: string;
  availability: "Available" | "Busy";
  mentoringRequested: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  time: string;
  priority: "High" | "Normal";
}

export interface NotificationItem {
  id: string;
  icon: string;
  title: string;
  message: string;
  time: string;
}

interface AIResult {
  reply: string;
  links?: { label: string; url: string }[];
}

interface AIHistoryItem extends AIResult {
  query: string;
}

interface EventVerification {
  ok: boolean;
  message?: string;
  event?: HackathonEvent;
}

interface MockDbContextType {
  user: UserProfile | null;
  login: (provider: "google" | "github" | "phone", role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  isOnboarded: boolean;
  completeOnboarding: (
    data: Omit<UserProfile, "id" | "photoUrl" | "skills" | "techStack" | "interests">
  ) => void;
  updateProfile: (
    data: Omit<UserProfile, "id" | "photoUrl" | "skills" | "techStack" | "interests">
  ) => void;
  verifyEventCode: (code: string) => Promise<EventVerification>;
  eventState: HackathonEvent;
  setEventStage: (stage: EventStage) => void;
  posts: FeedPost[];
  addPost: (text: string, image?: string) => void;
  likePost: (id: string) => void;
  bookmarkPost: (id: string) => void;
  connections: Connection[];
  sendConnectionRequest: (id: string) => void;
  acceptConnectionRequest: (id: string) => void;
  projects: TeamProject[];
  likeProject: (id: string) => void;
  bookmarkProject: (id: string) => void;
  mentors: JuryMentor[];
  requestMentoring: (id: string) => void;
  announcements: Announcement[];
  notifications: NotificationItem[];
  addNotification: (icon: string, title: string, message: string) => void;
  clearNotification: (id: string) => void;
  activityTicker: string[];
  submitFeedback: (stars: number, emoji: string, comments: string) => void;
  feedbackSubmitted: boolean;
  askAI: (query: string) => AIResult;
  aiHistory: AIHistoryItem[];
  firebaseReady: boolean;
}

const MockDbContext = createContext<MockDbContextType | undefined>(undefined);

const DEFAULT_EVENT: HackathonEvent = {
  id: ACTIVE_EVENT_ID,
  name: "Talent Hunt 2K26 Vynedam",
  venue: "Mallareddy University",
  date: "July 5, 2026",
  countdown: "10:00:00",
  endTime: new Date("2026-07-05T19:00:00+05:30").getTime(),
  status: "LIVE",
  stage: "HACKING",
  progressPercent: 64.5,
  milestoneText: "Talent Hunt in progress",
  joinCode: "HACKFEST2026",
  joinUrl: getJoinUrl(ACTIVE_EVENT_ID),
  stats: {
    teams: 300,
    participants: 120,
    connections: 45,
    posts: 4,
  },
};

const INITIAL_POSTS: FeedPost[] = [
  {
    id: "post-1",
    name: "Aarav Sharma",
    role: "Organizer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    timestamp: "2 mins ago",
    text: "WiFi is live. Connect to CrewSpace_5G and keep building.",
    likes: 42,
    liked: false,
    bookmarked: false,
    type: "organizer",
    eventId: ACTIVE_EVENT_ID,
  },
  {
    id: "post-2",
    name: "Sophia Patel",
    role: "Mentor",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
    timestamp: "15 mins ago",
    text: "I am available near the Mentor Desk for Firebase and system design reviews.",
    likes: 18,
    liked: false,
    bookmarked: false,
    type: "mentor",
    eventId: ACTIVE_EVENT_ID,
  },
  {
    id: "post-3",
    name: "Team TechVanguards",
    role: "Participant",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    timestamp: "45 mins ago",
    text: "Project architecture is locked. MVP sprint starts now.",
    image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80",
    likes: 54,
    liked: false,
    bookmarked: false,
    type: "participant",
    eventId: ACTIVE_EVENT_ID,
  },
];

const INITIAL_CONNECTIONS: Connection[] = [
  {
    id: "user-c1",
    name: "Rohan Verma",
    college: "IIT Bombay",
    role: "Participant",
    skills: ["React", "Node.js", "GraphQL"],
    techStack: ["Next.js", "Tailwind", "PostgreSQL"],
    interests: ["EdTech", "SaaS"],
    photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    status: "connect",
    aiReason: "You both use React and build AI tools.",
  },
  {
    id: "user-c2",
    name: "Priya Nair",
    college: "BITS Pilani",
    role: "Participant",
    skills: ["Python", "TensorFlow", "FastAPI"],
    techStack: ["React", "PyTorch", "MongoDB"],
    interests: ["Healthcare AI", "BioTech"],
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    status: "connect",
    aiReason: "You both build AI applications.",
  },
  {
    id: "user-c3",
    name: "Kabir Mehta",
    college: "Delhi Technological University",
    role: "Participant",
    skills: ["Solidity", "Rust", "TypeScript"],
    techStack: ["Web3.js", "Ethereum", "Next.js"],
    interests: ["DeFi", "Smart Contracts"],
    photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    status: "connect",
    aiReason: "You both know Next.js and TypeScript.",
  },
];

const INITIAL_PROJECTS: TeamProject[] = [
  {
    id: "proj-1",
    teamName: "Alpha Crew",
    projectName: "EcoTrace AI",
    bannerColor: "from-green-500/20 to-emerald-500/5",
    members: ["Priya Nair", "Rohan Verma"],
    problemStatement:
      "Tracking carbon emissions in supply chains using real-time IoT and predictive AI.",
    techStack: ["Python", "TensorFlow", "React", "Firebase"],
    githubUrl: "https://github.com/crewspace/ecotrace-ai",
    demoUrl: "https://ecotrace-demo.vercel.app",
    updates: ["Uploaded model architecture", "Finalized dashboard components"],
    likes: 35,
    liked: false,
    bookmarked: false,
  },
  {
    id: "proj-2",
    teamName: "Pixel Pioneers",
    projectName: "CrewSpace OS",
    bannerColor: "from-purple-500/20 to-pink-500/5",
    members: ["Ananya Iyer", "Self"],
    problemStatement:
      "A real-time event operating system for physical hackathon participants.",
    techStack: ["Next.js", "Framer Motion", "TailwindCSS", "Firebase"],
    githubUrl: "https://github.com/crewspace/crewspace",
    demoUrl: "https://crewspace.vercel.app",
    updates: ["Completed design tokens", "Implemented live feed"],
    likes: 88,
    liked: false,
    bookmarked: false,
  },
];

const INITIAL_MENTORS: JuryMentor[] = [
  {
    id: "mentor-1",
    name: "Sophia Patel",
    company: "Google",
    designation: "Senior Staff Developer Advocate",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    expertise: ["Firebase", "Google Cloud", "System Design"],
    linkedin: "https://linkedin.com/in/sophia-patel-mock",
    availability: "Available",
    mentoringRequested: false,
  },
  {
    id: "mentor-2",
    name: "David Kim",
    company: "Vercel",
    designation: "Principal Design Engineer",
    photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
    expertise: ["Next.js", "Tailwind CSS", "Animations"],
    linkedin: "https://linkedin.com/in/david-kim-mock",
    availability: "Available",
    mentoringRequested: false,
  },
];

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-1",
    title: "Lunch is Served",
    description:
      "Head to the dining hall for pizza, vegan options, and cold brew coffee.",
    time: "1:15 PM",
    priority: "High",
  },
  {
    id: "ann-2",
    title: "Mentor Checkpoint",
    description:
      "Mentors are now roaming Hall A and Hall B for reviews and pitch practice.",
    time: "3:00 PM",
    priority: "Normal",
  },
];

const TICKER_POOL = [
  "Team Alpha uploaded their MVP draft",
  "Rahul connected with Priya Nair",
  "Mentor Sophia Patel is now available",
  "18 new participants checked in at Hall A",
  "Pizza delivery has arrived in the dining lounge",
  "Team Pixel Pioneers posted a design update",
];

const LOCAL_USER_KEY = "cs_user";
const LOCAL_ONBOARDED_KEY = "cs_onboarded";
const LOCAL_FEEDBACK_KEY = "cs_feedback_submitted";

function getNowLabel() {
  return "Just now";
}

function safeJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function asMillis(value: unknown) {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

function sortNewestFirst<T extends { createdAt?: unknown }>(items: T[]) {
  return [...items].sort((a, b) => asMillis(b.createdAt) - asMillis(a.createdAt));
}

function firebaseUserToProfile(
  firebaseUser: FirebaseUser,
  role: UserRole,
  provider: "google" | "github" | "phone"
): UserProfile {
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || (provider === "github" ? "GitHub User" : "CrewSpace Guest"),
    college: "",
    role,
    photoUrl:
      firebaseUser.photoURL ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    skills: [],
    techStack: [],
    interests: [],
    email: firebaseUser.email || undefined,
    eventId: ACTIVE_EVENT_ID,
    provider,
  };
}

function localProfile(provider: "google" | "github" | "phone", role: UserRole): UserProfile {
  const suffix = provider === "github" ? "GitHub" : provider === "phone" ? "Mobile" : "Rivera";
  return {
    id: `local-${provider}`,
    name: provider === "github" ? "alex_rivera" : `Alex ${suffix}`,
    college: "",
    role,
    photoUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    skills: [],
    techStack: [],
    interests: [],
    eventId: ACTIVE_EVENT_ID,
    provider,
  };
}

function buildOnboardedProfile(
  user: UserProfile,
  data: Omit<UserProfile, "id" | "photoUrl" | "skills" | "techStack" | "interests">
): UserProfile {
  let skills = ["React", "TypeScript", "TailwindCSS"];
  let techStack = ["Next.js", "Firebase", "Framer Motion"];
  let interests = ["Hackathons", "Design Systems"];

  if (data.role === "Mentor") {
    skills = ["Architecture", "Scalability", "Firebase"];
    techStack = ["Google Cloud", "PostgreSQL", "React"];
    interests = ["Mentoring", "Investing"];
  }

  if (data.role === "Judge") {
    skills = ["Product Strategy", "Pitching", "UX Review"];
    techStack = ["AI Models", "SaaS Infrastructure"];
    interests = ["Seed Funding", "Incubators"];
  }

  return {
    ...user,
    name: data.name,
    college: data.college,
    teamName: data.teamName,
    role: data.role,
    linkedinUrl: data.linkedinUrl,
    githubUrl: data.githubUrl,
    skills,
    techStack,
    interests,
    eventId: ACTIVE_EVENT_ID,
  };
}

function stageCopy(stage: EventStage) {
  const copy: Record<EventStage, Pick<HackathonEvent, "status" | "progressPercent" | "milestoneText" | "countdown">> = {
    REGISTRATION: {
      status: "UPCOMING",
      progressPercent: 0,
      milestoneText: "Registration is open",
      countdown: "36:00:00",
    },
    OPENING: {
      status: "LIVE",
      progressPercent: 5,
      milestoneText: "Opening ceremony underway",
      countdown: "35:30:00",
    },
    HACKING: {
      status: "LIVE",
      progressPercent: 10,
      milestoneText: "Let the hacking begin",
      countdown: "32:00:00",
    },
    LUNCH: {
      status: "LIVE",
      progressPercent: 50,
      milestoneText: "Lunch is served",
      countdown: "18:00:00",
    },
    JUDGING: {
      status: "LIVE",
      progressPercent: 90,
      milestoneText: "Judging is starting",
      countdown: "01:30:00",
    },
    COMPLETED: {
      status: "COMPLETED",
      progressPercent: 100,
      milestoneText: "Hackathon completed",
      countdown: "00:00:00",
    },
  };

  return copy[stage];
}

function parseCountdownToSeconds(countdownStr: unknown): number | null {
  if (typeof countdownStr !== "string" || !countdownStr) return null;
  const parts = countdownStr.split(":").map(Number);
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2 && parts.every(Number.isFinite)) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 1 && Number.isFinite(parts[0])) {
    return parts[0];
  }
  return null;
}

function secondsToCountdownString(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function mergeEvent(prev: HackathonEvent, incoming: Record<string, unknown>): HackathonEvent {
  const merged = {
    ...prev,
    ...incoming,
    id: String(incoming.id || prev.id || ACTIVE_EVENT_ID),
    stats: {
      ...prev.stats,
      ...((incoming.stats as HackathonEvent["stats"] | undefined) || {}),
    },
    joinCode: String(incoming.joinCode || prev.joinCode || "HACKFEST2026"),
    joinUrl: String(incoming.joinUrl || prev.joinUrl || getJoinUrl(ACTIVE_EVENT_ID)),
  } as HackathonEvent;

  if (typeof merged.endTime !== "number") merged.endTime = prev.endTime;

  if (!merged.countdown || typeof merged.countdown !== "string" || !/^\d+:\d{2}:\d{2}$/.test(merged.countdown)) {
    merged.countdown = prev.countdown || "31:00:00";
  }

  return merged;
}

function extractEventId(code: string) {
  const trimmed = code.trim();
  if (!trimmed) return "";

  try {
    const parsed = JSON.parse(trimmed) as { eventId?: string };
    if (parsed.eventId) return parsed.eventId;
  } catch {
    // Plain codes and URLs are expected too.
  }

  try {
    const parsedUrl = new URL(trimmed);
    return parsedUrl.searchParams.get("event") || parsedUrl.searchParams.get("eventId") || "";
  } catch {
    return "";
  }
}

export const MockDbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseReady] = useState(isFirebaseConfigured);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [eventState, setEventState] = useState<HackathonEvent>(DEFAULT_EVENT);
  const [posts, setPosts] = useState<FeedPost[]>(INITIAL_POSTS);
  const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
  const [projects, setProjects] = useState<TeamProject[]>(INITIAL_PROJECTS);
  const [mentors, setMentors] = useState<JuryMentor[]>(INITIAL_MENTORS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activityTicker, setActivityTicker] = useState<string[]>([
    "Rohan connected with Kabir Mehta",
    "Pixel Pioneers uploaded their design preview",
    "Pitch guidelines published",
  ]);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [aiHistory, setAiHistory] = useState<AIHistoryItem[]>([]);

  useEffect(() => {
    createEventQrDataUrl(ACTIVE_EVENT_ID).then((eventQrDataUrl) => {
      setEventState((prev) => ({ ...prev, eventQrDataUrl }));
    });
  }, []);

  useEffect(() => {
    const services = getFirebaseServices();

    if (!services) {
      const timeout = window.setTimeout(() => {
        const cachedUser = safeJson<UserProfile>(localStorage.getItem(LOCAL_USER_KEY));
        setUser(cachedUser);
        setIsOnboarded(localStorage.getItem(LOCAL_ONBOARDED_KEY) === "true");
        setFeedbackSubmitted(localStorage.getItem(LOCAL_FEEDBACK_KEY) === "true");
      }, 0);
      return () => window.clearTimeout(timeout);
    }

    return onAuthStateChanged(services.auth, async (authUser) => {
      if (!authUser) {
        const cachedUser = safeJson<UserProfile>(localStorage.getItem(LOCAL_USER_KEY));
        if (cachedUser && cachedUser.id.startsWith("local-")) {
          setUser(cachedUser);
          setIsOnboarded(localStorage.getItem(LOCAL_ONBOARDED_KEY) === "true");
          return;
        }
        setUser(null);
        setIsOnboarded(false);
        return;
      }

      try {
        const userRef = doc(services.db, "users", authUser.uid);
        const participantRef = doc(
          services.db,
          "eventParticipants",
          `${ACTIVE_EVENT_ID}_${authUser.uid}`
        );
        const [userSnap, participantSnap] = await Promise.all([
          getDoc(userRef),
          getDoc(participantRef),
        ]);

        const fallback = firebaseUserToProfile(authUser, "Participant", "google");
        const profile = userSnap.exists()
          ? ({ ...fallback, ...userSnap.data(), id: authUser.uid } as UserProfile)
          : fallback;

        setUser(profile);
        setIsOnboarded(participantSnap.exists());
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
        localStorage.setItem(
          LOCAL_ONBOARDED_KEY,
          participantSnap.exists() ? "true" : "false"
        );
      } catch (error) {
        console.error("Firestore user profile read failed, falling back to cached profile:", error);
        const cachedUser = safeJson<UserProfile>(localStorage.getItem(LOCAL_USER_KEY));
        if (cachedUser) {
          setUser(cachedUser);
          setIsOnboarded(localStorage.getItem(LOCAL_ONBOARDED_KEY) === "true");
        } else {
          const fallback = firebaseUserToProfile(authUser, "Participant", "google");
          setUser(fallback);
          setIsOnboarded(false);
        }
      }
    });
  }, []);

  useEffect(() => {
    const services = getFirebaseServices();
    if (!services) return;

    const unsubscribe: Array<() => void> = [];

    // Force sync the correct end time and total teams to Firebase for the demo
    const targetEndTime = new Date("2026-07-05T19:00:00+05:30").getTime();
    updateDoc(doc(services.db, "events", ACTIVE_EVENT_ID), {
      endTime: targetEndTime,
      "stats.teams": 300
    }).catch(() => undefined);
    realtimeSet(realtimeRef(services.rtdb, `live/events/${ACTIVE_EVENT_ID}/endTime`), targetEndTime).catch(() => undefined);
    realtimeSet(realtimeRef(services.rtdb, `live/events/${ACTIVE_EVENT_ID}/stats/teams`), 300).catch(() => undefined);
    unsubscribe.push(
      onSnapshot(
        doc(services.db, "events", ACTIVE_EVENT_ID),
        (snapshot) => {
          if (snapshot.exists()) {
            setEventState((prev) => mergeEvent(prev, { id: snapshot.id, ...snapshot.data() }));
          }
        },
        (error) => {
          console.warn("Firestore events sub error (using fallback):", error);
        }
      )
    );

    unsubscribe.push(
      onSnapshot(
        query(collection(services.db, "posts"), where("eventId", "==", ACTIVE_EVENT_ID)),
        (snapshot) => {
          const items = snapshot.docs.map((item) => ({
            id: item.id,
            liked: false,
            bookmarked: false,
            timestamp: getNowLabel(),
            ...item.data(),
          })) as Array<FeedPost & { createdAt?: unknown }>;
          if (items.length > 0) setPosts(sortNewestFirst(items));
        },
        (error) => {
          console.warn("Firestore posts sub error (using fallback):", error);
        }
      )
    );

    unsubscribe.push(
      onSnapshot(
        query(collection(services.db, "announcements"), where("eventId", "==", ACTIVE_EVENT_ID)),
        (snapshot) => {
          const items = snapshot.docs.map((item) => ({
            id: item.id,
            time: getNowLabel(),
            ...item.data(),
          })) as Array<Announcement & { createdAt?: unknown }>;
          if (items.length > 0) setAnnouncements(sortNewestFirst(items));
        },
        (error) => {
          console.warn("Firestore announcements sub error (using fallback):", error);
        }
      )
    );

    unsubscribe.push(
      onSnapshot(
        query(collection(services.db, "projects"), where("eventId", "==", ACTIVE_EVENT_ID)),
        (snapshot) => {
          const items = snapshot.docs.map((item) => ({
            id: item.id,
            teamName: "",
            projectName: "Untitled Project",
            bannerColor: "from-purple-500/20 to-pink-500/5",
            members: [],
            problemStatement: "",
            techStack: [],
            githubUrl: "#",
            demoUrl: "#",
            liked: false,
            bookmarked: false,
            updates: [],
            likes: 0,
            ...item.data(),
          })) as Array<TeamProject & { createdAt?: unknown }>;
          if (items.length > 0) setProjects(sortNewestFirst(items));
        },
        (error) => {
          console.warn("Firestore projects sub error (using fallback):", error);
        }
      )
    );

    unsubscribe.push(
      onSnapshot(
        query(collection(services.db, "mentors"), where("eventId", "==", ACTIVE_EVENT_ID)),
        (snapshot) => {
          const items = snapshot.docs.map((item) => ({
            id: item.id,
            mentoringRequested: false,
            ...item.data(),
          })) as JuryMentor[];
          if (items.length > 0) setMentors(items);
        },
        (error) => {
          console.warn("Firestore mentors sub error (using fallback):", error);
        }
      )
    );

    const liveUnsubscribe = onValue(
      realtimeRef(services.rtdb, `live/events/${ACTIVE_EVENT_ID}`),
      (snapshot) => {
        const live = snapshot.val();
        if (!live) return;

        setEventState((prev) =>
          mergeEvent(prev, {
            countdown: live.countdown,
            stage: live.stage,
            stats: live.stats,
            progressPercent: live.progressPercent,
            milestoneText: live.milestoneText,
            endTime: live.endTime,
          })
        );

        if (Array.isArray(live.activityFeed)) {
          setActivityTicker(live.activityFeed.slice(0, 12));
        } else if (live.activityFeed && typeof live.activityFeed === "object") {
          setActivityTicker(
            Object.values(live.activityFeed as Record<string, string>).slice(-12).reverse()
          );
        }
      },
      (error) => {
        console.warn("Realtime DB sub error (using fallback):", error);
      }
    );

    return () => {
      unsubscribe.forEach((run) => run());
      liveUnsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id || !isOnboarded) return;
    registerFcmToken(user.id, ACTIVE_EVENT_ID).catch(() => undefined);
  }, [isOnboarded, user?.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setEventState((prev) => {
        if (prev.stage === "COMPLETED") return prev;

        let remainingSecs = 0;
        let newEndTime = prev.endTime;

        if (newEndTime) {
          remainingSecs = Math.max(0, Math.floor((newEndTime - Date.now()) / 1000));
        } else {
          const parsed = parseCountdownToSeconds(prev.countdown);
          const currentSeconds = parsed !== null ? parsed : (parseCountdownToSeconds("31:00:00") ?? 111600);
          remainingSecs = Math.max(0, currentSeconds - 1);
          newEndTime = Date.now() + remainingSecs * 1000;
        }

        const totalSecs = 36 * 3600;
        const stage: EventStage = remainingSecs <= 0 ? "COMPLETED" : prev.stage;
        const status = remainingSecs <= 0 ? "COMPLETED" : prev.status;
        const progressPercent = Math.min(
          Math.max(Number((((totalSecs - remainingSecs) / totalSecs) * 100).toFixed(1)), 0),
          100
        );

        const countdown = secondsToCountdownString(remainingSecs);

        return {
          ...prev,
          stage,
          status,
          countdown,
          endTime: newEndTime,
          progressPercent,
          milestoneText: remainingSecs <= 0 ? "Hackathon completed" : prev.milestoneText,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);


  const addActivityLog = async (action: string, actorId?: string) => {
    const services = getFirebaseServices();
    if (!services) return;

    await Promise.allSettled([
      addDoc(collection(services.db, "activityLogs"), {
        eventId: ACTIVE_EVENT_ID,
        action,
        actorId: actorId || user?.id || null,
        createdAt: serverTimestamp(),
      }),
      push(realtimeRef(services.rtdb, `live/events/${ACTIVE_EVENT_ID}/activityFeed`), action),
    ]);
  };

  const addNotification = (icon: string, title: string, message: string) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random()}`,
      icon,
      title,
      message,
      time: getNowLabel(),
    };

    setNotifications((prev) => [newNotif, ...prev]);

    const services = getFirebaseServices();
    if (services && user) {
      addDoc(collection(services.db, "notifications"), {
        eventId: ACTIVE_EVENT_ID,
        userId: user.id,
        icon,
        title,
        message,
        read: false,
        createdAt: serverTimestamp(),
      }).catch(() => undefined);
    }

    setTimeout(() => {
      setNotifications((prev) => prev.filter((notif) => notif.id !== newNotif.id));
    }, 5000);
  };

  const login = async (
    provider: "google" | "github" | "phone",
    selectedRole: UserRole = "Participant"
  ) => {
    const services = getFirebaseServices();

    if (!services) {
      const profile = localProfile(provider, selectedRole);
      setUser(profile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
      return;
    }

    try {
      const credential =
        provider === "google"
          ? await signInWithPopup(services.auth, new GoogleAuthProvider())
          : provider === "github"
            ? await signInWithPopup(services.auth, new GithubAuthProvider())
            : await signInAnonymously(services.auth);

      const profile = firebaseUserToProfile(credential.user, selectedRole, provider);

      await setDoc(
        doc(services.db, "users", profile.id),
        {
          ...profile,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      setUser(profile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
      await addActivityLog(`${profile.name} signed in`, profile.id);
    } catch (error) {
      console.error("Firebase authentication failed, falling back to mock local login", error);
      // Fallback to local mock profile
      const profile = localProfile(provider, selectedRole);
      setUser(profile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
      addNotification("OK", "Logged in (Demo Mode)", `Authenticated as ${profile.name} (Firebase offline)`);
    }
  };

  const logout = async () => {
    const services = getFirebaseServices();
    if (services) await signOut(services.auth).catch(() => undefined);

    setUser(null);
    setIsOnboarded(false);
    setFeedbackSubmitted(false);
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem(LOCAL_ONBOARDED_KEY);
    localStorage.removeItem(LOCAL_FEEDBACK_KEY);
  };

  const verifyEventCode = async (code: string): Promise<EventVerification> => {
    const normalized = code.trim();
    if (!normalized) {
      return { ok: false, message: "Please enter an event QR or join code." };
    }

    const possibleEventId = extractEventId(normalized);
    const services = getFirebaseServices();

    if (!services) {
      const accepted =
        normalized.toUpperCase() === DEFAULT_EVENT.joinCode ||
        possibleEventId === DEFAULT_EVENT.id ||
        normalized.length >= 4;

      return accepted
        ? { ok: true, event: eventState }
        : { ok: false, message: "Invalid event code. Please scan the CrewSpace Event QR." };
    }

    const eventCandidates: HackathonEvent[] = [];

    if (possibleEventId) {
      const eventSnap = await getDoc(doc(services.db, "events", possibleEventId));
      if (eventSnap.exists()) {
        eventCandidates.push(mergeEvent(DEFAULT_EVENT, { id: eventSnap.id, ...eventSnap.data() }));
      }
    }

    const byCode = await getDocs(
      query(collection(services.db, "events"), where("joinCode", "==", normalized.toUpperCase()))
    );

    byCode.forEach((eventDoc) => {
      eventCandidates.push(mergeEvent(DEFAULT_EVENT, { id: eventDoc.id, ...eventDoc.data() }));
    });

    const event = eventCandidates[0];
    if (!event) {
      return { ok: false, message: "Invalid event QR. Please check the code and try again." };
    }

    if (event.status === "COMPLETED" || event.stage === "COMPLETED") {
      return { ok: false, message: "This event has ended." };
    }

    setEventState(event);
    return { ok: true, event };
  };

  const completeOnboarding = (
    data: Omit<UserProfile, "id" | "photoUrl" | "skills" | "techStack" | "interests">
  ) => {
    if (!user) return;

    const updatedUser = buildOnboardedProfile(user, data);
    setUser(updatedUser);
    setIsOnboarded(true);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser));
    localStorage.setItem(LOCAL_ONBOARDED_KEY, "true");

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#8B5CF6", "#A855F7", "#22C55E"],
    });

    addNotification("OK", "Joined Event", `Welcome to ${eventState.name}, ${data.name}.`);

    createPersonalQrDataUrl(updatedUser.id, ACTIVE_EVENT_ID)
      .then(async (personalQrDataUrl) => {
        const profileWithQr = { ...updatedUser, personalQrDataUrl };
        setUser(profileWithQr);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profileWithQr));

        const services = getFirebaseServices();
        if (!services) return;

        await Promise.allSettled([
          setDoc(
            doc(services.db, "users", profileWithQr.id),
            {
              ...profileWithQr,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ),
          setDoc(
            doc(services.db, "eventParticipants", `${ACTIVE_EVENT_ID}_${profileWithQr.id}`),
            {
              ...profileWithQr,
              eventId: ACTIVE_EVENT_ID,
              participantId: profileWithQr.id,
              checkedInAt: serverTimestamp(),
              personalQrPayload: {
                type: "personal",
                eventId: ACTIVE_EVENT_ID,
                participantId: profileWithQr.id,
              },
            },
            { merge: true }
          ),
          updateDoc(doc(services.db, "events", ACTIVE_EVENT_ID), {
            "stats.participants": increment(1),
            updatedAt: serverTimestamp(),
          }).catch(() => undefined),
          realtimeSet(
            realtimeRef(services.rtdb, `live/events/${ACTIVE_EVENT_ID}/onlineUsers/${profileWithQr.id}`),
            {
              name: profileWithQr.name,
              role: profileWithQr.role,
              lastSeen: realtimeServerTimestamp(),
            }
          ),
        ]);

        await addActivityLog(`${profileWithQr.name} joined ${eventState.name}`, profileWithQr.id);
      })
      .catch(() => undefined);
  };

  const updateProfile = (
    data: Omit<UserProfile, "id" | "photoUrl" | "skills" | "techStack" | "interests">
  ) => {
    if (!user) return;

    const updatedUser = buildOnboardedProfile(user, data);
    setUser(updatedUser);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser));

    const services = getFirebaseServices();
    if (services) {
      Promise.allSettled([
        setDoc(
          doc(services.db, "users", updatedUser.id),
          {
            ...updatedUser,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ),
        setDoc(
          doc(services.db, "eventParticipants", `${ACTIVE_EVENT_ID}_${updatedUser.id}`),
          {
            ...updatedUser,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ),
        realtimeSet(
          realtimeRef(services.rtdb, `live/events/${ACTIVE_EVENT_ID}/onlineUsers/${updatedUser.id}`),
          {
            name: updatedUser.name,
            role: updatedUser.role,
            lastSeen: realtimeServerTimestamp(),
          }
        ),
      ]).catch(() => undefined);
    }

    addNotification("OK", "Profile Updated", "Your changes have been saved successfully.");
  };

  const setEventStage = (stage: EventStage) => {
    const stageState = stageCopy(stage);
    const stageSeconds = parseCountdownToSeconds(stageState.countdown) || 0;
    const newEndTime = Date.now() + stageSeconds * 1000;

    setEventState((prev) => ({
      ...prev,
      ...stageState,
      stage,
      endTime: newEndTime,
    }));

    const services = getFirebaseServices();
    if (services) {
      Promise.allSettled([
        setDoc(
          doc(services.db, "events", ACTIVE_EVENT_ID),
          {
            stage,
            ...stageState,
            endTime: newEndTime,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ),
        realtimeSet(realtimeRef(services.rtdb, `live/events/${ACTIVE_EVENT_ID}/stage`), stage),
        realtimeSet(
          realtimeRef(services.rtdb, `live/events/${ACTIVE_EVENT_ID}/milestoneText`),
          stageState.milestoneText
        ),
        realtimeSet(
          realtimeRef(services.rtdb, `live/events/${ACTIVE_EVENT_ID}/endTime`),
          newEndTime
        ),
      ]).catch(() => undefined);
    }

    addNotification("!", "Timeline Update", stageState.milestoneText);
    addActivityLog(`Timeline moved to ${stage}`).catch(() => undefined);

    if (stage === "COMPLETED") {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
    }
  };

  const addPost = (text: string, image?: string) => {
    if (!user) return;

    const newPost: FeedPost = {
      id: `post-${Date.now()}`,
      name: user.name,
      role: user.role,
      avatar: user.photoUrl,
      timestamp: getNowLabel(),
      text,
      image,
      likes: 0,
      liked: false,
      bookmarked: false,
      type: user.role.toLowerCase() as FeedPost["type"],
      eventId: ACTIVE_EVENT_ID,
    };

    setPosts((prev) => [newPost, ...prev]);
    setEventState((prev) => ({
      ...prev,
      stats: { ...prev.stats, posts: prev.stats.posts + 1 },
    }));

    const services = getFirebaseServices();
    if (services) {
      addDoc(collection(services.db, "posts"), {
        ...newPost,
        authorId: user.id,
        createdAt: serverTimestamp(),
      }).catch(() => undefined);
      updateDoc(doc(services.db, "events", ACTIVE_EVENT_ID), {
        "stats.posts": increment(1),
      }).catch(() => undefined);
    }

    addNotification("OK", "Post Published", "Your update is live on the CrewSpace feed.");
    addActivityLog(`${user.name} published a post`, user.id).catch(() => undefined);
  };

  const likePost = (id: string) => {
    const target = posts.find((post) => post.id === id);
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id
          ? {
              ...post,
              likes: post.liked ? post.likes - 1 : post.likes + 1,
              liked: !post.liked,
            }
          : post
      )
    );

    const services = getFirebaseServices();
    if (services && target) {
      updateDoc(doc(services.db, "posts", id), {
        likes: increment(target.liked ? -1 : 1),
      }).catch(() => undefined);
    }
  };

  const bookmarkPost = (id: string) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === id ? { ...post, bookmarked: !post.bookmarked } : post))
    );
  };

  const sendConnectionRequest = (id: string) => {
    const target = connections.find((connection) => connection.id === id);
    setConnections((prev) =>
      prev.map((connection) =>
        connection.id === id ? { ...connection, status: "requested" } : connection
      )
    );

    const services = getFirebaseServices();
    if (services && user && target) {
      setDoc(
        doc(services.db, "connections", `${ACTIVE_EVENT_ID}_${user.id}_${id}`),
        {
          eventId: ACTIVE_EVENT_ID,
          requesterId: user.id,
          receiverId: id,
          receiverName: target.name,
          status: "pending",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => undefined);
    }

    addNotification("OK", "Request Sent", "Connection request sent successfully.");
    addActivityLog(`${user?.name || "A participant"} requested a connection`, user?.id).catch(
      () => undefined
    );
  };

  const acceptConnectionRequest = (id: string) => {
    setConnections((prev) =>
      prev.map((connection) =>
        connection.id === id ? { ...connection, status: "connected" } : connection
      )
    );
    setEventState((prev) => ({
      ...prev,
      stats: { ...prev.stats, connections: prev.stats.connections + 1 },
    }));
    addNotification("OK", "Connection Approved", "You accepted the connection request.");
  };

  const likeProject = (id: string) => {
    const target = projects.find((project) => project.id === id);
    setProjects((prev) =>
      prev.map((project) =>
        project.id === id
          ? {
              ...project,
              likes: project.liked ? project.likes - 1 : project.likes + 1,
              liked: !project.liked,
            }
          : project
      )
    );

    const services = getFirebaseServices();
    if (services && target) {
      updateDoc(doc(services.db, "projects", id), {
        likes: increment(target.liked ? -1 : 1),
      }).catch(() => undefined);
    }
  };

  const bookmarkProject = (id: string) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === id ? { ...project, bookmarked: !project.bookmarked } : project
      )
    );
  };

  const requestMentoring = (id: string) => {
    const target = mentors.find((mentor) => mentor.id === id);
    setMentors((prev) =>
      prev.map((mentor) =>
        mentor.id === id
          ? { ...mentor, mentoringRequested: !mentor.mentoringRequested }
          : mentor
      )
    );

    const services = getFirebaseServices();
    if (services && user && target) {
      addDoc(collection(services.db, "notifications"), {
        eventId: ACTIVE_EVENT_ID,
        userId: id,
        title: "Mentor Request",
        message: `${user.name} requested help from ${target.name}.`,
        type: "mentor_request",
        createdAt: serverTimestamp(),
      }).catch(() => undefined);
    }

    addNotification("OK", "Request Submitted", "Your mentoring slot request was sent.");
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const submitFeedback = (stars: number, emoji: string, comments: string) => {
    setFeedbackSubmitted(true);
    localStorage.setItem(LOCAL_FEEDBACK_KEY, "true");

    const services = getFirebaseServices();
    if (services && user) {
      addDoc(collection(services.db, "feedback"), {
        eventId: ACTIVE_EVENT_ID,
        userId: user.id,
        role: user.role,
        stars,
        emoji,
        comments,
        createdAt: serverTimestamp(),
      }).catch(() => undefined);
    }

    addNotification("OK", "Feedback Received", "Thank you for reviewing CrewSpace.");
    confetti({ particleCount: 70, spread: 60, colors: ["#22C55E", "#8B5CF6"] });
  };

  const askAI = (queryText: string): AIResult => {
    const q = queryText.toLowerCase().trim();
    let reply = "";
    let links: AIResult["links"] = [];

    if (q.includes("lunch") || q.includes("food") || q.includes("eat")) {
      reply = "Lunch is currently in the main dining lounge. Check announcements for timing changes.";
      links = [{ label: "Live Feed", url: "/space?tab=feed" }];
    } else if (q.includes("hall") || q.includes("map") || q.includes("venue")) {
      reply = "Hall A hosts hacking tables. Hall B has the mentor desk, jury room, and workshop area.";
      links = [{ label: "Open Feed", url: "/space?tab=feed" }];
    } else if (q.includes("react") || q.includes("next.js") || q.includes("typescript")) {
      reply = "Rohan, Priya, and Kabir are strong matches for React, Next.js, and TypeScript.";
      links = [{ label: "Find Connections", url: "/space?tab=network" }];
    } else if (q.includes("ai") || q.includes("model") || q.includes("python")) {
      reply = "EcoTrace AI is the strongest AI project in the showcase right now.";
      links = [{ label: "View Projects", url: "/space?tab=showcase" }];
    } else if (q.includes("certificate") || q.includes("pdf") || q.includes("winner")) {
      reply =
        eventState.stage === "COMPLETED"
          ? "Certificates are unlocked in your profile."
          : "Certificates unlock when organizers mark the event completed.";
      links = [{ label: "Profile", url: "/space?tab=profile" }];
    } else if (q.includes("mentor") || q.includes("help") || q.includes("stuck")) {
      reply = "Sophia Patel and David Kim are available for mentor requests.";
      links = [{ label: "Jury & Mentors", url: "/space?tab=jury" }];
    } else {
      reply =
        "Ask me about the schedule, venue, React builders, AI projects, certificates, or mentors.";
    }

    const item: AIHistoryItem = { query: queryText, reply, links };
    setAiHistory((prev) => [...prev, item]);
    return { reply, links };
  };

  const value = {
    user,
    login,
    logout,
    isOnboarded,
    completeOnboarding,
    updateProfile,
    verifyEventCode,
    eventState,
    setEventStage,
    posts,
    addPost,
    likePost,
    bookmarkPost,
    connections,
    sendConnectionRequest,
    acceptConnectionRequest,
    projects,
    likeProject,
    bookmarkProject,
    mentors,
    requestMentoring,
    announcements,
    notifications,
    addNotification,
    clearNotification,
    activityTicker,
    submitFeedback,
    feedbackSubmitted,
    askAI,
    aiHistory,
    firebaseReady,
  };

  return <MockDbContext.Provider value={value}>{children}</MockDbContext.Provider>;
};

export const useMockDb = () => {
  const context = useContext(MockDbContext);
  if (!context) {
    throw new Error("useMockDb must be used within a MockDbProvider");
  }
  return context;
};
