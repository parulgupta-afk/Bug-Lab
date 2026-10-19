import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bug,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  CirclePause,
  Flag,
  Gauge,
  GitBranch,
  KeyRound,
  Lightbulb,
  ListRestart,
  LockKeyhole,
  MousePointer2,
  Play,
  RotateCcw,
  ScanSearch,
  Search,
  Settings2,
  Sparkles,
  Terminal,
  Target,
  TimerReset,
  TrendingUp,
  TriangleAlert,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
import {
  CHALLENGES,
  getChallenge,
  getExpectedIndex,
  getPredictionPrompt,
  isSorted,
  runBinarySearch,
  verifyRun,
  type Challenge,
  type ChallengeId,
  type ExecutionSnapshot,
  type FixType,
  type VerificationResult,
} from './engine/binarySearchEngine'

type Stage = 'observe' | 'predict' | 'investigate' | 'fix' | 'verify'
type PredictionFeedback = 'correct' | 'incorrect' | null

const stages: { id: Stage; label: string; icon: LucideIcon }[] = [
  { id: 'observe', label: 'Observe', icon: ScanSearch },
  { id: 'predict', label: 'Predict', icon: CircleHelp },
  { id: 'investigate', label: 'Investigate', icon: Search },
  { id: 'fix', label: 'Fix', icon: Wrench },
  { id: 'verify', label: 'Verify', icon: CheckCircle2 },
]

const hintSets: Record<ChallengeId, string[]> = {
  'infinite-loop': [
    'Watch the range after the trace moves right. Does low change to a new index?',
    'The value at mid was already ruled out. Leaving low on mid lets the same candidate return.',
    'Fix line 13 so low advances one past mid. Every iteration needs to shrink the interval.',
  ],
  'missing-element': [
    'Look at the single-candidate case. When low equals high, is there still a value to inspect?',
    'The loop stops before the final candidate gets a comparison.',
    'Include equality in the while condition so low <= high keeps the last index alive.',
  ],
  assumptions: [
    'The comparison tells us which half to discard only if the values are ordered.',
    'Try the same target with the array rearranged. The direction decision can now discard the target.',
    'Sort the input before running binary search. The algorithm is not the broken part here.',
  ],
}

const stageNotes: Record<Stage, { kicker: string; title: string; body: string }> = {
  observe: {
    kicker: 'TRACE THE SIGNAL',
    title: 'Watch the search interval move.',
    body: 'Step through the broken algorithm and read each state change before touching the code.',
  },
  predict: {
    kicker: 'MAKE A CALL',
    title: 'What should happen next?',
    body: 'Use the current low, mid, and high values to predict the next safe move.',
  },
  investigate: {
    kicker: 'FOLLOW THE SYMPTOM',
    title: 'Find the suspicious line.',
    body: 'Flag a line, then use progressive hints to connect the symptom to the faulty logic.',
  },
  fix: {
    kicker: 'MAKE THE PATCH',
    title: 'Choose a correction.',
    body: 'Apply a targeted repair, then replay the same deterministic trace with the fix enabled.',
  },
  verify: {
    kicker: 'RUN THE PROOF',
    title: 'Does the fix hold?',
    body: 'Compare the repaired run with the expected output. A correct fix makes the invariant visible.',
  },
}

const codeTokenClass = (token: string) => {
  if (/^(const|let|while|if|else|return)$/.test(token)) return 'token-keyword'
  if (/^(low|high|mid|target|arr|value)$/.test(token)) return 'token-variable'
  if (/^(Math|floor)$/.test(token)) return 'token-function'
  if (/^(===|<=|>=|<|>|\+|-|=)$/.test(token)) return 'token-operator'
  if (/^\d+$/.test(token)) return 'token-number'
  if (token.startsWith('//')) return 'token-comment'
  return 'token-plain'
}

function highlightCode(line: string): ReactNode[] {
  const tokens = line.split(/(\b(?:const|let|while|if|else|return|Math|floor|low|high|mid|target|arr|value)\b|===|<=|>=|[<>+\-=]|\b\d+\b)/g)
  return tokens.filter(Boolean).map((token, index) => (
    <span className={codeTokenClass(token)} key={`${token}-${index}`}>{token}</span>
  ))
}

