import { FastifyRequest, FastifyReply } from 'fastify'
import { UserService } from '../service/create-user.service'
import { UserRepository } from '../repository/user.repository'
import { createUserSchema, updateUserSchema } from '../schemas/user.schema'
import { paginationSchema, paginatedResponse } from '../../../shared/helpers/pagination'
import { createAuditLog } from '../../../shared/middlewares/audit.middleware'

export class UserController {
  private service = new UserService(new UserRepository())

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const data = createUserSchema.parse(req.body)
    const { officeId } = req.currentUser
    const user = await this.service.create(data, officeId)

    await createAuditLog(req, {
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
    })

    return reply.status(201).send(user)
  }

  list = async (req: FastifyRequest, reply: FastifyReply) => {
    const { page, limit, search } = paginationSchema.parse(req.query)
    const { officeId } = req.currentUser
    const { data, total } = await this.service.findAll(officeId, page, limit, search)

    return reply.send(paginatedResponse(data, total, page, limit))
  }

  show = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const user = await this.service.findById(id)
    return reply.send(user)
  }

  update = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const data = updateUserSchema.parse(req.body)
    const user = await this.service.update(id, data)

    await createAuditLog(req, {
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      details: data,
    })

    return reply.send(user)
  }

  deactivate = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    await this.service.deactivate(id)

    await createAuditLog(req, {
      action: 'DEACTIVATE',
      entity: 'User',
      entityId: id,
    })

    return reply.send({ message: 'Usuário desativado com sucesso' })
  }
}