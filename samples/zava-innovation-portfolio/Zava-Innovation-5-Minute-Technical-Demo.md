# Zava Innovation Hub - 5-minute technical demo

## 0:00-0:45 - Immutable component catalog

Show `src/shared/catalog.ts`, `scripts/configure-intents.mjs`, and `scripts/validate-intents.mjs`. Explain 17 Yeoman-generated identities, unique GUIDs, one business scenario per tool, positive/negative routing boundaries, and one shared SPFx bundle.

## 0:45-1:30 - Shared host and theming

Show `InnovationCopilotComponentBase.tsx` and `InnovationThemeProvider.tsx`. Explain React 18, Fluent UI v9, Griffel targeting `ownerDocument`, host-authoritative full-screen mode, and component teardown.

## 1:30-2:20 - Purpose-built React UX

Show `InnovationExperiences.tsx` and `operations.ts`: seven separate controlled domain forms share only the review/confirmation frame. Change business-case cost/confidence to recalculate payback, exceed the capital envelope, or miss a pilot threshold. Show the retained primary body in `PremiumInnovationApp.tsx`, the five-lens shell, and the preserved analytical visuals.

## 2:20-3:10 - Deterministic decisions

Show `ReviewDecisionCenter.tsx`. The queue inspects only. Invoke `ReviewIdeaGate` with `IDEA-014`, inspect its actual gaps, choose Approve/Send back/Decline, enter rationale, and explicitly confirm. Show the receipt and updated local queue. An unknown ID remains no-match and publishes that context; it cannot silently select IDEA-001.

## 3:10-3:45 - Mock graph and session actions

Show `domain.ts`, `media.ts`, and `sessionStore.ts`. Explain 120 deterministic idea records, named overlays, separate curated queue and aggregate snapshots, packaged portraits, and immutable source data. Semantic receipts are in memory only, do not update other dashboards, and are cleared by reload or Reset demo data. No tenant write or notification occurs.

## 3:45-4:25 - Visual evidence

Show `scripts/visual-harness`, `assets/gallery-evidence.json`, and `assets/intent-evidence.json`. The current source-hash-backed evidence covers every intent at standard/narrow/dark, five curated full-screen defaults, all seven reviewed and receipt states, gate confirmation/receipts, and unknown IDs. Browser checks verify no overflow/broken images/runtime errors and actual draft retention across theme/mode changes. Older August artifacts are historical, not RC0 proof.

## 4:25-5:00 - Build and production boundary

Run `npx tsc --project scripts\visual-harness\tsconfig.json` and `npm run build`. Explain portable narrowed schemas, immutable tool identities, source-hash gallery checks, production audit, all discovered Jest tests, zero-warning compilation/lint, generated-plugin audit, package hashes, and fresh agent ZIP/SPFx package. Tenant routing, extraction, CSP/bridge support, iframe focus, screen readers, permissions, live services, and portrait rights remain external gates.
