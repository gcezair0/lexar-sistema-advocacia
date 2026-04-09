import { DocumentRepository } from '../repository/document.repository'
import { AppError } from '../../../shared/errors/app-error'
import { UploadDocumentInput } from '../schemas/document.schema'
import fs from 'fs'
import path from 'path'
import { env } from '../../../shared/config/env'

export class DocumentService {
  constructor(private repo: DocumentRepository) {}

  async upload(
    file: { filename: string; mimetype: string; file: NodeJS.ReadableStream },
    metadata: UploadDocumentInput,
    officeId: string
  ) {
    const uploadDir = path.resolve(env.UPLOAD_DIR, officeId)

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const fileName = `${Date.now()}-${file.filename}`
    const filePath = path.join(uploadDir, fileName)

    // Write file to disk
    const writeStream = fs.createWriteStream(filePath)
    const chunks: Buffer[] = []

    for await (const chunk of file.file) {
      chunks.push(chunk as Buffer)
      writeStream.write(chunk)
    }
    writeStream.end()

    const buffer = Buffer.concat(chunks)

    return this.repo.create({
      name: metadata.name || file.filename,
      originalName: file.filename,
      mimeType: file.mimetype,
      size: buffer.length,
      path: filePath,
      category: metadata.category || 'OTHER',
      officeId,
      clientId: metadata.clientId,
      processId: metadata.processId,
    })
  }

  async findById(id: string) {
    const doc = await this.repo.findById(id)
    if (!doc) throw new AppError('Documento não encontrado', 404)
    return doc
  }

  async findAll(
    officeId: string,
    page: number,
    limit: number,
    search?: string,
    clientId?: string,
    processId?: string
  ) {
    return this.repo.findAll(officeId, page, limit, search, clientId, processId)
  }

  async download(id: string) {
    const doc = await this.repo.findById(id)
    if (!doc) throw new AppError('Documento não encontrado', 404)

    if (!fs.existsSync(doc.path)) {
      throw new AppError('Arquivo não encontrado no servidor', 404)
    }

    return {
      stream: fs.createReadStream(doc.path),
      mimeType: doc.mimeType,
      originalName: doc.originalName,
    }
  }

  async delete(id: string) {
    const doc = await this.repo.findById(id)
    if (!doc) throw new AppError('Documento não encontrado', 404)

    // Delete file from disk
    if (fs.existsSync(doc.path)) {
      fs.unlinkSync(doc.path)
    }

    return this.repo.delete(id)
  }
}
