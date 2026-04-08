import { z } from 'zod'

export const createProcessSchema = z.object({
  number: z.string().min(1, 'Número do processo é obrigatório'),
  title: z.string().min(2, 'Título deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  court: z.string().optional(),
  actionType: z.string().optional(),
  status: z.enum(['ACTIVE', 'CLOSED', 'SUSPENDED', 'ARCHIVED']).default('ACTIVE'),
  distributedAt: z.string().datetime().optional(),
  clientId: z.string().optional(),
  lawyerId: z.string().optional(),
})

export const updateProcessSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  court: z.string().optional(),
  actionType: z.string().optional(),
  status: z.enum(['ACTIVE', 'CLOSED', 'SUSPENDED', 'ARCHIVED']).optional(),
  clientId: z.string().optional(),
  lawyerId: z.string().optional(),
})

export const createMovementSchema = z.object({
  title: z.string().min(2, 'Título da movimentação é obrigatório'),
  description: z.string().optional(),
})

export type CreateProcessInput = z.infer<typeof createProcessSchema>
export type UpdateProcessInput = z.infer<typeof updateProcessSchema>
export type CreateMovementInput = z.infer<typeof createMovementSchema>
