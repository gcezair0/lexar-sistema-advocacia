import { FastifyRequest, FastifyReply } from 'fastify'
import { CreateUserService } from '../service/create-user.service'
import { UserRepository } from '../repository/user.repository'

export class UserController {
  async create(req: FastifyRequest, reply: FastifyReply) {
    const service = new CreateUserService(new UserRepository())

    const user = await service.execute(req.body)

    return reply.send(user)
  }

  async list(req: FastifyRequest, reply: FastifyReply) {
    const repo = new UserRepository()

    return repo.findAll()
  }
}