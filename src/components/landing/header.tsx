"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { X, Menu } from "lucide-react"
import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
  }, [])

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "backdrop-blur-md" : ""
        }`}
        style={scrolled ? { backgroundColor: "rgba(7,7,7,0.8)", borderBottom: "1px solid rgba(255,255,255,0.08)" } : {}}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between relative">
          <Logo />

          {/* Desktop nav — centered */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#cta" className="text-sm text-muted-foreground hover:text-white transition-colors">
              About
            </Link>
            <Link href="/onboarding" className="text-sm text-muted-foreground hover:text-white transition-colors">
              App
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href="#cta">
              <Button size="sm" className="bg-[#22C55E] text-[#0F1A0E] hover:bg-[#22C55E]/90 px-4 py-2 text-sm font-medium rounded-lg">
                Get Early Access
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-muted-foreground hover:text-white"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile full-screen overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center" style={{ backgroundColor: "#070707" }}>
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-5 right-5 text-muted-foreground hover:text-white"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>

          <nav className="flex flex-col items-center gap-8">
            <Link
              href="#features"
              className="text-4xl font-normal text-white hover:text-[#22C55E] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#cta"
              className="text-4xl font-normal text-white hover:text-[#22C55E] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/onboarding"
              className="text-4xl font-normal text-white hover:text-[#22C55E] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              App
            </Link>
            <Link href="#cta" onClick={() => setMenuOpen(false)}>
              <Button size="lg" className="mt-4 bg-[#22C55E] text-[#0F1A0E] hover:bg-[#22C55E]/90 px-8 font-medium">
                Get Early Access
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}