function App() {
  const [challengeId, setChallengeId] = useState<ChallengeId>('infinite-loop')
  const [activeStage, setActiveStage] = useState<Stage>('observe')
  const [fixType, setFixType] = useState<FixType>('none')
  const [selectedFix, setSelectedFix] = useState<FixType>('boundary')
  const [position, setPosition] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [flaggedLine, setFlaggedLine] = useState<number | null>(null)
  const [hintIndex, setHintIndex] = useState(0)
  const [predictionChoice, setPredictionChoice] = useState<string | null>(null)
  const [predictionFeedback, setPredictionFeedback] = useState<PredictionFeedback>(null)
  const [verifyResult, setVerifyResult] = useState<VerificationResult | null>(null)
  const [breakItOpen, setBreakItOpen] = useState(false)
  const [arrayInput, setArrayInput] = useState(CHALLENGES[0].defaultArray.join(', '))
  const [targetInput, setTargetInput] = useState(String(CHALLENGES[0].defaultTarget))
  const [customArray, setCustomArray] = useState<number[] | null>(null)
  const [customTarget, setCustomTarget] = useState<number | null>(null)
  const [breakError, setBreakError] = useState('')

  const challenge = useMemo(() => getChallenge(challengeId), [challengeId])
  const baseArray = customArray ?? challenge.defaultArray
  const baseTarget = customTarget ?? challenge.defaultTarget
  const effectiveArray = useMemo(
    () => fixType === 'sort-input' ? [...baseArray].sort((a, b) => a - b) : [...baseArray],
    [baseArray, fixType],
  )
  const snapshots = useMemo(
    () => runBinarySearch(challengeId, baseArray, baseTarget, fixType),
    [challengeId, baseArray, baseTarget, fixType],
  )
  const snapshot = snapshots[Math.min(position, snapshots.length - 1)]
  const prediction = useMemo(
    () => getPredictionPrompt(challenge, snapshot),
    [challenge, snapshot],
  )
  const expectedIndex = getExpectedIndex(effectiveArray, baseTarget)
  const progress = snapshots.length > 1 ? Math.round((position / (snapshots.length - 1)) * 100) : 100
  const isTerminal = snapshot.status !== 'running'
  const isSortedInput = isSorted(baseArray)

  useEffect(() => {
    setPosition(0)
    setIsRunning(false)
    setVerifyResult(null)
    setPredictionChoice(null)
    setPredictionFeedback(null)
    setFlaggedLine(null)
    setHintIndex(0)
  }, [challengeId, customArray, customTarget, fixType])

  useEffect(() => {
    setArrayInput(challenge.defaultArray.join(', '))
    setTargetInput(String(challenge.defaultTarget))
    setCustomArray(null)
    setCustomTarget(null)
    setFixType('none')
    setSelectedFix(challenge.correctFix)
    setBreakError('')
  }, [challenge])

  useEffect(() => {
    if (!isRunning) return undefined
    if (position >= snapshots.length - 1) {
      setIsRunning(false)
      return undefined
    }
    const timer = window.setTimeout(() => {
      setPosition((current) => Math.min(current + 1, snapshots.length - 1))
    }, Math.max(170, 900 / speed))
    return () => window.clearTimeout(timer)
  }, [isRunning, position, snapshots.length, speed])

  const handleChallengeSelect = (id: ChallengeId) => {
    setChallengeId(id)
    setActiveStage('observe')
    setBreakItOpen(false)
  }

  const handleNext = () => {
    if (activeStage === 'predict' && predictionFeedback !== 'correct') return
    setPosition((current) => Math.min(current + 1, snapshots.length - 1))
    if (activeStage === 'predict' && predictionFeedback === 'correct') setActiveStage('observe')
  }

  const handlePrevious = () => {
    setIsRunning(false)
    setPosition((current) => Math.max(current - 1, 0))
  }

  const handleReset = () => {
    setIsRunning(false)
    setPosition(0)
    setFixType('none')
    setActiveStage('observe')
    setVerifyResult(null)
    setPredictionChoice(null)
    setPredictionFeedback(null)
    setFlaggedLine(null)
    setHintIndex(0)
  }

  const handleStartPredict = () => {
    setIsRunning(false)
    setActiveStage('predict')
    setPredictionChoice(null)
    setPredictionFeedback(null)
  }

  const handlePredictionSubmit = () => {
    if (!predictionChoice) return
    const isCorrect = predictionChoice === prediction.correct
    setPredictionFeedback(isCorrect ? 'correct' : 'incorrect')
  }

  const handleFlagLine = (line: number) => {
    setFlaggedLine((current) => current === line ? null : line)
  }

  const handleApplyFix = () => {
    if (selectedFix === 'none') return
    setFixType(selectedFix)
    setActiveStage('verify')
    setVerifyResult(null)
    setIsRunning(false)
  }

  const handleVerify = () => {
    setVerifyResult(verifyRun(snapshots, expectedIndex))
  }

  const handleApplyBreakIt = () => {
    const values = arrayInput.split(/[,\s]+/).filter(Boolean).map(Number)
    const target = Number(targetInput)
    if (values.length < 2 || values.some((value) => !Number.isFinite(value)) || !Number.isFinite(target)) {
      setBreakError('Use at least two comma-separated numbers and one numeric target.')
      return
    }
    setBreakError('')
    setCustomArray(values)
    setCustomTarget(target)
    setFixType('none')
    setActiveStage('observe')
    setBreakItOpen(false)
  }

  const handlePreset = (preset: 'sorted' | 'missing' | 'unsorted') => {
    if (preset === 'sorted') {
      setArrayInput('3, 8, 14, 21, 29, 34, 42, 57')
      setTargetInput('34')
    } else if (preset === 'missing') {
      setArrayInput('3, 8, 14, 21, 29, 34, 42, 57')
      setTargetInput('31')
    } else {
      setArrayInput('3, 34, 8, 57, 14, 42, 21, 29')
      setTargetInput('14')
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><Bug size={17} strokeWidth={2.6} /></div>
          <div>
            <div className="brand-name">BUG<span>LAB</span></div>
            <div className="brand-tagline">debug the algorithm</div>
          </div>
        </div>
        <div className="breadcrumb"><span>CHALLENGES</span><ChevronDown size={13} /><span className="breadcrumb-current">BINARY SEARCH</span></div>
        <div className="topbar-actions">
          <div className="session-pill"><span className="live-dot" /> SESSION 04 <span className="muted">/</span> LOCAL</div>
          <button className={`top-action ${breakItOpen ? 'active' : ''}`} onClick={() => setBreakItOpen((open) => !open)}><Settings2 size={15} /> Break it</button>
          <button className="avatar-button" aria-label="Student profile">S</button>
        </div>
      </header>

      {breakItOpen && (
        <BreakItPanel
          arrayInput={arrayInput}
          targetInput={targetInput}
          error={breakError}
          onArrayChange={setArrayInput}
          onTargetChange={setTargetInput}
          onPreset={handlePreset}
          onApply={handleApplyBreakIt}
          onClose={() => setBreakItOpen(false)}
        />
      )}

      <div className="workspace">
        <aside className="sidebar">
          <div className="sidebar-heading">
            <div><span className="eyebrow">CURRICULUM</span><h2>Debug missions</h2></div>
            <div className="completion-ring"><span>01</span><small>/03</small></div>
          </div>
          <div className="challenge-list">
            {CHALLENGES.map((item, index) => (
              <ChallengeCard
                key={item.id}
                challenge={item}
                index={index}
                active={item.id === challengeId}
                completed={item.id === 'infinite-loop' && fixType === 'boundary' && verifyResult?.passed === true}
                onSelect={() => handleChallengeSelect(item.id)}
              />
            ))}
          </div>
          <div className="sidebar-footer">
            <div className="lab-status"><Activity size={15} /><div><strong>Lab status</strong><span>Trace engine online</span></div><span className="status-dot" /></div>
            <div className="sidebar-note"><BookOpen size={14} /><span>Every bug is a doorway into the invariant.</span></div>
          </div>
        </aside>

        <main className="main-column">
          <div className="workspace-heading">
            <div className="heading-copy">
              <div className="kicker-row"><span className="challenge-number">0{CHALLENGES.findIndex((item) => item.id === challengeId) + 1}</span><span className="eyebrow">{challenge.eyebrow}</span><span className="difficulty-tag">{challenge.difficulty}</span></div>
              <h1>{challenge.title}</h1>
              <p>{challenge.description}</p>
            </div>
            <div className="heading-signal"><span className="signal-icon"><GitBranch size={17} /></span><div><span className="eyebrow">CURRENT SYMPTOM</span><strong>{challenge.symptom}</strong></div></div>
          </div>

          <div className="main-grid">
            <CodePanel challenge={challenge} snapshot={snapshot} flaggedLine={flaggedLine} onFlagLine={handleFlagLine} fixed={fixType !== 'none'} />
            <VisualizationPanel snapshot={snapshot} target={baseTarget} expectedIndex={expectedIndex} progress={progress} inputIsSorted={isSortedInput} fixed={fixType !== 'none'} />
          </div>

          <LearningDock
            activeStage={activeStage}
            onStageChange={setActiveStage}
            snapshot={snapshot}
            challenge={challenge}
            position={position}
            totalSteps={snapshots.length}
            prediction={prediction}
            predictionChoice={predictionChoice}
            predictionFeedback={predictionFeedback}
            flaggedLine={flaggedLine}
            hintIndex={hintIndex}
            selectedFix={selectedFix}
            fixType={fixType}
            verifyResult={verifyResult}
            expectedIndex={expectedIndex}
            onPredictionChoice={setPredictionChoice}
            onSubmitPrediction={handlePredictionSubmit}
            onNextHint={() => setHintIndex((index) => Math.min(index + 1, hintSets[challenge.id].length))}
            onSelectFix={setSelectedFix}
            onApplyFix={handleApplyFix}
            onVerify={handleVerify}
          />

          <footer className="execution-bar">
            <div className="execution-left">
              <button className="icon-button" onClick={handlePrevious} disabled={position === 0} aria-label="Previous step"><ArrowLeft size={16} /></button>
              <button className="icon-button" onClick={handleNext} disabled={position >= snapshots.length - 1 || (activeStage === 'predict' && predictionFeedback !== 'correct')} aria-label="Next step"><ArrowRight size={16} /></button>
              <button className={`run-button ${isRunning ? 'is-running' : ''}`} onClick={() => {
                if (position >= snapshots.length - 1) setPosition(0)
                setIsRunning((running) => !running)
              }}>{isRunning ? <CirclePause size={15} /> : <Play size={15} fill="currentColor" />} {isRunning ? 'Pause' : 'Run'}</button>
              <button className="reset-button" onClick={handleReset}><RotateCcw size={14} /> Reset</button>
            </div>
            <div className="execution-progress"><div className="progress-label"><span>EXECUTION PROGRESS</span><strong>{String(position + 1).padStart(2, '0')} <span>/ {String(snapshots.length).padStart(2, '0')}</span></strong></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div>
            <div className="speed-control"><Gauge size={14} /><span>SPEED</span><input aria-label="Execution speed" type="range" min="0.5" max="2" step="0.5" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} /><strong>{speed}×</strong></div>
          </footer>
        </main>
      </div>
    </div>
  )
}

