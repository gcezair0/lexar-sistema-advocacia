import { prisma } from '../../../shared/infra/prisma/prisma'

export class AuthRepository {
  async createRefreshToken(data: {
    token: string
    userId: string
    expiresAt: Date
  }) {
    return prisma.refreshToken.create({ data })
  }

  async findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({ where: { token } })
  }

  async deleteRefreshToken(token: string) {
    return prisma.refreshToken.delete({ where: { token } })
  }

  async deleteAllUserRefreshTokens(userId: string) {
    return prisma.refreshToken.deleteMany({ where: { userId } })
  }
}
