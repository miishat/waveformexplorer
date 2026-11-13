import {ChevronRight, Moon, PanelLeftClose, PanelLeftOpen, Sun} from 'lucide-react';
import {NAV, isReferencePage} from '../navigation';

export function Topbar({
  page,
  sidebar,
  theme,
  onToggleSidebar,
  onToggleTheme,
}: {
  page: string;
  sidebar: boolean;
  theme: string;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
}) {
  return (
    <header className="topbar">
      <button
        className="icon-button nav-toggle"
        onClick={onToggleSidebar}
        aria-label={sidebar ? 'Collapse Navigation' : 'Expand Navigation'}
      >
        {sidebar ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
      </button>
      <div className="breadcrumb">
        Verdi Reference <ChevronRight size={12} />
        <b>{isReferencePage(page) ? 'Reference' : NAV.find(n => n[0] === page)?.[1]}</b>
      </div>
      <div className="topbar-actions">
        <button
          className="icon-button"
          aria-label={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
          onClick={onToggleTheme}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </header>
  );
}
