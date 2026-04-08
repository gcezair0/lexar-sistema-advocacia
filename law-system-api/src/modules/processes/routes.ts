import { FastifyInstance } from 'fastify'
import { ProcessController } from './controller/process.controller'
import { authMiddleware } from '../../shared/middlewares/auth.middleware'

export async function processRoutes(app: FastifyInstance) {
  const controller = new ProcessController()

  app.addHook('onRequest', authMiddleware)

  app.post('/', controller.create)
  app.get('/', controller.list)
  app.get('/stats', controller.stats)
  app.get('/:id', controller.show)
  app.put('/:id', controller.update)
  app.delete('/:id', controller.delete)

  // Timeline / Movements
  app.post('/:id/movements', controller.addMovement)
  app.get('/:id/movements', controller.getTimeline)
}