import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { tokens } from "@/lib/theme"
import { Toaster } from "@/components/ui/sonner"
import { NativeAuthGate } from "@/components/shared/native-auth-gate"
import { StoreHydrator } from "@/components/shared/store-hydrator"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: tokens.bg,
}

export const metadata: Metadata = {
  title: "FINISHER — HYROX Training App",
  description:
    "Your personalized HYROX race-day training plan. Built from the official coaching manual.",
  openGraph: {
    title: "FINISHER — HYROX Training App",
    description:
      "Personalized HYROX training plans. Every session. Every rep. Every week to race day.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geist.variable} ${mono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <StoreHydrator />
        <NativeAuthGate>{children}</NativeAuthGate>
        <Toaster />
      </body>
    </html>
  )
}
