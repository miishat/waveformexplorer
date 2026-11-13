import {Fragment, useId, useState} from 'react';
import {BookOpen, Check, ChevronDown, LayoutGrid} from 'lucide-react';
import type {Lesson} from '../content/lessons';
import {STEP_LABELS, hasStarted, type LessonProgress} from '../session';
import './InvestigationIndex.css';

const num = (i: number) => String(i + 1).padStart(2, '0');

export function InvestigationIndex({
  lessons,
  lessonId,
  completed,
  progress,
  onSelect,
  onSources,
}: {
  lessons: Lesson[];
  lessonId: string;
  completed: string[];
  progress: Record<string, LessonProgress>;
  onSelect: (id: string) => void;
  onSources: () => void;
}) {
  const [open, setOpen] = useState(false),
    bodyId = useId();
  return (
    <section className="investigation-index">
      <div className="index-head">
        <button
          className="index-toggle"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen(o => !o)}
        >
          <LayoutGrid size={16} />
          <b>All Investigations</b>
          <span className="index-progress">
            {completed.length} / {lessons.length} Complete
          </span>
          <ChevronDown size={16} className={`index-chevron ${open ? 'open' : ''}`} />
        </button>
        <button className="index-sources" onClick={onSources}>
          <BookOpen size={14} />
          Sources & Limitations
        </button>
      </div>
      {open && (
        <div className="index-body" id={bodyId}>
          <table className="index-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Investigation</th>
                <th>Topic</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((l, i) => {
                const done = completed.includes(l.id);
                return (
                  <Fragment key={l.id}>
                    {l.track === 'expert' && lessons[i - 1]?.track !== 'expert' && (
                      <tr className="index-track">
                        <td colSpan={4}>
                          <b>Expert Track</b> Assumes the investigations above. Each one is a bug
                          where the obvious reading of the trace is wrong.
                        </td>
                      </tr>
                    )}
                    <tr
                      className={l.id === lessonId ? 'current' : ''}
                      aria-current={l.id === lessonId ? 'true' : undefined}
                      onClick={() => onSelect(l.id)}
                    >
                      <td className="index-num">{num(i)}</td>
                      <td>
                        <button
                          className="index-title"
                          onClick={e => {
                            e.stopPropagation();
                            onSelect(l.id);
                          }}
                        >
                          {l.title}
                        </button>
                        <small>{l.summary}</small>
                      </td>
                      <td>
                        <span className="index-tag">{l.tag}</span>
                      </td>
                      <td>
                        {done ? (
                          <span className="index-status done">
                            <Check size={13} />
                            Complete
                          </span>
                        ) : hasStarted(progress[l.id]) ? (
                          <span className="index-status started">
                            In Progress · {STEP_LABELS[progress[l.id].step]}
                          </span>
                        ) : (
                          <span className="index-status">Not Started</span>
                        )}
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
