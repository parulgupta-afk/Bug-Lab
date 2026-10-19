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
    <nav aria-label="Challenges" className="panel-card p-3">
      <h2 className="eyebrow mb-3 px-1">Choose a challenge</h2>
      <ul className="space-y-2">
        {challenges.map((c) => {
          const selected = c.id === selectedId
          const solved = solvedIds.includes(c.id)
          return (
            <li key={c.id}>
              <button
                onClick={() => onSelect(c.id)}
                aria-pressed={selected}
                className={`w-full rounded-lg border px-3 py-2.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet ${
                  selected
                    ? 'border-[rgba(167,139,250,0.55)] bg-[rgba(167,139,250,0.12)] shadow-glow'
                    : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[rgba(157,166,199,0.28)] hover:bg-[var(--surface-3)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--quiet)]">{c.number}</span>
                  <span className="text-sm font-semibold text-[var(--text)]">{c.title}</span>
                  {solved && (
                    <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-mint">
                      <CheckCircle2 size={13} aria-hidden="true" /> Bug located
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-snug text-[var(--muted)]">{c.summary}</p>
                <span className="mt-2 inline-block rounded bg-[var(--surface-3)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--quiet)]">
                  {c.difficulty}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 flex items-start gap-2 px-1 text-[11px] leading-snug text-[var(--quiet)]">
        <Bug size={13} className="mt-0.5 shrink-0 text-violet" />
        Phase 4: Break It mode, assumptions challenge, optional AI tutor.
      </p>
    </nav>
  )
}
