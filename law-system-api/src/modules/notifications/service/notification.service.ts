import { NotificationRepository } from '../repository/notification.repository'
import { WhatsAppService } from '../../whatsapp/service/whatsapp.service'

export class NotificationService {
  constructor(private repo: NotificationRepository) {}

  async create(data: {
    title: string
    message: string
    type: 'WHATSAPP' | 'EMAIL' | 'SYSTEM'
    officeId: string
    targetUserId?: string
    targetPhone?: string
  }) {
    const notification = await this.repo.create(data)

    // Send via WhatsApp if type is WHATSAPP
    if (data.type === 'WHATSAPP' && data.targetPhone) {
      const whatsapp = new WhatsAppService(data.officeId)
      await whatsapp.sendMessage(data.targetPhone, `${data.title}\n\n${data.message}`)

      await this.repo.markAsRead(notification.id)
    }

    // TODO: Send via email if type is EMAIL

    return notification
  }

  async findAll(officeId: string, page: number, limit: number, read?: boolean) {
    return this.repo.findAll(officeId, page, limit, read)
  }

  async markAsRead(id: string) {
    return this.repo.markAsRead(id)
  }

  async markAllAsRead(officeId: string, userId?: string) {
    return this.repo.markAllAsRead(officeId, userId)
  }

  async countUnread(officeId: string, userId?: string) {
    return this.repo.countUnread(officeId, userId)
  }
}
