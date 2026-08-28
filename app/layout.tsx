import type { Metadata, Viewport } from "next";
import { BetaStorageReset } from "@/components/BetaStorageReset";
import { AuthProvider } from "@/context/AuthContext";
import { ChatNotifyProvider } from "@/components/providers/ChatNotifyProvider";
import { GlobalMeetupChatHost } from "@/components/providers/GlobalMeetupChatHost";
import { MeetupStoreProvider } from "@/components/providers/MeetupStoreProvider";
import { PresenceHeartbeat } from "@/components/presence/PresenceHeartbeat";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { InstallPrompt } from "@/components/ui/InstallPrompt";
import { NotificationPermissionBanner } from "@/components/ui/NotificationPermissionBanner";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d0f12",
};

export const metadata: Metadata = {
  title: "RABT",
  description: "RABT — spiritual network utility",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RABT",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png?v=5", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png?v=5", sizes: "512x512", type: "image/png" },
    ],
    apple: {
      url: "/icons/icon-192x192.png?v=5",
      sizes: "192x192",
      type: "image/png",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-body">
      <body className="bg-background text-foreground font-body antialiased">
        <div className="max-w-md mx-auto min-h-screen relative overflow-hidden bg-background text-foreground">
          <BetaStorageReset />
          <AuthProvider>
            <MeetupStoreProvider>
              <ChatNotifyProvider>
                <PresenceHeartbeat />
                <ServiceWorkerRegister />
                <OfflineBanner />
                <NotificationPermissionBanner />
                {children}
                <GlobalMeetupChatHost />
                <InstallPrompt />
              </ChatNotifyProvider>
            </MeetupStoreProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
