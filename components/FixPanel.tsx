import { CheckCircle2, GitCompareArrows, Wrench, XCircle } from 'lucide-react'
import type { FixOption, FixResult, TraceSummary } from '../engine/fixing'

type Props = {
  /** Only shown after the student has located the bug. */
  unlocked: boolean
  options: FixOption[]
  selectedId: string | null
  result: FixResult | null
  before: TraceSummary
  after: TraceSummary | null
  onSelect: (id: string) => void
  onApply: () => void
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: 'good' | 'bad' | 'neutral' }) {
  const color =
    highlight === 'good'
      ? 'text-emerald-300'
      : highlight === 'bad'
        ? 'text-rose-300'
        : 'text-slate-200'
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 font-mono text-sm ${color}`}>{value}</p>
    </div>
  )
}

export function FixPanel({
  unlocked,
  options,
  selectedId,
  result,
  before,
  after,
  onSelect,
  onApply,
}: Props) {
  if (!unlocked) {
    return (
      <section aria-label="Fix the bug" className="rounded-xl border border-slate-800 bg-[#0d1426] p-4 opacity-60">
        <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <Wrench size={14} /> Fix the bug
        </h2>
        <p className="text-sm text-slate-400">Locate the bug first, then you can try a fix and verify it by re-running.</p>
      </section>
    )
  }

  const fixedOk = result?.verdict === 'correct'

  return (
    <section aria-label="Fix the bug" className="rounded-xl border border-slate-800 bg-[#0d1426] p-4">
      <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
        <Wrench size={14} /> Fix the bug
      </h2>
      <p className="mb-3 text-sm text-slate-300">
        Choose a correction, then verify it. Bug Lab re-runs the algorithm — it does not trust the label.
      </p>

      <fieldset disabled={fixedOk} className="space-y-2">
        <legend className="sr-only">Possible fixes</legend>
        {options.map((opt) => {
          const selected = selectedId === opt.id
          return (
            <label
              key={opt.id}
              className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${
                selected
                  ? 'border-sky-400/60 bg-sky-500/10'
                  : 'border-slate-700 bg-slate-900/40 hover:border-slate-600'
              } ${fixedOk ? 'cursor-default' : ''}`}
            >
              <input
                type="radio"
                name="fix-option"
                value={opt.id}
                checked={selected}
                onChange={() => onSelect(opt.id)}
                className="mt-1 accent-sky-400"
              />
              <div>
                <p className="font-mono text-sm font-semibold text-slate-100">{opt.label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{opt.description}</p>
              </div>
            </label>
          )
        })}
      </fieldset>

      {!fixedOk && (
        <button
          onClick={onApply}
          disabled={selectedId === null}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-400/60 bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-emerald-500/15"
        >
          <Wrench size={15} /> Apply &amp; verify
        </button>
      )}

      {result && (
        <div
          aria-live="polite"
          className={`mt-3 flex gap-3 rounded-lg border p-3 ${
            result.verdict === 'correct'
              ? 'border-emerald-500/50 bg-emerald-500/10'
              : 'border-rose-500/50 bg-rose-500/10'
          }`}
        >
          {result.verdict === 'correct' ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
          ) : (
            <XCircle size={18} className="mt-0.5 shrink-0 text-rose-400" />
          )}
          <p className="text-sm text-slate-100">{result.message}</p>
        </div>
      )}

      {after && (
        <div className="mt-4">
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            <GitCompareArrows size={14} /> Before / after
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-300/80">Buggy run</p>
              <Stat label="Steps" value={String(before.steps)} />
              <Stat
                label="Result"
                value={before.result === null ? 'none' : String(before.result)}
                highlight="bad"
              />
              <Stat
                label="Failure"
                value={before.failureKind ?? 'none'}
                highlight={before.failed ? 'bad' : 'neutral'}
              />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/80">After fix</p>
              <Stat label="Steps" value={String(after.steps)} highlight={after.failed ? 'bad' : 'good'} />
              <Stat
                label="Result"
                value={after.result === null ? 'none' : String(after.result)}
                highlight={after.failed ? 'bad' : 'good'}
              />
              <Stat
                label="Failure"
                value={after.failureKind ?? 'none'}
                highlight={after.failed ? 'bad' : 'good'}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