function ChallengeCard({ challenge, index, active, completed, onSelect }: { challenge: Challenge; index: number; active: boolean; completed: boolean; onSelect: () => void }) {
  return (
    <button className={`challenge-card ${active ? 'selected' : ''}`} onClick={onSelect}>
      <div className="challenge-card-top"><span className="challenge-index">0{index + 1}</span><span className={`difficulty-dot ${challenge.difficulty.toLowerCase()}`} /></div>
      <div className="challenge-card-title">{challenge.title}</div>
      <div className="challenge-card-bottom"><span>{challenge.difficulty}</span>{completed ? <span className="completed-badge"><Check size={11} /> fixed</span> : <span className="challenge-arrow">↗</span>}</div>
      {active && <span className="active-card-line" />}
    </button>
  )
}

function CodePanel({ challenge, snapshot, flaggedLine, onFlagLine, fixed }: { challenge: Challenge; snapshot: ExecutionSnapshot; flaggedLine: number | null; onFlagLine: (line: number) => void; fixed: boolean }) {
  const displayedCode = fixed ? challenge.codeLines.map((line, index) => {
    if (challenge.id === 'infinite-loop' && index === 11) return '    low = mid + 1    // patched'
    if (challenge.id === 'missing-element' && index === 3) return 'while (low <= high)   // patched'
    if (challenge.id === 'assumptions' && index === 0) return 'const arr = [...input].sort((a, b) => a - b) // patched'
    return line
  }) : challenge.codeLines
  return (
    <section className="panel code-panel">
      <div className="panel-header">
        <div className="panel-title"><span className="panel-icon purple"><Terminal size={15} /></span><div><span className="eyebrow">SOURCE TRACE</span><h2>binarySearch.ts</h2></div></div>
        <div className="panel-header-actions"><span className={`bug-state ${fixed ? 'fixed' : ''}`}>{fixed ? <CheckCircle2 size={13} /> : <TriangleAlert size={13} />}{fixed ? 'PATCH APPLIED' : 'BUG ACTIVE'}</span><span className="file-meta">READ ONLY <LockKeyhole size={12} /></span></div>
      </div>
      <div className="code-scroll">
        {displayedCode.map((line, index) => {
          const lineNumber = index + 1
          const active = lineNumber === snapshot.line
          const flagged = lineNumber === flaggedLine
          return (
            <button className={`code-line ${active ? 'active' : ''} ${flagged ? 'flagged' : ''}`} key={`${lineNumber}-${line}`} onClick={() => onFlagLine(lineNumber)}>
              <span className="line-number">{String(lineNumber).padStart(2, '0')}</span><span className="line-flag">{flagged ? <Flag size={12} fill="currentColor" /> : active ? <span className="current-marker" /> : null}</span><code>{highlightCode(line)}</code>{active && <span className="line-state">{snapshot.changedVariable ?? snapshot.phase}</span>}
            </button>
          )
        })}
      </div>
      <div className="code-footer"><span><MousePointer2 size={13} /> click a line to flag it as suspicious</span><span className="line-focus"><span className="focus-bar" /> runtime line {snapshot.line}</span></div>
    </section>
  )
}

