import bcrypt from 'bcrypt'
import { UserRepository } from '../repository/user.repository'

export class CreateUserService {
  constructor(private repo: UserRepository) {}

  async execute(data: any) {
    const hash = await bcrypt.hash(data.password, 10)

    return this.repo.create({
      ...data,
      password: hash
    })
  }
}