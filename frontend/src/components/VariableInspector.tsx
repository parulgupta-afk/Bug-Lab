import type { ExecutionState } from '../engine/types'

type Props = {
  state: ExecutionState
  /** The state one step earlier, used to highlight what just changed. */
  previous: ExecutionState | null
}

function Cell({ name, value, changed, note }: { name: string; value: number | null; changed: boolean; note?: string }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 transition-colors duration-200 ${
        changed ? 'border-amber-400/70 bg-amber-400/10' : 'border-slate-700 bg-slate-800/50'
      }`}
    >
      <div className="font-mono text-xs text-slate-400">{name}</div>
      <div className={`font-mono text-2xl font-semibold ${value === null ? 'text-slate-600' : 'text-slate-100'}`}>
        {value === null ? '–' : value}
      </div>
      <div className="h-4 truncate text-[11px] text-slate-500">{note ?? ''}</div>
    </div>
  )
}

export function VariableInspector({ state, previous }: Props) {
  const changed = (key: 'low' | 'mid' | 'high') => previous !== null && previous[key] !== state[key]
  const midValue = state.mid !== null ? state.array[state.mid] : undefined

  return (
    <section aria-label="Variables" className="rounded-xl border border-slate-800 bg-[#0d1426] p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Variables</h2>
      <div className="grid grid-cols-3 gap-3">
        <Cell name="low" value={state.low} changed={changed('low')} />
        <Cell
          name="mid"
          value={state.mid}
          changed={changed('mid')}
          note={midValue !== undefined ? `arr[mid] = ${midValue}` : undefined}
        />
        <Cell name="high" value={state.high} changed={changed('high')} />
      </div>
      <p className="mt-2 text-[11px] text-slate-500">A highlighted box means that value just changed.</p>
    </section>
  )
}