function VisualizationPanel({ snapshot, target, expectedIndex, progress, inputIsSorted, fixed }: { snapshot: ExecutionSnapshot; target: number; expectedIndex: number; progress: number; inputIsSorted: boolean; fixed: boolean }) {
  const statusLabel = snapshot.status === 'loop-detected' ? 'LOOP DETECTED' : snapshot.status === 'found' ? 'FOUND' : snapshot.status === 'not-found' ? 'NOT FOUND' : 'RUNNING'
  return (
    <section className="panel visualization-panel">
      <div className="panel-header"><div className="panel-title"><span className="panel-icon cyan"><Activity size={15} /></span><div><span className="eyebrow">LIVE VISUALIZATION</span><h2>Runtime state</h2></div></div><span className={`runtime-status ${snapshot.status}`}><span /> {statusLabel}</span></div>
      <div className="visualization-body">
        <div className="trace-callout"><div className="trace-callout-icon"><Zap size={16} /></div><div><span className="eyebrow">CURRENT TRACE</span><strong>{snapshot.narrative}</strong></div></div>
        <div className="array-label-row"><span className="eyebrow">ARRAY / INDEX</span><span className={`sorted-indicator ${inputIsSorted ? 'valid' : 'invalid'}`}>{inputIsSorted ? <Check size={12} /> : <TriangleAlert size={12} />} {inputIsSorted ? 'sorted input' : 'unsorted input'}</span></div>
        <div className="array-visual">
          <div className="array-index-row" style={{ gridTemplateColumns: `22px repeat(${snapshot.array.length}, minmax(36px, 1fr))` }}><span className="array-spacer" />{snapshot.array.map((_, index) => <span className="array-index" key={`index-${index}`}>{index}</span>)}</div>
          <div className="array-cell-row" style={{ gridTemplateColumns: `22px repeat(${snapshot.array.length}, minmax(36px, 1fr))` }}><span className="array-spacer" />{snapshot.array.map((value, index) => {
            const active = index >= snapshot.low && index <= snapshot.high
            const current = index === snapshot.currentIndex
            const isExpected = index === expectedIndex
            return <div className={`array-cell ${active ? 'in-range' : 'out-range'} ${current ? 'current' : ''} ${isExpected && snapshot.status === 'found' ? 'answer' : ''}`} key={`${value}-${index}`}><span>{value}</span><div className="cell-tags">{current && <b className="tag-mid">mid</b>}{index === snapshot.low && <b className="tag-low">low</b>}{index === snapshot.high && <b className="tag-high">high</b>}</div></div>
          })}</div>
          <div className="pointer-legend"><span><i className="legend-dot low" /> low</span><span><i className="legend-dot mid" /> mid</span><span><i className="legend-dot high" /> high</span><span className="range-copy">range {snapshot.low <= snapshot.high ? `${snapshot.low}…${snapshot.high}` : 'empty'}</span></div>
        </div>
        <div className="variable-grid"><VariableCard label="low" value={snapshot.low} accent="violet" change={snapshot.changedVariable?.includes('low')} /><VariableCard label="mid" value={snapshot.mid < 0 ? '—' : snapshot.mid} accent="cyan" change={snapshot.changedVariable?.includes('mid')} /><VariableCard label="high" value={snapshot.high} accent="blue" change={snapshot.changedVariable?.includes('high')} /><VariableCard label="target" value={target} accent="amber" /></div>
        <div className="comparison-row"><div className="comparison-icon"><Target size={15} /></div><div><span className="eyebrow">COMPARISON</span><strong>{snapshot.comparison}</strong></div><div className="comparison-step">step {String(snapshot.step + 1).padStart(2, '0')}</div></div>
        {snapshot.status === 'loop-detected' && <div className="guard-warning"><AlertTriangle size={15} /><span><strong>Infinite-loop guard engaged.</strong> The same interval appeared twice, so the browser stayed safe.</span></div>}
        {fixed && <div className="fixed-note"><CheckCircle2 size={14} /><span>Patch active · replaying with a progress guarantee</span></div>}
      </div>
      <div className="visualization-footer"><span><span className="pulse-dot" /> snapshots synchronized</span><span>output <strong>{snapshot.output === null ? '—' : snapshot.output}</strong></span><span>expected <strong>{expectedIndex < 0 ? 'not present' : expectedIndex}</strong></span></div>
    </section>
  )
}

