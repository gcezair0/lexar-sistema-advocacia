import { buildApp } from './app'
import { env } from './shared/config/env'

const app = buildApp()

app
  .listen({ port: env.PORT, host: '0.0.0.0' })
  .then((address) => {
    console.log(`🚀 Lexar API running at ${address}`)
    console.log(`📋 Environment: ${env.NODE_ENV}`)
    console.log(`📱 WhatsApp webhook: ${address}/whatsapp/webhook`)
    console.log(`❤️  Health check: ${address}/health`)
  })
  .catch((err) => {
    console.error('❌ Failed to start server:', err)
    process.exit(1)
  })