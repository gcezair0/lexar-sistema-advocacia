import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'LAWYER', 'ASSISTANT']).default('LAWYER'),
  oabNumber: z.string().optional(),
  phone: z.string().optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'LAWYER', 'ASSISTANT']).optional(),
  oabNumber: z.string().optional(),
  phone: z.string().optional(),
  active: z.boolean().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
