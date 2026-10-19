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
    <section aria-label="Flag the bug" className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <h2 className="mb-2 flex items-center gap-2 eyebrow">
        <Flag size={14} /> Found the bug?
      </h2>

      {solved ? (
        <div className="flex gap-3 rounded-lg border border-[rgba(140,232,190,0.45)] bg-[rgba(140,232,190,0.1)] p-3">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-mint" />
          <div className="text-sm text-[#ecfdf5]">
            <p className="font-semibold">Bug located</p>
            <p className="mt-1 text-[#d1fae5]/90">{explanation}</p>
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
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[rgba(241,143,154,0.55)] bg-[rgba(241,143,154,0.12)] px-3 py-2 text-sm font-semibold text-[#ffe4e6] transition hover:bg-[rgba(241,143,154,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--red)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[rgba(241,143,154,0.12)]"
          >
            <Flag size={15} /> Something's wrong
          </button>

          {result && (
            <div
              aria-live="polite"
              className={`mt-3 flex gap-3 rounded-lg border p-3 ${
                result.verdict === 'wrong-line'
                  ? 'border-[rgba(241,143,154,0.45)] bg-[rgba(241,143,154,0.1)]'
                  : 'border-violet/40 bg-violet/10'
              }`}
            >
              {result.verdict === 'wrong-line' ? (
                <XCircle size={18} className="mt-0.5 shrink-0 text-[var(--red)]" />
              ) : (
                <Info size={18} className="mt-0.5 shrink-0 text-violet" />
              )}
              <p className="text-sm text-slate-100">{result.message}</p>
            </div>
          )}
        </>
      )}
    </section>
  )
}
