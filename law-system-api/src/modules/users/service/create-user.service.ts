import bcrypt from 'bcrypt'
import { UserRepository } from '../repository/user.repository'
import { AppError } from '../../../shared/errors/app-error'
import { CreateUserInput } from '../schemas/user.schema'

export class UserService {
  constructor(private repo: UserRepository) {}

  async create(data: CreateUserInput, officeId: string) {
    const existing = await this.repo.findByEmail(data.email)
    if (existing) throw new AppError('Email já está em uso', 409)

    const hash = await bcrypt.hash(data.password, 10)

    return this.repo.create({
      ...data,
      password: hash,
      officeId,
    })
  }

  async findById(id: string) {
    const user = await this.repo.findById(id)
    if (!user) throw new AppError('Usuário não encontrado', 404)
    return user
  }

  async findAll(officeId: string, page: number, limit: number, search?: string) {
    return this.repo.findAll(officeId, page, limit, search)
  }

  async update(id: string, data: Record<string, unknown>) {
    const user = await this.repo.findById(id)
    if (!user) throw new AppError('Usuário não encontrado', 404)
    return this.repo.update(id, data)
  }

  async deactivate(id: string) {
    return this.repo.update(id, { active: false })
  }
}