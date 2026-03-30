import { UserRepository } from '../../users/repository/user.repository'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export class AuthService {
  constructor(private userRepo: UserRepository) {}

  async login(email: string, password: string) {
    const user = await this.userRepo.findByEmail(email)
    if (!user) throw new Error('Invalid credentials')

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) throw new Error('Invalid credentials')

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    )

    return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token }
  }
}