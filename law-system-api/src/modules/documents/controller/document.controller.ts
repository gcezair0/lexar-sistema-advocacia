import { FastifyRequest, FastifyReply } from 'fastify'
import { DocumentService } from '../service/document.service'
import { DocumentRepository } from '../repository/document.repository'
import { uploadDocumentSchema } from '../schemas/document.schema'
import { paginationSchema, paginatedResponse } from '../../../shared/helpers/pagination'
import { createAuditLog } from '../../../shared/middlewares/audit.middleware'

export class DocumentController {
  private service = new DocumentService(new DocumentRepository())

  upload = async (req: FastifyRequest, reply: FastifyReply) => {
    const file = await (req as any).file()
    if (!file) {
      return reply.status(400).send({ message: 'Nenhum arquivo enviado' })
    }

    const metadata = uploadDocumentSchema.parse({
      name: (file.fields as any)?.name?.value,
      category: (file.fields as any)?.category?.value,
      clientId: (file.fields as any)?.clientId?.value,
      processId: (file.fields as any)?.processId?.value,
    })

    const { officeId } = req.currentUser
    const document = await this.service.upload(file, metadata, officeId)

    await createAuditLog(req, {
      action: 'UPLOAD',
      entity: 'Document',
      entityId: document.id,
    })

    return reply.status(201).send(document)
  }

  list = async (req: FastifyRequest, reply: FastifyReply) => {
    const { page, limit, search } = paginationSchema.parse(req.query)
    const { clientId, processId } = req.query as { clientId?: string; processId?: string }
    const { officeId } = req.currentUser
    const { data, total } = await this.service.findAll(officeId, page, limit, search, clientId, processId)

    return reply.send(paginatedResponse(data, total, page, limit))
  }

  show = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const document = await this.service.findById(id)
    return reply.send(document)
  }

  download = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const { stream, mimeType, originalName } = await this.service.download(id)

    reply.header('Content-Type', mimeType)
    reply.header('Content-Disposition', `attachment; filename="${originalName}"`)

    return reply.send(stream)
  }

  delete = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    await this.service.delete(id)

    await createAuditLog(req, {
      action: 'DELETE',
      entity: 'Document',
      entityId: id,
    })

    return reply.send({ message: 'Documento removido com sucesso' })
  }
}
