import { FastifyInstance } from 'fastify'
import { DashboardController } from './controller/dashboard.controller'
import { authMiddleware } from '../../shared/middlewares/auth.middleware'

export async function dashboardRoutes(app: FastifyInstance) {
  const controller = new DashboardController()

  app.addHook('onRequest', authMiddleware)

  app.get('/stats', controller.getStats)
  app.get('/activity', controller.getRecentActivity)
}
