'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { MessageSquare, Send, Search, Phone, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import api from '@/lib/api'
import { formatDateTime, formatPhone } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ChatSession {
  id: string
  phone: string
  clientName: string | null
  status: string
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}

interface ChatMessage {
  id: string
  content: string
  sender: 'CLIENT' | 'BOT' | 'LAWYER'
  createdAt: string
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [search, setSearch] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadSessions = useCallback(async () => {
    try {
      const { data } = await api.get('/chat/sessions', {
        params: { search: search || undefined },
      })
      setSessions(data.data || data.sessions || data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    loadSessions()
    const interval = setInterval(loadSessions, 10000)
    return () => clearInterval(interval)
  }, [loadSessions])

  async function loadMessages(session: ChatSession) {
    setSelectedSession(session)
    setMessagesLoading(true)
    try {
      const { data } = await api.get(`/chat/sessions/${session.id}/messages`)
      setMessages(data.data || data.messages || data)
    } catch {
      toast({ type: 'error', title: 'Erro ao carregar mensagens' })
    } finally {
      setMessagesLoading(false)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Poll messages for selected session
  useEffect(() => {
    if (!selectedSession) return
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/chat/sessions/${selectedSession.id}/messages`)
        setMessages(data.data || data.messages || data)
      } catch {
        // silent
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [selectedSession])

  async function handleSend() {
    if (!newMessage.trim() || !selectedSession) return
    try {
      await api.post(`/chat/sessions/${selectedSession.id}/messages`, {
        content: newMessage,
      })
      setNewMessage('')
      // Reload messages
      const { data } = await api.get(`/chat/sessions/${selectedSession.id}/messages`)
      setMessages(data.data || data.messages || data)
    } catch {
      toast({ type: 'error', title: 'Erro ao enviar mensagem' })
    }
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] -m-4 lg:-m-6">
      {/* Sessions List */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Conversas</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Nenhuma conversa encontrada
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => loadMessages(session)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 text-left transition-colors',
                  selectedSession?.id === session.id && 'bg-blue-50 hover:bg-blue-50'
                )}
              >
                <Avatar name={session.clientName || session.phone} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {session.clientName || formatPhone(session.phone)}
                    </p>
                    {session.unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2 text-[10px] px-1.5">
                        {session.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{session.lastMessage || 'Sem mensagens'}</p>
                  {session.lastMessageAt && (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {formatDateTime(session.lastMessageAt)}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <Avatar name={selectedSession.clientName || selectedSession.phone} />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedSession.clientName || formatPhone(selectedSession.phone)}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {formatPhone(selectedSession.phone)}
                  </p>
                </div>
              </div>
              <Badge variant={selectedSession.status === 'ACTIVE' ? 'success' : 'secondary'}>
                {selectedSession.status === 'ACTIVE' ? 'Ativo' : 'Encerrado'}
              </Badge>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-8">Nenhuma mensagem ainda</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex',
                      msg.sender === 'CLIENT' ? 'justify-start' : 'justify-end'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[70%] rounded-2xl px-4 py-2.5 text-sm',
                        msg.sender === 'CLIENT'
                          ? 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                          : msg.sender === 'BOT'
                          ? 'bg-gray-200 text-gray-800 rounded-br-md'
                          : 'bg-blue-600 text-white rounded-br-md'
                      )}
                    >
                      {msg.sender !== 'CLIENT' && (
                        <p className="text-[10px] font-medium mb-1 opacity-70">
                          {msg.sender === 'BOT' ? '🤖 Bot' : '👤 Advogado'}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className={cn(
                        'text-[10px] mt-1',
                        msg.sender === 'CLIENT' ? 'text-gray-400' : 'opacity-60'
                      )}>
                        {formatDateTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            icon={<MessageSquare className="h-12 w-12" />}
            title="Selecione uma conversa"
            description="Escolha uma conversa à esquerda para visualizar as mensagens."
            className="flex-1"
          />
        )}
      </div>
    </div>
  )
}
