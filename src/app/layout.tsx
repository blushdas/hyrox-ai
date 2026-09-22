import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { StoreHydrator } from "@/components/shared/store-hydrator"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "FINISHER — HYROX Training App",
  description: "Your personalized HYROX race-day training plan. Built from the official coaching manual.",
  openGraph: {
    title: "FINISHER — HYROX Training App",
    description: "Personalized HYROX training plans. Every session. Every rep. Every week to race day.",
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
      <body className={`${inter.variable} antialiased min-h-screen bg-background text-foreground`}>
        <StoreHydrator />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
