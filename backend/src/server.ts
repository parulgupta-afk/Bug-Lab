import { createAnthropicAsk, createGeminiAsk } from './ai.js'
import { createApp } from './app.js'
import type { AskModel } from './app.js'

// Load backend/.env if it exists (Node 20.12+). Running without one is fine.
try {
  process.loadEnvFile()
} catch {
  /* no .env file */
}

const port = Number(process.env.PORT ?? 4000)

const rawGeminiKey = process.env.GEMINI_API_KEY?.trim()
const rawAnthropicKey = process.env.ANTHROPIC_API_KEY?.trim()

// Auto-detect Gemini key if prefixed with AQ. or AIza, or if explicitly configured
const isGemini = Boolean(
  rawGeminiKey ||
    (rawAnthropicKey && (rawAnthropicKey.startsWith('AIza') || rawAnthropicKey.startsWith('AQ.'))) ||
    process.env.GEMINI_MODEL ||
    process.env.ANTHROPIC_MODEL?.toLowerCase().includes('gemini'),
)

let askModel: AskModel | undefined
let modelName = 'disabled'


if (isGemini) {
  const apiKey = rawGeminiKey || rawAnthropicKey
  if (apiKey) {
    const model =
      process.env.GEMINI_MODEL?.trim() ||
      (process.env.ANTHROPIC_MODEL?.toLowerCase().includes('gemini') ? process.env.ANTHROPIC_MODEL?.trim() : undefined) ||
      'gemini-2.5-flash'
    askModel = createGeminiAsk({ apiKey, model })
    modelName = `gemini (${model})`
  }
} else if (rawAnthropicKey) {
  const model = process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-5-5'
  askModel = createAnthropicAsk({ apiKey: rawAnthropicKey, model })
  modelName = `anthropic (${model})`
}

const app = createApp({
  askModel,
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
})

app.listen(port, () => {
  console.log(`Bug Lab API on http://localhost:${port}  (AI tutor ${askModel ? `enabled, model ${modelName}` : 'disabled'})`)
})

