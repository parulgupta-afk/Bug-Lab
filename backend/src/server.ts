import { createAnthropicAsk } from './ai.js'
import { createApp } from './app.js'

// Load backend/.env if it exists (Node 20.12+). Running without one is fine.
try {
  process.loadEnvFile()
} catch {
  /* no .env file */
}

const port = Number(process.env.PORT ?? 4000)
const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
const model = process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-5-5'

const app = createApp({
  askModel: apiKey ? createAnthropicAsk({ apiKey, model }) : undefined,
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
})

app.listen(port, () => {
  console.log(`Bug Lab API on http://localhost:${port}  (AI tutor ${apiKey ? `enabled, model ${model}` : 'disabled'})`)
})
