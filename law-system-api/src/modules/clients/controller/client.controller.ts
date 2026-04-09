import { FastifyRequest, FastifyReply } from 'fastify'
import { ClientService } from '../service/client.service'
import { ClientRepository } from '../repository/client.repository'
import { createClientSchema, updateClientSchema } from '../schemas/client.schema'
import { paginationSchema, paginatedResponse } from '../../../shared/helpers/pagination'
import { createAuditLog } from '../../../shared/middlewares/audit.middleware'

export class ClientController {
  private service = new ClientService(new ClientRepository())

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const data = createClientSchema.parse(req.body)
    const { officeId } = req.currentUser
    const client = await this.service.create(data, officeId)

    await createAuditLog(req, {
      action: 'CREATE',
      entity: 'Client',
      entityId: client.id,
    })

    return reply.status(201).send(client)
  }

  list = async (req: FastifyRequest, reply: FastifyReply) => {
    const { page, limit, search } = paginationSchema.parse(req.query)
    const { status } = req.query as { status?: string }
    const { officeId } = req.currentUser
    const { data, total } = await this.service.findAll(officeId, page, limit, search, status)

    return reply.send(paginatedResponse(data, total, page, limit))
  }

  show = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const client = await this.service.findById(id)
    return reply.send(client)
  }

  update = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const data = updateClientSchema.parse(req.body)
    const client = await this.service.update(id, data)

    await createAuditLog(req, {
      action: 'UPDATE',
      entity: 'Client',
      entityId: id,
      details: data,
    })

    return reply.send(client)
  }

  delete = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    await this.service.delete(id)

    await createAuditLog(req, {
      action: 'DELETE',
      entity: 'Client',
      entityId: id,
    })

    return reply.send({ message: 'Cliente removido com sucesso (LGPD)' })
  }

  stats = async (req: FastifyRequest, reply: FastifyReply) => {
    const { officeId } = req.currentUser
    const stats = await this.service.getStats(officeId)
    return reply.send(stats)
  }
}
