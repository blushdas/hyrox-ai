"use client";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Button } from "./button";
export function DeleteAccountDialog({ open, busy, onOpenChange, onConfirm }: {
 open: boolean; busy: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void;
}) {
 return <AlertDialog.Root open={open} onOpenChange={value => { if (!busy) onOpenChange(value); }}>
  <AlertDialog.Portal>
   <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/70" />
   <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border bg-background p-6 shadow-xl">
    <AlertDialog.Title className="text-lg font-semibold">Delete account?</AlertDialog.Title>
    <AlertDialog.Description className="my-4 text-sm text-text-2">This permanently deletes your account, training plans, and Coach conversations. This cannot be undone.</AlertDialog.Description>
    <div className="flex flex-wrap gap-3">
     <AlertDialog.Close render={<Button variant="outline" disabled={busy} />}>Cancel</AlertDialog.Close>
     <Button variant="destructive" disabled={busy} onClick={onConfirm}>Delete my account permanently</Button>
    </div>
   </AlertDialog.Popup>
  </AlertDialog.Portal>
 </AlertDialog.Root>;
}
