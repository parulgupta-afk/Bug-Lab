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
    <section aria-label="What just happened" aria-live="polite" className="rounded-xl border border-slate-800 bg-[#0d1426] p-4">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">What just happened</h2>
      <p className="text-sm leading-relaxed text-slate-200">{state.message}</p>

      {state.comparison && (
        <p className="mt-2 inline-block rounded-md border border-slate-700 bg-slate-900/70 px-2.5 py-1 font-mono text-xs text-slate-300">
          {state.comparison}
        </p>
      )}

      {showFailure && (
        <div className="mt-4 flex gap-3 rounded-lg border border-rose-500/50 bg-rose-500/10 p-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-400" />
          <div>
            <p className="text-sm font-semibold text-rose-200">
              {failure.kind === 'infinite-loop' && 'Possible infinite loop detected'}
              {failure.kind === 'wrong-result' && 'Wrong result detected'}
              {failure.kind === 'step-limit' && 'Step limit reached'}
            </p>
            <p className="mt-1 text-sm text-rose-100/90">{failure.explanation}</p>
          </div>
        </div>
      )}

      {state.status === 'found' && isLastStep && (
        <div className="mt-4 flex gap-3 rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-3">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
          <p className="text-sm text-emerald-100">The search finished and returned the correct answer.</p>
        </div>
      )}

      {state.status === 'not-found' && isLastStep && (
        <div className="mt-4 flex gap-3 rounded-lg border border-sky-500/50 bg-sky-500/10 p-3">
          <Info size={18} className="mt-0.5 shrink-0 text-sky-400" />
          <p className="text-sm text-sky-100">The search finished and correctly reported that the target is not in the array.</p>
        </div>
      )}
    </section>
  )
}
