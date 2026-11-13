import {ArrowRight, Info} from 'lucide-react';
import {lessons, type Lesson} from '../content/lessons';
import type {Appearance} from '../session';
import {Select} from './Select';

const num = (l: Lesson) => String(lessons.indexOf(l) + 1).padStart(2, '0');
export const coreLessons = lessons.filter(l => l.track !== 'expert');
export const expertLessons = lessons.filter(l => l.track === 'expert');

/** Track headings are non-selectable heading options, so the picker shows the split without making them selectable. */
function pickerOptions(completed: string[]) {
  const item = (l: Lesson) => ({
    value: l.id,
    label: `${num(l)} · ${l.title}${completed.includes(l.id) ? ' ✓' : ''}`,
  });
  return [
    {value: '__core', label: `Core Track · ${coreLessons.length} investigations`, heading: true},
    ...coreLessons.map(item),
    {value: '__expert', label: 'Expert Track · finish the core track first', heading: true},
    ...expertLessons.map(item),
  ];
}

export function InvestigationToolbar({
  lesson,
  completed,
  appearance,
  onLesson,
  onAppearance,
}: {
  lesson: Lesson;
  completed: string[];
  appearance: Appearance;
  onLesson: (id: string) => void;
  onAppearance: (a: Appearance) => void;
}) {
  const coreDone = coreLessons.filter(l => completed.includes(l.id)).length;
  const nextCore = coreLessons.find(l => !completed.includes(l.id));
  const showHint = lesson.track === 'expert' && nextCore;
  return (
    <div className="investigation-toolbar">
      <Select
        label="Investigation"
        value={lesson.id}
        onChange={onLesson}
        options={pickerOptions(completed)}
      />
      <span className={`investigation-tag ${lesson.track === 'expert' ? 'expert' : ''}`}>
        {lesson.track === 'expert' ? 'Expert · ' : ''}
        {lesson.tag}
      </span>
      <h2 className="investigation-question">{lesson.question}</h2>
      <div className="style-toggle" role="group" aria-label="Diagram Style">
        {(
          [
            ['reference', 'Reference'],
            ['teaching', 'Teaching'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            aria-pressed={appearance === value}
            onClick={() => onAppearance(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {showHint && (
        <div className="track-hint" role="note">
          <Info size={15} aria-hidden="true" />
          <span>
            <b>Expert track.</b> These investigations assume the core track, and each one is a bug
            where the obvious reading of the trace is wrong. You have finished {coreDone} of{' '}
            {coreLessons.length} core investigations.
          </span>
          <button className="text-button" onClick={() => onLesson(nextCore.id)}>
            Go to {num(nextCore)} · {nextCore.title} <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
