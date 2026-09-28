"use client"
import { create } from "zustand"
import type { Relationship } from "@/lib/people/types"
type PeopleState={relationships:Record<string,Relationship>;coachRequests:Record<string,boolean>;add:(id:string)=>void;cancel:(id:string)=>void;accept:(id:string)=>void;decline:(id:string)=>void;requestCoach:(id:string)=>void;cancelCoachRequest:(id:string)=>void}
export const usePeopleStore=create<PeopleState>(set=>({relationships:{},coachRequests:{},add:id=>set(s=>({relationships:{...s.relationships,[id]:"outgoing"}})),cancel:id=>set(s=>({relationships:{...s.relationships,[id]:"none"}})),accept:id=>set(s=>({relationships:{...s.relationships,[id]:"friend"}})),decline:id=>set(s=>({relationships:{...s.relationships,[id]:"none"}})),requestCoach:id=>set(s=>({coachRequests:{...s.coachRequests,[id]:true}})),cancelCoachRequest:id=>set(s=>({coachRequests:{...s.coachRequests,[id]:false}}))}))
