import { ProcessRepository } from '../repository/process.repository'

export class CreateProcessService {
  constructor(private repo: ProcessRepository) {}

  execute(data: any) {
    return this.repo.create(data)
  }
}