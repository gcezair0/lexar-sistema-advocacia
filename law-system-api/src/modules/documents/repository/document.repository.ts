import { prisma } from '../../../shared/infra/prisma/prisma'
import { Prisma } from '@prisma/client'
import { paginate } from '../../../shared/helpers/pagination'

export class DocumentRepository {
  async create(data: any) {
    return prisma.document.create({ data })
  }

  async findById(id: string) {
    return prisma.document.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        process: { select: { id: true, number: true, title: true } },
      },
    })
  }

  async findAll(officeId: string, page = 1, limit = 20, search?: string, clientId?: string, processId?: string) {
    const where: any = {
      officeId,
      ...(clientId && { clientId }),
      ...(processId && { processId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { originalName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      prisma.document.findMany({
        where,
        ...paginate(page, limit),
        include: {
          client: { select: { id: true, name: true } },
          process: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.document.count({ where }),
    ])

    return { data, total }
  }

  async delete(id: string) {
    return prisma.document.delete({ where: { id } })
  }
}
