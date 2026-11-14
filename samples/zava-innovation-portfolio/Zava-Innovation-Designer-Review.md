# Zava Innovation Hub - designer review guide

Review the implemented React experience, not historical references. Current RC0 evidence is
`assets/gallery-evidence.json` (11 curated publication captures) and `assets/intent-evidence.json`
(all 17 tools at standard/narrow/dark, seven flows at review/receipt, gate decisions, and no-match).
The August `visual-evidence.json` and Workbench artifacts are historical, not fresh RC0 evidence.

## Review goals

1. Does each inline component communicate its business job before interaction?
2. Does the hierarchy remain clear at 760 px and 390 px?
3. Does full screen feel like one premium product across five role-based work areas?
4. Does Enterprise Insights deliver a keynote-level portfolio overview without becoming an equal-card grid?
5. Do consequential actions clearly separate evidence, decision, confirmation, and receipt?
6. Does recognition reward verified impact rather than popularity?

## Primary screens

| Experience | Evidence |
| --- | --- |
| Enterprise Insights keynote | `assets/ux-fullscreen-enterprise.png` |
| Recognition review | `assets/intent-visuals/CelebrateInnovationImpact-standard-review.png` |
| My Innovation | `assets/ux-fullscreen-my.png` |
| Programs & Pilots | `assets/ux-fullscreen-programs.png` |
| Reviews & Gates | `assets/ux-fullscreen-reviews.png` |
| Investment | `assets/ux-fullscreen-investment.png` |
| Incoming review queue | `assets/ux-inline-GetInnovationReviewQueue.png` |
| Review detail | `assets/intent-visuals/ReviewIdeaGate-standard.png` |
| Gate confirmation | `assets/intent-visuals/ReviewIdeaGate-standard-confirm.png` |
| Gate receipt | `assets/intent-visuals/ReviewIdeaGate-standard-receipt.png` |
| Recognition composer | `assets/intent-visuals/CelebrateInnovationImpact-standard.png` |

Every catalog intent has `assets/intent-visuals/<IntentName>-standard.png`, `-narrow.png`, and `-dark.png`.

## Visual language

- Deep grape anchors governance and navigation.
- Marigold signals creative energy, selection, and stage progression.
- Semantic green, amber, and red are reserved for outcomes and risk.
- Operational surfaces use 4-8 px radii and restrained elevation.
- Analytical regions remain unframed or singly bounded; there are no nested card stacks.
- Named people appear where ownership, review, funding, experiments, or recognition matter.

## Interaction review

- Use Up/Down arrow keys in the full-screen icon tabs.
- Toggle Compact and confirm density changes without losing context.
- In Program growth, switch submissions, conversion, and value.
- In Reviews & Gates, select each phase and status bucket.
- The queue is inspection-only. Invoke ReviewIdeaGate to complete Approve, Send back, and Decline;
  every decision requires a human rationale and explicit confirmation.
- In Celebrate impact, name contribution/source and edit the message before review/confirmation.
  Enterprise Insights is read-only and has no acknowledgement mutation.
- Use Reset demo data before another review session.

## Accessibility states

Current automated evidence covers standard/narrow/dark and curated full-screen role defaults, with
runtime/overflow/broken-image checks and mode/theme draft retention. Reduced-motion capture is used.
Forced colors, 200% scale, screen readers, and full keyboard rehearsal require fresh accessibility
review; do not infer those results from historical screenshots. Confirm:

- Focus remains visible against grape, marigold, and neutral surfaces.
- No meaning depends only on color.
- Chart labels remain useful without hover.
- Reduced motion reveals final states immediately.
- Forced colors preserve selected navigation and decision boundaries.

Authenticated Copilot Workbench testing remains a separate gate for iframe focus, host display mode, CSP, screen-reader output, and model routing.

## Feedback format

Record findings with: screenshot, viewport, theme, intent/lens, expected hierarchy, observed issue, severity, and proposed change. Distinguish product-scope requests from polish defects so the approved 16+1 scenario catalog does not drift accidentally.
