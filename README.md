# Verdi Temporal Flow Explorer

React + TypeScript educational application with 19 symbol/concept cards, 31 guided investigations (21 core, 10 expert), three flow representations, synchronized RTL/event context, glossary, tracing reference and printable checklist.

## Run

Use Node 22.13 or newer. Install dependencies with `npm install`, then `npm run dev`.

| Command                           | What it does                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `npm run build`                   | Type-checks and builds `dist/`                                                   |
| `npm test`                        | Model and content checks (Node test runner)                                      |
| `npm run test:e2e`                | Browser tests with Playwright (run `npx playwright install chromium` once first) |
| `npm run lint`                    | ESLint                                                                           |
| `npm run format` / `format:check` | Prettier                                                                         |

Every push to `main` runs format check, lint, unit tests, browser tests and the build, then deploys `dist/` to GitHub Pages (`.github/workflows/deploy.yml`).

The app is static; deploy `dist/` to an HTTPS static host. It does not process arbitrary RTL, FSDB or uploaded screenshots. Progress is saved only in this browser's localStorage.

## Documentation

The per-symbol source inventory is `src/content/reference.ts`. Detailed notation uses Synopsys O-2018.09-SP2 and command-reference descriptions. The July 2024 official datasheet and Synopsys-authored DVCon India 2024 presentation were checked for newer context; they do not contain a replacement comprehensive TFV legend. No newer public detailed reference was verified. Confirm exact symbols and defaults in the installed release.

## Validation boundaries

Original drawings are educational recreations, not screenshots or a pixel-exact clone. Examples are manually reviewed snippets and curated event data. No HDL simulator was available in this environment. Tests validate fixture consistency and selected timing/logic expectations; they do not establish simulator or Verdi equivalence.

The delay example's cycle lens explicitly displays the settled 12 ns summary while its timeline retains the selected event; transition lens displays the selected instantaneous event. Other method changes provide interpretation guidance over the same curated data.

## Project structure

- `src/content`: inventory, references, lessons and event fixtures. `kit.ts` holds the lesson types and helpers, `lessons.ts` and `core-timing.ts` the core track, `expert.ts` the expert track.
- `src/model.ts`, `src/graph.ts`: temporal helpers and geometry. `src/session.ts` and `src/storage.ts`: saved progress.
- `src/components`: app shell (`Sidebar`, `Topbar`), the investigation workspace (`InvestigationToolbar`, `Lab`, `Diagram`), `Atlas` and `SymbolDrawer`, and reference pages.
- `src/styles/`: global styles, split into numbered files imported in order by `src/styles.css`. Later files override earlier ones, so keep the order.
- `tests`: model and content consistency checks. `e2e`: Playwright browser tests.
- `docs/validation.md`: what has and has not been verified.

All names, RTL and stimulus are synthetic educational examples. Verdi is a Synopsys trademark; this is an independent educational tool.
