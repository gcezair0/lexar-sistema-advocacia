import { prisma } from '../../../shared/infra/prisma/prisma'
import { paginate } from '../../../shared/helpers/pagination'

export class EventRepository {
  async create(data: any) {
    return prisma.event.create({
      data,
      include: {
        assignedTo: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        process: { select: { id: true, title: true, number: true } },
      },
    })
  }

  async findById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        process: { select: { id: true, title: true, number: true } },
      },
    })
  }

  async findAll(
    officeId: string,
    page = 1,
    limit = 20,
    type?: string,
    startDate?: string,
    endDate?: string
  ) {
    const where: any = {
      officeId,
      ...(type && { type }),
      ...(startDate && endDate && {
        startDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    }

    const [data, total] = await Promise.all([
      prisma.event.findMany({
        where,
        ...paginate(page, limit),
        include: {
          assignedTo: { select: { id: true, name: true } },
          client: { select: { id: true, name: true } },
          process: { select: { id: true, title: true } },
        },
        orderBy: { startDate: 'asc' },
      }),
      prisma.event.count({ where }),
    ])

    return { data, total }
  }

  async findUpcoming(officeId: string, days = 7) {
    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    return prisma.event.findMany({
      where: {
        officeId,
        completed: false,
        startDate: {
          gte: now,
          lte: futureDate,
        },
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, phone: true } },
        process: { select: { id: true, title: true, number: true } },
      },
      orderBy: { startDate: 'asc' },
    })
  }

  async update(id: string, data: any) {
    return prisma.event.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prisma.event.delete({ where: { id } })
  }
}
