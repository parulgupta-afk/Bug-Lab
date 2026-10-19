// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

// jsdom does not implement scrollIntoView (the trace table calls it in real browsers)
Element.prototype.scrollIntoView = () => {}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const tick = (times: number, ms = 800) => {
  for (let i = 0; i < times; i++) {
    act(() => {
      vi.advanceTimersByTime(ms)
    })
  }
}
const nextButton = () => screen.getByRole('button', { name: 'Next step' })
const slider = () => screen.getByLabelText('Scrub through execution steps') as HTMLInputElement
const goToEnd = () => fireEvent.change(slider(), { target: { value: slider().max } })
const clickLine = (n: number) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Line ${n}\\b`) }))

describe('explore mode', () => {
  it('steps forward and back', () => {
    render(<App />)
    expect(screen.getByText(/Step 1 of/)).toBeTruthy()
    fireEvent.click(nextButton())
    expect(screen.getByText(/Step 2 of/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Previous step' }))
    expect(screen.getByText(/Step 1 of/)).toBeTruthy()
  })

  it('shows the failure only when the end of the run is reached', () => {
    render(<App />)
    expect(screen.queryByText(/Possible infinite loop detected/)).toBeNull()
    goToEnd()
    expect(screen.getByText(/Possible infinite loop detected/)).toBeTruthy()
  })
})

describe('predict mode', () => {
  const enterPredict = () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'predict' }))
  }

  it('locks Next behind a question and unlocks it once answered correctly', () => {
    enterPredict()
    fireEvent.click(nextButton()) // step 1 -> 2, where the first question waits
    expect(screen.getByText(/Will the loop body run\?/)).toBeTruthy()
    expect(nextButton().hasAttribute('disabled')).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Yes, the loop body runs' }))
    expect(screen.getByText('Correct')).toBeTruthy()
    expect(screen.getByText(/Predictions: 1\/1 correct/)).toBeTruthy()
    expect(nextButton().hasAttribute('disabled')).toBe(false)

    fireEvent.click(nextButton())
    expect(screen.getByText(/Step 3 of/)).toBeTruthy()
  })

  it('explains a wrong answer and still lets the student continue', () => {
    enterPredict()
    fireEvent.click(nextButton())
    fireEvent.click(screen.getByRole('button', { name: 'No, the loop ends' }))
    expect(screen.getByText('Not quite')).toBeTruthy()
    expect(screen.getByText(/the condition is true/)).toBeTruthy()
    expect(screen.getByText(/Predictions: 0\/1 correct/)).toBeTruthy()
    expect(nextButton().hasAttribute('disabled')).toBe(false)
  })

  it('lets the student skip a question without it counting as a wrong answer', () => {
    enterPredict()
    fireEvent.click(nextButton())
    fireEvent.click(screen.getByRole('button', { name: 'Skip, show me' }))
    expect(screen.getByText('Skipped')).toBeTruthy()
    expect(screen.getByText(/Predictions: 0\/0 correct · 1 skipped/)).toBeTruthy()
  })

  it('does not let the scrubber jump past an unanswered question', () => {
    enterPredict()
    fireEvent.click(nextButton())
    goToEnd()
    expect(screen.getByText(/Step 2 of/)).toBeTruthy()
  })

  it('clears the score and questions on Reset', () => {
    enterPredict()
    fireEvent.click(nextButton())
    fireEvent.click(screen.getByRole('button', { name: 'Yes, the loop body runs' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByText(/Step 1 of/)).toBeTruthy()
    expect(screen.getByText(/Predictions: 0\/0 correct/)).toBeTruthy()
  })

  it('never shows questions in explore mode', () => {
    render(<App />)
    fireEvent.click(nextButton())
    expect(screen.queryByText(/Will the loop body run\?/)).toBeNull()
  })

  it('can be played through to the end by answering every question', () => {
    enterPredict()
    for (let guard = 0; guard < 200; guard++) {
      if (nextButton().hasAttribute('disabled')) {
        const skip = screen.queryByRole('button', { name: 'Skip, show me' })
        if (!skip) break
        fireEvent.click(skip)
      }
      fireEvent.click(nextButton())
    }
    expect(screen.getByText(/Possible infinite loop detected/)).toBeTruthy()
  })
})

describe('flagging the bug', () => {
  it('asks for a suspect line first', () => {
    render(<App />)
    const flag = screen.getByRole('button', { name: /Something's wrong/ })
    expect(flag.hasAttribute('disabled')).toBe(true)
    clickLine(15)
    expect(flag.hasAttribute('disabled')).toBe(false)
  })

  it('does not judge a wrong line before the failure is visible', () => {
    render(<App />)
    clickLine(6)
    fireEvent.click(screen.getByRole('button', { name: /Something's wrong/ }))
    expect(screen.getByText(/Nothing has visibly gone wrong at step 1/)).toBeTruthy()
  })

  it('rejects a wrong line once the failure is visible, then accepts the right one', () => {
    render(<App />)
    goToEnd()
    clickLine(13)
    fireEvent.click(screen.getByRole('button', { name: /Something's wrong/ }))
    expect(screen.getByText(/Not quite\. The failure is visible, but line 13 does its job correctly/)).toBeTruthy()

    clickLine(15)
    fireEvent.click(screen.getByRole('button', { name: /Something's wrong/ }))
    expect(screen.getByText('Bug located', { selector: 'p' })).toBeTruthy()
    expect(screen.getByText(/high = mid keeps it in/i, { exact: false })).toBeTruthy()
  })

  it('marks the challenge as solved in the sidebar and reveals the bug line', () => {
    render(<App />)
    goToEnd()
    clickLine(15)
    fireEvent.click(screen.getByRole('button', { name: /Something's wrong/ }))
    expect(screen.getAllByText('Bug located').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('bug')).toBeTruthy()
    // once solved, lines are no longer clickable
    expect(screen.queryByRole('button', { name: /^Line 15/ })).toBeNull()
  })

  it('works for the second challenge too', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /The Missing Element/ }))
    expect(screen.getByText(/Step 1 of/)).toBeTruthy()
    goToEnd()
    expect(screen.getByText(/Wrong result detected/)).toBeTruthy()
    clickLine(5)
    fireEvent.click(screen.getByRole('button', { name: /Something's wrong/ }))
    expect(screen.getByText('Bug located', { selector: 'p' })).toBeTruthy()
  })

  it('keeps a solved challenge solved when switching away and back, with fresh stepping state', () => {
    render(<App />)
    goToEnd()
    clickLine(15)
    fireEvent.click(screen.getByRole('button', { name: /Something's wrong/ }))
    fireEvent.click(screen.getByRole('button', { name: /The Missing Element/ }))
    expect(screen.getByText(/Step 1 of/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /The Infinite Loop/ }))
    expect(screen.getByText(/Step 1 of/)).toBeTruthy()
    expect(screen.getByText('Bug located', { selector: 'p' })).toBeTruthy()
  })
})

describe('autoplay', () => {
  it('Run advances one step per tick in explore mode and stops at the end', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))
    tick(1)
    expect(screen.getByText(/Step 2 of/)).toBeTruthy()
    tick(60)
    expect(screen.getByText(/Possible infinite loop detected/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Run' })).toBeTruthy()
  })

  it('Run stops at an unanswered prediction and does not resume by itself after answering', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'predict' }))
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))
    tick(10)
    expect(screen.getByText(/Step 2 of/)).toBeTruthy()
    expect(screen.getByText(/Will the loop body run\?/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Run' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Yes, the loop body runs' }))
    tick(10)
    expect(screen.getByText(/Step 2 of/)).toBeTruthy()
  })

  it('Pause stops playback', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))
    tick(1)
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    tick(10)
    expect(screen.getByText(/Step 2 of/)).toBeTruthy()
  })
})
