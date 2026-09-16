# Planner Navigation Rules

Run `npx heft test --production` for TypeScript, lint, production compilation,
and all Jest suites. This does not rebuild the SharePoint solution package.

## Required Behavior

| Rule | Automated coverage |
| --- | --- |
| Query tool renders Myprojects, not creation. | MyprojectsExperience.test.tsx |
| Query, select plan, expand, then call creation with blank workbench fields: show creation, never the previous plan. | MyprojectsExperience.test.tsx |
| A fresh creation instance with identical arguments does not inherit completed creation state. | MyprojectsExperience.test.tsx |
| Legacy unscoped creation storage cannot override the creation panel. | MyprojectsExperience.test.tsx |
| Open project preserves the exact created plan ID and edited title before requesting fullscreen. | MyprojectsExperience.test.tsx |
| Fullscreen may use a different component instance ID; it must restore the opened project. | MyprojectsExperience.test.tsx |
| Close returns to Myprojects inline, including an explicitly requested replacement inline iframe. | MyprojectsExperience.test.tsx |
| A delayed native close returning to the original inline instance preserves Myprojects. | MyprojectsExperience.test.tsx |
| Already-fullscreen creation opens the project locally without a redundant mode request. | MyprojectsExperience.test.tsx |
| Rejected, consumed, or expired transfers must not reopen projects in later creation calls. | MyprojectsExperience.test.tsx; plannerSelection.test.ts |
| Transfers match both creation arguments and requested display mode. | plannerSelection.test.ts |
| Invalid or unavailable storage does not crash navigation. | plannerSelection.test.ts |
| Actual Myprojects rendering chooses the inline list in inline mode even with a selected plan. | Myprojects.test.tsx |
| Actual Myprojects rendering expands the selected/created plan, not the first plan in the results. | Myprojects.test.tsx |
| Loading the created plan must not temporarily expand an unrelated plan. | Myprojects.test.tsx |
| An inline-only host receives no fullscreen request. | Myprojects.test.tsx |

## Test Boundaries

- Lifecycle tests run the real experience router, creation navigation hook, and
  storage utilities. They mock the creation form and Myprojects leaf component.
- Rendering tests run the real Myprojects component and its view-selection logic.
  They mock Graph data, styling/measurement hooks, and inline/expanded leaf views.
- Storage tests exercise serialization, matching, expiry, consumption, isolation,
  cancellation, and blocked storage.
- These are not authenticated Copilot browser tests. They do not verify native
  Planner loading, Graph writes, or the host's actual iframe/storage behavior.

## Live Host Checks

1. Call MyprojectsTool, select a non-first plan, expand, and close. Confirm the
   selected plan is shown expanded and the project list is shown inline on close.
2. Call CreatePlannerProjectTool with
   `{"operation":"create","projectName":"","startDate":"","template":"basicPlan"}`.
   Confirm the creation form appears, not the previous plan.
3. With an explicitly authorized test plan, complete creation and click Open
   project. Confirm Planner/Gantt shows that exact plan, including when the host
   replaces the iframe.
4. Close using the app control and separately the host control after more than
   30 seconds. Confirm Myprojects inline, not the creation form.
5. Invoke creation again with the same arguments. Confirm a fresh creation form.

The cross-instance transfer is one-use, destination-mode-specific, and expires
after 30 seconds. Same-origin sessionStorage must be shared between frames.
Without a stable host invocation identifier, simultaneous identical creation
requests targeting the same mode cannot be distinguished perfectly. A native
close that creates an entirely new inline ID without an app close callback also
requires live-host verification; do not infer that guarantee from these tests.