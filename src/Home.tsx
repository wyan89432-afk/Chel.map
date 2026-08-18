/**
 * Design direction: Instrument Panel / Midnight Graphite.
 * Keep the plotting field dominant, use amber/mint/red as semantic channels,
 * and preserve monospaced rhythm for all plotted numeric data.
 */
import { useMemo, useRef, useState } from "react";
import { ArrowRight, ClipboardPaste, Eraser, Info, Play, RotateCcw, Search } from "lucide-react";

const SAMPLE = `979
063
395
603
626
481
598
116
690
593
504
503
336
041
867
606
662
665
962
044
221
863
843
209`;

const ROW_HEIGHT = 48;
const CHANNELS = [
  { key: "hundreds", label: "Hundreds", short: "H", className: "channel-amber", color: "#f8c94e" },
  { key: "tens", label: "Tens", short: "T", className: "channel-mint", color: "#78ee8b" },
  { key: "units", label: "Units", short: "U", className: "channel-red", color: "#ff3b2f" },
] as const;

type ParsedRow = { value: string; digits: number[] };

function parseRows(value: string) {
  const tokens = value.trim() ? value.trim().split(/\s+/) : [];
  const rows: ParsedRow[] = [];
  const invalid: string[] = [];
  tokens.forEach((token) => {
    if (/^\d{3}$/.test(token)) rows.push({ value: token, digits: token.split("").map(Number) });
    else invalid.push(token);
  });
  return { rows, invalid };
}

function GridRow({ row, index }: { row: ParsedRow; index: number }) {
  return (
    <div className="digit-row" style={{ height: ROW_HEIGHT }}>
      <div className="row-index">{String(index + 1).padStart(2, "0")}</div>
      <div className="digit-cells">
        {Array.from({ length: 10 }, (_, digit) => {
          const position = row.digits.findIndex((value) => value === digit);
          const isHundreds = position === 0;
          const isTens = position === 1;
          const isUnits = position === 2;
          return (
            <div key={digit} className="digit-cell">
              <span
                className={`digit-glyph ${isHundreds ? "is-amber" : ""} ${isTens ? "is-mint" : ""} ${isUnits ? "is-red" : ""} ${isHundreds && isUnits ? "is-double" : ""}`}
              >
                {digit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConnectorLayer({ rows }: { rows: ParsedRow[] }) {
  const points = rows.map((row, index) => `${row.digits[2] * 100 + 50},${index * ROW_HEIGHT + ROW_HEIGHT / 2}`).join(" ");
  if (rows.length < 2) return null;
  return (
    <svg className="connector-layer" viewBox={`0 0 1000 ${rows.length * ROW_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <marker id="unit-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L7,3.5 L0,7 z" fill="#ff3b2f" />
        </marker>
      </defs>
      <polyline points={points} fill="none" stroke="#ff3b2f" strokeWidth="2.6" vectorEffect="non-scaling-stroke" markerMid="url(#unit-arrow)" markerEnd="url(#unit-arrow)" />
    </svg>
  );
}

export default function Home() {
  const [input, setInput] = useState("");
  const [hasRendered, setHasRendered] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const parsed = useMemo(() => parseRows(input), [input]);
  const visibleRows = hasRendered ? parsed.rows : [];

  const renderSequence = () => setHasRendered(true);
  const clearAll = () => {
    setInput("");
    setHasRendered(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };
  const loadSample = () => {
    setInput(SAMPLE);
    setHasRendered(true);
  };

  return (
    <main className="app-shell">
      <aside className="control-rail">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><i /><i /><i /></div>
          <div><div className="brand-name">CYCLE / 03</div><div className="brand-subtitle">unit digit visualizer</div></div>
        </div>

        <div className="rail-intro">
          <p className="eyebrow">Sequence instrument</p>
          <h1>Trace the<br /><em>last digit.</em></h1>
          <p className="intro-copy">Paste three-digit rows to reveal position cycles and the unit-digit path between them.</p>
        </div>

        <section className="input-panel" aria-labelledby="sequence-label">
          <div className="section-heading"><label id="sequence-label" htmlFor="sequence-input">Input sequence</label><span>{parsed.rows.length} rows</span></div>
          <div className="textarea-wrap">
            <ClipboardPaste size={15} aria-hidden="true" />
            <textarea ref={inputRef} id="sequence-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="979\n063\n395" spellCheck={false} aria-describedby="input-help" />
          </div>
          <p id="input-help" className="helper-text">One three-digit value per line. Leading zeroes are preserved.</p>
          {parsed.invalid.length > 0 && <p className="validation-note"><Info size={13} /> Ignored: {parsed.invalid.slice(0, 3).join(", ")}{parsed.invalid.length > 3 ? "…" : ""}</p>}
          <button className="render-button" onClick={renderSequence}><Play size={15} fill="currentColor" /> Render sequence <ArrowRight size={15} /></button>
          <div className="secondary-actions"><button onClick={loadSample}><RotateCcw size={14} /> Load sample</button><button onClick={clearAll}><Eraser size={14} /> Refresh table</button></div>
        </section>

        <section className="legend" aria-label="Digit position legend">
          <div className="section-heading"><span>Colour channels</span><span className="legend-live">LIVE</span></div>
          {CHANNELS.map((channel) => <div className="legend-row" key={channel.key}><span className={`legend-dot ${channel.className}`} /><span>{channel.label}</span><kbd>{channel.short}</kbd></div>)}
        </section>

        <div className="rail-footer"><span>Note</span><strong>wai Yan</strong><p>Unit digits are linked in signal red from row to row.</p></div>
      </aside>

      <section className="visualizer-stage">
        <header className="stage-header"><div><p className="eyebrow">Live plot / unit channel</p><h2>Unit digit table</h2></div><div className="stage-meta"><span className="status-dot" /> <span>{visibleRows.length ? "Sequence rendered" : "Awaiting sequence"}</span><span className="meta-divider" /> <span>0—9 axis</span></div></header>
        <div className="plot-card">
          <div className="plot-topline"><span>ROW INDEX</span><span className="axis-label">DIGIT POSITION</span><span>CONNECTOR: UNIT</span></div>
          <div className="plot-scroll">
            <div className="plot-canvas" style={{ minHeight: Math.max(visibleRows.length * ROW_HEIGHT, 220) }}>
              <div className="axis-row"><div className="row-index">#</div><div className="axis-cells">{Array.from({ length: 10 }, (_, digit) => <span key={digit}>{digit}</span>)}</div></div>
              {visibleRows.length > 0 ? <div className="rows-layer">{visibleRows.map((row, index) => <GridRow key={`${row.value}-${index}`} row={row} index={index} />)}<ConnectorLayer rows={visibleRows} /></div> : <div className="empty-plot"><Search size={18} /><p>Paste a sequence to start plotting.</p><span>Three digits become three colour channels.</span></div>}
            </div>
          </div>
          <div className="plot-footer"><span>Rows: <strong>{visibleRows.length}</strong></span><span>Unit path: <strong className="red-text">{visibleRows.length > 1 ? `${visibleRows.length - 1} connections` : "—"}</strong></span><span>Format: <strong>000–999</strong></span></div>
        </div>
        <footer className="page-footer"><span>Built for pattern reading</span><span>Graphite field · Signal channels · v1.0</span></footer>
      </section>
    </main>
  );
}
