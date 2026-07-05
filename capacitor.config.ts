import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.crewspace.app",
  appName: "CrewSpace",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
};

export default config;
