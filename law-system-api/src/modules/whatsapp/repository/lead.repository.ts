import { prisma } from '../../../shared/infra/prisma/prisma'

export class LeadRepository {
  async create(data: any) {
    return prisma.lead.create({ data })
  }

  async findByPhone(phone: string, officeId: string) {
    return prisma.lead.findFirst({
      where: { phone, officeId, converted: false },
    })
  }

  async findAll(officeId: string, converted?: boolean) {
    return prisma.lead.findMany({
      where: {
        officeId,
        ...(converted !== undefined && { converted }),
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async convert(id: string) {
    return prisma.lead.update({
      where: { id },
      data: { converted: true, convertedAt: new Date() },
    })
  }
}
