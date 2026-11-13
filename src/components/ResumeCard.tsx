import {ArrowRight, RotateCcw} from 'lucide-react';
import {lessons, type Lesson} from '../content/lessons';
import {STEP_LABELS, type LessonProgress} from '../session';

export function ResumeCard({
  lesson,
  progress,
  onStartOver,
  onContinue,
}: {
  lesson: Lesson;
  progress: LessonProgress;
  onStartOver: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="resume-card" role="status">
      <div className="resume-copy">
        <span className="resume-eyebrow">Continue Where You Left Off</span>
        <b>
          {String(lessons.indexOf(lesson) + 1).padStart(2, '0')} · {lesson.title}
        </b>
        <small>
          Step {progress.step + 1} of {STEP_LABELS.length} · {STEP_LABELS[progress.step]} ·{' '}
          {lesson.frames[progress.index].label}
        </small>
      </div>
      <button className="step-back" onClick={onStartOver}>
        <RotateCcw size={14} aria-hidden="true" />
        Start Over
      </button>
      <button className="button" autoFocus onClick={onContinue}>
        Continue <ArrowRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
