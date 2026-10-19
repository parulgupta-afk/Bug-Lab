import { Beaker, Bug, CheckCircle2, CircleHelp, Play, RotateCcw, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { SearchVariant } from '../engine/types'
import {
  BINARY_SEARCH_SUITE,
  type TestCase,
  type TestResult,
} from '../engine/testCases'
import {
  makeCustomTestCase,
  parseCustomTest,
  runOneTest,
  runTestSuite,
  summarizeResults,
} from '../engine/testRunner'

type Props = {
  variant: SearchVariant
  /** Load a failed (or any) case into the main debugger. */
  onDebugCase: (array: number[], target: number) => void
}

export function TestCasesPanel({ variant, onDebugCase }: Props) {
  const [results, setResults] = useState<TestResult[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hintLevel, setHintLevel] = useState(0)
  const [customCases, setCustomCases] = useState<TestCase[]>([])
  const [arrayInput, setArrayInput] = useState('1, 3, 5, 7, 9')
  const [targetInput, setTargetInput] = useState('7')
  const [formError, setFormError] = useState('')
  const [running, setRunning] = useState(false)

  const suite = useMemo(() => [...BINARY_SEARCH_SUITE, ...customCases], [customCases])
  const byId = useMemo(() => new Map(suite.map((t) => [t.id, t])), [suite])
  const resultById = useMemo(
    () => new Map((results ?? []).map((r) => [r.testCaseId, r])),
    [results],
  )
  const summary = results ? summarizeResults(results) : null
  const selected = selectedId ? byId.get(selectedId) : undefined
  const selectedResult = selectedId ? resultById.get(selectedId) : undefined

  const runAll = () => {
    setRunning(true)
    // Yield so the UI can show running state; suite is small and sync.
    requestAnimationFrame(() => {
      const next = runTestSuite(variant, suite)
      setResults(next)
      setSelectedId(next.find((r) => r.status === 'failed')?.testCaseId ?? next[0]?.testCaseId ?? null)
      setHintLevel(0)
      setRunning(false)
    })
  }

  const reset = () => {
    setResults(null)
    setSelectedId(null)
    setHintLevel(0)
  }

  const addCustom = () => {
    const parsed = parseCustomTest(arrayInput, targetInput)
    if (!parsed.ok) {
      setFormError(parsed.error)
      return
    }
    setFormError('')
    const test = makeCustomTestCase(parsed.array, parsed.target)
    setCustomCases((prev) => [...prev, test])
    const one = runOneTest(test, variant)
    setResults((prev) => {
      const base = prev ?? runTestSuite(variant, BINARY_SEARCH_SUITE.concat(customCases))
      return [...base.filter((r) => r.testCaseId !== test.id), one]
    })
    setSelectedId(test.id)
    setHintLevel(0)
  }

  return (
    <section aria-label="Smart test cases" className="panel-card overflow-hidden">
      <header className="panel-header">
        <h2 className="eyebrow flex items-center gap-2">
          <Beaker size={13} className="text-violet" /> Smart test cases
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={runAll}
            disabled={running}
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet/50 bg-violet/15 px-2.5 py-1.5 text-xs font-semibold text-[#efe8ff] hover:bg-violet/25 disabled:opacity-40"
          >
            <Play size={13} /> {running ? 'Running…' : 'Run all tests'}
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)]"
          >
            <RotateCcw size={13} /> Clear results
          </button>
        </div>
      </header>

      <div className="space-y-3 p-3">
        {summary && (
          <div className="flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-wide">
            <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[var(--muted)]">
              {summary.total} total
            </span>
            <span className="rounded-full border border-mint/40 bg-[rgba(140,232,190,0.1)] px-2 py-0.5 text-mint">
              {summary.passed} passed
            </span>
            <span className="rounded-full border border-[rgba(241,143,154,0.4)] bg-[rgba(241,143,154,0.1)] px-2 py-0.5 text-[var(--red)]">
              {summary.failed} failed
            </span>
            <span className="rounded-full border border-amber/40 bg-[rgba(245,200,107,0.1)] px-2 py-0.5 text-amber">
              {summary.invalid} invalid input
            </span>
          </div>
        )}

        <ul className="max-h-52 space-y-1 overflow-y-auto">
          {suite.map((test) => {
            const r = resultById.get(test.id)
            const active = test.id === selectedId
            return (
              <li key={test.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(test.id)
                    setHintLevel(0)
                  }}
                  className={`flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition ${
                    active
                      ? 'border-violet/50 bg-violet/10'
                      : 'border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <StatusIcon status={r?.status} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-[var(--text)]">{test.name}</span>
                    <span className="font-mono text-[10px] text-[var(--quiet)]">
                      [{test.array.join(', ')}] → {test.target}
                    </span>
                  </span>
                  {r && (
                    <span className="shrink-0 font-mono text-[10px] text-[var(--muted)]">
                      {r.status === 'invalid-input'
                        ? 'precondition'
                        : `exp ${r.expected ?? '—'} / got ${r.actual ?? '—'}`}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        {selected && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs">
            <p className="eyebrow mb-1">Selected case</p>
            <p className="font-medium text-[var(--text)]">{selected.name}</p>
            <p className="mt-1 text-[var(--muted)]">{selected.description}</p>
            <p className="mt-2 font-mono text-[11px] text-[var(--muted)]">
              array [{selected.array.join(', ')}] · target {selected.target}
            </p>
            {selectedResult && (
              <>
                <p className="mt-2 text-[var(--text)]">{selectedResult.message}</p>
                {selectedResult.hints.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-[var(--muted)]">{selectedResult.hints[Math.min(hintLevel, selectedResult.hints.length - 1)]}</p>
                    {hintLevel < selectedResult.hints.length - 1 && (
                      <button
                        type="button"
                        onClick={() => setHintLevel((h) => h + 1)}
                        className="inline-flex items-center gap-1 text-[11px] text-violet hover:underline"
                      >
                        <CircleHelp size={12} /> More detail
                      </button>
                    )}
                  </div>
                )}
                {(selectedResult.status === 'failed' || selectedResult.status === 'invalid-input') && (
                  <button
                    type="button"
                    onClick={() => onDebugCase(selected.array, selected.target)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-cyan/40 bg-cyan/10 px-2.5 py-1.5 text-[11px] font-semibold text-cyan hover:bg-cyan/20"
                  >
                    <Bug size={13} /> Debug this failure
                  </button>
                )}
              </>
            )}
            {!selectedResult && (
              <p className="mt-2 text-[var(--quiet)]">Run the suite to score this case.</p>
            )}
          </div>
        )}

        <div className="rounded-lg border border-dashed border-[var(--border)] p-3">
          <p className="eyebrow mb-2">Custom test</p>
          <div className="grid gap-2 sm:grid-cols-[1fr_90px_auto]">
            <input
              value={arrayInput}
              onChange={(e) => setArrayInput(e.target.value)}
              placeholder="1, 3, 5"
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 font-mono text-xs text-[var(--text)]"
            />
            <input
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="target"
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 font-mono text-xs text-[var(--text)]"
            />
            <button
              type="button"
              onClick={addCustom}
              className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] hover:border-violet/40 hover:text-[var(--text)]"
            >
              Add & run
            </button>
          </div>
          {formError && <p className="mt-1 text-[11px] text-[var(--red)]">{formError}</p>}
        </div>
      </div>
    </section>
  )
}

function StatusIcon({ status }: { status?: TestResult['status'] }) {
  if (!status) return <span className="mt-0.5 h-3.5 w-3.5 rounded-full border border-[var(--border)]" />
  if (status === 'passed') return <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-mint" />
  if (status === 'invalid-input') return <CircleHelp size={14} className="mt-0.5 shrink-0 text-amber" />
  return <XCircle size={14} className="mt-0.5 shrink-0 text-[var(--red)]" />
}
