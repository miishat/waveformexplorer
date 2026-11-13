import {useEffect, useRef, useState} from 'react';
import {ExternalLink, X} from 'lucide-react';
import {sources, type SymbolEntry} from '../content/reference';
import {SymbolGlyph} from './Symbol';

/** Modal symbol reference. Traps focus while open and returns it to the opener on close. */
export function SymbolDrawer({symbol, onClose}: {symbol: SymbolEntry; onClose: () => void}) {
  const dialogRef = useRef<HTMLElement>(null);
  const source = sources.find(s => s.id === symbol.source);
  // Captured during render: autoFocus moves focus into the dialog before effects run.
  const [opener] = useState(() => document.activeElement as HTMLElement | null);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab') return;
      const list = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button,a[href],input,select,[tabindex="0"]',
      );
      if (!list?.length) return;
      const first = list[0],
        last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handle);
    return () => {
      document.removeEventListener('keydown', handle);
      opener?.focus();
    };
  }, [onClose, opener]);
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <section
        ref={dialogRef}
        className="symbol-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="symbol-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="drawer-head">
          <span className="drawer-chip">{symbol.category}</span>
          <button
            autoFocus
            className="drawer-close"
            onClick={onClose}
            aria-label="Close Symbol Reference"
          >
            <X size={18} />
          </button>
        </div>
        <div className="drawer-body">
          <div className="drawer-figure">
            <SymbolGlyph shape={symbol.shape} inactive={symbol.id === 'inactive'} />
            <span>{symbol.status}</span>
          </div>
          <h2 id="symbol-title">{symbol.name}</h2>
          <p className="drawer-lead">{symbol.meaning}</p>
          <dl className="drawer-meta">
            <div>
              <dt>View</dt>
              <dd>{symbol.views}</dd>
            </div>
            <div>
              <dt>Method</dt>
              <dd>{symbol.method}</dd>
            </div>
          </dl>
          <h4>Read It in Context</h4>
          <p>{symbol.example}</p>
          <h4>Do Not Confuse It With…</h4>
          <p>{symbol.confusion}</p>
          <p className="drawer-note">
            Illustration follows documented descriptions, not a pixel-exact capture. Confirm
            appearance in your installed Help → Legend → TFV.
          </p>
        </div>
        {source && (
          <div className="drawer-source">
            <div>
              <b>{source.title}</b>
              <small>
                {source.version} · pp. {symbol.page}
              </small>
            </div>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              aria-label="Open Documentation"
              title="Open Documentation"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
