# Ten-minute technical demo

## Message

Zava One uses generated SPFx identities and thin host adapters around shared React experiences. A
canonical catalog owns routing and packaging, while deterministic fixtures, explicit confirmation, and
executable evidence make the sample reliable to review.

## Setup

- Open `config/zava-capabilities.mjs`, `src/shared/components/ZavaOneApp.tsx`, and the local UX harness.
- Keep a terminal at the sample root.
- Stop `npm start` before running a clean build.

## Script

### 0:00-1:15 — Catalog-owned identity and routing

Open `config/zava-capabilities.mjs`.

Say: "Thirty-five capability records own the stable ID, intent, route, operation, grammar, web-part
name, Copilot name, prompt, positive trigger, and nearest-sibling exclusion."

Show these collision examples:

| Prompt | Tool | Route | Excluded sibling |
| --- | --- | --- | --- |
| **Which approvals need me?** | `ShowMyApprovals` | `personal/approvals` | Vacation approvals |
| **Show vacation requests waiting for my decision.** | `ReviewVacationRequests` | `personal/vacation-approvals` | Own time-off request |
| **Find the parental leave policy for Finland.** | `FindCompanyKnowledge` | `company/knowledge` | Glossary definition |
| **What does CXR mean at Zava?** | `FindCompanyTerm` | `company/glossary` | Broader policy search |

Run `npm run check:routing-collisions` and point out the 13 tested collision pairs.

### 1:15-2:30 — Shared UI, distinct host adapters

Open `src/shared/components/ZavaOneApp.tsx` and the two host bases.

- `ZavaOneWebPartBase` owns SharePoint properties, Top Actions, property panes, rendering, and teardown.
- `ZavaOneCopilotComponentBase` owns display mode, model context, follow-up, resize, and teardown.
- Both render the same `ZavaOneApp` intent branch.
- Both use React 18 `createRoot` and explicit `unmount`.
- `ZavaErrorBoundary` provides a no-submit fallback and route/theme reset key.

Run `npm run check:react-baseline` and point out the exact RC0/React 18 pins and allowlisted
framework-internal React 17 copies.

### 2:30-3:30 — Host and bundle isolation

Show the three workspace manifests and one feature manifest.

- 35 feature web parts: `SharePointWebPart` only.
- Three workspace web parts: SharePoint web part/full page plus Teams personal and channel tabs.
- 37 Copilot Components: inline/full-screen.
- Separate `zava-one-webparts` and `zava-one-copilot-components` bundles.

Say: "Feature web parts never pull the Copilot runtime into ordinary SharePoint pages."

### 3:30-5:00 — Safe state transition

Open C35 in the local harness and reset it.

1. Point to 4 pending / 2 processed.
2. Open Johanna Lorenz by selecting her request row.
3. Select **Review decision**.
4. Select **Approve vacation request**.
5. Read **Session-only demo update** on the receipt.
6. Return to the queue and verify 3 pending / 3 processed.

Open `src/shared/services/ZavaSessionStore.ts`.

Say: "Draft state remains local. Explicit confirmation creates one deterministic decision event and
publishes it through `useSyncExternalStore`."

### 5:00-6:15 — Visualization and accessibility equivalence

Open Offices and select Singapore, Los Angeles, then Helsinki.

- Map markers and the button list control the same selected office.
- IANA zones derive local time from one injected fixture instant.
- The map has a title/description and keyboard-operable markers.

Then open Equity as an optional code view:

- D3 bars are keyboard-selectable.
- The exact-value table remains available beneath the chart.
- Received values and estimates are labeled separately.

Do not claim the Sales trend is bar-clickable; demonstrate its Region and Period selectors instead.

### 6:15-7:15 — Publisher and employee configuration

Show `src/shared/catalog/webPartConfigurations.ts`.

- Every business capability has publisher defaults.
- Company News exposes six layout choices.
- High-use choices appear as Top Actions; advanced settings open the property pane.
- Combined/Company/Personal workspace modes remain immutable.

State explicitly: hosted Workbench does not render Top Actions. Show this step only on a real modern
SharePoint page, or use the configuration catalog as local evidence.

### 7:15-8:20 — Agent packaging

Open `copilot/declarativeAgent.json` and `copilot/instruction.txt`.

- Six conversation starters cover news, knowledge, praise, sales, offices, and Explorer.
- Explorer is last.
- Instructions route all 37 source tools and prefer the narrowest tool.
- Tool parameters filter or prefill; they never authorize a write.

Run `npm run check:generated-plugin`.

### 8:20-9:30 — Evidence pipeline

Run or show the latest output from:

```bash
npm run validate
npm run check:package-output
```

Call out:

- 42 tests / 0 failures, plus 4,080 passing responsive browser states;
- 75 unique SPFx manifests;
- 35 capabilities and 37 plugin functions;
- 13 routing collision pairs;
- 39 engineering screenshots and 15 reviewed publication images (12 local, three authenticated Teams);
- 28 provenance-checked media assets;
- one validated version `1.0.0.15`, 110-entry SPPKG and three personal-only Teams app ZIPs.

### 9:30-10:00 — Honest boundary

Close with: "This proves the fixture sample and package locally, plus the author's working Teams
personal-app baseline and authentic screenshots. Modern
SharePoint Top Actions, host screen-reader behavior, CSP/focus integration, and live providers remain
explicit external gates."

## Questions to anticipate

| Question | Answer |
| --- | --- |
| Why fixtures? | Repeatable review without permissions, data leakage, network dependency, or synthetic live success. |
| Why 35 pairs? | SharePoint authors get independently configurable web parts; Copilot gets narrow intent tools over the same capability code. |
| Why three Teams apps only? | Teams exposure is reserved for coherent composed workspaces, not every small feature. |
| Where does state live? | Invocation-local drafts plus an evented session-local fixture store; no cross-device promise. |
| Is this production-ready? | No. It is an approval-ready preview sample with explicit tenant and provider gates. |