import { z } from 'zod'

export const createClientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  cpfCnpj: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('LEAD'),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  lgpdConsent: z.boolean().default(false),
})

export const updateClientSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  cpfCnpj: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  lgpdConsent: z.boolean().optional(),
})

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
