import { prisma } from '../../../shared/infra/prisma/prisma'
import { Prisma } from '@prisma/client'
import { paginate } from '../../../shared/helpers/pagination'

export class ClientRepository {
  async create(data: any) {
    return prisma.client.create({ data })
  }

  async findById(id: string) {
    return prisma.client.findUnique({
      where: { id },
      include: {
        processes: { select: { id: true, number: true, title: true, status: true } },
        documents: { select: { id: true, name: true, category: true, createdAt: true } },
        _count: { select: { processes: true, documents: true, chatSessions: true } },
      },
    })
  }

  async findByCpfCnpj(cpfCnpj: string) {
    return prisma.client.findUnique({ where: { cpfCnpj } })
  }

  async findByPhone(phone: string, officeId: string) {
    return prisma.client.findFirst({ where: { phone, officeId } })
  }

  async findAll(officeId: string, page = 1, limit = 20, search?: string, status?: string) {
    const where: Prisma.ClientWhereInput = {
      officeId,
      ...(status && { status: status as any }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { cpfCnpj: { contains: search } },
          { phone: { contains: search } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      prisma.client.findMany({
        where,
        ...paginate(page, limit),
        include: {
          _count: { select: { processes: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.client.count({ where }),
    ])

    return { data, total }
  }

  async update(id: string, data: Prisma.ClientUpdateInput) {
    return prisma.client.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prisma.client.delete({ where: { id } })
  }

  async countByStatus(officeId: string) {
    const result = await prisma.client.groupBy({
      by: ['status'],
      where: { officeId },
      _count: true,
    })
    return result
  }
}
