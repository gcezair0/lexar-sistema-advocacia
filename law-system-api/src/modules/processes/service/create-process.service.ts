import { ProcessRepository } from '../repository/process.repository'
import { AppError } from '../../../shared/errors/app-error'
import { CreateProcessInput, UpdateProcessInput, CreateMovementInput } from '../schemas/process.schema'

export class ProcessService {
  constructor(private repo: ProcessRepository) {}

  async create(data: CreateProcessInput, officeId: string) {
    return this.repo.create({
      ...data,
      officeId,
      distributedAt: data.distributedAt ? new Date(data.distributedAt) : undefined,
    })
  }

  async findById(id: string) {
    const process = await this.repo.findById(id)
    if (!process) throw new AppError('Processo não encontrado', 404)
    return process
  }

  async findAll(
    officeId: string,
    page: number,
    limit: number,
    search?: string,
    status?: string
  ) {
    return this.repo.findAll(officeId, page, limit, search, status)
  }

  async findByClientCpf(cpfCnpj: string) {
    return this.repo.findByClientCpf(cpfCnpj)
  }

  async update(id: string, data: UpdateProcessInput) {
    const process = await this.repo.findById(id)
    if (!process) throw new AppError('Processo não encontrado', 404)
    return this.repo.update(id, data)
  }

  async delete(id: string) {
    const process = await this.repo.findById(id)
    if (!process) throw new AppError('Processo não encontrado', 404)
    return this.repo.delete(id)
  }

  // Movements / Timeline
  async addMovement(processId: string, data: CreateMovementInput) {
    const process = await this.repo.findById(processId)
    if (!process) throw new AppError('Processo não encontrado', 404)
    return this.repo.createMovement(processId, data)
  }

  async getTimeline(processId: string) {
    return this.repo.findMovements(processId)
  }

  async getStats(officeId: string) {
    return this.repo.countByStatus(officeId)
  }
}