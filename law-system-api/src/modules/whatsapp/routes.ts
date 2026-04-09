import { FastifyInstance } from 'fastify'
import { WhatsAppController } from './controller/whatsapp.controller'
import { authMiddleware } from '../../shared/middlewares/auth.middleware'

export async function whatsappRoutes(app: FastifyInstance) {
  const controller = new WhatsAppController()

  // Webhook - sem auth (chamado externamente ou pelo próprio Baileys)
  app.post('/webhook', controller.webhook)

  // Rotas protegidas
  app.register(async (protectedApp) => {
    protectedApp.addHook('onRequest', authMiddleware)

    // Conexão WhatsApp
    protectedApp.post('/connect', controller.connect)
    protectedApp.get('/status', controller.status)
    protectedApp.post('/disconnect', controller.disconnect)
    protectedApp.post('/send', controller.sendMessage)

    // Leads
    protectedApp.get('/leads', controller.listLeads)
    protectedApp.patch('/leads/:id/convert', controller.convertLead)
  })
}
