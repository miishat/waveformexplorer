import {useState, useRef, useEffect, useId, type ReactNode} from 'react';
import {nodeBounds, expandNode, fitBounds, retainSelection} from '../graph';
import {Minus, Plus, Maximize} from 'lucide-react';
import type {Lesson, Node, Frame} from '../content/lessons';
import type {View, Method} from '../model';
export type Selection = {type: 'node' | 'edge' | 'pin' | 'time' | 'group'; id: string};
export function Diagram({
  lesson,
  frame,
  view,
  method,
  selection,
  onSelect,
  revealed,
  onReveal,
  activeOnly,
  appearance,
  toolbarExtra,
}: {
  toolbarExtra?: ReactNode;
  lesson: Lesson;
  frame: Frame;
  view: View;
  method: Method;
  selection: Selection;
  onSelect: (s: Selection) => void;
  revealed: string[];
  onReveal: (ids: string[]) => void;
  activeOnly: boolean;
  appearance: string;
}) {
  const helpId = useId();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({x: 0, y: 0});
  const svgRef = useRef<SVGSVGElement>(null),
    contentRef = useRef<SVGGElement>(null);
  const drag = useRef<{id: number; x: number; y: number; pan: {x: number; y: number}} | null>(null);
  const [panning, setPanning] = useState(false);
  const [viewport, setViewport] = useState({width: 800, height: 430});
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(([entry]) => {
      const {width, height} = entry.contentRect;
      if (width > 0 && height > 0) setViewport({width, height});
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);
  function pointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (e.button !== 0 || (e.target as Element).closest('[role="button"]')) return;
    const matrix = e.currentTarget.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
    drag.current = {id: e.pointerId, x: point.x, y: point.y, pan};
    e.currentTarget.setPointerCapture(e.pointerId);
    setPanning(true);
    e.preventDefault();
  }
  function pointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const start = drag.current,
      matrix = e.currentTarget.getScreenCTM();
    if (!start || start.id !== e.pointerId || !matrix) return;
    const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
    setPan({x: start.pan.x + point.x - start.x, y: start.pan.y + point.y - start.y});
  }
  function stopPan(e: React.PointerEvent<SVGSVGElement>) {
    if (drag.current?.id !== e.pointerId) return;
    drag.current = null;
    setPanning(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function fit() {
    if (!contentRef.current) return;
    const next = fitBounds(contentRef.current.getBBox(), viewport);
    setZoom(next.zoom);
    setPan(next.pan);
  }
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current || !svgRef.current || !contentRef.current) return;
    if (Math.abs(svgRef.current.clientWidth - viewport.width) > 1) return;
    const bounds = contentRef.current.getBBox();
    // Center the diagram, and zoom out (never in, and not below 70% so text stays readable) when it is larger than the canvas.
    const zoomToFit = Math.max(0.7, Math.min(1, fitBounds(bounds, viewport).zoom));
    setZoom(zoomToFit);
    setPan({
      x: (viewport.width / 2 - bounds.x - bounds.width / 2) * zoomToFit,
      y: (viewport.height / 2 - bounds.y - bounds.height / 2) * zoomToFit,
    });
    initialized.current = true;
  }, [viewport]);
  const abstract = view === 'register';
  const ancestors = new Set<string>([lesson.target]);
  for (let i = 0; i < lesson.nodes.length; i++)
    for (const edge of lesson.edges) if (ancestors.has(edge.to)) ancestors.add(edge.from);
  let all = lesson.nodes.filter(n => !abstract || (!n.internal && ancestors.has(n.id)));
  // A register view stops each cone at the nearest storage/primary-input boundary.
  const connections = abstract
    ? all.flatMap(to => {
        const upstream = new Set<string>();
        const walk = (id: string, control: boolean) => {
          for (const edge of lesson.edges.filter(e => e.to === id)) {
            const source = lesson.nodes.find(n => n.id === edge.from)!;
            if (source.internal) walk(source.id, control || edge.role === 'C');
            else upstream.add(`${source.id}|${control || edge.role === 'C' ? 'C' : 'D'}`);
          }
        };
        walk(to.id, false);
        return [...upstream].map(key => {
          const [from, role] = key.split('|');
          return {
            from,
            to: to.id,
            role: role as 'C' | 'D',
            detail:
              'Intermediate combinational statements are abstracted; storage boundaries and sampled history are retained.',
          };
        });
      })
    : lesson.edges;
  const visible = new Set(revealed);
  all = all.filter(
    n => visible.has(n.id) && (!activeOnly || frame.samples[n.id].active || n.id === lesson.target),
  );
  const groupInputs = lesson.nodes.filter(n =>
    lesson.edges.some(e => e.from === n.id && lesson.nodes.find(x => x.id === e.to)?.internal),
  );
  // In Compact view, an input that feeds a grouped input sits to its left, stacked when several feed the same one.
  const upstreamOf = (node: (typeof lesson.nodes)[number]) => {
    const g = groupInputs.find(x => lesson.edges.some(e => e.from === node.id && e.to === x.id));
    if (!g || node.internal || node.id === lesson.target) return {x: node.x, y: node.y};
    const peers = lesson.nodes.filter(
      m =>
        !m.internal &&
        !groupInputs.includes(m) &&
        lesson.edges.some(e => e.from === m.id && e.to === g.id),
    );
    return {
      x: -90,
      y: 110 + groupInputs.indexOf(g) * 108 + (peers.indexOf(node) - (peers.length - 1) / 2) * 95,
    };
  };
  const positions = Object.fromEntries(
    all.map((n, i) => [
      n.id,
      abstract
        ? n.id === lesson.target
          ? {x: 650, y: 140}
          : {x: 115 + (i % 2) * 190, y: 120 + Math.floor(i / 2) * 140}
        : view === 'compact' && groupInputs.length > 0
          ? n.id === lesson.target
            ? {x: 665, y: 115}
            : n.internal
              ? {x: 415, y: 115}
              : groupInputs.includes(n)
                ? {x: 130, y: 110 + groupInputs.indexOf(n) * 108}
                : upstreamOf(n)
          : {x: n.x, y: n.y},
    ]),
  );
  const hasGroup =
    view !== 'tfv' &&
    all.length > 1 &&
    ((abstract && connections.every(e => e.to === lesson.target)) ||
      (!abstract && groupInputs.length > 0));
  const available = new Set(['time:event', ...(hasGroup ? ['group:inputs'] : [])]);
  for (const n of all) {
    available.add(`node:${n.id}`);
    available.add(`pin:${n.id}:out`);
  }
  for (const e of connections.filter(e => positions[e.from] && positions[e.to])) {
    available.add(`edge:${e.from}:${e.to}`);
    available.add(`pin:${e.to}:${e.role === 'C' ? 'control' : 'in'}:${e.from}`);
  }
  const availableKey = [...available].sort().join('|');
  useEffect(() => {
    const next = retainSelection(selection, new Set(availableKey.split('|')), lesson.target);
    if (next.type !== selection.type || next.id !== selection.id) onSelect(next);
  }, [availableKey, selection, onSelect, lesson.target]);
  const expansionEdges = connections.filter(e => !activeOnly || frame.samples[e.from].active);
  const hiddenInputs = (id: string) =>
    expandNode(revealed, id, expansionEdges).filter(id => !visible.has(id));
  const expand = (id: string) => {
    onSelect({type: 'node', id});
    onReveal(expandNode(revealed, id, expansionEdges));
  };
  const picked = (type: Selection['type'], id: string) =>
    selection.type === type && selection.id === id;
  const keyboard = (type: Selection['type'], id: string) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect({type, id});
    }
  };
  const labelOf = (id: string) => lesson.nodes.find(n => n.id === id)?.label ?? id;
  const activate = (type: Selection['type'], id: string) => ({
    role: 'button' as const,
    tabIndex: 0,
    'aria-pressed': picked(type, id),
    onClick: () => onSelect({type, id}),
    onKeyDown: keyboard(type, id),
  });
  function block(n: Node) {
    const p = positions[n.id],
      s = frame.samples[n.id],
      isTarget = n.id === lesson.target;
    const internal = (view === 'compact' && n.internal) || n.shape === 'internal';
    const isMux = view === 'tfv' && n.shape === 'mux';
    const w = isMux ? 76 : 126,
      h = isMux ? 96 : 62;
    const hidden = hiddenInputs(n.id);
    return (
      <g
        key={n.id}
        transform={`translate(${p.x},${p.y})`}
        className={`diagram-node ${s.active ? 'active' : 'inactive'} ${picked('node', n.id) ? 'selected' : ''} ${isTarget ? 'target' : ''}`}
      >
        <g
          {...activate('node', n.id)}
          aria-label={[
            n.label,
            isTarget ? 'investigation target' : '',
            `value ${s.value}`,
            s.at,
            n.role === 'C' ? 'control' : n.role === 'CD' ? 'control and data' : 'data',
            s.active ? 'active' : 'inactive',
            s.changed ? 'changed' : '',
          ]
            .filter(Boolean)
            .join(', ')}
        >
          <title>{n.detail}</title>
          {isTarget && (
            <>
              <rect
                className="target-ring"
                x={-w / 2 - 8}
                y={-h / 2 - 8}
                width={w + 16}
                height={h + 16}
                rx="8"
              />
              <text className="target-label" textAnchor="middle" y={-h / 2 - 23}>
                INVESTIGATION TARGET
              </text>
            </>
          )}
          {isMux ? (
            <path className="node-body" d="M-38 -48L38 -30V30L-38 48Z" />
          ) : internal ? (
            <path className="node-body" d="M-51 -31H51L63 -19V19L51 31H-51L-63 19V-19Z" />
          ) : (
            <rect
              className="node-body"
              x={-63}
              y={-31}
              width={126}
              height={62}
              rx={n.shape === 'memory' ? 8 : 2}
            />
          )}
          {n.shape === 'register' && view === 'tfv' && (
            <path
              d="M-63 17L-54 23L-63 29"
              fill="none"
              stroke="var(--state-active)"
              strokeWidth="1.2"
            />
          )}
          {n.shape === 'pin' && (
            <text x="-56" y="-20" className="node-time">
              {n.id === 'one' ? 'CONST' : 'INPUT'}
            </text>
          )}
          {s.changed && (
            <circle className="transition-dot" cx={-w / 2 - 3} cy={-h / 2 - 6} r="4.5" />
          )}
          {n.role === 'C' && s.changed && (
            <text className="control-marker" x={w / 2 + 5} y={-h / 2}>
              !
            </text>
          )}
          <text className="node-name" y={isMux ? -6 : -5} textAnchor="middle">
            {isMux ? 'MUX' : view === 'tfv' && n.shape === 'function' ? 'f  ' + n.label : n.label}
          </text>
          <text className="node-value" y="17" textAnchor="middle">
            {s.value === 'X' ? 'X' : s.value} <tspan className="role-text">{n.role}</tspan>
          </text>
          <text className="node-time" textAnchor="middle" y={h / 2 + 22}>
            {s.at}
          </text>
          {appearance === 'teaching' && (
            <text className="node-state" textAnchor="middle" y={h / 2 + 39}>
              {s.active ? 'ACTIVE' : 'INACTIVE'}
              {s.changed ? ' · Δ' : ''}
            </text>
          )}
        </g>
        <circle
          {...activate('pin', `${n.id}:out`)}
          aria-label={`${n.label} output pin`}
          className={`diagram-pin ${picked('pin', `${n.id}:out`) ? 'picked' : ''}`}
          cx={w / 2}
          cy={0}
          r="5"
        />
        {connections
          .filter(e => e.to === n.id && positions[e.from])
          .map(edge => {
            const control = edge.role === 'C';
            const inputs = connections.filter(e => e.to === n.id && e.role === edge.role);
            const offset = control
              ? 0
              : ((inputs.indexOf(edge) + 1) * h) / (inputs.length + 1) - h / 2;
            const id = `${n.id}:${control ? 'control' : 'in'}:${edge.from}`;
            return (
              <circle
                key={id}
                {...activate('pin', id)}
                aria-label={`${n.label} ${control ? 'control' : 'data'} input pin from ${labelOf(edge.from)}`}
                className={`diagram-pin ${frame.samples[edge.from].active ? '' : 'inactive-pin'} ${picked('pin', id) ? 'picked' : ''}`}
                cx={control ? 0 : -w / 2}
                cy={control ? h / 2 : offset}
                r="5"
              />
            );
          })}
        {hidden.length > 0 && (
          <g
            role="button"
            tabIndex={0}
            className="node-expand"
            aria-label={`Expand ${n.label}: ${hidden.length} hidden inputs`}
            transform={`translate(0 ${h / 2 + (appearance === 'teaching' ? 62 : 46)})`}
            onClick={() => expand(n.id)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                expand(n.id);
              }
            }}
          >
            <rect x="-62" y="-12" width="124" height="25" rx="3" />
            <text textAnchor="middle" y="5">
              + {hidden.length} hidden input{hidden.length === 1 ? '' : 's'}
            </text>
          </g>
        )}
      </g>
    );
  }
  return (
    <div className={`diagram-wrap ${appearance}`}>
      <p id={helpId} className="visually-hidden">
        Use Tab to move between nodes, pins and connections, and Enter to select one. With the
        canvas focused, arrow keys pan and F fits the diagram.
      </p>
      <div className="diagram-scroll">
        <svg
          ref={svgRef}
          className={`flow-svg ${panning ? 'panning' : ''}`}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={stopPan}
          onPointerCancel={stopPan}
          onLostPointerCapture={stopPan}
          tabIndex={0}
          onKeyDown={e => {
            const delta: Record<string, {x: number; y: number}> = {
              ArrowLeft: {x: -40, y: 0},
              ArrowRight: {x: 40, y: 0},
              ArrowUp: {x: 0, y: -40},
              ArrowDown: {x: 0, y: 40},
            };
            if (e.target !== e.currentTarget) return;
            if (delta[e.key]) {
              e.preventDefault();
              setPan(p => ({x: p.x + delta[e.key].x, y: p.y + delta[e.key].y}));
            } else if (e.key.toLowerCase() === 'f') {
              e.preventDefault();
              fit();
            }
          }}
          viewBox={`0 0 ${viewport.width} ${viewport.height}`}
          role="group"
          aria-roledescription="diagram"
          aria-label={`${lesson.title}, ${view} educational diagram`}
          aria-describedby={helpId}
        >
          <defs>
            <marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <path d="M0 0L7 3.5L0 7" fill="context-stroke" />
            </marker>
          </defs>

          <g
            ref={contentRef}
            transform={`translate(${pan.x} ${pan.y}) translate(${viewport.width / 2} ${viewport.height / 2}) scale(${zoom}) translate(${-viewport.width / 2} ${-viewport.height / 2})`}
          >
            <g
              {...activate('time', 'event')}
              aria-label={`Investigation event at ${frame.time} nanoseconds`}
              className={`time-boundary ${picked('time', 'event') ? 'selected' : ''}`}
            >
              <path d="M745 58V370" />
              <text x="745" y="40" textAnchor="middle">
                {frame.label}
              </text>
              <rect x="725" y="20" width="40" height="355" fill="transparent" stroke="none" />
            </g>
            {hasGroup && (
              <g
                {...activate('group', 'inputs')}
                aria-label="Input Dependency Grouping"
                className={`input-group ${picked('group', 'inputs') ? 'selected' : ''}`}
              >
                <rect x="25" y="55" width={abstract ? 420 : 220} height="330" rx="9" />
                <text x="40" y="72">
                  {abstract ? 'FAN-IN GROUP' : 'STATEMENT INPUTS'}
                </text>
              </g>
            )}
            {connections
              .filter(e => positions[e.from] && positions[e.to])
              .map((edge, i) => {
                const a = positions[edge.from],
                  b = positions[edge.to],
                  control = edge.role === 'C';
                const sourceBounds = nodeBounds(
                  lesson.nodes.find(n => n.id === edge.from)!.shape,
                  view,
                );
                const startX = a.x + sourceBounds.halfWidth,
                  endX =
                    b.x -
                    (view === 'tfv' && lesson.nodes.find(n => n.id === edge.to)?.shape === 'mux'
                      ? 38
                      : 63);
                const targetHalfHeight =
                  view === 'tfv' && lesson.nodes.find(n => n.id === edge.to)?.shape === 'mux'
                    ? 48
                    : 31;
                const dataInputs = connections.filter(e => e.to === edge.to && e.role === 'D');
                const targetY =
                  b.y +
                  ((dataInputs.indexOf(edge) + 1) * (targetHalfHeight * 2)) /
                    (dataInputs.length + 1) -
                  targetHalfHeight;
                const d = control
                  ? `M${startX} ${a.y} H${startX + 22} V${b.y + targetHalfHeight + 30} H${b.x} V${b.y + targetHalfHeight}`
                  : `M${startX} ${a.y} H${(startX + endX) / 2} V${targetY} H${endX}`;
                const id = `${edge.from}:${edge.to}`;
                return (
                  <g
                    key={id}
                    {...activate('edge', id)}
                    aria-label={`${labelOf(edge.from)} to ${labelOf(edge.to)}, ${edge.role === 'C' ? 'control' : 'data'} dependency, ${frame.samples[edge.from].active ? 'active' : 'inactive'}`}
                    className={`diagram-edge ${frame.samples[edge.from].active ? '' : 'inactive'} ${control ? 'control' : ''} ${picked('edge', id) ? 'selected' : ''}`}
                  >
                    <path d={d} className="hit-path" />
                    <path d={d} className="visible-path" markerEnd="url(#arrow)" />
                    {!control && i === 0 && (
                      <text x={(startX + endX) / 2 + 8} y={a.y - 10}>
                        data
                      </text>
                    )}
                  </g>
                );
              })}
            {all.map(block)}
          </g>
        </svg>
      </div>
      <div className="canvas-toolbar">
        <details className="canvas-popover" name="canvas-help">
          <summary>Legend</summary>
          <div className="canvas-panel">
            <div className="canvas-key">
              <em>Connections</em>
              <span>
                <i className="key-active" />
                Active
              </span>
              <span>
                <i className="key-inactive" />
                Inactive
              </span>
              <span>
                <i className="key-control" />
                Control
              </span>
              <span className="canvas-key-sep" aria-hidden="true" />
              <em>Markers</em>
              <span>
                <i className="key-transition" />
                Transition
              </span>
              <span>
                <i className="key-target" />
                Target
              </span>
              <span>
                <i className="key-selection" />
                Selected
              </span>
            </div>
          </div>
        </details>
        <details className="canvas-popover" name="canvas-help">
          <summary>Shortcuts</summary>
          <div className="canvas-panel">
            <dl className="canvas-shortcuts">
              <div>
                <dt>
                  <kbd>Drag</kbd> or <kbd>←</kbd>
                  <kbd>↑</kbd>
                  <kbd>↓</kbd>
                  <kbd>→</kbd>
                </dt>
                <dd>Pan the Canvas</dd>
              </div>
              <div>
                <dt>
                  <kbd>F</kbd>
                </dt>
                <dd>Fit to Content</dd>
              </div>
              <div>
                <dt>
                  <kbd>Tab</kbd>
                </dt>
                <dd>Move Between Nodes</dd>
              </div>
              <div>
                <dt>
                  <kbd>Enter</kbd>
                </dt>
                <dd>Select or Expand a Node</dd>
              </div>
            </dl>
          </div>
        </details>
        {toolbarExtra}
        <div className="zoom-tools">
          <button
            title="Zoom Out"
            aria-label="Zoom Out"
            onClick={() => setZoom(z => Math.max(0.1, z - 0.15))}
          >
            <Minus size={14} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            title="Zoom In"
            aria-label="Zoom In"
            onClick={() => setZoom(z => Math.min(2, z + 0.15))}
          >
            <Plus size={14} />
          </button>
          <button title="Actual Size" aria-label="Actual Size" onClick={() => setZoom(1)}>
            1:1
          </button>
          <button title="Fit to Content (F)" aria-label="Fit to Content" onClick={fit}>
            <Maximize size={14} />
          </button>
        </div>
        <button className="expand-button" onClick={() => onReveal(lesson.nodes.map(n => n.id))}>
          Show All Dependencies
        </button>
        <button
          className="expand-button"
          disabled={revealed.length === 1}
          onClick={() => {
            onReveal([lesson.target]);
            onSelect({type: 'node', id: lesson.target});
          }}
        >
          Collapse to Target
        </button>
      </div>
      <div className="canvas-status" role="status">
        <span>
          {all.length} Nodes Shown{activeOnly ? ' · Active Only' : ''}
        </span>
        <span>
          {view === 'register'
            ? 'Register Boundaries'
            : view === 'compact'
              ? 'Compact Statements'
              : 'Statement Dependencies'}{' '}
          · {method === 'cycle' ? 'Cycle-Based' : 'Transition-Based'}
        </span>
      </div>
    </div>
  );
}
