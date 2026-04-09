import { FastifyInstance } from 'fastify'
import { EventController } from './controller/event.controller'
import { authMiddleware } from '../../shared/middlewares/auth.middleware'

export async function eventRoutes(app: FastifyInstance) {
  const controller = new EventController()

  app.addHook('onRequest', authMiddleware)

  app.post('/', controller.create)
  app.get('/', controller.list)
  app.get('/upcoming', controller.upcoming)
  app.get('/:id', controller.show)
  app.put('/:id', controller.update)
  app.patch('/:id/complete', controller.complete)
  app.delete('/:id', controller.delete)
}
