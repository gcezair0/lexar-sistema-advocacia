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

const clientSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido').or(z.literal('')).optional(),
  phone: z.string().min(10, 'Telefone inválido'),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ inválido'),
  type: z.enum(['INDIVIDUAL', 'COMPANY']),
  address: z.string().optional(),
  notes: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

interface ClientFormDialogProps {
  open: boolean
  onClose: () => void
  client: {
    id: string
    name: string
    email: string | null
    phone: string
    cpfCnpj: string
    type: 'INDIVIDUAL' | 'COMPANY'
    address: string | null
  } | null
  onSuccess: () => void
}

export function ClientFormDialog({ open, onClose, client, onSuccess }: ClientFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!client

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    values: client
      ? {
          name: client.name,
          email: client.email || '',
          phone: client.phone,
          cpfCnpj: client.cpfCnpj,
          type: client.type,
          address: client.address || '',
        }
      : {
          name: '',
          email: '',
          phone: '',
          cpfCnpj: '',
          type: 'INDIVIDUAL',
          address: '',
        },
  })

  async function onSubmit(data: ClientFormData) {
    setLoading(true)
    try {
      if (isEditing) {
        await api.put(`/clients/${client!.id}`, data)
        toast({ type: 'success', title: 'Cliente atualizado com sucesso' })
      } else {
        await api.post('/clients', data)
        toast({ type: 'success', title: 'Cliente cadastrado com sucesso' })
      }
      reset()
      onSuccess()
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } }
      toast({ type: 'error', title: apiErr.response?.data?.error || 'Erro ao salvar cliente' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-xl">
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        <DialogClose onClose={onClose} />
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="name"
              label="Nome completo"
              {...register('name')}
              error={errors.name?.message}
              placeholder="João da Silva"
            />
            <Select
              id="type"
              label="Tipo"
              {...register('type')}
              error={errors.type?.message}
              options={[
                { value: 'INDIVIDUAL', label: 'Pessoa Física' },
                { value: 'COMPANY', label: 'Pessoa Jurídica' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="cpfCnpj"
              label="CPF / CNPJ"
              {...register('cpfCnpj')}
              error={errors.cpfCnpj?.message}
              placeholder="000.000.000-00"
            />
            <Input
              id="phone"
              label="Telefone"
              {...register('phone')}
              error={errors.phone?.message}
              placeholder="(11) 99999-9999"
            />
          </div>

          <Input
            id="email"
            label="E-mail"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="email@exemplo.com"
          />

          <Textarea
            id="address"
            label="Endereço"
            {...register('address')}
            error={errors.address?.message}
            placeholder="Rua, número, bairro, cidade - UF"
            className="min-h-[60px]"
          />
        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
