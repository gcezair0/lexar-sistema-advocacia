import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { registerRoutes } from './shared/infra/http/routes'

export function buildApp() {
  const app = Fastify()

  app.register(cors)

  app.register(jwt, {
    secret: 'secret'
  })

  app.decorate('authenticate', async (req: any, reply: any) => {
    try {
      await req.jwtVerify()
    } catch {
      reply.status(401).send({ message: 'Unauthorized' })
    }
  })

  app.register(registerRoutes)

  return app
}