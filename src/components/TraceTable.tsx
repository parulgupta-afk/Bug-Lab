import { useEffect, useRef } from 'react'
import type { ExecutionState } from '../engine/types'

type Props = {
  states: ExecutionState[]
  stepIndex: number
  onSelect: (index: number) => void
}

const cell = (v: number | null) => (v === null ? '–' : v)

/** Everything executed so far. Future steps are hidden so the failure is not spoiled. */
export function TraceTable({ states, stepIndex, onSelect }: Props) {
  const activeRow = useRef<HTMLTableRowElement | null>(null)

  useEffect(() => {
    activeRow.current?.scrollIntoView({ block: 'nearest' })
  }, [stepIndex])

  const visible = states.slice(0, stepIndex + 1)

  return (
    <section aria-label="Execution trace" className="rounded-xl border border-slate-800 bg-[#0d1426]">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Trace so far</h2>
        <span className="text-[11px] text-slate-500">Click a row to jump back</span>
      </header>
      <div className="max-h-56 overflow-y-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="sticky top-0 bg-[#0d1426] text-slate-500">
            <tr>
              <th className="px-4 py-1.5 font-medium">step</th>
              <th className="px-2 py-1.5 font-medium">line</th>
              <th className="px-2 py-1.5 font-medium">low</th>
              <th className="px-2 py-1.5 font-medium">mid</th>
              <th className="px-2 py-1.5 font-medium">high</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => {
              const active = s.step === stepIndex
              return (
                <tr
                  key={s.step}
                  ref={active ? activeRow : null}
                  onClick={() => onSelect(s.step)}
                  className={`cursor-pointer border-t border-slate-800/70 transition-colors hover:bg-slate-800/60 ${
                    active ? 'bg-amber-400/10 text-amber-100' : 'text-slate-300'
                  }`}
                >
                  <td className="px-4 py-1">{s.step + 1}</td>
                  <td className="px-2 py-1">{s.line}</td>
                  <td className="px-2 py-1">{cell(s.low)}</td>
                  <td className="px-2 py-1">{cell(s.mid)}</td>
                  <td className="px-2 py-1">{cell(s.high)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
