"use client"

import { ToastProvider, ConfirmProvider } from "@/components/ui/toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        {children}
        <ConfirmDialog />
      </ConfirmProvider>
    </ToastProvider>
  )
}

