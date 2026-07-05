"use client";

import QRCode from "qrcode";

export const ACTIVE_EVENT_ID =
  process.env.NEXT_PUBLIC_CREWSPACE_EVENT_ID || "talent-hunt-2k26";

export interface EventQrPayload {
  type: "event";
  eventId: string;
  joinUrl: string;
  issuedAt: string;
}

export interface PersonalQrPayload {
  type: "personal";
  eventId: string;
  participantId: string;
  issuedAt: string;
}

export function getJoinUrl(eventId = ACTIVE_EVENT_ID) {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "https://crewspace.app";

  return `${origin}/home?event=${encodeURIComponent(eventId)}`;
}

export async function createQrDataUrl(payload: EventQrPayload | PersonalQrPayload) {
  return QRCode.toDataURL(JSON.stringify(payload), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
    color: {
      dark: "#0B0B0F",
      light: "#FFFFFF",
    },
  });
}

export async function createEventQrDataUrl(eventId = ACTIVE_EVENT_ID) {
  return createQrDataUrl({
    type: "event",
    eventId,
    joinUrl: getJoinUrl(eventId),
    issuedAt: new Date().toISOString(),
  });
}

export async function createPersonalQrDataUrl(participantId: string, eventId = ACTIVE_EVENT_ID) {
  return createQrDataUrl({
    type: "personal",
    eventId,
    participantId,
    issuedAt: new Date().toISOString(),
  });
}
