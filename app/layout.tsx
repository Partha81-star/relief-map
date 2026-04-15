import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReliefMap | Disaster Relief Network",
  description: "Real-time disaster relief coordination platform",
  manifest: "/manifest.json",
  viewport: "width=device-width, initial-scale=1.0, viewport-fit=cover",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className={`${inter.className} bg-slate-950 text-slate-50 overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
