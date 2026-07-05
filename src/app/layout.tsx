import type { Metadata, Viewport } from "next";
import { MockDbProvider } from "@/lib/mockDb";
import { NotificationSystem } from "@/components/NotificationSystem";
import { AIAssistant } from "@/components/AIAssistant";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrewSpace | Every Hackathon. One Space.",
  description: "The premium social operating system for hackathons. Connect, showcase projects, request mentoring, and experience events in real-time.",
  applicationName: "CrewSpace",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CrewSpace",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#0B0B0F] text-white flex flex-col font-sans gradient-mesh-bg selection:bg-[#8B5CF6]/30 selection:text-white">
        <MockDbProvider>
          {children}
          <NotificationSystem />
          <AIAssistant />
        </MockDbProvider>
      </body>
    </html>
  );
}
