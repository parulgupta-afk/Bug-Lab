/** Which flavour of binary search is being simulated. */
export type SearchVariant = {
  /** Condition used by the `while` loop. */
  loop: '<' | '<='
  /** What the `else` branch assigns to `high`. */
  highUpdate: 'mid' | 'mid-1'
}

export type Status = 'running' | 'found' | 'not-found' | 'bug-detected'

/** One immutable snapshot of the program after executing a single source line. */
export type ExecutionState = {
  readonly step: number
  /** 1-based line number of the line that just executed. */
  readonly line: number
  readonly low: number | null
  readonly mid: number | null
  readonly high: number | null
  readonly array: readonly number[]
  readonly target: number
  /** Plain-language description of what this line did. */
  readonly message: string
  /** Short comparison text, e.g. "arr[4] = 24 < 5 ?  false". */
  readonly comparison: string | null
  readonly status: Status
}

export type FailureKind = 'infinite-loop' | 'wrong-result' | 'step-limit'

export type Failure = {
  kind: FailureKind
  /** Index into `states` where the failure becomes observable. */
  atStep: number
  /** For infinite loops: the earlier step whose state was repeated. */
  repeatedFromStep?: number
  /** Source line of the last statement that changed the window (if known). */
  blameLine?: number
  explanation: string
}

export type Trace = {
  states: ExecutionState[]
  /** Value returned by the function, or null if it never returned. */
  result: number | null
  failure: Failure | null
}
