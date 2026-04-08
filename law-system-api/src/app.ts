import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import { registerRoutes } from './shared/infra/http/routes'
import { errorHandler } from './shared/errors/error-handler'
import { env } from './shared/config/env'

export function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === 'development'
      ? { transport: { target: 'pino-pretty' } }
      : true,
  })

  // Plugins
  app.register(cors, {
    origin: true,
    credentials: true,
  })

  app.register(jwt, {
    secret: env.JWT_SECRET,
  })

  app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  })

  // Global error handler
  app.setErrorHandler(errorHandler)

  // Routes
  app.register(registerRoutes)

  return app
}