import { Fragment } from 'react'

type Props = {
  lines: string[]
  /** 1-based line currently executing, or null. */
  activeLine: number | null
}

const TOKEN = /(\/\/.*$|\b(?:function|let|const|while|if|else|return)\b|\bMath\.floor\b|\b\d+\b)/g

function highlight(text: string) {
  return text.split(TOKEN).map((part, i) => {
    if (!part) return null
    let cls = ''
    if (part.startsWith('//')) cls = 'text-slate-500 italic'
    else if (/^(function|let|const|while|if|else|return)$/.test(part)) cls = 'text-violet-300'
    else if (part === 'Math.floor') cls = 'text-sky-300'
    else if (/^\d+$/.test(part)) cls = 'text-amber-300'
    return cls ? (
      <span key={i} className={cls}>
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  })
}

export function CodePanel({ lines, activeLine }: Props) {
  return (
    <section aria-label="Source code" className="rounded-xl border border-slate-800 bg-[#0d1426]">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Source code</h2>
        <span className="font-mono text-xs text-slate-500">binarySearch.js</span>
      </header>
      <pre className="overflow-x-auto py-3 font-mono text-[13px] leading-6">
        {lines.map((text, i) => {
          const n = i + 1
          const active = n === activeLine
          return (
            <div
              key={n}
              aria-current={active ? 'step' : undefined}
              className={`flex border-l-2 pr-4 transition-colors duration-150 ${
                active ? 'border-amber-400 bg-amber-400/10' : 'border-transparent'
              }`}
            >
              <span
                className={`w-10 shrink-0 select-none pr-3 text-right ${
                  active ? 'text-amber-300' : 'text-slate-600'
                }`}
              >
                {n}
              </span>
              <code className="whitespace-pre text-slate-200">{text ? highlight(text) : ' '}</code>
            </div>
          )
        })}
      </pre>
    </section>
  )
}
