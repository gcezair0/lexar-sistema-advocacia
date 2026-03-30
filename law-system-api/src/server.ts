import { buildApp } from './app'

const app = buildApp()

app.listen({ port: 3333 }).then(() => {
  console.log('🚀 API running')
})