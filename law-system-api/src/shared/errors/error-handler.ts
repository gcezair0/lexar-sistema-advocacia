import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from './app-error'
import { ZodError } from 'zod'

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(422).send({
      statusCode: 422,
      error: 'Validation Error',
      message: 'Dados inválidos',
      issues: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    })
  }

  // Application errors
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: 'Application Error',
      message: error.message,
    })
  }

  // Log unexpected errors
  console.error('❌ Unexpected error:', {
    message: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
  })

  return reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'Erro interno do servidor',
  })
}
