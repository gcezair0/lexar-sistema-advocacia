import { FastifyInstance } from 'fastify'
import { AuthController } from './controller/auth.controller'

export async function authRoutes(app: FastifyInstance) {
  const controller = new AuthController()

  app.post('/login', controller.login)
}