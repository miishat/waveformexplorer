import {sources, glossary, symbols} from '../content/reference';
import {ArrowUpRight, BookOpen, CheckCircle2, Printer} from 'lucide-react';
import {SymbolGlyph} from './Symbol';
export function Reference({section}: {section: string}) {
  if (section === 'glossary')
    return (
      <>
        <div className="page-heading">
          <span className="eyebrow">THE LANGUAGE OF A TRACE</span>
          <h1>A Shared Vocabulary.</h1>
          <p>Precise terms for reading a value’s history.</p>
        </div>
        <div className="glossary-grid">
          {glossary.map(([term, definition]) => (
            <article className="paper-card" key={term}>
              <h3>{term}</h3>
              <p>{definition}</p>
            </article>
          ))}
        </div>
      </>
    );
  if (section === 'quick')
    return (
      <>
        <div className="page-heading">
          <span className="eyebrow">KEEP BESIDE YOUR WAVEFORM</span>
          <h1>The Reading Checklist.</h1>
          <p>A compact reference for your next debug session.</p>
          <button className="button" onClick={() => window.print()}>
            <Printer size={16} /> Print Reference
          </button>
        </div>
        <div className="quick-layout">
          <section className="paper-card">
            <h2>Read the Evidence in Order</h2>
            {[
              'Identify the investigation signal, bit range, value and time.',
              'Find the operation or storage element that supplies the value.',
              'Separate data operands from control dependencies.',
              'Check contribution and transition markers independently.',
              'Read the sampling context: before/after which event?',
              'Follow the active dependency to its relevant earlier event.',
              'Check the RTL and waveform at that time.',
              'Read the stopping reason; a trace endpoint is not proof of a bug.',
            ].map((text, i) => (
              <div className="checklist-item" key={text}>
                <b>{String(i + 1).padStart(2, '0')}</b>
                <p>{text}</p>
              </div>
            ))}
          </section>
          <section className="paper-card">
            <h2>Recognize the Notation</h2>
            {symbols
              .filter(s =>
                ['register', 'internal', 'roles', 'transition', 'group', 'time'].includes(s.id),
              )
              .map(s => (
                <div className="quick-symbol" key={s.id}>
                  <SymbolGlyph shape={s.shape} />
                  <div>
                    <b>{s.name}</b>
                    <p>{s.meaning}</p>
                  </div>
                </div>
              ))}
          </section>
        </div>
      </>
    );
  if (section === 'methods')
    return (
      <>
        <div className="page-heading">
          <span className="eyebrow">HOW TO FOLLOW THE EVIDENCE</span>
          <h1>Methods, Not Magic.</h1>
          <p>Choose the question first. Then choose the tracing method.</p>
        </div>
        <div className="method-grid">
          <article className="paper-card">
            <span className="small-tag">CYCLE-BASED</span>
            <h2>Follow Settled State.</h2>
            <p>
              Interpret register-to-register history using stable cycle values and clock context.
              Useful for a value moving through a synchronous pipeline.
            </p>
            <p className="callout">
              A cycle boundary is a sampling abstraction. It does not display every transient in
              that interval.
            </p>
          </article>
          <article className="paper-card">
            <span className="small-tag">TRANSITION-BASED</span>
            <h2>Follow an Event.</h2>
            <p>
              Investigate the input transitions associated with an output transition. Useful when
              propagation timing matters, particularly gate-level debug.
            </p>
            <p className="callout">
              An event path and a stable-cycle dependency graph answer different questions.
            </p>
          </article>
        </div>
        <h2 className="section-heading">Four Different Operations</h2>
        <div className="operation-table">
          {[
            [
              'Manual Expansion',
              'Which statement or register supplies this value?',
              'Expand one dependency at a time and correlate the source.',
              'You control where to continue; unexplored logic is not proven irrelevant.',
            ],
            [
              'Trace This Value',
              'Where did this data value originate?',
              'Follow value-related dependencies with the selected method and preferences.',
              'This is not a guarantee that the algorithm proves the design defect.',
            ],
            [
              'X Tracing',
              'Where does this unknown come from?',
              'Inspect four-state behavior and trace settings.',
              'Scope, black boxes and no-transition rules can stop the search.',
            ],
            [
              'Waveform Mismatch',
              'Where do two simulation histories diverge?',
              'Use corresponding signals and aligned events from the two runs.',
              'A difference is evidence; mismatched configurations can also create differences.',
            ],
          ].map(([title, q, how, limit]) => (
            <article key={title}>
              <h3>{title}</h3>
              <b>{q}</b>
              <p>{how}</p>
              <small>{limit}</small>
            </article>
          ))}
        </div>
        <h2 className="section-heading">Advanced Investigation Notes</h2>
        <div className="glossary-grid">
          {[
            [
              'Memory Reconstruction',
              'Separate the read address, location contents and historical write. Reconstruction depends on the model and available analysis data; it is not an unlimited recovery of undumped arbitrary state.',
            ],
            [
              'Skew and Propagation',
              'Clock skew and combinational delays can complicate cycle sampling. Check analysis settings and the waveform; compare transition-based analysis when a settled-cycle interpretation is insufficient.',
            ],
            [
              'Mismatch Workflow',
              'Confirm equivalent elaboration, reset, stimulus and signal correspondence before comparing runs. Investigate the first relevant divergence, not merely the latest visibly wrong output.',
            ],
            [
              'Before Declaring Root Cause',
              'Record the stop reason, analysis scope and missing visibility. Then connect the observed behavior to an intended requirement. A causal operand can be perfectly correct even when the result is unwanted.',
            ],
          ].map(([title, body]) => (
            <article className="paper-card" key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <p className="reference-line">
          Baseline:{' '}
          <a href={sources[0].url} target="_blank" rel="noreferrer">
            User guide pp. 249–260, 290–335 ↗
          </a>
          . Teaching explanations are simplified; the app does not run Verdi tracing.
        </p>
      </>
    );
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">EVIDENCE, EDITIONS & LIMITS</span>
        <h1>Know What Is Documented.</h1>
        <p>A transparent reference trail for every illustration.</p>
      </div>
      <div className="source-banner">
        <CheckCircle2 size={25} />
        <div>
          <h3>2019 Notation. Newer Context Checked.</h3>
          <p>
            Detailed conventions are based on O-2018.09-SP2. Synopsys materials from 2024 confirm
            ongoing TFV use and newer themes, but do not provide a replacement symbol legend. Newer
            public detailed manuals were searched for; none was verified for this build.
          </p>
        </div>
      </div>
      <div className="source-grid">
        {sources.map(s => (
          <article className="paper-card source-card" key={s.id}>
            <div className="eyebrow">
              <BookOpen size={15} />
              {s.status}
            </div>
            <h2>{s.title}</h2>
            <span className="source-version">{s.version}</span>
            <p>{s.scope}</p>
            <a href={s.url} target="_blank" rel="noreferrer">
              Read Source <ArrowUpRight size={16} />
            </a>
          </article>
        ))}
      </div>
      <section className="paper-card limits">
        <h2>What This App Does—and What It Cannot Establish</h2>
        <p>
          These are original educational recreations, not captured Verdi sessions. Shapes follow
          documented descriptions; exact rendering, defaults, colors and extracted logic vary by
          release and settings. The app has no access to your installed Help → Legend → TFV.
        </p>
        <p>
          Examples use curated events and manually reviewed RTL. Automated checks verify internal
          data consistency and selected language semantics; they do not certify equivalence to
          Verdi’s proprietary analysis. No arbitrary RTL, FSDB, memory reconstruction, or real
          screenshot interpretation is performed.
        </p>
        <p>
          Newer references were checked in November 2026. For your installation, use its own legend
          as the final visual authority.
        </p>
      </section>
    </>
  );
}
