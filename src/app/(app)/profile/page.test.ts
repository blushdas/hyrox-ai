import React from "react";
import { beforeEach,afterEach,expect,it,vi } from "vitest";
import type { ReactElement } from "react";
import { profile } from "@/lib/api/test-d1";
const mocks=vi.hoisted(()=>({native:vi.fn(()=>false),clearProfile:vi.fn(),clearPlan:vi.fn(),reset:vi.fn(),signOut:vi.fn(),toast:vi.fn()}));
vi.mock("react",async original=>({...await original<typeof import("react")>(),useEffect:()=>undefined,useState:(initial:unknown)=>[initial,vi.fn()],useRef:(current:unknown)=>({current})}));
vi.mock("next/navigation",()=>({useRouter:()=>({replace:vi.fn(),push:vi.fn()})}));
vi.mock("next-auth/react",()=>({signOut:mocks.signOut}));vi.mock("@capacitor/core",()=>({Capacitor:{isNativePlatform:mocks.native}}));
vi.mock("sonner",()=>({toast:{error:mocks.toast}}));
vi.mock("@/stores/athlete-store",()=>({useAthleteStore:Object.assign(()=>({profile,setProfile:vi.fn()}),{getState:()=>({clearProfile:mocks.clearProfile})})}));
vi.mock("@/stores/plan-store",()=>({usePlanStore:Object.assign(()=>({clearPlan:mocks.clearPlan}),{getState:()=>({clearPlan:mocks.clearPlan})})}));
vi.mock("@/stores/coach-ai-store",()=>({useCoachAIStore:{getState:()=>({reset:mocks.reset})}}));
vi.mock("@/hooks/use-plan-generator",()=>({usePlanGenerator:()=>({generatePlan:vi.fn()})}));
import ProfilePage from "./page";
import { DeleteAccountDialog } from "@/components/ui/alert-dialog";
function findDialog(node:unknown): ReactElement<{onConfirm:()=>Promise<void>}> | undefined {
 if(!React.isValidElement(node))return;
 if(node.type===DeleteAccountDialog)return node as ReactElement<{onConfirm:()=>Promise<void>}>;
 const children=(node.props as {children?:unknown}).children;
 for(const child of Array.isArray(children)?children.flat():[children]){const found=findDialog(child);if(found)return found;}
}
beforeEach(()=>{vi.clearAllMocks();mocks.native.mockReturnValue(false);vi.stubGlobal("React",React);});
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
it("deletion sends one request during repeated confirms, then clears stores and signs out",async()=>{
 let release:(r:Response)=>void=()=>{throw new Error("not ready");};
 const fetcher=vi.spyOn(globalThis,"fetch").mockImplementation(()=>new Promise(resolve=>{release=resolve;}));
 const dialog=findDialog(ProfilePage())!;const first=dialog.props.onConfirm();const second=dialog.props.onConfirm();
 expect(fetcher).toHaveBeenCalledExactlyOnceWith("/api/me/account",{method:"DELETE"});
 release(new Response(null,{status:204}));await Promise.all([first,second]);
 expect(mocks.clearProfile).toHaveBeenCalledOnce();expect(mocks.clearPlan).toHaveBeenCalledOnce();expect(mocks.reset).toHaveBeenCalledOnce();expect(mocks.signOut).toHaveBeenCalledExactlyOnceWith({callbackUrl:"/sign-in"});
});
it("failed deletion preserves signed-in data and shows error",async()=>{
 vi.spyOn(globalThis,"fetch").mockResolvedValue(new Response(null,{status:500}));await findDialog(ProfilePage())!.props.onConfirm();
 expect(mocks.toast).toHaveBeenCalledOnce();expect(mocks.clearProfile).not.toHaveBeenCalled();expect(mocks.signOut).not.toHaveBeenCalled();
});
it("native profile hides deletion until phase 2 Bearer support",()=>{mocks.native.mockReturnValue(true);expect(findDialog(ProfilePage())).toBeUndefined();});
