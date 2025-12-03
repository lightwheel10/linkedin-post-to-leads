"use client"

import { useConfirmDialog } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function ConfirmDialog() {
  const { dialogState, handleConfirm, handleCancel } = useConfirmDialog()

  return (
    <Dialog open={dialogState.isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              dialogState.variant === "destructive" 
                ? "bg-red-500/10" 
                : "bg-primary/10"
            )}>
              {dialogState.variant === "destructive" ? (
                <Trash2 className="w-5 h-5 text-red-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-primary" />
              )}
            </div>
            <DialogTitle>{dialogState.title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {dialogState.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            {dialogState.cancelText}
          </Button>
          <Button 
            variant={dialogState.variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            className={cn(
              dialogState.variant === "destructive" && "bg-red-500 hover:bg-red-600"
            )}
          >
            {dialogState.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

