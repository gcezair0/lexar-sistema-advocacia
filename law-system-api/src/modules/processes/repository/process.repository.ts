import { prisma } from '../../../shared/infra/prisma/prisma'
import { Prisma } from '@prisma/client'
import { paginate } from '../../../shared/helpers/pagination'

export class ProcessRepository {
  async create(data: any) {
    return prisma.process.create({
      data,
      include: { client: true, lawyer: true },
    })
  }

  async findById(id: string) {
    return prisma.process.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, cpfCnpj: true, phone: true } },
        lawyer: { select: { id: true, name: true, oabNumber: true } },
        movements: { orderBy: { createdAt: 'desc' } },
        documents: { select: { id: true, name: true, category: true, createdAt: true } },
        events: { select: { id: true, title: true, type: true, startDate: true } },
      },
    })
  }

  async findAll(officeId: string, page = 1, limit = 20, search?: string, status?: string) {
    const where: Prisma.ProcessWhereInput = {
      officeId,
      ...(status && { status: status as any }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { number: { contains: search } },
          { client: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      prisma.process.findMany({
        where,
        ...paginate(page, limit),
        include: {
          client: { select: { id: true, name: true } },
          lawyer: { select: { id: true, name: true } },
          _count: { select: { movements: true, documents: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.process.count({ where }),
    ])

    return { data, total }
  }

  async findByClientCpf(cpfCnpj: string) {
    return prisma.process.findMany({
      where: { client: { cpfCnpj } },
      include: {
        movements: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
    })
  }

  async update(id: string, data: Prisma.ProcessUpdateInput) {
    return prisma.process.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prisma.process.delete({ where: { id } })
  }

  // Movements
  async createMovement(processId: string, data: { title: string; description?: string }) {
    return prisma.movement.create({
      data: { ...data, processId },
    })
  }

  async findMovements(processId: string) {
    return prisma.movement.findMany({
      where: { processId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async countByStatus(officeId: string) {
    return prisma.process.groupBy({
      by: ['status'],
      where: { officeId },
      _count: true,
    })
  }
}