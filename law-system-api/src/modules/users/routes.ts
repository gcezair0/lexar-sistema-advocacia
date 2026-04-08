import { FastifyInstance } from 'fastify'
import { UserController } from './controller/user.controller'
import { authMiddleware } from '../../shared/middlewares/auth.middleware'
import { rolesMiddleware } from '../../shared/middlewares/roles.middleware'

export async function userRoutes(app: FastifyInstance) {
  const controller = new UserController()

  // All user routes require authentication
  app.addHook('onRequest', authMiddleware)

  app.post('/', { preHandler: [rolesMiddleware('ADMIN')] }, controller.create)
  app.get('/', controller.list)
  app.get('/:id', controller.show)
  app.put('/:id', { preHandler: [rolesMiddleware('ADMIN')] }, controller.update)
  app.patch('/:id/deactivate', { preHandler: [rolesMiddleware('ADMIN')] }, controller.deactivate)
}