import { prisma } from '../infra/prisma/prisma'
import { FastifyRequest } from 'fastify'

interface AuditOptions {
  action: string
  entity: string
  entityId: string
  details?: Record<string, unknown>
}

export async function createAuditLog(
  request: FastifyRequest,
  options: AuditOptions
) {
  const { sub: userId, officeId } = request.currentUser

  await prisma.auditLog.create({
    data: {
      action: options.action,
      entity: options.entity,
      entityId: options.entityId,
      details: options.details ?? undefined,
      officeId,
      userId,
    },
  })
}
