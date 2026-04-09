import { FastifyInstance } from 'fastify'
import { DocumentController } from './controller/document.controller'
import { authMiddleware } from '../../shared/middlewares/auth.middleware'

export async function documentRoutes(app: FastifyInstance) {
  const controller = new DocumentController()

  app.addHook('onRequest', authMiddleware)

  app.post('/upload', controller.upload)
  app.get('/', controller.list)
  app.get('/:id', controller.show)
  app.get('/:id/download', controller.download)
  app.delete('/:id', controller.delete)
}
