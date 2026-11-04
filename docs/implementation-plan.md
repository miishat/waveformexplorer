# Verdi Temporal Flow Explorer Implementation Plan

Goal: implement the user's approved specification as a React/TypeScript static teaching app.

Architecture: source-backed inventory and curated event fixtures feed custom SVG diagrams, source highlights, waveforms and inspectors. No arbitrary RTL/FSDB ingestion or claims of proprietary engine parity. Sites hosts the static build privately.

1. Research: preserve exact reference versions and newer-source limits in src/content/reference.ts. Inventory every illustrated notation with source and applicability before lessons.
2. Content: src/content/lessons.ts holds 12 typed examples, event snapshots, node roles, RTL lines, explanations and exercises. src/model.ts enforces method compatibility and temporal invariants.
3. UI: src/App.tsx manages routes/search/lesson navigation; components/Diagram.tsx renders three distinct representations and semantic selection; components/Lab.tsx coordinates event/source/wave panels; Reference and Atlas provide quick lookup.
4. Validate: tests cover nonblocking pre-edge sampling, hold versus same-value write, reset timing, partial bus, X masking, pipeline/feedback history, graph endpoints and method restrictions. Build TypeScript and browser-check keyboard, selection, routes, themes and narrow viewports.
5. Publish exact checked source through Sites helper. Document limits: simplified original illustrations and manually checked RTL unless a simulator is available.

Review focus: incompatible method/view combinations; hidden dependency selection; last-event bounds; X values not truthy booleans; small viewport overflow. User approved full written spec in conversation; implement without additional design gate.
