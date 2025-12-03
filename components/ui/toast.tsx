"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, Info, X, AlertTriangle } from "lucide-react"

// ============================================================================
// Toast Context & Provider - Simple, beautiful toast notifications
// ============================================================================

type ToastType = "success" | "error" | "info" | "warning"

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (type: ToastType, title: string, description?: string) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((type: ToastType, title: string, description?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setToasts(prev => [...prev, { id, type, title, description }])

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

// ============================================================================
// Toast Container & Item
// ============================================================================

function ToastContainer({ toasts, removeToast }: { toasts: Toast[], removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast, onClose: () => void }) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  }

  const backgrounds = {
    success: "border-emerald-500/20 bg-emerald-500/5",
    error: "border-red-500/20 bg-red-500/5",
    info: "border-blue-500/20 bg-blue-500/5",
    warning: "border-amber-500/20 bg-amber-500/5",
  }

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-xl border bg-card shadow-xl",
        "animate-in slide-in-from-right-full fade-in duration-300",
        backgrounds[toast.type]
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[toast.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded-md hover:bg-muted/50 transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  )
}

// ============================================================================
// Confirmation Dialog Hook - Modern replacement for confirm()
// ============================================================================

interface ConfirmOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}

interface ConfirmDialogState extends ConfirmOptions {
  isOpen: boolean
  resolve: ((value: boolean) => void) | null
}

const ConfirmContext = React.createContext<{
  confirm: (options: ConfirmOptions) => Promise<boolean>
  dialogState: ConfirmDialogState
  handleConfirm: () => void
  handleCancel: () => void
} | undefined>(undefined)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [dialogState, setDialogState] = React.useState<ConfirmDialogState>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "default",
    resolve: null,
  })

  const confirm = React.useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        ...options,
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        variant: options.variant || "default",
        resolve,
      })
    })
  }, [])

  const handleConfirm = React.useCallback(() => {
    dialogState.resolve?.(true)
    setDialogState(prev => ({ ...prev, isOpen: false, resolve: null }))
  }, [dialogState.resolve])

  const handleCancel = React.useCallback(() => {
    dialogState.resolve?.(false)
    setDialogState(prev => ({ ...prev, isOpen: false, resolve: null }))
  }, [dialogState.resolve])

  return (
    <ConfirmContext.Provider value={{ confirm, dialogState, handleConfirm, handleCancel }}>
      {children}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = React.useContext(ConfirmContext)
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider")
  }
  return context.confirm
}

export function useConfirmDialog() {
  const context = React.useContext(ConfirmContext)
  if (!context) {
    throw new Error("useConfirmDialog must be used within a ConfirmProvider")
  }
  return context
}

