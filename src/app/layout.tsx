import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Providers } from "./providers";
import { ToastProvider } from "@/components/ui/toast-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: {
    default: "LaunchDir — Discover the best new startups",
    template: "%s | LaunchDir",
  },
  description:
    "The go-to directory for indie makers and startup founders to discover, launch, and promote their products.",
  keywords: [
    "startups",
    "products",
    "indie makers",
    "product hunt",
    "launch",
    "directory",
  ],
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
    description:
      "The go-to directory for indie makers and startup founders.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
