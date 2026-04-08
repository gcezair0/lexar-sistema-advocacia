import { FastifyRequest, FastifyReply } from 'fastify'
import { AuthService } from '../service/auth.service'
import { UserRepository } from '../../users/repository/user.repository'
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
} from '../schemas/auth.schema'

export class AuthController {
  private service = new AuthService(new UserRepository())

  register = async (req: FastifyRequest, reply: FastifyReply) => {
    const data = registerSchema.parse(req.body)
    const result = await this.service.register(data)
    return reply.status(201).send(result)
  }

  login = async (req: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = loginSchema.parse(req.body)
    const result = await this.service.login(email, password)
    return reply.send(result)
  }

  refresh = async (req: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = refreshTokenSchema.parse(req.body)
    const result = await this.service.refreshToken(refreshToken)
    return reply.send(result)
  }

  logout = async (req: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = refreshTokenSchema.parse(req.body)
    const result = await this.service.logout(refreshToken)
    return reply.send(result)
  }
}