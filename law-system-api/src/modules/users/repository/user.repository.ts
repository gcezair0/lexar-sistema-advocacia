import { prisma } from '../../../shared/infra/prisma/prisma'

export class UserRepository {
  async create(data: any) {
    return prisma.user.create({ data })
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  }

  async findAll() {
    return prisma.user.findMany()
  }
}