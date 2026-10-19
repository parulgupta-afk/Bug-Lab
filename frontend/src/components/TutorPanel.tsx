import { Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { ExecutionState } from '../engine/types'

type Props = {
  challengeTitle: string
  code: string[]
  state: ExecutionState
}

export function TutorPanel({ challengeTitle, code, state }: Props) {
  const [question, setQuestion] = useState('Why is this implementation failing?')
  const [answer, setAnswer] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const ask = async () => {
    setLoading(true)
    setError(null)
    setAnswer(null)
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question,
          challengeTitle,
          code,
          state: {
            step: state.step,
            line: state.line,
            low: state.low,
            mid: state.mid,
            high: state.high,
            array: [...state.array],
            target: state.target,
            message: state.message,
          },
        }),
      })
      const data = (await res.json()) as { answer?: string; message?: string; error?: string }
      if (!res.ok) {
        setError(data.message ?? 'Tutor unavailable. The core debugger still works offline.')
        return
      }
      setAnswer(data.answer ?? '')
    } catch {
      setError('Could not reach the tutor API. Start the backend or continue offline.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section aria-label="AI tutor" className="panel-card p-4">
      <h2 className="eyebrow mb-2 flex items-center gap-2">
        <Sparkles size={14} className="text-violet" /> AI tutor
      </h2>
      <p className="mb-2 text-xs text-[var(--muted)]">
        Optional. Uses the current step only. If the API is offline, debugging still works.
      </p>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] focus:border-violet/50 focus:outline-none"
      />
      <button
        type="button"
        onClick={ask}
        disabled={loading || !question.trim()}
        className="mt-2 inline-flex items-center gap-2 rounded-lg border border-violet/50 bg-violet/15 px-3 py-2 text-sm font-semibold text-[#efe8ff] transition hover:bg-violet/25 disabled:opacity-40"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        Ask tutor
      </button>
      {error && (
        <p className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2 text-xs text-[var(--muted)]">
          {error}
        </p>
      )}
      {answer && (
        <p className="mt-2 rounded-lg border border-violet/30 bg-violet/10 p-3 text-sm text-[var(--text)]">{answer}</p>
      )}
    </section>
  )
}
