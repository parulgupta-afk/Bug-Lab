import { Flag } from 'lucide-react'
import { Fragment } from 'react'

type Props = {
  lines: string[]
  /** 1-based line currently executing, or null. */
  activeLine: number | null
  /** Line the student suspects, or null. */
  suspectLine?: number | null
  /** Line revealed as the bug (only after the student has found it). */
  bugLine?: number | null
  /** When provided, non-blank lines can be clicked to mark them as the suspect. */
  onSelectLine?: (line: number) => void
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

export function CodePanel({ lines, activeLine, suspectLine = null, bugLine = null, onSelectLine }: Props) {
  return (
    <section aria-label="Source code" className="panel-card overflow-hidden">
      <header className="panel-header">
        <h2 className="eyebrow">Source code</h2>
        <span className="font-mono text-xs text-slate-500">
          {onSelectLine ? 'Click a line to mark it as suspect' : 'binarySearch.js'}
        </span>
      </header>
      <pre className="overflow-x-auto py-3 font-mono text-[13px] leading-6">
        {lines.map((text, i) => {
          const n = i + 1
          const active = n === activeLine
          const suspect = n === suspectLine
          const isBug = n === bugLine
          const clickable = Boolean(onSelectLine) && text.trim().length > 0

          let tone = 'border-transparent'
          if (isBug) tone = 'code-line-bug'
          else if (active) tone = 'code-line-active'
          else if (suspect) tone = 'code-line-suspect'

          return (
            <div
              key={n}
              aria-current={active ? 'step' : undefined}
              aria-label={clickable ? `Line ${n}${suspect ? ', marked as suspect' : ''}` : undefined}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={clickable ? () => onSelectLine?.(n) : undefined}
              onKeyDown={
                clickable
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelectLine?.(n)
                      }
                    }
                  : undefined
              }
              className={`flex items-center border-l-2 pr-4 transition-colors duration-150 ${tone} ${
                clickable ? 'cursor-pointer hover:bg-slate-800/60 focus:outline-none focus-visible:bg-slate-800/60' : ''
              }`}
            >
              <span className="flex w-5 shrink-0 justify-center text-rose-300">
                {suspect && <Flag size={12} aria-hidden="true" />}
              </span>
              <span
                className={`w-7 shrink-0 select-none pr-3 text-right ${
                  active ? 'text-amber-300' : isBug ? 'text-emerald-300' : 'text-slate-600'
                }`}
              >
                {n}
              </span>
              <code className="whitespace-pre text-slate-200">{text ? highlight(text) : ' '}</code>
              {isBug && (
                <span className="ml-3 rounded bg-emerald-400/20 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                  bug
                </span>
              )}
            </div>
          )
        })}
      </pre>
    </section>
  )
}
