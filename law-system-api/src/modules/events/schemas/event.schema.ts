import { z } from 'zod'

export const createEventSchema = z.object({
  title: z.string().min(2, 'Título é obrigatório'),
  description: z.string().optional(),
  type: z.enum(['HEARING', 'DEADLINE', 'MEETING', 'TASK']).default('TASK'),
  startDate: z.string().datetime('Data de início inválida'),
  endDate: z.string().datetime().optional(),
  allDay: z.boolean().default(false),
  assignedToId: z.string().optional(),
  clientId: z.string().optional(),
  processId: z.string().optional(),
})

export const updateEventSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  type: z.enum(['HEARING', 'DEADLINE', 'MEETING', 'TASK']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  completed: z.boolean().optional(),
  assignedToId: z.string().optional(),
  clientId: z.string().optional(),
  processId: z.string().optional(),
})

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
