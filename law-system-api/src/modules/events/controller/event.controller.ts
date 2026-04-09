import { FastifyRequest, FastifyReply } from 'fastify'
import { EventService } from '../service/event.service'
import { EventRepository } from '../repository/event.repository'
import { createEventSchema, updateEventSchema } from '../schemas/event.schema'
import { paginationSchema, paginatedResponse } from '../../../shared/helpers/pagination'
import { createAuditLog } from '../../../shared/middlewares/audit.middleware'

export class EventController {
  private service = new EventService(new EventRepository())

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const data = createEventSchema.parse(req.body)
    const { officeId } = req.currentUser
    const event = await this.service.create(data, officeId)

    await createAuditLog(req, {
      action: 'CREATE',
      entity: 'Event',
      entityId: event.id,
    })

    return reply.status(201).send(event)
  }

  list = async (req: FastifyRequest, reply: FastifyReply) => {
    const { page, limit } = paginationSchema.parse(req.query)
    const { type, startDate, endDate } = req.query as {
      type?: string
      startDate?: string
      endDate?: string
    }
    const { officeId } = req.currentUser
    const { data, total } = await this.service.findAll(officeId, page, limit, type, startDate, endDate)

    return reply.send(paginatedResponse(data, total, page, limit))
  }

  show = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const event = await this.service.findById(id)
    return reply.send(event)
  }

  upcoming = async (req: FastifyRequest, reply: FastifyReply) => {
    const { days } = req.query as { days?: string }
    const { officeId } = req.currentUser
    const events = await this.service.getUpcoming(officeId, days ? Number(days) : undefined)
    return reply.send(events)
  }

  update = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const data = updateEventSchema.parse(req.body)
    const event = await this.service.update(id, data)

    await createAuditLog(req, {
      action: 'UPDATE',
      entity: 'Event',
      entityId: id,
    })

    return reply.send(event)
  }

  complete = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    await this.service.complete(id)
    return reply.send({ message: 'Evento marcado como concluído' })
  }

  delete = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    await this.service.delete(id)

    await createAuditLog(req, {
      action: 'DELETE',
      entity: 'Event',
      entityId: id,
    })

    return reply.send({ message: 'Evento removido com sucesso' })
  }
}
