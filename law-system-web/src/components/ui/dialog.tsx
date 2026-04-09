'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Dialog({ open, onClose, children, className }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div
        className={cn(
          'relative bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto w-full mx-4 animate-in fade-in zoom-in-95',
          className || 'max-w-lg'
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between p-6 pb-0', className)}>
      {children}
    </div>
  )
}

export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn('text-lg font-semibold text-gray-900', className)}>{children}</h2>
  )
}

export function DialogClose({ onClose }: { onClose: () => void }) {
  return (
    <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-gray-600">
      <X className="h-4 w-4" />
    </Button>
  )
}

export function DialogContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-6', className)}>{children}</div>
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-end gap-3 p-6 pt-0', className)}>
      {children}
    </div>
  )
}
