import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Providers } from "./providers";
import { ToastProvider } from "@/components/ui/toast-provider";

// OPT: Add display:swap so text renders immediately with fallback font.
// Add preload:true (default) ensures the font file is <link rel=preload>.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "LaunchDir — Discover the best new startups",
    template: "%s | LaunchDir",
  },
  description:
    "The go-to directory for indie makers and startup founders to discover, launch, and promote their products.",
    icons: {
      icon: "/icon.png",
      shortcut: "/favicon.ico",
      apple: "/icon.png",
    },
  keywords: ["startups", "products", "indie makers", "product hunt", "launch", "directory"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "LaunchDir",
    title: "LaunchDir — Discover the best new startups",
    description:
      "The go-to directory for indie makers and startup founders to discover, launch, and promote their products.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LaunchDir — Discover the best new startups",
    description: "The go-to directory for indie makers and startup founders.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* OPT: preconnect to Supabase storage so image requests skip DNS+TCP handshake */}
        <link rel="preconnect" href="https://zbvxeivxcszgidekinmw.supabase.co" />
        <link rel="dns-prefetch" href="https://zbvxeivxcszgidekinmw.supabase.co" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <ToastProvider />
        </Providers>
      </body>
    </html>
  );
}