function VariableCard({ label, value, accent, change }: { label: string; value: number | string; accent: string; change?: boolean }) {
  return <div className={`variable-card accent-${accent} ${change ? 'changed' : ''}`}><span>{label}</span><strong>{value}</strong>{change && <span className="changed-label">changed</span>}</div>
}

function LearningDock({ activeStage, onStageChange, snapshot, challenge, position, totalSteps, prediction, predictionChoice, predictionFeedback, flaggedLine, hintIndex, selectedFix, fixType, verifyResult, expectedIndex, onPredictionChoice, onSubmitPrediction, onNextHint, onSelectFix, onApplyFix, onVerify }: {
  activeStage: Stage
  onStageChange: (stage: Stage) => void
  snapshot: ExecutionSnapshot
  challenge: Challenge
  position: number
  totalSteps: number
  prediction: ReturnType<typeof getPredictionPrompt>
  predictionChoice: string | null
  predictionFeedback: PredictionFeedback
  flaggedLine: number | null
  hintIndex: number
  selectedFix: FixType
  fixType: FixType
  verifyResult: VerificationResult | null
  expectedIndex: number
  onPredictionChoice: (choice: string) => void
  onSubmitPrediction: () => void
  onNextHint: () => void
  onSelectFix: (fix: FixType) => void
  onApplyFix: () => void
  onVerify: () => void
}) {
  const note = stageNotes[activeStage]
  return (
    <section className="learning-dock">
      <div className="stage-nav"><div className="stage-nav-label"><Sparkles size={14} /> LEARNING LOOP</div>{stages.map((stage, index) => { const Icon = stage.icon; return <button className={`stage-button ${activeStage === stage.id ? 'active' : ''} ${index < stages.findIndex((item) => item.id === activeStage) ? 'visited' : ''}`} key={stage.id} onClick={() => onStageChange(stage.id)}><span className="stage-number">0{index + 1}</span><Icon size={14} /><span>{stage.label}</span></button> })}</div>
      <div className="dock-content"><div className="dock-intro"><span className="eyebrow">{note.kicker}</span><h3>{note.title}</h3><p>{note.body}</p><div className="dock-context"><span className="mini-status"><span className={`mini-status-dot ${snapshot.status}`} /> trace {position + 1}/{totalSteps}</span>{flaggedLine ? <span className="mini-status flagged-context"><Flag size={11} /> line {flaggedLine} flagged</span> : null}</div></div><div className="dock-action">{activeStage === 'observe' && <ObserveAction snapshot={snapshot} onPredict={() => onStageChange('predict')} onInvestigate={() => onStageChange('investigate')} />}{activeStage === 'predict' && <PredictAction prediction={prediction} choice={predictionChoice} feedback={predictionFeedback} onChoice={onPredictionChoice} onSubmit={onSubmitPrediction} />}{activeStage === 'investigate' && <InvestigateAction challenge={challenge} flaggedLine={flaggedLine} hintIndex={hintIndex} onNextHint={onNextHint} onFix={() => onStageChange('fix')} />}{activeStage === 'fix' && <FixAction challenge={challenge} selectedFix={selectedFix} applied={fixType !== 'none'} onSelect={onSelectFix} onApply={onApplyFix} />}{activeStage === 'verify' && <VerifyAction result={verifyResult} expectedIndex={expectedIndex} onVerify={onVerify} onInvestigate={() => onStageChange('investigate')} />}</div></div>
    </section>
  )
}

