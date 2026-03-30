import { FastifyReply, FastifyRequest } from 'fastify'
import { ProcessRepository } from '../repository/process.repository'
import { CreateProcessService } from '../service/create-process.service'

export class ProcessController {
  create(req: FastifyRequest, reply: FastifyReply) {
    const service = new CreateProcessService(new ProcessRepository())

    return service.execute(req.body)
  }

  list() {
    return new ProcessRepository().findAll()
  }
}