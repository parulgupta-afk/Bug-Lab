import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'

type Props = {
  stepIndex: number
  lastStep: number
  /** Furthest step the student may move to right now (limited by unanswered predictions). */
  maxStep: number
  playing: boolean
  speedMs: number
  onPrev: () => void
  onNext: () => void
  onTogglePlay: () => void
  onReset: () => void
  onScrub: (index: number) => void
  onSpeed: (ms: number) => void
}

const SPEEDS = [
  { label: 'Slow', ms: 1400 },
  { label: 'Normal', ms: 800 },
  { label: 'Fast', ms: 350 },
]

const btn =
  'inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-800/70'

export function Controls({
  stepIndex,
  lastStep,
  maxStep,
  playing,
  speedMs,
  onPrev,
  onNext,
  onTogglePlay,
  onReset,
  onScrub,
  onSpeed,
}: Props) {
  const atEnd = stepIndex >= maxStep
  return (
    <section aria-label="Debugger controls" className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Execution</h2>
        <span className="font-mono text-xs text-slate-400">
          Step {stepIndex + 1} of {lastStep + 1}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button className={btn} onClick={onPrev} disabled={stepIndex === 0} aria-label="Previous step">
          <ChevronLeft size={16} /> Previous
        </button>
        <button
          className={`${btn} border-sky-500/60 bg-sky-500/20 hover:bg-violet/30`}
          onClick={onNext}
          disabled={atEnd}
          aria-label="Next step"
        >
          Next step <ChevronRight size={16} />
        </button>
        <button className={btn} onClick={onTogglePlay} disabled={atEnd && !playing} aria-label={playing ? 'Pause' : 'Run'}>
          {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? 'Pause' : 'Run'}
        </button>
        <button className={btn} onClick={onReset} aria-label="Reset">
          <RotateCcw size={16} /> Reset
        </button>

        <label className="ml-auto flex items-center gap-2 text-xs text-slate-400">
          Speed
          <select
            value={speedMs}
            onChange={(e) => onSpeed(Number(e.target.value))}
            className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet"
          >
            {SPEEDS.map((s) => (
              <option key={s.ms} value={s.ms}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <input
        type="range"
        min={0}
        max={lastStep}
        value={stepIndex}
        onChange={(e) => onScrub(Math.min(Number(e.target.value), maxStep))}
        aria-label="Scrub through execution steps"
        className="mt-4 w-full accent-sky-400"
      />
      <p className="mt-1 text-[11px] text-slate-500">
        Keyboard: <kbd className="rounded bg-slate-800 px-1">←</kbd> <kbd className="rounded bg-slate-800 px-1">→</kbd> to step,{' '}
        <kbd className="rounded bg-slate-800 px-1">Space</kbd> to run or pause, <kbd className="rounded bg-slate-800 px-1">R</kbd> to reset.
      </p>
    </section>
  )
}