function ObserveAction({ snapshot, onPredict, onInvestigate }: { snapshot: ExecutionSnapshot; onPredict: () => void; onInvestigate: () => void }) {
  return <div className="action-stack"><div className="action-signal"><TrendingUp size={15} /><span>Current line <strong>{snapshot.line}</strong> · {snapshot.changedVariable ? `${snapshot.changedVariable} just changed` : 'state is ready'}</span></div><div className="action-buttons"><button className="secondary-button" onClick={onInvestigate}><Search size={14} /> Find the bug</button><button className="primary-button" onClick={onPredict}><Lightbulb size={14} /> Predict next <ArrowRight size={14} /></button></div></div>
}

function PredictAction({ prediction, choice, feedback, onChoice, onSubmit }: { prediction: ReturnType<typeof getPredictionPrompt>; choice: string | null; feedback: PredictionFeedback; onChoice: (choice: string) => void; onSubmit: () => void }) {
  return <div className="prediction-action"><div className="prediction-question"><CircleHelp size={16} /><strong>{prediction.question}</strong></div><div className="option-row">{prediction.options.map((option) => <button className={`answer-option ${choice === option ? 'selected' : ''} ${feedback && option === prediction.correct ? 'correct' : ''} ${feedback === 'incorrect' && choice === option ? 'wrong' : ''}`} key={option} onClick={() => onChoice(option)}><span className="radio-dot" />{option}</button>)}<button className="submit-answer" onClick={onSubmit} disabled={!choice}>{feedback === 'correct' ? <Check size={14} /> : <ArrowRight size={14} />} {feedback === 'correct' ? 'Correct' : 'Check answer'}</button></div>{feedback && <div className={`prediction-feedback ${feedback}`}><span>{feedback === 'correct' ? <CheckCircle2 size={15} /> : <TriangleAlert size={15} />}<strong>{feedback === 'correct' ? 'Nice prediction.' : 'Not quite yet.'}</strong></span><p>{prediction.explanation}</p></div>}</div>
}

