import { prisma } from '../../../shared/infra/prisma/prisma'

export class ProcessRepository {
  create(data: any) {
    return prisma.process.create({ data })
  }

  findAll() {
    return prisma.process.findMany({
      include: { movements: true }
    })
  }
}