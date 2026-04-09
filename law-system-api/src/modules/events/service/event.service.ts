import { EventRepository } from '../repository/event.repository'
import { AppError } from '../../../shared/errors/app-error'
import { CreateEventInput, UpdateEventInput } from '../schemas/event.schema'

export class EventService {
  constructor(private repo: EventRepository) {}

  async create(data: CreateEventInput, officeId: string) {
    return this.repo.create({
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      officeId,
    })
  }

  async findById(id: string) {
    const event = await this.repo.findById(id)
    if (!event) throw new AppError('Evento não encontrado', 404)
    return event
  }

  async findAll(
    officeId: string,
    page: number,
    limit: number,
    type?: string,
    startDate?: string,
    endDate?: string
  ) {
    return this.repo.findAll(officeId, page, limit, type, startDate, endDate)
  }

  async getUpcoming(officeId: string, days?: number) {
    return this.repo.findUpcoming(officeId, days)
  }

  async update(id: string, data: UpdateEventInput) {
    const event = await this.repo.findById(id)
    if (!event) throw new AppError('Evento não encontrado', 404)

    return this.repo.update(id, {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    })
  }

  async complete(id: string) {
    const event = await this.repo.findById(id)
    if (!event) throw new AppError('Evento não encontrado', 404)
    return this.repo.update(id, { completed: true })
  }

  async delete(id: string) {
    const event = await this.repo.findById(id)
    if (!event) throw new AppError('Evento não encontrado', 404)
    return this.repo.delete(id)
  }
}
