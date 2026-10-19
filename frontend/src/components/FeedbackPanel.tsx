import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import type { ExecutionState, Failure } from '../engine/types'

type Props = {
  state: ExecutionState
  failure: Failure | null
  isLastStep: boolean
}

export function FeedbackPanel({ state, failure, isLastStep }: Props) {
  const showFailure = state.status === 'bug-detected' && failure !== null

  return (
    <section aria-label="What just happened" aria-live="polite" className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <h2 className="mb-2 eyebrow">What just happened</h2>
      <p className="text-sm leading-relaxed text-slate-200">{state.message}</p>

      {state.comparison && (
        <p className="mt-2 inline-block rounded-md border border-slate-700 bg-slate-900/70 px-2.5 py-1 font-mono text-xs text-slate-300">
          {state.comparison}
        </p>
      )}

      {showFailure && (
        <div className="mt-4 flex gap-3 rounded-lg border border-[rgba(241,143,154,0.45)] bg-[rgba(241,143,154,0.1)] p-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--red)]" />
          <div>
            <p className="text-sm font-semibold text-[#fecdd3]">
              {failure.kind === 'infinite-loop' && 'Possible infinite loop detected'}
              {failure.kind === 'wrong-result' && 'Wrong result detected'}
              {failure.kind === 'step-limit' && 'Step limit reached'}
            </p>
            <p className="mt-1 text-sm text-[#ffe4e6]/90">{failure.explanation}</p>
          </div>
        </div>
      )}

      {state.status === 'found' && isLastStep && (
        <div className="mt-4 flex gap-3 rounded-lg border border-[rgba(140,232,190,0.45)] bg-[rgba(140,232,190,0.1)] p-3">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-mint" />
          <p className="text-sm text-[#d1fae5]">The search finished and returned the correct answer.</p>
        </div>
      )}

      {state.status === 'not-found' && isLastStep && (
        <div className="mt-4 flex gap-3 rounded-lg border border-cyan/40 bg-cyan/10 p-3">
          <Info size={18} className="mt-0.5 shrink-0 text-cyan" />
          <p className="text-sm text-[#cffafe]">The search finished and correctly reported that the target is not in the array.</p>
        </div>
      )}
    </section>
  )
}
