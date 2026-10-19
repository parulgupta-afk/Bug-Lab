import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App smoke test', () => {
  it('renders the first challenge at step 1 with the code, array and controls', () => {
    const html = renderToString(<App />).replace(/<!-- -->/g, '')
    expect(html).toContain('Bug Lab')
    expect(html).toContain('The Infinite Loop')
    expect(html).toContain('(low &lt;= high) {')
    expect(html).toContain('target = 5')
    expect(html).toContain('Step 1 of')
    // the bug must not be given away in the initial view
    expect(html).not.toMatch(/Possible infinite loop detected/)
    expect(html).not.toMatch(/\/\/ BUG/i)
  })
})
