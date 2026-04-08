import { z } from 'zod'

export const envSchema = z.object({
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().default('supersecret'),
  JWT_REFRESH_SECRET: z.string().default('refreshsecret'),
  PORT: z.coerce.number().default(3333),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  UPLOAD_DIR: z.string().default('./uploads'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type Env = z.infer<typeof envSchema>

export const env = envSchema.parse(process.env)
