import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Structura — 3D GitHub Repository Visualizer",
  description:
    "Instantly visualize any public GitHub repository as an interactive 3D graph. Explore folder structures, file dependencies, and auto-detected modules with AI-powered analysis.",
  keywords: [
    "github",
    "repository",
    "visualizer",
    "3D graph",
    "code architecture",
    "dependency graph",
    "project structure",
  ],
  openGraph: {
    title: "Structura — 3D GitHub Repository Visualizer",
    description:
      "Explore any GitHub repo as an interactive 3D architecture graph with AI analysis.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
