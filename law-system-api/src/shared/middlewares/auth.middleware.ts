import { FastifyReply, FastifyRequest } from 'fastify'
import jwt from 'jsonwebtoken'

export interface AuthPayload {
  sub: string
  role: string
  officeId: string
}

declare module 'fastify' {
  interface FastifyRequest {
    currentUser: AuthPayload
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token não fornecido',
    })
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as AuthPayload

    request.currentUser = decoded
  } catch {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token inválido ou expirado',
    })
  }
}
