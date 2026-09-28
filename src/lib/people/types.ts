import type { RaceCategory } from "@/lib/types"
export type Relationship = "friend" | "incoming" | "outgoing" | "none"
export type Athlete = { id:string; name:string; handle:string; initials:string; location:string; category:RaceCategory; nextRace?:{name:string;date:string}; relationship:Relationship; mutualCount:number; weeklySessions?:number }
export type CoachSpecialty = "running" | "engine" | "strength" | "stations" | "race_strategy" | "doubles"
export type CoachLevel = "beginner" | "intermediate" | "pro"
export type CoachAvailability = "open" | "waitlist" | "full"
export type Coach = { id:string; name:string; initials:string; verified:boolean; verification?:{body:string;verifiedOn:string}; headline:string; credentials:string[]; specialties:CoachSpecialty[]; levels:CoachLevel[]; availability:CoachAvailability; location:string; remote:boolean; yearsCoaching:number; athletesCoached:number; medianImprovementMin:number|null; priceFromMonthly:number|null; currency:"USD"|"GBP"|"EUR"; bio:string }
export type CoachFilters = { query:string; specialties:CoachSpecialty[]; level:CoachLevel|"any"; availability:CoachAvailability|"any"; verifiedOnly:boolean }
