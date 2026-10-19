import { Bug, CheckCircle2 } from 'lucide-react'
import type { Challenge } from '../engine/challenges'

type Props = {
  challenges: Challenge[]
  selectedId: string
  solvedIds: string[]
  onSelect: (id: string) => void
}

export function ChallengeList({ challenges, selectedId, solvedIds, onSelect }: Props) {
  return (
    <nav aria-label="Challenges" className="rounded-xl border border-slate-800 bg-[#0d1426] p-3">
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-slate-400">Choose a challenge</h2>
      <ul className="space-y-2">
        {challenges.map((c) => {
          const selected = c.id === selectedId
          const solved = solvedIds.includes(c.id)
          return (
            <li key={c.id}>
              <button
                onClick={() => onSelect(c.id)}
                aria-pressed={selected}
                className={`w-full rounded-lg border px-3 py-2.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  selected
                    ? 'border-sky-500/70 bg-sky-500/10'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-500">{c.number}</span>
                  <span className="text-sm font-semibold text-slate-100">{c.title}</span>
                  {solved && (
                    <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                      <CheckCircle2 size={13} aria-hidden="true" /> Bug located
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-snug text-slate-400">{c.summary}</p>
                <span className="mt-2 inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                  {c.difficulty}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 flex items-start gap-2 px-1 text-[11px] leading-snug text-slate-500">
        <Bug size={13} className="mt-0.5 shrink-0" />
        Fixing the bug and Break It mode arrive in the next phases.
      </p>
    </nav>
  )
}
