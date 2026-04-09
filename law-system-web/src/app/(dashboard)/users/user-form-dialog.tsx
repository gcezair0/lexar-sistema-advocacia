'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogHeader, DialogTitle, DialogClose, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import api from '@/lib/api'

const userSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres').or(z.literal('')),
  role: z.enum(['ADMIN', 'LAWYER', 'INTERN', 'SECRETARY']),
  oabNumber: z.string().optional(),
})

type UserFormData = z.infer<typeof userSchema>

interface UserFormDialogProps {
  open: boolean
  onClose: () => void
  user: {
    id: string
    name: string
    email: string
    role: string
    oabNumber: string | null
  } | null
  onSuccess: () => void
}

export function UserFormDialog({ open, onClose, user, onSuccess }: UserFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!user

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    values: user
      ? {
          name: user.name,
          email: user.email,
          password: '',
          role: user.role as 'ADMIN' | 'LAWYER' | 'INTERN' | 'SECRETARY',
          oabNumber: user.oabNumber || '',
        }
      : {
          name: '',
          email: '',
          password: '',
          role: 'LAWYER',
          oabNumber: '',
        },
  })

  async function onSubmit(data: UserFormData) {
    setLoading(true)
    try {
      const payload: Record<string, unknown> = { ...data }
      if (isEditing && !data.password) delete payload.password

      if (isEditing) {
        await api.put(`/users/${user!.id}`, payload)
        toast({ type: 'success', title: 'Usuário atualizado' })
      } else {
        if (!data.password) {
          toast({ type: 'error', title: 'Senha é obrigatória para novos usuários' })
          setLoading(false)
          return
        }
        await api.post('/users', payload)
        toast({ type: 'success', title: 'Usuário criado' })
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
        <DialogTitle>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
        <DialogClose onClose={onClose} />
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent className="space-y-4">
          <Input id="name" label="Nome" {...register('name')} error={errors.name?.message} placeholder="Nome completo" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="email" label="E-mail" type="email" {...register('email')} error={errors.email?.message} placeholder="email@exemplo.com" />
            <Input id="password" label={isEditing ? 'Nova Senha (deixe vazio para manter)' : 'Senha'} type="password" {...register('password')} error={errors.password?.message} placeholder="••••••" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select id="role" label="Cargo" {...register('role')} error={errors.role?.message} options={[
              { value: 'ADMIN', label: 'Administrador' },
              { value: 'LAWYER', label: 'Advogado' },
              { value: 'INTERN', label: 'Estagiário' },
              { value: 'SECRETARY', label: 'Secretária' },
            ]} />
            <Input id="oabNumber" label="Número OAB" {...register('oabNumber')} placeholder="SP123456" />
          </div>
        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
