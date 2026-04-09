'use client'

import { useState, useEffect } from 'react'
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

const processSchema = z.object({
  number: z.string().min(1, 'Número é obrigatório'),
  title: z.string().min(2, 'Título é obrigatório'),
  description: z.string().optional(),
  type: z.string().min(1, 'Tipo é obrigatório'),
  status: z.string().min(1, 'Status é obrigatório'),
  court: z.string().optional(),
  branch: z.string().optional(),
  value: z.string().optional(),
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  responsibleId: z.string().min(1, 'Responsável é obrigatório'),
})

type ProcessFormData = z.infer<typeof processSchema>

interface ProcessFormDialogProps {
  open: boolean
  onClose: () => void
  process: {
    id: string
    number: string
    title: string
    description: string | null
    type: string
    status: string
    court: string | null
    branch: string | null
    value: number | null
    client: { id: string }
    responsible: { id: string }
  } | null
  onSuccess: () => void
}

export function ProcessFormDialog({ open, onClose, process, onSuccess }: ProcessFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<{ value: string; label: string }[]>([])
  const [users, setUsers] = useState<{ value: string; label: string }[]>([])
  const isEditing = !!process

  useEffect(() => {
    if (open) {
      api.get('/clients', { params: { limit: 100 } }).then(({ data }) => {
        const list = data.data || data.clients || data
        setClients(list.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })))
      }).catch(() => {})

      api.get('/users', { params: { limit: 100 } }).then(({ data }) => {
        const list = data.data || data.users || data
        setUsers(list.map((u: { id: string; name: string }) => ({ value: u.id, label: u.name })))
      }).catch(() => {})
    }
  }, [open])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProcessFormData>({
    resolver: zodResolver(processSchema),
    values: process
      ? {
          number: process.number,
          title: process.title,
          description: process.description || '',
          type: process.type,
          status: process.status,
          court: process.court || '',
          branch: process.branch || '',
          value: process.value?.toString() || '',
          clientId: process.client.id,
          responsibleId: process.responsible.id,
        }
      : {
          number: '',
          title: '',
          description: '',
          type: 'CIVIL',
          status: 'ACTIVE',
          court: '',
          branch: '',
          value: '',
          clientId: '',
          responsibleId: '',
        },
  })

  async function onSubmit(data: ProcessFormData) {
    setLoading(true)
    try {
      const payload = {
        ...data,
        value: data.value ? parseFloat(data.value) : null,
      }
      if (isEditing) {
        await api.put(`/processes/${process!.id}`, payload)
        toast({ type: 'success', title: 'Processo atualizado' })
      } else {
        await api.post('/processes', payload)
        toast({ type: 'success', title: 'Processo cadastrado' })
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
    <Dialog open={open} onClose={onClose} className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Editar Processo' : 'Novo Processo'}</DialogTitle>
        <DialogClose onClose={onClose} />
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="number" label="Número do Processo" {...register('number')} error={errors.number?.message} placeholder="0000000-00.0000.0.00.0000" />
            <Select id="type" label="Tipo" {...register('type')} error={errors.type?.message} options={[
              { value: 'CIVIL', label: 'Cível' },
              { value: 'CRIMINAL', label: 'Criminal' },
              { value: 'LABOR', label: 'Trabalhista' },
              { value: 'TAX', label: 'Tributário' },
              { value: 'ADMINISTRATIVE', label: 'Administrativo' },
              { value: 'FAMILY', label: 'Família' },
              { value: 'CONSUMER', label: 'Consumidor' },
              { value: 'ENVIRONMENTAL', label: 'Ambiental' },
              { value: 'OTHER', label: 'Outro' },
            ]} />
          </div>

          <Input id="title" label="Título" {...register('title')} error={errors.title?.message} placeholder="Título do processo" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select id="clientId" label="Cliente" {...register('clientId')} error={errors.clientId?.message} options={clients} placeholder="Selecione o cliente" />
            <Select id="responsibleId" label="Advogado Responsável" {...register('responsibleId')} error={errors.responsibleId?.message} options={users} placeholder="Selecione o responsável" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select id="status" label="Status" {...register('status')} error={errors.status?.message} options={[
              { value: 'ACTIVE', label: 'Ativo' },
              { value: 'PENDING', label: 'Pendente' },
              { value: 'CLOSED', label: 'Encerrado' },
              { value: 'SUSPENDED', label: 'Suspenso' },
              { value: 'ARCHIVED', label: 'Arquivado' },
            ]} />
            <Input id="court" label="Tribunal" {...register('court')} placeholder="TJSP" />
            <Input id="value" label="Valor da Causa" {...register('value')} placeholder="10000.00" type="number" step="0.01" />
          </div>

          <Input id="branch" label="Vara" {...register('branch')} placeholder="1ª Vara Cível" />

          <Textarea id="description" label="Descrição" {...register('description')} placeholder="Detalhes do processo..." className="min-h-[60px]" />
        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar'}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
