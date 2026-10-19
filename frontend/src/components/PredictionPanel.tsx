import { BrainCircuit, CheckCircle2, XCircle } from 'lucide-react'
import type { Answer, Prediction } from '../engine/predict'

type Props = {
  prediction: Prediction | null
  answer: Answer | undefined
  onAnswer: (optionId: string) => void
  onSkip: () => void
}

export function PredictionPanel({ prediction, answer, onAnswer, onSkip }: Props) {
  if (!prediction) {
    return (
      <section aria-label="Prediction" className="rounded-xl border border-slate-800 bg-[#0d1426] p-4">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <BrainCircuit size={14} /> Predict mode
        </h2>
        <p className="mt-2 text-sm text-slate-400">No question for this step. Press Next step to continue.</p>
      </section>
    )
  }

  const chosen = answer?.choice ?? null
  const answered = answer !== undefined

  return (
    <section aria-label="Prediction" className="rounded-xl border border-sky-500/40 bg-sky-500/5 p-4">
      <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-sky-300">
        <BrainCircuit size={14} /> {prediction.title}
      </h2>
      <p className="text-sm leading-relaxed text-slate-100">{prediction.question}</p>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Answer options">
        {prediction.options.map((o) => {
          const isCorrect = o.id === prediction.correctId
          const isChosen = o.id === chosen
          let tone = 'border-slate-600 bg-slate-800/70 text-slate-100 hover:bg-slate-700'
          if (answered && isCorrect) tone = 'border-emerald-400 bg-emerald-400/15 text-emerald-100'
          else if (answered && isChosen) tone = 'border-rose-400 bg-rose-400/15 text-rose-100'
          else if (answered) tone = 'border-slate-800 bg-slate-900/40 text-slate-500'
          return (
            <button
              key={o.id}
              onClick={() => onAnswer(o.id)}
              disabled={answered}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-default ${tone}`}
            >
              {o.label}
            </button>
          )
        })}
        {!answered && (
          <button
            onClick={onSkip}
            className="rounded-lg border border-transparent px-3 py-2 text-sm text-slate-400 underline-offset-2 transition hover:text-slate-200 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            Skip, show me
          </button>
        )}
      </div>

      {!answered && <p className="mt-3 text-xs text-slate-500">Answer to unlock the next step.</p>}

      {answered && (
        <div
          aria-live="polite"
          className={`mt-4 flex gap-3 rounded-lg border p-3 ${
            answer.choice === null
              ? 'border-slate-600 bg-slate-800/50'
              : answer.correct
                ? 'border-emerald-500/50 bg-emerald-500/10'
                : 'border-rose-500/50 bg-rose-500/10'
          }`}
        >
          {answer.choice === null ? null : answer.correct ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
          ) : (
            <XCircle size={18} className="mt-0.5 shrink-0 text-rose-400" />
          )}
          <div className="text-sm text-slate-100">
            <p className="font-semibold">
              {answer.choice === null ? 'Skipped' : answer.correct ? 'Correct' : 'Not quite'}
            </p>
            <p className="mt-1 text-slate-200">{prediction.explanation}</p>
          </div>
        </div>
      )}
    </section>
  )
}
