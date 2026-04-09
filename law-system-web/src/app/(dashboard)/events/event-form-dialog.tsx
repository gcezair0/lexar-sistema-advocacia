'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogHeader, DialogTitle, DialogClose, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import api from '@/lib/api'

const eventSchema = z.object({
  title: z.string().min(2, 'Título é obrigatório'),
  description: z.string().optional(),
  type: z.string().min(1, 'Tipo é obrigatório'),
  dateTime: z.string().min(1, 'Data/hora é obrigatória'),
  location: z.string().optional(),
  processId: z.string().optional(),
})

type EventFormData = z.infer<typeof eventSchema>

interface EventFormDialogProps {
  open: boolean
  onClose: () => void
  event: {
    id: string
    title: string
    description: string | null
    type: string
    dateTime: string
    location: string | null
    process?: { id: string } | null
  } | null
  onSuccess: () => void
}

function toLocalDatetime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EventFormDialog({ open, onClose, event, onSuccess }: EventFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!event

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    values: event
      ? {
          title: event.title,
          description: event.description || '',
          type: event.type,
          dateTime: toLocalDatetime(event.dateTime),
          location: event.location || '',
          processId: event.process?.id || '',
        }
      : {
          title: '',
          description: '',
          type: 'MEETING',
          dateTime: '',
          location: '',
          processId: '',
        },
  })

  async function onSubmit(data: EventFormData) {
    setLoading(true)
    try {
      const payload = {
        ...data,
        dateTime: new Date(data.dateTime).toISOString(),
        processId: data.processId || null,
      }
      if (isEditing) {
        await api.put(`/events/${event!.id}`, payload)
        toast({ type: 'success', title: 'Compromisso atualizado' })
      } else {
        await api.post('/events', payload)
        toast({ type: 'success', title: 'Compromisso criado' })
      }
      reset()
      onSuccess()
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } }
      toast({ type: 'error', title: apiErr.response?.data?.error || 'Erro ao salvar' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Editar Compromisso' : 'Novo Compromisso'}</DialogTitle>
        <DialogClose onClose={onClose} />
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent className="space-y-4">
          <Input id="title" label="Título" {...register('title')} error={errors.title?.message} placeholder="Audiência de instrução" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select id="type" label="Tipo" {...register('type')} error={errors.type?.message} options={[
              { value: 'HEARING', label: 'Audiência' },
              { value: 'MEETING', label: 'Reunião' },
              { value: 'DEADLINE', label: 'Prazo' },
              { value: 'TASK', label: 'Tarefa' },
              { value: 'OTHER', label: 'Outro' },
            ]} />
            <Input id="dateTime" label="Data e Hora" type="datetime-local" {...register('dateTime')} error={errors.dateTime?.message} />
          </div>

          <Input id="location" label="Local" {...register('location')} placeholder="Fórum Central, Sala 5" />

          <Textarea id="description" label="Descrição" {...register('description')} placeholder="Detalhes do compromisso..." className="min-h-[60px]" />
        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
