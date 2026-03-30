import { FastifyInstance } from 'fastify'
import { userRoutes } from '../../../modules/users/routes'
import { processRoutes } from '../../../modules/processes/routes'

export async function registerRoutes(app: FastifyInstance) {
  app.register(userRoutes, { prefix: '/users' })
  app.register(processRoutes, { prefix: '/processes' })
}