# Validation record

- TypeScript check passed.
- Production bundle built with Vite 8.0.16.
- 19 automated model/content checks passed, including pre-edge sampling, pipeline history, hold versus same-value assignment, reset, bit slices, X masking, memory read-before-NBA-write, delayed mode comparison, marker consistency and geometry dimensions.
- Initial model tests were observed failing before implementation. Target-transition consistency regression was observed failing before the correction.
- Local package downloads were blocked. Dependencies already installed on this computer were copied into this isolated workspace and exact versions recorded in package.json.
- HDL simulator unavailable; RTL fixtures are manually reviewed, not simulator-certified.
- Initial local browser preview could not connect through the environment. Hosted publication attempted, blocked by Git DNS failure (`getaddrinfo() thread failed to start`). No live deployment is claimed.
- Self-contained offline HTML is produced by scripts/package-offline.mjs from the production bundle, with no runtime JavaScript/CSS dependencies.

## Review fixes

- Made the target transition dot derive from the same event fact as the inspector.
- Corrected control pin and mux-output geometry.
- Preserved nearest register boundaries in abstracted graphs.
- Added explicit settled-versus-event comparison for the delayed example.
- Distinguished external inputs from register storage in diagram labels.

## Limits

Drawings are simplified educational recreations. Installed-version legend fidelity remains unverified. Cycle and transition interpretations are curated teaching data, not proprietary analysis. Browser interaction verification remains pending if the standalone preview also cannot be opened.
