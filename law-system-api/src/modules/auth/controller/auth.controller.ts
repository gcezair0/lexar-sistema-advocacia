import { FastifyRequest, FastifyReply } from 'fastify'
import { AuthService } from '../service/auth.service'
import { UserRepository } from '../../users/repository/user.repository'

export class AuthController {
  private service = new AuthService(new UserRepository())

  async login(req: FastifyRequest, reply: FastifyReply) {
    const { email, password } = req.body as { email: string; password: string }

    try {
      const result = await this.service.login(email, password)
      return reply.send(result)
    } catch (err: any) {
      return reply.status(401).send({ message: err.message })
    }
  }
}