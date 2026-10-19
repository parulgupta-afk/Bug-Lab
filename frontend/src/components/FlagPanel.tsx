import { CheckCircle2, Flag, Info, XCircle } from 'lucide-react'
import type { FlagResult } from '../engine/flagging'

type Props = {
  suspectLine: number | null
  stepIndex: number
  result: FlagResult | null
  solved: boolean
  /** Explanation of the bug, revealed once it has been found. */
  explanation: string
  onFlag: () => void
}

export function FlagPanel({ suspectLine, stepIndex, result, solved, explanation, onFlag }: Props) {
  return (
    <section aria-label="Flag the bug" className="rounded-xl border border-slate-800 bg-[#0d1426] p-4">
      <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
        <Flag size={14} /> Found the bug?
      </h2>

      {solved ? (
        <div className="flex gap-3 rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-3">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
          <div className="text-sm text-emerald-50">
            <p className="font-semibold">Bug located</p>
            <p className="mt-1 text-emerald-100/90">{explanation}</p>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-300">
            {suspectLine === null
              ? 'Click the line of code you suspect, then flag it at the step where you can see the problem.'
              : `Suspect: line ${suspectLine}. You are on step ${stepIndex + 1}.`}
          </p>
          <button
            onClick={onFlag}
            disabled={suspectLine === null}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-400/60 bg-rose-500/15 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-rose-500/15"
          >
            <Flag size={15} /> Something's wrong
          </button>

          {result && (
            <div
              aria-live="polite"
              className={`mt-3 flex gap-3 rounded-lg border p-3 ${
                result.verdict === 'wrong-line'
                  ? 'border-rose-500/50 bg-rose-500/10'
                  : 'border-sky-500/50 bg-sky-500/10'
              }`}
            >
              {result.verdict === 'wrong-line' ? (
                <XCircle size={18} className="mt-0.5 shrink-0 text-rose-400" />
              ) : (
                <Info size={18} className="mt-0.5 shrink-0 text-sky-400" />
              )}
              <p className="text-sm text-slate-100">{result.message}</p>
            </div>
          )}
        </>
      )}
    </section>
  )
}
