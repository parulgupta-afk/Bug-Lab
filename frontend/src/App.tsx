import { Bug } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrayView } from './components/ArrayView'
import { ChallengeList } from './components/ChallengeList'
import { CodePanel } from './components/CodePanel'
import { Controls } from './components/Controls'
import { FeedbackPanel } from './components/FeedbackPanel'
import { FlagPanel } from './components/FlagPanel'
import { ObjectivePanel } from './components/ObjectivePanel'
import { PredictionPanel } from './components/PredictionPanel'
import { TraceTable } from './components/TraceTable'
import { VariableInspector } from './components/VariableInspector'
import { buildSource, runTrace } from './engine/binarySearch'
import { CHALLENGES, getChallenge } from './engine/challenges'
import type { Challenge } from './engine/challenges'
import { evaluateFlag, isSolved } from './engine/flagging'
import type { FlagResult } from './engine/flagging'
import { evaluateFix, getFixOptions, summarizeTrace } from './engine/fixing'
import type { FixResult } from './engine/fixing'
import { getPrediction, scoreAnswers } from './engine/predict'
import type { Answer } from './engine/predict'
import { FixPanel } from './components/FixPanel'
import { BreakItPanel } from './components/BreakItPanel'
import { TutorPanel } from './components/TutorPanel'
import { TestCasesPanel } from './components/TestCasesPanel'


function isSorted(arr: readonly number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i]! < arr[i - 1]!) return false
  }
  return true
}

function parseArrayInput(raw: string): number[] | null {
  const parts = raw
    .split(/[\s,]+/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length === 0) return null
  const nums = parts.map((p) => Number(p))
  if (nums.some((n) => !Number.isFinite(n))) return null
  return nums
}

type Mode = 'explore' | 'predict'

type DebuggerProps = {
  challenge: Challenge
  solved: boolean
  onSolved: () => void
}

