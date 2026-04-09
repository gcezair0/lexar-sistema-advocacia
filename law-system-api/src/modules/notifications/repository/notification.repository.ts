import { prisma } from '../../../shared/infra/prisma/prisma'
import { paginate } from '../../../shared/helpers/pagination'

export class NotificationRepository {
  async create(data: any) {
    return prisma.notification.create({ data })
  }

  async findAll(officeId: string, page = 1, limit = 20, read?: boolean) {
    const where: any = {
      officeId,
      ...(read !== undefined && { read }),
    }

    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        ...paginate(page, limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ])

    return { data, total }
  }

  async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { read: true },
    })
  }

  async markAllAsRead(officeId: string, targetUserId?: string) {
    return prisma.notification.updateMany({
      where: {
        officeId,
        read: false,
        ...(targetUserId && { targetUserId }),
      },
      data: { read: true },
    })
  }

  async countUnread(officeId: string, targetUserId?: string) {
    return prisma.notification.count({
      where: {
        officeId,
        read: false,
        ...(targetUserId && { targetUserId }),
      },
    })
  }
}
