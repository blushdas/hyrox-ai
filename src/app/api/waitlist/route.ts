import { NextRequest, NextResponse } from "next/server"
import { readFileSync, writeFileSync } from "fs"
import { join } from "path"

const WAITLIST_PATH = join(process.cwd(), "data", "waitlist.json")

type WaitlistData = {
  emails: string[]
  count: number
}

function readWaitlist(): WaitlistData {
  try {
    const raw = readFileSync(WAITLIST_PATH, "utf-8")
    return JSON.parse(raw)
  } catch {
    return { emails: [], count: 0 }
  }
}

export async function GET() {
  const data = readWaitlist()
  return NextResponse.json({ count: data.count })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email } = body

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }

  const data = readWaitlist()

  if (data.emails.includes(email.toLowerCase())) {
    return NextResponse.json({ message: "Already on waitlist", count: data.count })
  }

  data.emails.push(email.toLowerCase())
  data.count = data.emails.length

  try {
    writeFileSync(WAITLIST_PATH, JSON.stringify(data, null, 2))
  } catch {
    // silently fail if write fails (read-only environments)
  }

  return NextResponse.json({ message: "Success", count: data.count })
}
