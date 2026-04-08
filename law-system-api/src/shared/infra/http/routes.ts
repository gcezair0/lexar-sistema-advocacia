import { FastifyInstance } from 'fastify'
import { userRoutes } from '../../../modules/users/routes'
import { processRoutes } from '../../../modules/processes/routes'
import { authRoutes } from '../../../modules/auth/routes'
import { clientRoutes } from '../../../modules/clients/routes'
import { documentRoutes } from '../../../modules/documents/routes'
import { eventRoutes } from '../../../modules/events/routes'
import { chatRoutes } from '../../../modules/chat/routes'
import { whatsappRoutes } from '../../../modules/whatsapp/routes'
import { dashboardRoutes } from '../../../modules/dashboard/routes'
import { notificationRoutes } from '../../../modules/notifications/routes'

export async function registerRoutes(app: FastifyInstance) {
  // Public routes
  app.register(authRoutes, { prefix: '/auth' })

  // Protected routes
  app.register(userRoutes, { prefix: '/users' })
  app.register(clientRoutes, { prefix: '/clients' })
  app.register(processRoutes, { prefix: '/processes' })
  app.register(documentRoutes, { prefix: '/documents' })
  app.register(eventRoutes, { prefix: '/events' })
  app.register(chatRoutes, { prefix: '/chat' })
  app.register(whatsappRoutes, { prefix: '/whatsapp' })
  app.register(dashboardRoutes, { prefix: '/dashboard' })
  app.register(notificationRoutes, { prefix: '/notifications' })

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }))
}