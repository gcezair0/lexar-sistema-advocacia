import { FastifyInstance } from 'fastify'
import { ClientController } from './controller/client.controller'
import { authMiddleware } from '../../shared/middlewares/auth.middleware'

export async function clientRoutes(app: FastifyInstance) {
  const controller = new ClientController()

  app.addHook('onRequest', authMiddleware)

  app.post('/', controller.create)
  app.get('/', controller.list)
  app.get('/stats', controller.stats)
  app.get('/:id', controller.show)
  app.put('/:id', controller.update)
  app.delete('/:id', controller.delete)
}
