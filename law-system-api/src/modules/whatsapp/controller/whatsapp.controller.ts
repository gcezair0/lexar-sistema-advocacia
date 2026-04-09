import { FastifyRequest, FastifyReply } from 'fastify'
import { BotFlowService } from '../service/bot-flow.service'
import { WhatsAppService } from '../service/whatsapp.service'
import { LeadRepository } from '../repository/lead.repository'
import { paginationSchema, paginatedResponse } from '../../../shared/helpers/pagination'

export class WhatsAppController {
  private botFlow = new BotFlowService()
  private leadRepo = new LeadRepository()

  /**
   * Iniciar conexão com WhatsApp — gera QR Code no terminal
   */
  connect = async (req: FastifyRequest, reply: FastifyReply) => {
    const { officeId } = req.currentUser
    const whatsapp = WhatsAppService.getInstance(officeId)

    await whatsapp.connect()

    return reply.send({
      message: '📱 Conexão iniciada! Verifique o terminal para escanear o QR Code.',
      ...whatsapp.getStatus(),
    })
  }

  /**
   * Ver status da conexão WhatsApp
   */
  status = async (req: FastifyRequest, reply: FastifyReply) => {
    const { officeId } = req.currentUser
    const whatsapp = WhatsAppService.getInstance(officeId)

    return reply.send(whatsapp.getStatus())
  }

  /**
   * Desconectar do WhatsApp
   */
  disconnect = async (req: FastifyRequest, reply: FastifyReply) => {
    const { officeId } = req.currentUser
    const whatsapp = WhatsAppService.getInstance(officeId)

    await whatsapp.disconnect()

    return reply.send({ message: '📱 WhatsApp desconectado.' })
  }

  /**
   * Webhook para receber mensagens do WhatsApp (uso externo)
   */
  webhook = async (req: FastifyRequest, reply: FastifyReply) => {
    const { phone, message, officeId } = req.body as {
      phone: string
      message: string
      officeId: string
    }

    if (!phone || !message || !officeId) {
      return reply.status(400).send({ message: 'phone, message e officeId são obrigatórios' })
    }

    try {
      const responses = await this.botFlow.handleMessage(phone, message, officeId)
      return reply.send({ responses })
    } catch (error: any) {
      return reply.status(500).send({ message: 'Erro ao processar mensagem', error: error.message })
    }
  }

  /**
   * Enviar mensagem manual via WhatsApp
   */
  sendMessage = async (req: FastifyRequest, reply: FastifyReply) => {
    const { phone, message } = req.body as { phone: string; message: string }
    const { officeId } = req.currentUser

    if (!phone || !message) {
      return reply.status(400).send({ message: 'phone e message são obrigatórios' })
    }

    const whatsapp = WhatsAppService.getInstance(officeId)
    await whatsapp.sendMessage(phone, message)

    return reply.send({ message: 'Mensagem enviada', phone })
  }

  /**
   * Listar leads capturados
   */
  listLeads = async (req: FastifyRequest, reply: FastifyReply) => {
    const { officeId } = req.currentUser
    const { converted } = req.query as { converted?: string }
    const leads = await this.leadRepo.findAll(
      officeId,
      converted ? converted === 'true' : undefined
    )
    return reply.send(leads)
  }

  /**
   * Converter lead em cliente
   */
  convertLead = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const lead = await this.leadRepo.convert(id)
    return reply.send(lead)
  }
}
