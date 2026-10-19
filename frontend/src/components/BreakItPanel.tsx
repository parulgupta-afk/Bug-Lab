import { Settings2, TriangleAlert, X, Zap } from 'lucide-react'

type Props = {
  open: boolean
  arrayInput: string
  targetInput: string
  error: string
  sorted: boolean | null
  onArrayChange: (value: string) => void
  onTargetChange: (value: string) => void
  onPreset: (preset: 'sorted' | 'missing' | 'unsorted') => void
  onApply: () => void
  onClose: () => void
  onOpen: () => void
}

export function BreakItPanel({
  open,
  arrayInput,
  targetInput,
  error,
  sorted,
  onArrayChange,
  onTargetChange,
  onPreset,
  onApply,
  onClose,
  onOpen,
}: Props) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:border-violet/40 hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet"
      >
        <Settings2 size={14} /> Break it
      </button>
    )
  }

  return (
    <section aria-label="Break it mode" className="panel-card p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet/40 bg-violet/10 text-violet">
          <Settings2 size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Break it mode</p>
          <h2 className="text-sm font-semibold text-[var(--text)]">Change the input. Keep the trace honest.</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Binary search needs sorted data. Try a counterexample, then restore a valid input.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close break it panel"
          className="rounded-md p-1 text-[var(--quiet)] hover:bg-[var(--surface-3)] hover:text-[var(--text)]"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_100px_auto]">
        <label className="block text-xs">
          <span className="eyebrow">Array values</span>
          <input
            value={arrayInput}
            onChange={(e) => onArrayChange(e.target.value)}
            placeholder="3, 8, 14, 21"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 font-mono text-sm text-[var(--text)] focus:border-violet/50 focus:outline-none"
          />
        </label>
        <label className="block text-xs">
          <span className="eyebrow">Target</span>
          <input
            value={targetInput}
            onChange={(e) => onTargetChange(e.target.value)}
            placeholder="14"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 font-mono text-sm text-[var(--text)] focus:border-violet/50 focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={onApply}
          className="inline-flex items-center justify-center gap-2 self-end rounded-lg border border-violet/50 bg-violet/15 px-3 py-2 text-sm font-semibold text-[#efe8ff] transition hover:bg-violet/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet"
        >
          <Zap size={14} /> Apply
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="eyebrow mr-1">Presets</span>
        <button
          type="button"
          onClick={() => onPreset('sorted')}
          className="rounded-md border border-[var(--border)] px-2.5 py-1 text-[11px] text-[var(--muted)] hover:border-violet/40 hover:text-[var(--text)]"
        >
          sorted / found
        </button>
        <button
          type="button"
          onClick={() => onPreset('missing')}
          className="rounded-md border border-[var(--border)] px-2.5 py-1 text-[11px] text-[var(--muted)] hover:border-violet/40 hover:text-[var(--text)]"
        >
          sorted / missing
        </button>
        <button
          type="button"
          onClick={() => onPreset('unsorted')}
          className="rounded-md border border-[var(--border)] px-2.5 py-1 text-[11px] text-[var(--muted)] hover:border-violet/40 hover:text-[var(--text)]"
        >
          unsorted / risky
        </button>
        {sorted !== null && (
          <span
            className={`ml-auto rounded-full border px-2 py-0.5 font-mono text-[10px] ${
              sorted
                ? 'border-mint/40 bg-[rgba(140,232,190,0.1)] text-mint'
                : 'border-[rgba(241,143,154,0.4)] bg-[rgba(241,143,154,0.1)] text-[var(--red)]'
            }`}
          >
            {sorted ? 'sorted input' : 'unsorted input'}
          </span>
        )}
      </div>

      {error && (
        <p className="mt-2 flex items-center gap-2 text-xs text-[var(--red)]">
          <TriangleAlert size={14} /> {error}
        </p>
      )}
    </section>
  )
}
