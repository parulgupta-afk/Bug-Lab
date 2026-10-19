import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { describe, expect, it, vi } from 'vitest'
import { buildPrompt } from './ai'
import { createApp } from './app'
import type { AppOptions, TutorInput } from './app'

async function withServer<T>(options: AppOptions, fn: (base: string) => Promise<T>): Promise<T> {
  const server = createApp(options).listen(0)
  await once(server, 'listening')
  const { port } = server.address() as AddressInfo
  try {
    return await fn(`http://127.0.0.1:${port}`)
  } finally {
    server.close()
  }
}

const validBody = {
  question: 'Why did low change?',
  challengeTitle: 'The Infinite Loop',
  state: {
    step: 3,
    line: 13,
    low: 5,
    mid: 4,
    high: 8,
    array: [3, 7, 12, 18, 24, 31, 45, 52, 67],
    target: 45,
    message: 'low = mid + 1 = 5.',
  },
}

const post = (base: string, body: unknown, init: RequestInit = {}) =>
  fetch(`${base}/api/tutor`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
    ...init,
  })

describe('GET /api/health', () => {
  it('reports ok and that the AI tutor is off when no model is configured', async () => {
    await withServer({}, async (base) => {
      const res = await fetch(`${base}/api/health`)
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ status: 'ok', ai: false })
    })
  })

  it('reports the AI tutor as on when a model is configured', async () => {
    await withServer({ askModel: async () => 'hi' }, async (base) => {
      expect(await (await fetch(`${base}/api/health`)).json()).toEqual({ status: 'ok', ai: true })
    })
  })

  it('allows the configured frontend origin through CORS', async () => {
    await withServer({ corsOrigin: 'http://localhost:5173' }, async (base) => {
      const res = await fetch(`${base}/api/health`, { headers: { Origin: 'http://localhost:5173' } })
      expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173')
    })
  })

  it('does not allow other origins through CORS', async () => {
    await withServer({ corsOrigin: 'http://localhost:5173' }, async (base) => {
      const res = await fetch(`${base}/api/health`, { headers: { Origin: 'http://evil.example' } })
      expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173')
    })
  })
})

describe('POST /api/tutor', () => {
  it('returns 503 with a clear message when AI is not configured', async () => {
    await withServer({}, async (base) => {
      const res = await post(base, validBody)
      expect(res.status).toBe(503)
      expect((await res.json()).error).toBe('ai-disabled')
    })
  })

  it('returns the model answer for a valid request and passes the state through', async () => {
    const askModel = vi.fn(async (_input: TutorInput) => 'Because 45 > 24.')
    await withServer({ askModel }, async (base) => {
      const res = await post(base, validBody)
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ answer: 'Because 45 > 24.' })
    })
    expect(askModel).toHaveBeenCalledOnce()
    expect(askModel.mock.calls[0][0].state.target).toBe(45)
  })

  it('rejects an empty question with 400 and field-level issues', async () => {
    await withServer({ askModel: async () => 'x' }, async (base) => {
      const res = await post(base, { ...validBody, question: '   ' })
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('invalid-request')
      expect(body.issues[0].path).toBe('question')
    })
  })

  it('rejects a missing state with 400', async () => {
    await withServer({ askModel: async () => 'x' }, async (base) => {
      const res = await post(base, { question: 'hi' })
      expect(res.status).toBe(400)
    })
  })

  it('rejects an overlong question', async () => {
    await withServer({ askModel: async () => 'x' }, async (base) => {
      const res = await post(base, { ...validBody, question: 'a'.repeat(501) })
      expect(res.status).toBe(400)
    })
  })

  it('returns 400 JSON for malformed JSON instead of an HTML error page', async () => {
    await withServer({ askModel: async () => 'x' }, async (base) => {
      const res = await post(base, '{not json')
      expect(res.status).toBe(400)
      expect((await res.json()).error).toBe('invalid-json')
    })
  })

  it('returns 413 for oversized bodies', async () => {
    await withServer({ askModel: async () => 'x' }, async (base) => {
      const res = await post(base, { ...validBody, code: ['x'.repeat(100)], pad: 'y'.repeat(30_000) })
      expect(res.status).toBe(413)
    })
  })

  it('returns 502 without leaking upstream details when the model call fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await withServer(
      {
        askModel: async () => {
          throw new Error('secret upstream detail sk-ant-123')
        },
      },
      async (base) => {
        const res = await post(base, validBody)
        expect(res.status).toBe(502)
        const text = await res.text()
        expect(text).not.toContain('secret')
        expect(text).not.toContain('sk-ant')
      },
    )
    spy.mockRestore()
  })
})

describe('unknown routes', () => {
  it('return a JSON 404', async () => {
    await withServer({}, async (base) => {
      const res = await fetch(`${base}/api/nope`)
      expect(res.status).toBe(404)
      expect(await res.json()).toEqual({ error: 'not-found' })
    })
  })
})

describe('buildPrompt', () => {
  it('includes the question and the real state values', () => {
    const prompt = buildPrompt(validBody)
    expect(prompt).toContain('Why did low change?')
    expect(prompt).toContain('low: 5, mid: 4, high: 8')
    expect(prompt).toContain('target: 45')
    expect(prompt).toContain('step: 4')
  })
})