function InvestigateAction({ challenge, flaggedLine, hintIndex, onNextHint, onFix }: { challenge: Challenge; flaggedLine: number | null; hintIndex: number; onNextHint: () => void; onFix: () => void }) {
  const hints = hintSets[challenge.id]
  return <div className="investigate-action"><div className="investigate-top"><div className="flag-summary"><Flag size={15} /><span>{flaggedLine ? <>You flagged <strong>line {flaggedLine}</strong>. {flaggedLine === challenge.focusLine ? 'That is the line to interrogate.' : 'Keep looking at how the interval changes.'}</> : <>Click any code line to flag it as suspicious.</>}</span></div><span className="hint-count"><Lightbulb size={13} /> {hintIndex}/{hints.length} hints</span></div>{hintIndex > 0 && <div className="hint-card"><span className="hint-number">H{hintIndex}</span><p>{hints[hintIndex - 1]}</p></div>}<div className="action-buttons"><button className="secondary-button" onClick={onNextHint} disabled={hintIndex >= hints.length}><Lightbulb size={14} /> {hintIndex >= hints.length ? 'All hints shown' : `Reveal hint ${hintIndex + 1}`}</button><button className="primary-button" onClick={onFix}><Wrench size={14} /> Fix the bug <ArrowRight size={14} /></button></div></div>
}

