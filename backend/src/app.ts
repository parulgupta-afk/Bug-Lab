import cors from 'cors'
import express from 'express'
import type { ErrorRequestHandler } from 'express'
import { z } from 'zod'

const intOrNull = z.number().int().nullable()

/** What the frontend sends so the tutor can explain the exact step the student is looking at. */
export const tutorSchema = z.object({
  question: z.string().trim().min(1).max(500),
  challengeTitle: z.string().max(100).optional(),
  code: z.array(z.string().max(200)).max(60).optional(),
  state: z.object({
    step: z.number().int().min(0),
    line: z.number().int().min(1),
    low: intOrNull,
    mid: intOrNull,
    high: intOrNull,
    array: z.array(z.number()).max(50),
    target: z.number(),
    message: z.string().max(500),
  }),
})

export type TutorInput = z.infer<typeof tutorSchema>
export type AskModel = (input: TutorInput) => Promise<string>

export type AppOptions = {
  /** Provided only when an AI key is configured. The rest of the API works without it. */
  askModel?: AskModel
  corsOrigin?: string
}

export function createApp(options: AppOptions = {}) {
  const { askModel, corsOrigin = 'http://localhost:5173' } = options
  const app = express()

  app.use(cors({ origin: corsOrigin }))
  app.use(express.json({ limit: '20kb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', ai: Boolean(askModel) })
  })

  app.post('/api/tutor', async (req, res) => {
    if (!askModel) {
      res.status(503).json({
        error: 'ai-disabled',
        message: 'The AI tutor is not configured. Add ANTHROPIC_API_KEY to backend/.env to enable it.',
      })
      return
    }

    const parsed = tutorSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: 'invalid-request',
        issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      })
      return
    }

    try {
      const answer = await askModel(parsed.data)
      res.json({ answer })
    } catch (err) {
      // Log the reason on the server only; never leak upstream details to the browser.
      console.error('AI tutor failed:', err instanceof Error ? err.message : 'unknown error')
      res.status(502).json({ error: 'ai-failed', message: 'The AI tutor could not answer right now.' })
    }
  })

  app.use((_req, res) => {
    res.status(404).json({ error: 'not-found' })
  })

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    const status = typeof err?.status === 'number' ? err.status : 500
    res.status(status).json({ error: status === 413 ? 'payload-too-large' : status === 400 ? 'invalid-json' : 'server-error' })
  }
  app.use(onError)

  return app
}
