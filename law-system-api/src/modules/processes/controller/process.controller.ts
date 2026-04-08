import { FastifyReply, FastifyRequest } from 'fastify'
import { ProcessRepository } from '../repository/process.repository'
import { ProcessService } from '../service/create-process.service'
import { createProcessSchema, updateProcessSchema, createMovementSchema } from '../schemas/process.schema'
import { paginationSchema, paginatedResponse } from '../../../shared/helpers/pagination'
import { createAuditLog } from '../../../shared/middlewares/audit.middleware'

export class ProcessController {
  private service = new ProcessService(new ProcessRepository())

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const data = createProcessSchema.parse(req.body)
    const { officeId } = req.currentUser
    const process = await this.service.create(data, officeId)

    await createAuditLog(req, {
      action: 'CREATE',
      entity: 'Process',
      entityId: process.id,
    })

    return reply.status(201).send(process)
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
    const process = await this.service.findById(id)
    return reply.send(process)
  }

  update = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const data = updateProcessSchema.parse(req.body)
    const process = await this.service.update(id, data)

    await createAuditLog(req, {
      action: 'UPDATE',
      entity: 'Process',
      entityId: id,
      details: data,
    })

    return reply.send(process)
  }

  delete = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    await this.service.delete(id)

    await createAuditLog(req, {
      action: 'DELETE',
      entity: 'Process',
      entityId: id,
    })

    return reply.send({ message: 'Processo removido com sucesso' })
  }

  // Movements / Timeline
  addMovement = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const data = createMovementSchema.parse(req.body)
    const movement = await this.service.addMovement(id, data)

    await createAuditLog(req, {
      action: 'CREATE',
      entity: 'Movement',
      entityId: movement.id,
      details: { processId: id },
    })

    return reply.status(201).send(movement)
  }

  getTimeline = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const movements = await this.service.getTimeline(id)
    return reply.send(movements)
  }

  stats = async (req: FastifyRequest, reply: FastifyReply) => {
    const { officeId } = req.currentUser
    const stats = await this.service.getStats(officeId)
    return reply.send(stats)
  }
}