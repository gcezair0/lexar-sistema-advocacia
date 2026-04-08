import { prisma } from '../../../shared/infra/prisma/prisma'
import { Prisma } from '@prisma/client'
import { paginate } from '../../../shared/helpers/pagination'

export class UserRepository {
  async create(data: Prisma.UserCreateInput | any) {
    return prisma.user.create({ data })
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        oabNumber: true,
        phone: true,
        active: true,
        officeId: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  }

  async findAll(officeId: string, page = 1, limit = 20, search?: string) {
    const where: Prisma.UserWhereInput = {
      officeId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        ...paginate(page, limit),
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          oabNumber: true,
          phone: true,
          active: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.user.count({ where }),
    ])

    return { data, total }
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        oabNumber: true,
        phone: true,
        active: true,
        officeId: true,
      },
    })
  }

  async delete(id: string) {
    return prisma.user.delete({ where: { id } })
  }
}