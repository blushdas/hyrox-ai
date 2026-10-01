import { beforeEach, expect, test, vi } from "vitest"
import { createElement, isValidElement, type ReactElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
const hooks = vi.hoisted(()=>({selected:undefined as boolean | undefined,set:vi.fn()}))
vi.mock("react",async original=>({...await original<typeof import("react")>(),useState:(initial:boolean)=>[hooks.selected ?? initial,hooks.set],useEffect:()=>undefined,useRef:()=>({current:null})}))
import { Composer } from "./chat"
const props=()=>({value:"Today's session?",onChange:vi.fn(),onSend:vi.fn(),streaming:false,onStop:vi.fn()})
function find(node:unknown,match:(element:ReactElement<Record<string,unknown>>)=>boolean): ReactElement<Record<string,unknown>> | undefined {
 if(!isValidElement<Record<string,unknown>>(node)) return
 if(match(node)) return node
 const children=node.props.children
 for(const child of Array.isArray(children)?children:[children]) {const found=find(child,match);if(found)return found}
}
beforeEach(()=>{hooks.selected=undefined;hooks.set.mockClear()})
test("Search web defaults off with a 44px native button",()=>{
 const html=renderToStaticMarkup(createElement(Composer,props()))
 expect(html).toMatch(/<button type="button" aria-pressed="false" class="[^"]*min-h-11[^"]*">Search web<\/button>/)
})
test("submit forwards toggle and resets it",()=>{
 hooks.selected=true;const p=props();const tree=Composer(p)
 const submit=tree.props.onSubmit as (event:{preventDefault:()=>void})=>void
 submit({preventDefault:vi.fn()})
 expect(p.onSend).toHaveBeenCalledWith(true);expect(hooks.set).toHaveBeenCalledWith(false)
})
test("Enter sends and resets selected web search",()=>{
 hooks.selected=true;const p=props();const tree=Composer(p)
 const textarea=find(tree,e=>e.type === "textarea")!
 const key=textarea.props.onKeyDown as (e:{key:string;shiftKey:boolean;preventDefault:()=>void})=>void
 key({key:"Enter",shiftKey:false,preventDefault:vi.fn()})
 expect(p.onSend).toHaveBeenCalledWith(true);expect(hooks.set).toHaveBeenCalledWith(false)
})
test("Stop preserves the toggle",()=>{
 hooks.selected=true;const p={...props(),streaming:true};const tree=Composer(p)
 const stop=find(tree,e=>e.props['aria-label'] === "Stop response")!
 ;(stop.props.onClick as ()=>void)()
 expect(p.onStop).toHaveBeenCalledOnce();expect(hooks.set).not.toHaveBeenCalled()
})
