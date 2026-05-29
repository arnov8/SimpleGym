import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SimpleGym",
  description: "Your AI-powered personal gym coach",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "SimpleGym" },
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, maximumScale: 1,
  userScalable: false, themeColor: "#f4f7f4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`h-full ${nunito.className}`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
