import { FastifyInstance } from 'fastify'
import { ProcessController } from './controller/process.controller'

export async function processRoutes(app: FastifyInstance) {
  const controller = new ProcessController()

  app.post('/', controller.create)
  app.get('/', controller.list)
}