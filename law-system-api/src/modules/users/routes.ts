import { FastifyInstance } from 'fastify'
import { UserController } from './controller/user.controller'

export async function userRoutes(app: FastifyInstance) {
  const controller = new UserController()

  app.post('/', controller.create)
  app.get('/', controller.list)
}