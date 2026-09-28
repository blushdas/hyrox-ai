"use client"
import { create } from "zustand"
import type { TrainingPlan } from "@/lib/types"
import type { ChatMessage } from "@/lib/coach-ai/types"
import { buildCoachReply, chunkForStreaming } from "@/lib/coach-ai/mock-coach"
type Context = { plan:TrainingPlan; currentWeek:number; today:number; sessionId?:string }
type ChatState = { messages:ChatMessage[]; isStreaming:boolean; send:(prompt:string,context:Context)=>void; retry:(context:Context)=>void; stop:()=>void; reset:()=>void }
let timer: ReturnType<typeof setTimeout> | undefined
let generation = 0
export const useCoachAIStore = create<ChatState>((set,get)=>({
  messages:[],isStreaming:false,
  stop:()=>{generation++;clearTimeout(timer);set(s=>({isStreaming:false,messages:s.messages.map(m=>m.status==="streaming"?{...m,status:"complete"}:m)}))},
  reset:()=>{get().stop();set({messages:[]})},
  retry:(context)=>{const last=[...get().messages].reverse().find(m=>m.role==="user");if(last){set(s=>({messages:s.messages.slice(0,-2)}));get().send(last.content,context)}},
  send:(prompt,context)=>{
    if(get().isStreaming || !prompt.trim()) return
    const reply=buildCoachReply(prompt,context.plan,context.currentWeek,context.today,context.sessionId)
    const id=crypto.randomUUID();const createdAt=new Date().toISOString()
    const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const stream=reply.status!=="error"&&!reduce
    set(s=>({messages:[...s.messages,{id:crypto.randomUUID(),role:"user",content:prompt,citations:[],status:"complete",createdAt},{...reply,id,role:"assistant",createdAt,content:stream?"":reply.content,citations:stream?[]:reply.citations,status:stream?"streaming":reply.status}],isStreaming:stream}))
    if(!stream)return
    const chunks=chunkForStreaming(reply.content,3);const token=++generation;let index=0
    const tick=()=>{if(token!==generation)return;const chunk=chunks[index++]??"";const done=index>=chunks.length;set(s=>({isStreaming:!done,messages:s.messages.map(m=>m.id===id?{...m,content:m.content+chunk,status:done?"complete":"streaming",citations:done?reply.citations:[]}:m)}));if(!done)timer=setTimeout(tick,40)}
    timer=setTimeout(tick,40)
  },
}))
