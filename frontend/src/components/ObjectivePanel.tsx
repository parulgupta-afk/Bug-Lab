import { Lightbulb, Target } from 'lucide-react'
import { useState } from 'react'
import type { Challenge } from '../engine/challenges'

export function ObjectivePanel({ challenge }: { challenge: Challenge }) {
  const [shown, setShown] = useState(0)
  const hasMore = shown < challenge.hints.length

  return (
    <section aria-label="Debugging objective" className="rounded-xl border border-slate-800 bg-[#0d1426] p-4">
      <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
        <Target size={14} /> Debugging objective
      </h2>
      <p className="text-sm leading-relaxed text-slate-200">{challenge.objective}</p>

      {shown > 0 && (
        <ol className="mt-3 space-y-2">
          {challenge.hints.slice(0, shown).map((hint, i) => (
            <li key={i} className="rounded-lg border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-sm text-amber-100/90">
              <span className="mr-1 font-semibold text-amber-300">Hint {i + 1}.</span>
              {hint}
            </li>
          ))}
        </ol>
      )}

      <button
        onClick={() => setShown((n) => n + 1)}
        disabled={!hasMore}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-200 transition hover:bg-amber-400/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Lightbulb size={14} />
        {hasMore ? (shown === 0 ? 'Show a hint' : 'Show another hint') : 'No more hints'}
      </button>
    </section>
  )
}
