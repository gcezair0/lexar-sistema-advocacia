import { FastifyReply, FastifyRequest } from 'fastify'

export function rolesMiddleware(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { role } = request.currentUser

    if (!allowedRoles.includes(role)) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Você não tem permissão para acessar este recurso',
      })
    }
  }
}