function Debugger({ challenge, solved, onSolved }: DebuggerProps) {
  const [breakOpen, setBreakOpen] = useState(false)
  const [arrayInput, setArrayInput] = useState(() => challenge.array.join(', '))
  const [targetInput, setTargetInput] = useState(() => String(challenge.target))
  const [breakError, setBreakError] = useState('')
  const [runtime, setRuntime] = useState<{ array: number[]; target: number } | null>(null)

  const array = runtime?.array ?? challenge.array
  const target = runtime?.target ?? challenge.target
  // Assumptions challenge already uses the correct algorithm; others stay buggy until fixed elsewhere.
  const variant = challenge.buggy
  const sorted = useMemo(() => isSorted(array), [array])

  // The whole run is computed once from the engine; the UI only ever reads snapshots from it.
  const trace = useMemo(() => runTrace(array, target, variant), [array, target, variant])
  const source = useMemo(() => buildSource(variant), [variant])
  const predictions = useMemo(
    () => trace.states.map((_, i) => getPrediction(trace.states, variant, i)),
    [trace, variant],
  )

  const lastStep = trace.states.length - 1
  const [stepIndex, setStepIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speedMs, setSpeedMs] = useState(800)

  const [mode, setMode] = useState<Mode>('explore')
  const [answers, setAnswers] = useState<Record<number, Answer>>({})

  const [suspectLine, setSuspectLine] = useState<number | null>(null)
  const [flagResult, setFlagResult] = useState<FlagResult | null>(null)
  const [wrongAttempts, setWrongAttempts] = useState(0)

  const fixOptions = useMemo(() => getFixOptions(challenge), [challenge])
  const [selectedFixId, setSelectedFixId] = useState<string | null>(null)
  const [fixResult, setFixResult] = useState<FixResult | null>(null)

  const testVariant = useMemo(() => {
    if (fixResult?.verdict === 'correct' && selectedFixId) {
      const opt = fixOptions.find((o) => o.id === selectedFixId)
      if (opt) return opt.variant
    }
    return variant
  }, [fixResult, selectedFixId, fixOptions, variant])

  const debugTestCase = (arr: number[], tgt: number) => {
    setRuntime({ array: arr, target: tgt })
    setArrayInput(arr.join(', '))
    setTargetInput(String(tgt))
    setBreakOpen(true)
    setPlaying(false)
    setStepIndex(0)
    setAnswers({})
    setSuspectLine(null)
    setFlagResult(null)
  }
  const beforeSummary = useMemo(() => summarizeTrace(trace), [trace])
  const afterSummary = fixResult ? summarizeTrace(fixResult.fixedTrace) : null

  // In predict mode the student cannot move past a question they have not answered (or skipped).
  const firstUnanswered = predictions.findIndex((p, i) => p !== null && answers[i] === undefined)
  const maxStep = mode === 'predict' && firstUnanswered !== -1 ? firstUnanswered : lastStep

  const state = trace.states[stepIndex]
  const previous = stepIndex > 0 ? trace.states[stepIndex - 1] : null
  const prediction = mode === 'predict' ? predictions[stepIndex] : null
  const score = scoreAnswers(answers)

  const next = useCallback(() => setStepIndex((i) => Math.min(i + 1, maxStep)), [maxStep])
  const prev = useCallback(() => {
    setPlaying(false)
    setStepIndex((i) => Math.max(i - 1, 0))
  }, [])
  const reset = useCallback(() => {
    setPlaying(false)
    setStepIndex(0)
    setAnswers({})
  }, [])
  const togglePlay = useCallback(() => {
    if (stepIndex >= maxStep) return
    setPlaying((p) => !p)
  }, [stepIndex, maxStep])
  const scrub = useCallback(
    (i: number) => {
      setPlaying(false)
      setStepIndex(Math.min(i, maxStep))
    },
    [maxStep],
  )

  const switchMode = (m: Mode) => {
    if (m === mode) return
    setMode(m)
    setAnswers({})
    setPlaying(false)
    setStepIndex(0)
  }

  const answer = (choice: string | null) => {
    const p = predictions[stepIndex]
    if (!p) return
    setAnswers((a) => ({ ...a, [stepIndex]: { choice, correct: choice !== null && choice === p.correctId } }))
  }

  const selectLine = (line: number) => {
    setSuspectLine((cur) => (cur === line ? null : line))
    setFlagResult(null)
  }

  const flag = () => {
    if (suspectLine === null) return
    const result = evaluateFlag(challenge, trace, stepIndex, suspectLine, wrongAttempts)
    setFlagResult(result)
    if (result.verdict === 'wrong-line') setWrongAttempts((n) => n + 1)
    if (isSolved(result.verdict)) onSolved()
  }

  const applyFix = () => {
    if (selectedFixId === null) return
    const option = fixOptions.find((o) => o.id === selectedFixId)
    if (!option) return
    // evaluateFix always uses the challenge's original test input
    setFixResult(evaluateFix(challenge, option))
  }

  const applyBreakInput = () => {
    const parsed = parseArrayInput(arrayInput)
    const t = Number(targetInput.trim())
    if (!parsed) {
      setBreakError('Enter a comma-separated list of numbers for the array.')
      return
    }
    if (!Number.isFinite(t)) {
      setBreakError('Target must be a number.')
      return
    }
    setBreakError('')
    setRuntime({ array: parsed, target: t })
    setPlaying(false)
    setStepIndex(0)
    setAnswers({})
    setSuspectLine(null)
    setFlagResult(null)
    setFixResult(null)
  }

  const applyPreset = (preset: 'sorted' | 'missing' | 'unsorted') => {
    if (preset === 'sorted') {
      setArrayInput('3, 8, 14, 21, 29, 34, 42, 57')
      setTargetInput('21')
    } else if (preset === 'missing') {
      setArrayInput('3, 8, 14, 21, 29, 34, 42, 57')
      setTargetInput('15')
    } else {
      setArrayInput('18, 3, 7, 24, 12')
      setTargetInput('3')
    }
    setBreakError('')
  }

  const closeBreak = () => {
    setBreakOpen(false)
    setRuntime(null)
    setArrayInput(challenge.array.join(', '))
    setTargetInput(String(challenge.target))
    setBreakError('')
    setPlaying(false)
    setStepIndex(0)
    setAnswers({})
  }

  // Autoplay: one timer per step. When the next step is locked behind a question (or is the last
  // step), playback stops itself on arrival instead of resuming later without being asked.
  useEffect(() => {
    if (!playing || stepIndex >= maxStep) return
    const id = window.setTimeout(() => {
      if (stepIndex + 1 >= maxStep) setPlaying(false)
      setStepIndex(stepIndex + 1)
    }, speedMs)
    return () => window.clearTimeout(id)
  }, [playing, stepIndex, maxStep, speedMs])

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
      } else if (e.key === ' ' && target.tagName !== 'BUTTON' && target.getAttribute('role') !== 'button') {
        e.preventDefault()
        togglePlay()
      } else if ((e.key === 'r' || e.key === 'R') && target.getAttribute('role') !== 'button') {
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
        <CodePanel
          lines={source}
          activeLine={state.line}
          suspectLine={suspectLine}
          bugLine={solved ? challenge.bugLine : null}
          onSelectLine={solved ? undefined : selectLine}
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div role="group" aria-label="Learning mode" className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-0.5">
            {(['explore', 'predict'] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                aria-pressed={mode === m}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet ${
                  mode === m ? 'mode-pill-active' : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          {mode === 'predict' && (
            <span className="rounded-md border border-slate-700 px-2.5 py-1 font-mono text-xs text-slate-300">
              Predictions: {score.correct}/{score.answered} correct
              {score.skipped > 0 ? ` · ${score.skipped} skipped` : ''}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <BreakItPanel
            open={breakOpen}
            arrayInput={arrayInput}
            targetInput={targetInput}
            error={breakError}
            sorted={runtime ? sorted : null}
            onArrayChange={setArrayInput}
            onTargetChange={setTargetInput}
            onPreset={applyPreset}
            onApply={applyBreakInput}
            onClose={closeBreak}
            onOpen={() => setBreakOpen(true)}
          />
          {runtime && (
            <span className="font-mono text-[10px] text-[var(--quiet)]">
              custom input · target {target}
            </span>
          )}
        </div>
        <ArrayView state={state} />
        <VariableInspector state={state} previous={previous} />
        {mode === 'predict' && (
          <PredictionPanel
            key={stepIndex}
            prediction={prediction}
            answer={answers[stepIndex]}
            onAnswer={(id) => answer(id)}
            onSkip={() => answer(null)}
          />
        )}
        <Controls
          stepIndex={stepIndex}
          lastStep={lastStep}
          maxStep={maxStep}
          playing={playing}
          speedMs={speedMs}
          onPrev={prev}
          onNext={next}
          onTogglePlay={togglePlay}
          onReset={reset}
          onScrub={scrub}
          onSpeed={setSpeedMs}
        />
        <FeedbackPanel state={state} failure={trace.failure} isLastStep={stepIndex === lastStep} />
        <FlagPanel
          suspectLine={suspectLine}
          stepIndex={stepIndex}
          result={flagResult}
          solved={solved}
          explanation={challenge.explanation}
          onFlag={flag}
        />
        <FixPanel
          unlocked={solved}
          options={fixOptions}
          selectedId={selectedFixId}
          result={fixResult}
          before={beforeSummary}
          after={afterSummary}
          onSelect={(id) => {
            setSelectedFixId(id)
            setFixResult(null)
          }}
          onApply={applyFix}
        />
        <TestCasesPanel variant={testVariant} onDebugCase={debugTestCase} />
        <TutorPanel challengeTitle={challenge.title} code={source} state={state} />
        <TraceTable states={trace.states} stepIndex={stepIndex} onSelect={scrub} />
      </div>
    </div>
  )
}

export default function App() {
  const [challengeId, setChallengeId] = useState(CHALLENGES[0].id)
  const [solvedIds, setSolvedIds] = useState<string[]>([])
  const challenge = getChallenge(challengeId)

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="flex items-center gap-3 min-w-0">
          <div className="brand-mark">
            <Bug size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="text-[14px] font-extrabold tracking-[0.1em] text-[#f5f3ff] leading-none">
              BUG<span className="text-violet">LAB</span>
            </h1>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--quiet)]">
              Debug the algorithm
            </p>
          </div>
        </div>
        <nav className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.11em] text-[var(--quiet)] md:flex">
          <span>Challenges</span>
          <span className="text-[#3d4357]">/</span>
          <span className="text-[#bfc6dd]">Binary Search</span>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--quiet)] sm:flex">
            <span className="live-dot" />
            Session · Local
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 font-mono text-[10px] text-[var(--muted)]">
            Phase 5
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside>
          <ChallengeList
            challenges={CHALLENGES}
            selectedId={challengeId}
            solvedIds={solvedIds}
            onSelect={setChallengeId}
          />
        </aside>
        {/* key resets all stepping state whenever a different challenge is chosen */}
        <Debugger
          key={challenge.id}
          challenge={challenge}
          solved={solvedIds.includes(challenge.id)}
          onSolved={() => setSolvedIds((ids) => (ids.includes(challenge.id) ? ids : [...ids, challenge.id]))}
        />
      </main>
    </div>
  )
}
