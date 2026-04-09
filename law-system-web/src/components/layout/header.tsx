'use client'

import { useAuth } from '@/contexts/auth-context'
import { Avatar } from '@/components/ui/avatar'
import { Bell, LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useRef, useEffect } from 'react'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden text-gray-500 hover:text-gray-700">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative text-gray-500">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-1.5 transition-colors"
          >
            <Avatar name={user?.name || 'U'} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-700 leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-500 leading-tight">
                {user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'LAWYER' ? 'Advogado' : 'Secretária'}
              </p>
            </div>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowMenu(false)
                  logout()
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
