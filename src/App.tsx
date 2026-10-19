import { Bug } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrayView } from './components/ArrayView'
import { ChallengeList } from './components/ChallengeList'
import { CodePanel } from './components/CodePanel'
import { Controls } from './components/Controls'
import { FeedbackPanel } from './components/FeedbackPanel'
import { ObjectivePanel } from './components/ObjectivePanel'
import { TraceTable } from './components/TraceTable'
import { VariableInspector } from './components/VariableInspector'
import { buildSource, runTrace } from './engine/binarySearch'
import { CHALLENGES, getChallenge } from './engine/challenges'
import type { Challenge } from './engine/challenges'

function Debugger({ challenge }: { challenge: Challenge }) {
  // The whole run is computed once from the engine; the UI only ever reads snapshots from it.
  const trace = useMemo(() => runTrace(challenge.array, challenge.target, challenge.buggy), [challenge])
  const source = useMemo(() => buildSource(challenge.buggy), [challenge])

  const lastStep = trace.states.length - 1
  const [stepIndex, setStepIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speedMs, setSpeedMs] = useState(800)

  const isPlaying = playing && stepIndex < lastStep
  const state = trace.states[stepIndex]
  const previous = stepIndex > 0 ? trace.states[stepIndex - 1] : null

  const next = useCallback(() => setStepIndex((i) => Math.min(i + 1, lastStep)), [lastStep])
  const prev = useCallback(() => {
    setPlaying(false)
    setStepIndex((i) => Math.max(i - 1, 0))
  }, [])
  const reset = useCallback(() => {
    setPlaying(false)
    setStepIndex(0)
  }, [])
  const togglePlay = useCallback(() => {
    if (stepIndex >= lastStep) return
    setPlaying((p) => !p)
  }, [stepIndex, lastStep])
  const scrub = useCallback((i: number) => {
    setPlaying(false)
    setStepIndex(i)
  }, [])

  useEffect(() => {
    if (!isPlaying) return
    const id = window.setInterval(next, speedMs)
    return () => window.clearInterval(id)
  }, [isPlaying, speedMs, next])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'SELECT' || target.tagName === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      } else if (e.key === ' ' && target.tagName !== 'BUTTON') {
        e.preventDefault()
        togglePlay()
      } else if (e.key === 'r' || e.key === 'R') {
        reset()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, togglePlay, reset])

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-4">
        <ObjectivePanel key={challenge.id} challenge={challenge} />
        <CodePanel lines={source} activeLine={state.line} />
      </div>

      <div className="space-y-4">
        <ArrayView state={state} />
        <VariableInspector state={state} previous={previous} />
        <Controls
          stepIndex={stepIndex}
          lastStep={lastStep}
          playing={isPlaying}
          speedMs={speedMs}
          onPrev={prev}
          onNext={next}
          onTogglePlay={togglePlay}
          onReset={reset}
          onScrub={scrub}
          onSpeed={setSpeedMs}
        />
        <FeedbackPanel state={state} failure={trace.failure} isLastStep={stepIndex === lastStep} />
        <TraceTable states={trace.states} stepIndex={stepIndex} onSelect={scrub} />
      </div>
    </div>
  )
}

export default function App() {
  const [challengeId, setChallengeId] = useState(CHALLENGES[0].id)
  const challenge = getChallenge(challengeId)

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-[#0b1226]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/15 text-rose-300">
              <Bug size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-slate-50">Bug Lab</h1>
              <p className="text-xs text-slate-400">Don't just write code. Break it. Trace it. Fix it. Understand it.</p>
            </div>
          </div>
          <span className="hidden rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400 sm:inline">
            Binary search debugger
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside>
          <ChallengeList challenges={CHALLENGES} selectedId={challengeId} onSelect={setChallengeId} />
        </aside>
        {/* key resets all stepping state whenever a different challenge is chosen */}
        <Debugger key={challenge.id} challenge={challenge} />
      </main>
    </div>
  )
}
