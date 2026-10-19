import type { ExecutionState } from '../engine/types'

type Props = { state: ExecutionState }

function pointersAt(state: ExecutionState, index: number): string {
  const tags: string[] = []
  if (state.low === index) tags.push('L')
  if (state.mid === index) tags.push('M')
  if (state.high === index) tags.push('H')
  return tags.join(' ')
}

export function ArrayView({ state }: Props) {
  const { array, low, high, mid, target, status } = state
  const n = array.length
  const hasWindow = low !== null && high !== null
  const windowEmpty = hasWindow && low > high

  const lowOff = low !== null && (low < 0 || low >= n)
  const highOff = high !== null && (high < 0 || high >= n)

  return (
    <section aria-label="Array" className="rounded-xl border border-slate-800 bg-[#0d1426] p-4">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Array</h2>
        <span className="rounded-md border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 font-mono text-xs text-sky-300">
          target = {target}
        </span>
      </header>

      {n === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">The array is empty.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {array.map((value, i) => {
            const inWindow = hasWindow && !windowEmpty && i >= (low as number) && i <= (high as number)
            const isMid = mid === i
            const matched = isMid && value === target && status === 'found'
            const eliminated = hasWindow && !inWindow

            let box = 'border-slate-700 bg-slate-800/60 text-slate-200'
            if (eliminated) box = 'border-slate-800 bg-slate-900/40 text-slate-600'
            else if (inWindow) box = 'border-sky-500/60 bg-sky-500/10 text-sky-100'
            if (isMid && !matched) box = 'border-amber-400 bg-amber-400/20 text-amber-100 shadow-[0_0_0_3px_rgba(251,191,36,0.15)]'
            if (matched) box = 'border-emerald-400 bg-emerald-400/20 text-emerald-100 shadow-[0_0_0_3px_rgba(52,211,153,0.2)]'

            const tags = pointersAt(state, i)
            return (
              <div key={i} className="flex w-14 flex-col items-center gap-1">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-lg border-2 font-mono text-lg font-semibold transition-all duration-200 ${box} ${
                    eliminated ? 'line-through decoration-slate-600' : ''
                  }`}
                  title={eliminated ? 'Outside the search window' : undefined}
                >
                  {value}
                </div>
                <span className="font-mono text-[11px] text-slate-500">{i}</span>
                <span className="h-4 font-mono text-xs font-bold tracking-wider text-amber-300">{tags}</span>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
        <Legend color="bg-sky-500/60" label="inside window" />
        <Legend color="bg-amber-400" label="mid (being checked)" />
        <Legend color="bg-slate-700" label="eliminated" />
        <span className="font-mono text-slate-500">L = low · M = mid · H = high</span>
      </div>

      {(lowOff || highOff || windowEmpty) && (
        <p className="mt-3 rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
          {windowEmpty
            ? `low (${low}) is now past high (${high}), so the window is empty. `
            : ''}
          {lowOff ? `low = ${low} points outside the array. ` : ''}
          {highOff ? `high = ${high} points outside the array.` : ''}
        </p>
      )}
    </section>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  )
}
