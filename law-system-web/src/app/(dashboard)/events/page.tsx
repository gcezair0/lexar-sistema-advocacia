'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Calendar, Clock, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageLoader } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import api from '@/lib/api'
import { formatDate, formatDateTime } from '@/lib/utils'
import { EventFormDialog } from './event-form-dialog'

interface Event {
  id: string
  title: string
  description: string | null
  type: string
  dateTime: string
  location: string | null
  process?: { id: string; number: string; title: string } | null
  user: { id: string; name: string }
  createdAt: string
}

const typeMap: Record<string, { label: string; color: string }> = {
  HEARING: { label: 'Audiência', color: 'destructive' },
  MEETING: { label: 'Reunião', color: 'default' },
  DEADLINE: { label: 'Prazo', color: 'warning' },
  TASK: { label: 'Tarefa', color: 'secondary' },
  OTHER: { label: 'Outro', color: 'secondary' },
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/events', {
        params: { type: typeFilter || undefined, limit: 50 },
      })
      setEvents(data.data || data.events || data)
    } catch {
      toast({ type: 'error', title: 'Erro ao carregar agenda' })
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => {
    load()
  }, [load])

  async function handleDelete(id: string) {
    if (!confirm('Excluir este compromisso?')) return
    try {
      await api.delete(`/events/${id}`)
      toast({ type: 'success', title: 'Compromisso excluído' })
      load()
    } catch {
      toast({ type: 'error', title: 'Erro ao excluir' })
    }
  }

  // Group events by date
  const grouped = events.reduce<Record<string, Event[]>>((acc, evt) => {
    const dateKey = formatDate(evt.dateTime)
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(evt)
    return acc
  }, {})

  if (loading) return <PageLoader />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500 mt-1">Audiências, reuniões, prazos e tarefas</p>
        </div>
        <Button onClick={() => { setEditingEvent(null); setFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Compromisso
        </Button>
      </div>

      <div className="flex gap-3">
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[
            { value: '', label: 'Todos os tipos' },
            { value: 'HEARING', label: 'Audiências' },
            { value: 'MEETING', label: 'Reuniões' },
            { value: 'DEADLINE', label: 'Prazos' },
            { value: 'TASK', label: 'Tarefas' },
            { value: 'OTHER', label: 'Outros' },
          ]}
          className="w-48"
        />
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title="Nenhum compromisso"
          description="Sua agenda está vazia. Adicione um compromisso para começar."
          action={<Button onClick={() => { setEditingEvent(null); setFormOpen(true) }}><Plus className="h-4 w-4 mr-2" /> Novo Compromisso</Button>}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, evts]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> {date}
              </h3>
              <div className="space-y-2">
                {evts.map((evt) => {
                  const typeInfo = typeMap[evt.type] || { label: evt.type, color: 'secondary' }
                  const time = new Date(evt.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <Card key={evt.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[50px]">
                            <p className="text-lg font-bold text-gray-900">{time}</p>
                          </div>
                          <div className="border-l border-gray-200 pl-4">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium text-gray-900">{evt.title}</p>
                              <Badge variant={typeInfo.color as 'destructive' | 'warning' | 'secondary' | 'default'}>
                                {typeInfo.label}
                              </Badge>
                            </div>
                            {evt.description && <p className="text-xs text-gray-500">{evt.description}</p>}
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                              {evt.process && <span>📋 {evt.process.number}</span>}
                              {evt.location && <span>📍 {evt.location}</span>}
                              <span>👤 {evt.user.name}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingEvent(evt); setFormOpen(true) }}>
                            Editar
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(evt.id)}>
                            Excluir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <EventFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingEvent(null) }}
        event={editingEvent}
        onSuccess={() => { setFormOpen(false); setEditingEvent(null); load() }}
      />
    </div>
  )
}
