import {ChevronLeft, ChevronRight, GitBranch} from 'lucide-react';
import {lessons} from '../content/lessons';
import {symbols} from '../content/reference';
import {NAV, isReferencePage} from '../navigation';

export function Sidebar({
  page,
  open,
  completed,
  onNavigate,
  onToggle,
}: {
  page: string;
  open: boolean;
  completed: number;
  onNavigate: (page: string) => void;
  onToggle: () => void;
}) {
  const inReference = isReferencePage(page);
  return (
    <aside className="sidebar">
      <a
        className="brand"
        href="#"
        aria-label="Verdi Temporal Flow Explorer"
        onClick={e => {
          e.preventDefault();
          onNavigate('lessons');
        }}
      >
        <div className="brand-mark">
          <GitBranch size={23} />
        </div>
        <div>
          VERDI<span>TEMPORAL FLOW EXPLORER</span>
        </div>
      </a>
      <nav>
        {NAV.map(([id, label, Icon]) => {
          const current = page === id || (id === 'methods' && inReference);
          return (
            <button
              key={id}
              title={label}
              aria-current={current ? 'page' : undefined}
              className={current ? 'active' : ''}
              onClick={() => onNavigate(id)}
            >
              <Icon size={17} aria-hidden="true" />
              <span>{label}</span>
              {id === 'atlas' && <small>{symbols.length}</small>}
              {id === 'lessons' && <small>{lessons.length}</small>}
            </button>
          );
        })}
      </nav>
      <div className="side-rule" />
      <div className="progress-card">
        <div>
          <span>Learning Progress</span>
          <b>
            {completed}/{lessons.length}
          </b>
        </div>
        <div className="progress-track">
          <i style={{width: `${(completed / lessons.length) * 100}%`}} />
        </div>
      </div>
      <button
        className="sidebar-tab"
        onClick={onToggle}
        aria-label={open ? 'Collapse Sidebar' : 'Expand Sidebar'}
        title={open ? 'Collapse Sidebar' : 'Expand Sidebar'}
      >
        {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </aside>
  );
}
