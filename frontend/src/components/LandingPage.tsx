import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  ArrowUpRight,
  Bug,
  Code2,
  Compass,
  GitBranch,
  Layers3,
  Lightbulb,
  Rocket,
  ScanSearch,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
  Wrench,
} from 'lucide-react'

export function LandingPage({ onEnterLab }: { onEnterLab: () => void }) {
  return (
    <div className="landing-shell">
      <header className="landing-nav">
        <div className="landing-brand"><div className="brand-mark"><Bug size={17} strokeWidth={2.6} /></div><div><div className="brand-name">BUG<span>LAB</span></div><div className="brand-tagline">debug the algorithm</div></div></div>
        <nav className="landing-links" aria-label="Landing page navigation"><a href="#method">How it works</a><a href="#missions">Missions</a><a href="#principles">Principles</a></nav>
        <button className="landing-nav-cta" onClick={onEnterLab}>Enter the lab <ArrowUpRight size={15} /></button>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <div className="hero-kicker"><span className="hero-kicker-dot" /> AN INTERACTIVE ALGORITHM DEBUGGER</div>
            <h1>Don't just watch the algorithm.<br /><em>Break it.</em></h1>
            <p className="hero-lede">Bug Lab turns DSA practice into a hands-on investigation. Trace the state, predict the next move, find the faulty assumption, and make the fix stick.</p>
            <div className="hero-actions"><button className="hero-primary" onClick={onEnterLab}><Rocket size={16} /> Start debugging <ArrowRight size={15} /></button><a className="hero-secondary" href="#method"><Compass size={15} /> See the method</a></div>
            <div className="hero-proof"><div><strong>03</strong><span>debug missions</span></div><div><strong>05</strong><span>learning stages</span></div><div><strong>0</strong><span>setup required</span></div></div>
          </div>
          <div className="hero-instrument" aria-label="Preview of the Bug Lab debugger">
            <div className="instrument-glow" />
            <div className="instrument-window">
              <div className="instrument-top"><div className="window-dots"><i /><i /><i /></div><span>buglab / binary-search</span><span className="instrument-live"><b /> LIVE TRACE</span></div>
              <div className="instrument-grid">
                <div className="instrument-code"><span className="mini-label">SOURCE TRACE</span><code><b>while</b> (low &lt;= high) {'{'}<br />  mid = floor((low + high) / 2)<br />  <b>if</b> (arr[mid] === target)<br />    <span className="code-pink">return</span> mid<br />  low = mid <span className="code-comment">// suspicious</span><br />{'}'}</code><div className="instrument-line"><span /> line 12 · low changed</div></div>
                <div className="instrument-state"><span className="mini-label">RUNTIME STATE</span><div className="mini-array">{[3, 8, 14, 21, 29, 34, 42, 57].map((value, index) => <span className={index === 6 ? 'mini-cell active' : index < 6 ? 'mini-cell in-range' : 'mini-cell'} key={value}>{value}</span>)}</div><div className="mini-pointers"><span><b className="pointer-violet" /> low <strong>6</strong></span><span><b className="pointer-cyan" /> mid <strong>6</strong></span><span><b className="pointer-blue" /> high <strong>7</strong></span></div><div className="instrument-alert"><TriangleAlert size={13} /><span>same interval detected</span></div></div>
              </div>
              <div className="instrument-footer"><span><Sparkles size={12} /> Observe → Predict → Investigate → Fix → Verify</span><span>step 12 / 18</span></div>
            </div>
          </div>
        </section>

        <section className="landing-method" id="method"><div className="section-intro"><span className="eyebrow">THE BUG LAB METHOD</span><h2>Algorithms are easier to understand when they can explain themselves.</h2><p>Every interaction is designed to make the invisible state visible before asking you to change the code.</p></div><div className="method-steps">{[
          ['01', ScanSearch, 'Observe', 'See the exact state the algorithm is in.'],
          ['02', Lightbulb, 'Predict', 'Make a call before the next step reveals itself.'],
          ['03', Search, 'Investigate', 'Follow the symptom back to the invariant.'],
          ['04', Wrench, 'Fix', 'Apply the smallest correction that restores progress.'],
          ['05', ShieldCheck, 'Verify', 'Replay the trace and prove the result.'],
        ].map(([number, Icon, title, body]) => { const StepIcon = Icon as LucideIcon; return <div className="method-step" key={String(number)}><span className="method-number">{String(number)}</span><StepIcon size={17} /><h3>{String(title)}</h3><p>{String(body)}</p></div> })}</div></section>

        <section className="landing-missions" id="missions"><div className="missions-heading"><div><span className="eyebrow">START WITH A SIGNAL</span><h2>Choose your first bug.</h2></div><button className="text-link" onClick={onEnterLab}>Open all missions <ArrowRight size={14} /></button></div><div className="mission-preview-grid">{[
          { icon: GitBranch, number: '01', title: 'The Infinite Loop', label: 'BOUNDARY UPDATE', copy: 'When low refuses to move past mid, the search never earns its next clue.', tone: 'violet' },
          { icon: Target, number: '02', title: 'The Missing Element', label: 'LOOP CONDITION', copy: 'A single skipped candidate is enough to make a correct target disappear.', tone: 'cyan' },
          { icon: Layers3, number: '03', title: 'Break the Assumptions', label: 'INPUT INVARIANT', copy: 'Test what happens when the array breaks the rule binary search depends on.', tone: 'amber' },
        ].map((mission) => { const MissionIcon = mission.icon; return <button className={`mission-preview ${mission.tone}`} onClick={onEnterLab} key={mission.number}><div className="mission-preview-top"><span>{mission.number}</span><MissionIcon size={16} /></div><span className="eyebrow">{mission.label}</span><h3>{mission.title}</h3><p>{mission.copy}</p><span className="mission-open">Explore mission <ArrowUpRight size={14} /></span></button> })}</div></section>

        <section className="landing-principles" id="principles"><div className="principles-mark"><Code2 size={22} /></div><div><span className="eyebrow">A DIFFERENT KIND OF PRACTICE</span><h2>Don't memorize the animation.<br /><span>Understand the invariant.</span></h2></div><p>Bug Lab is a quiet space to get curious about why an algorithm works, where it breaks, and how to prove you fixed it. No accounts. No leaderboards. Just the next useful question.</p></section>
      </main>
      <footer className="landing-footer"><div className="landing-brand"><div className="brand-mark"><Bug size={15} /></div><div className="brand-name">BUG<span>LAB</span></div></div><span>learn by breaking things</span><button onClick={onEnterLab}>Enter the lab <ArrowRight size={14} /></button></footer>
    </div>
  )
}
