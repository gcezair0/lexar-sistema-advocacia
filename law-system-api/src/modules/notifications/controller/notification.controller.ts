import { FastifyRequest, FastifyReply } from 'fastify'
import { NotificationService } from '../service/notification.service'
import { NotificationRepository } from '../repository/notification.repository'
import { paginationSchema, paginatedResponse } from '../../../shared/helpers/pagination'

export class NotificationController {
  private service = new NotificationService(new NotificationRepository())

  list = async (req: FastifyRequest, reply: FastifyReply) => {
    const { page, limit } = paginationSchema.parse(req.query)
    const { read } = req.query as { read?: string }
    const { officeId } = req.currentUser
    const { data, total } = await this.service.findAll(
      officeId,
      page,
      limit,
      read !== undefined ? read === 'true' : undefined
    )

    return reply.send(paginatedResponse(data, total, page, limit))
  }

  markAsRead = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    await this.service.markAsRead(id)
    return reply.send({ message: 'Notificação marcada como lida' })
  }

  markAllAsRead = async (req: FastifyRequest, reply: FastifyReply) => {
    const { officeId, sub: userId } = req.currentUser
    await this.service.markAllAsRead(officeId, userId)
    return reply.send({ message: 'Todas as notificações marcadas como lidas' })
  }

  countUnread = async (req: FastifyRequest, reply: FastifyReply) => {
    const { officeId, sub: userId } = req.currentUser
    const count = await this.service.countUnread(officeId, userId)
    return reply.send({ unread: count })
  }
}
