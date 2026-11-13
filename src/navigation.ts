import {BookOpen, Grid2X2, ScanLine} from 'lucide-react';

export const NAV = [
  ['lessons', 'Investigations', ScanLine],
  ['atlas', 'Symbols', Grid2X2],
  ['methods', 'Reference', BookOpen],
] as const;

export const REFERENCE_PAGES = [
  ['methods', 'Tracing Methods'],
  ['glossary', 'Glossary'],
  ['quick', 'Quick Reference'],
  ['sources', 'Sources & Versions'],
] as const;

export const isReferencePage = (page: string) => REFERENCE_PAGES.some(([id]) => id === page);
