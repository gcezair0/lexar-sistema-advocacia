import { FastifyInstance } from 'fastify'
import { NotificationController } from './controller/notification.controller'
import { authMiddleware } from '../../shared/middlewares/auth.middleware'

export async function notificationRoutes(app: FastifyInstance) {
  const controller = new NotificationController()

  app.addHook('onRequest', authMiddleware)

  app.get('/', controller.list)
  app.get('/unread-count', controller.countUnread)
  app.patch('/:id/read', controller.markAsRead)
  app.patch('/read-all', controller.markAllAsRead)
}
