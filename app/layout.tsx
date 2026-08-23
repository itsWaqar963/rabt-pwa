import type { Metadata, Viewport } from "next";
import { MeetupStoreProvider } from "@/components/providers/MeetupStoreProvider";
import { InstallPrompt } from "@/components/ui/InstallPrompt";
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
    apple: "/icons/icon-192x192.png",
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
          <MeetupStoreProvider>
            {children}
            <InstallPrompt />
          </MeetupStoreProvider>
        </div>
      </body>
    </html>
  );
}
