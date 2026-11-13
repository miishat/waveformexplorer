import {useState} from 'react';
import {Search, X} from 'lucide-react';
import {symbols, type SymbolEntry} from '../content/reference';
import {SymbolGlyph} from './Symbol';

const ALL = 'All Symbols';
const categories = [ALL, ...new Set(symbols.map(s => s.category))];

export function Atlas({onOpen}: {onOpen: (symbol: SymbolEntry) => void}) {
  const [search, setSearch] = useState(''),
    [category, setCategory] = useState(ALL);
  const filtered = symbols.filter(
    s =>
      (category === ALL || s.category === category) &&
      `${s.name} ${s.meaning} ${s.views} ${s.shape}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="atlas-heading">
        <h1>Symbol Atlas</h1>
        <span className="atlas-badge">{symbols.length}</span>
        <p>{symbols.length} documented symbols and concepts, explained in their specific view.</p>
      </div>
      <div className="atlas-bar">
        <div className="atlas-chips" role="group" aria-label="Category">
          {categories.map(name => (
            <button key={name} aria-pressed={category === name} onClick={() => setCategory(name)}>
              {name}
            </button>
          ))}
        </div>
        <span className="atlas-divider" />
        <label className="atlas-search">
          <Search size={16} />
          <input
            placeholder="Search by name, shape, or meaning…"
            aria-label="Search Symbols"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button aria-label="Clear Search" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </label>
        <span className="atlas-count" aria-live="polite">
          {filtered.length === symbols.length
            ? `${symbols.length} Symbols`
            : `${filtered.length} of ${symbols.length}`}
        </span>
      </div>
      <div className="atlas-grid">
        {filtered.map(s => (
          <button className="atlas-card" key={s.id} onClick={() => onOpen(s)}>
            <div className="atlas-drawing">
              <SymbolGlyph shape={s.shape} inactive={s.id === 'inactive'} />
            </div>
            <div className="atlas-card-copy">
              <span className="eyebrow">{s.category}</span>
              <h3>{s.name}</h3>
              <p>{s.meaning}</p>
              <small>{s.views}</small>
            </div>
          </button>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty-state">
          <Search size={28} />
          <h3>No Matching Symbols</h3>
          <p>Try “register”, “time”, “control”, or another category.</p>
          <button
            className="button"
            onClick={() => {
              setSearch('');
              setCategory(ALL);
            }}
          >
            Reset Filters
          </button>
        </div>
      )}
    </>
  );
}