function FixAction({ challenge, selectedFix, applied, onSelect, onApply }: { challenge: Challenge; selectedFix: FixType; applied: boolean; onSelect: (fix: FixType) => void; onApply: () => void }) {
  const options = challenge.id === 'assumptions' ? [{ id: 'sort-input' as FixType, title: 'Sort the input first', detail: 'Restore the invariant before searching.' }] : challenge.id === 'missing-element' ? [{ id: 'boundary' as FixType, title: 'Include the final candidate', detail: 'Change while (low < high) to while (low <= high).' }] : [{ id: 'boundary' as FixType, title: 'Advance beyond mid', detail: 'Change low = mid to low = mid + 1.' }]
  return <div className="fix-action"><div className="fix-code-card"><div className="fix-code-label"><Wrench size={14} /> PROPOSED PATCH</div>{options.map((option) => <button className={`fix-option ${selectedFix === option.id ? 'selected' : ''}`} key={option.id} onClick={() => onSelect(option.id)}><span className="fix-radio">{selectedFix === option.id && <Check size={12} />}</span><span><strong>{option.title}</strong><small>{option.detail}</small></span><ArrowDownRight size={15} /></button>)}</div><button className="primary-button wide" onClick={onApply} disabled={applied}><Zap size={14} /> {applied ? 'Patch applied · replay ready' : 'Apply patch and replay'}</button></div>
}

function VerifyAction({ result, expectedIndex, onVerify, onInvestigate }: { result: VerificationResult | null; expectedIndex: number; onVerify: () => void; onInvestigate: () => void }) {
  return <div className="verify-action">{result ? <div className={`verification-card ${result.passed ? 'passed' : 'failed'}`}><div className="verification-icon">{result.passed ? <CheckCircle2 size={20} /> : <TriangleAlert size={20} />}</div><div><strong>{result.passed ? 'Verified. The invariant holds.' : 'Not verified yet.'}</strong><p>{result.message}</p></div><div className="verification-values"><span>actual <b>{result.actual ?? '—'}</b></span><span>expected <b>{expectedIndex < 0 ? '—' : expectedIndex}</b></span></div></div> : <div className="verify-prompt"><div><span className="eyebrow">PATCHED TRACE READY</span><strong>Run the corrected algorithm against the expected output.</strong><p>Replay is deterministic, so every step remains inspectable.</p></div><button className="primary-button" onClick={onVerify}><Play size={14} fill="currentColor" /> Verify run</button></div>}{result?.passed !== true && <button className="text-button" onClick={onInvestigate}><Search size={13} /> go back to investigation</button>}</div>
}

function BreakItPanel({ arrayInput, targetInput, error, onArrayChange, onTargetChange, onPreset, onApply, onClose }: { arrayInput: string; targetInput: string; error: string; onArrayChange: (value: string) => void; onTargetChange: (value: string) => void; onPreset: (preset: 'sorted' | 'missing' | 'unsorted') => void; onApply: () => void; onClose: () => void }) {
  return <div className="break-it-panel"><div className="break-it-heading"><div className="break-it-icon"><Settings2 size={17} /></div><div><span className="eyebrow">BREAK IT MODE</span><h2>Change the input. Keep the trace honest.</h2><p>Binary search needs sorted data. Try a counterexample, then make the invariant visible again.</p></div></div><div className="break-it-fields"><label><span>ARRAY VALUES</span><input value={arrayInput} onChange={(event) => onArrayChange(event.target.value)} placeholder="3, 8, 14, 21" /></label><label className="target-field"><span>TARGET</span><input value={targetInput} onChange={(event) => onTargetChange(event.target.value)} placeholder="14" /></label><button className="apply-input" onClick={onApply}><Zap size={14} /> Apply input</button></div><div className="preset-row"><span>QUICK SCENARIOS</span><button onClick={() => onPreset('sorted')}>sorted / found</button><button onClick={() => onPreset('missing')}>sorted / missing</button><button onClick={() => onPreset('unsorted')}>unsorted / risky</button><button className="close-break" onClick={onClose}><X size={15} /></button></div>{error && <div className="break-error"><TriangleAlert size={14} /> {error}</div>}</div>
}

export default App
