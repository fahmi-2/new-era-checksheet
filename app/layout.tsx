import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { ConnectionProvider } from "@/lib/connection-context"
import { OfflineBanner } from "@/components/OfflineBanner"
import { ConnectionStatus } from "@/components/ConnectionStatus"
import "./globals.css"

export const metadata: Metadata = {
  title: "E-Checksheet - PT JAI",
  description: "Sistem manajemen checklist elektronik untuk PT JAI",
  generator: "Next.js",
  manifest: "/e-checksheet-ga/manifest.json", // ✅ Link ke manifest dengan basePath
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "E-Checksheet",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#1e88e5",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#1e88e5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="E-Checksheet" />
        {/* ✅ Link manifest dengan basePath */}
        <link rel="manifest" href="/e-checksheet-ga/manifest.json" />
        <link rel="apple-touch-icon" href="/e-checksheet-ga/icon-192.png" />
      </head>
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          {/* ✅ ConnectionProvider di dalam AuthProvider agar bisa akses user */}
          <ConnectionProvider>
            {children}
            {/* ✅ Banner & Status indicator */}
            <OfflineBanner />
            <ConnectionStatus />
          </ConnectionProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}