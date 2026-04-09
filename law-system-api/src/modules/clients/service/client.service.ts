import { ClientRepository } from '../repository/client.repository'
import { AppError } from '../../../shared/errors/app-error'
import { CreateClientInput, UpdateClientInput } from '../schemas/client.schema'

export class ClientService {
  constructor(private repo: ClientRepository) {}

  async create(data: CreateClientInput, officeId: string) {
    if (data.cpfCnpj) {
      const existing = await this.repo.findByCpfCnpj(data.cpfCnpj)
      if (existing) throw new AppError('CPF/CNPJ já cadastrado', 409)
    }

    const consentDate = data.lgpdConsent ? new Date() : undefined

    return this.repo.create({
      ...data,
      officeId,
      consentDate,
    })
  }

  async findById(id: string) {
    const client = await this.repo.findById(id)
    if (!client) throw new AppError('Cliente não encontrado', 404)
    return client
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

  async update(id: string, data: UpdateClientInput) {
    const client = await this.repo.findById(id)
    if (!client) throw new AppError('Cliente não encontrado', 404)

    const updateData: any = { ...data }
    if (data.lgpdConsent && !client.lgpdConsent) {
      updateData.consentDate = new Date()
    }

    return this.repo.update(id, updateData)
  }

  async delete(id: string) {
    const client = await this.repo.findById(id)
    if (!client) throw new AppError('Cliente não encontrado', 404)
    return this.repo.delete(id)
  }

  async getStats(officeId: string) {
    return this.repo.countByStatus(officeId)
  }
}
