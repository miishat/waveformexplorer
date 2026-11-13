# Validation record

## Current state (November 2026)

- Deployed to GitHub Pages from `main` by `.github/workflows/deploy.yml`. The workflow runs Prettier, ESLint, the unit tests and the Playwright browser tests before building, so a failing check blocks the deploy.
- Unit tests (`tests/`) check fixture consistency and selected timing and logic expectations for every investigation.
- Browser tests (`e2e/`) solve the Check step of every investigation with its own answer key, and cover completing an investigation, a wrong locate answer, resuming after reload, theme persistence, the symbol dialog focus trap, and the core/expert split in the investigation picker.
- Accessibility: diagram nodes, pins and connections are keyboard-reachable buttons with names that include value, time, role and active state, and report selection through `aria-pressed`. Text contrast was checked in both themes against WCAG AA (4.5:1, or 3:1 for large text) with no failures.
- All exercises were reviewed for SystemVerilog and tracing correctness in November 2026; 23 corrections were made, and the three new core investigations (hazard, loop, netforce) were reviewed and corrected before release.
- HDL simulator still not used: RTL fixtures are manually reviewed, not simulator-certified.

## History

- Initial build: TypeScript check and Vite production build passed, and 20 model/content checks passed, including pre-edge sampling, pipeline history, hold versus same-value assignment, reset, bit slices, X masking, memory read-before-NBA-write, delayed mode comparison, marker consistency and geometry dimensions.
- Initial model tests were observed failing before implementation. Target-transition consistency regression was observed failing before the correction.
- The original build environment blocked package downloads and hosted publication. That environment's offline packaging script and hosting config have since been removed.

## Review fixes

- Made the target transition dot derive from the same event fact as the inspector.
- Corrected control pin and mux-output geometry.
- Preserved nearest register boundaries in abstracted graphs.
- Added explicit settled-versus-event comparison for the delayed example.
- Distinguished external inputs from register storage in diagram labels.
- Browser QA identified input-pin inspection showing the operation result. Fixed by resolving each distinct operand pin to its source value; added regression coverage.
- Browser tests found that closing the symbol dialog did not return focus to the card that opened it. Fixed.

## Limits

Drawings are simplified educational recreations. Installed-version legend fidelity remains unverified. Cycle and transition interpretations are curated teaching data, not proprietary analysis.
