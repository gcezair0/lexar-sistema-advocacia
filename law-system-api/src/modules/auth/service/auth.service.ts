import { UserRepository } from '../../users/repository/user.repository'
import { AuthRepository } from '../repository/auth.repository'
import { AppError } from '../../../shared/errors/app-error'
import { env } from '../../../shared/config/env'
import { LoginInput, RegisterInput } from '../schemas/auth.schema'
import { prisma } from '../../../shared/infra/prisma/prisma'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { addDays } from 'date-fns'

export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private authRepo: AuthRepository = new AuthRepository()
  ) {}

  async register(data: RegisterInput) {
    const existingUser = await this.userRepo.findByEmail(data.email)
    if (existingUser) {
      throw new AppError('Email já está em uso', 409)
    }

    const hash = await bcrypt.hash(data.password, 10)

    let officeId = data.officeId

    // If no officeId, create a new office
    if (!officeId) {
      const office = await prisma.office.create({
        data: { name: data.officeName || `Escritório de ${data.name}` },
      })
      officeId = office.id
    }

    const user = await this.userRepo.create({
      name: data.name,
      email: data.email,
      password: hash,
      role: data.role || 'LAWYER',
      oabNumber: data.oabNumber,
      phone: data.phone,
      officeId,
    })

    const tokens = await this.generateTokens(user.id, user.role, officeId)

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        officeId,
      },
      ...tokens,
    }
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findByEmail(email)
    if (!user) throw new AppError('Credenciais inválidas', 401)

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) throw new AppError('Credenciais inválidas', 401)

    if (!user.active) throw new AppError('Usuário desativado', 403)

    const tokens = await this.generateTokens(user.id, user.role, user.officeId)

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        officeId: user.officeId,
      },
      ...tokens,
    }
  }

  async refreshToken(token: string) {
    const storedToken = await this.authRepo.findRefreshToken(token)
    if (!storedToken) throw new AppError('Refresh token inválido', 401)

    if (storedToken.expiresAt < new Date()) {
      await this.authRepo.deleteRefreshToken(token)
      throw new AppError('Refresh token expirado', 401)
    }

    const user = await this.userRepo.findById(storedToken.userId)
    if (!user) throw new AppError('Usuário não encontrado', 404)

    // Delete old refresh token
    await this.authRepo.deleteRefreshToken(token)

    // Generate new pair
    const tokens = await this.generateTokens(user.id, user.role, user.officeId)

    return tokens
  }

  async logout(token: string) {
    await this.authRepo.deleteRefreshToken(token).catch(() => {})
    return { message: 'Logout realizado com sucesso' }
  }

  private async generateTokens(userId: string, role: string, officeId: string) {
    const accessToken = jwt.sign(
      { sub: userId, role, officeId },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    )

    const refreshTokenValue = jwt.sign(
      { sub: userId },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    )

    await this.authRepo.createRefreshToken({
      token: refreshTokenValue,
      userId,
      expiresAt: addDays(new Date(), 7),
    })

    return { accessToken, refreshToken: refreshTokenValue }
  }
}