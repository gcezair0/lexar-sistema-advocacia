import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'

export function buildApp() {
  const app = Fastify()

  app.register(cors)


  return app
}