'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import api from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'LAWYER' | 'INTERN' | 'SECRETARY'
  officeId: string
  oabNumber?: string
}

interface AuthContextData {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = Cookies.get('accessToken')
    const savedUser = Cookies.get('user')

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        Cookies.remove('accessToken')
        Cookies.remove('refreshToken')
        Cookies.remove('user')
      }
    }
    setIsLoading(false)
  }, [])

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password })

    Cookies.set('accessToken', data.accessToken, { expires: 1 })
    Cookies.set('refreshToken', data.refreshToken, { expires: 7 })
    Cookies.set('user', JSON.stringify(data.user), { expires: 7 })

    setUser(data.user)
    router.push('/dashboard')
  }

  function logout() {
    const refreshToken = Cookies.get('refreshToken')
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => {})
    }

    Cookies.remove('accessToken')
    Cookies.remove('refreshToken')
    Cookies.remove('user')
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
