import {useCallback, useEffect, useState} from 'react';
import {lessons} from './content/lessons';
import {symbols, type SymbolEntry} from './content/reference';
import {Lab} from './components/Lab';
import {Reference} from './components/Reference';
import {Sidebar} from './components/Sidebar';
import {Topbar} from './components/Topbar';
import {Atlas} from './components/Atlas';
import {SymbolDrawer} from './components/SymbolDrawer';
import {ResumeCard} from './components/ResumeCard';
import {InvestigationToolbar} from './components/InvestigationToolbar';
import {InvestigationIndex} from './components/InvestigationIndex';
import './components/RoseTheme.css';
import './components/GraphiteTheme.css';
import {
  SESSION_KEY,
  defaultProgress,
  hasStarted,
  type LessonProgress,
  type Session,
} from './session';
import {getSaved, readCompleted, readSession, save} from './storage';
import {REFERENCE_PAGES, isReferencePage} from './navigation';

const narrow = () => window.innerWidth <= 760;

export default function App() {
  const [restored] = useState(readSession);
  const [page, setPage] = useState('lessons'),
    [lessonId, setLessonId] = useState(restored.lessonId),
    [modal, setModal] = useState<SymbolEntry | null>(null),
    [theme, setTheme] = useState(getSaved('tfv-theme', 'light')),
    [appearance, setAppearance] = useState(restored.appearance),
    [sidebar, setSidebar] = useState(!narrow() && (restored.sidebar ?? true)),
    [sidebarPref, setSidebarPref] = useState(restored.sidebar),
    [progress, setProgress] = useState(restored.progress),
    [resume, setResume] = useState(
      hasStarted(restored.progress[restored.lessonId]) ? restored.lessonId : null,
    ),
    [labRun, setLabRun] = useState(0),
    [completed, setCompleted] = useState(readCompleted);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    const session: Session = {lessonId, appearance, sidebar: sidebarPref, progress};
    save(SESSION_KEY, JSON.stringify(session));
  }, [lessonId, appearance, sidebarPref, progress]);

  const lesson = lessons.find(l => l.id === lessonId)!;
  const toggleSidebar = () => {
    const next = !sidebar;
    setSidebar(next);
    setSidebarPref(next);
  };
  const toggleTheme = () => {
    const t = theme === 'light' ? 'dark' : 'light';
    setTheme(t);
    save('tfv-theme', t);
  };
  const changeLesson = (id: string) => {
    setLessonId(id);
    setResume(null);
  };
  const recordProgress = (id: string) => (p: LessonProgress) =>
    setProgress(prev => {
      const cur = prev[id];
      if (
        cur &&
        cur.step === p.step &&
        cur.index === p.index &&
        cur.view === p.view &&
        cur.method === p.method &&
        cur.activeOnly === p.activeOnly
      )
        return prev;
      return {...prev, [id]: p};
    });
  const startOver = () => {
    setProgress(prev => {
      const next = {...prev};
      delete next[lessonId];
      return next;
    });
    setLabRun(r => r + 1);
    setResume(null);
  };
  const markComplete = () => {
    const next = [...new Set([...completed, lessonId])];
    setCompleted(next);
    save('tfv-complete', JSON.stringify(next));
  };
  const closeModal = useCallback(() => setModal(null), []);
  const openAtlas = (id: string) => setModal(symbols.find(s => s.id === id) ?? symbols[0]);
  const navigate = (p: string) => {
    setPage(p);
    if (narrow()) setSidebar(false);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };
  const selectLesson = (id: string) => {
    changeLesson(id);
    navigate('lessons');
  };
  const resumeLesson = resume ? lessons.find(l => l.id === resume) : undefined,
    resumeProgress = resume ? progress[resume] : undefined;
  const onLessons = page === 'lessons';

  return (
    <div className={`app ${theme} ${sidebar ? '' : 'collapsed'}`}>
      <Sidebar
        page={page}
        open={sidebar}
        completed={completed.length}
        onNavigate={navigate}
        onToggle={toggleSidebar}
      />
      <div className="workspace">
        <Topbar
          page={page}
          sidebar={sidebar}
          theme={theme}
          onToggleSidebar={toggleSidebar}
          onToggleTheme={toggleTheme}
        />
        <main className={onLessons ? 'compact-workspace' : undefined}>
          {/* The lab stays mounted on other pages so in-progress state survives navigation. */}
          <section hidden={!onLessons} aria-label="Investigation Workspace">
            {onLessons && resumeLesson && resumeProgress && (
              <ResumeCard
                lesson={resumeLesson}
                progress={resumeProgress}
                onStartOver={startOver}
                onContinue={() => setResume(null)}
              />
            )}
            {onLessons && (
              <InvestigationToolbar
                lesson={lesson}
                completed={completed}
                appearance={appearance}
                onLesson={changeLesson}
                onAppearance={setAppearance}
              />
            )}
            <Lab
              key={`${lessonId}:${labRun}`}
              lesson={lesson}
              appearance={appearance}
              initial={progress[lessonId] ?? defaultProgress(lesson)}
              onProgress={recordProgress(lessonId)}
              onAtlas={openAtlas}
              onComplete={markComplete}
            />
            {onLessons && (
              <InvestigationIndex
                lessons={lessons}
                lessonId={lessonId}
                completed={completed}
                progress={progress}
                onSelect={selectLesson}
                onSources={() => navigate('sources')}
              />
            )}
          </section>
          {page === 'atlas' && <Atlas onOpen={setModal} />}
          {isReferencePage(page) && (
            <>
              <nav className="reference-sections" aria-label="Reference Sections">
                {REFERENCE_PAGES.map(([id, label]) => (
                  <button
                    key={id}
                    aria-current={page === id ? 'page' : undefined}
                    className={page === id ? 'chosen' : ''}
                    onClick={() => navigate(id)}
                  >
                    {label}
                  </button>
                ))}
              </nav>
              <Reference section={page} />
            </>
          )}
        </main>
      </div>
      {modal && <SymbolDrawer symbol={modal} onClose={closeModal} />}
    </div>
  );
}
