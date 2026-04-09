import { z } from 'zod'

export const uploadDocumentSchema = z.object({
  name: z.string().optional(),
  category: z.enum(['CONTRACT', 'PETITION', 'EVIDENCE', 'COURT_ORDER', 'OTHER']).default('OTHER'),
  clientId: z.string().optional(),
  processId: z.string().optional(),
})

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>
