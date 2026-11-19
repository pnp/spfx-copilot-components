# Zava One - ten-minute technical demo

## Goal and setup

Show how one intent maps to a generated SPFx component, a shared React body, a composed workspace,
and an explicit fixture-only decision. Separate source contracts, executed local checks, historical
evidence, and authenticated host acceptance.

Before presenting, complete [operations](./demo-operations.md), open the linked files below, and keep
the terminal output from successful checks. Do not spend the ten minutes waiting for a full build.
Use [the intent matrix](../docs/intent-component-mapping.md) as the navigation sheet.

## 0:00-1:15 - From business language to one component

Open [the catalog](../config/zava-capabilities.mjs) beside the
[complete matrix](../docs/intent-component-mapping.md#complete-business-intent-matrix).

Trace **C35**:

```text
"Show vacation requests waiting for my decision."
  -> ReviewVacationRequests (tool)
  -> ReviewVacationRequestsCopilotComponent (SPFx entry)
  -> intent = vacationApprovals
  -> VacationApprovalsExperience (shared React body)
  -> personal/vacation-approvals (logical catalog route)
```

Contrast **Which approvals need me?** (C05) and **Draft my own leave** (C16).
The agent selects the tool; this is not a string-matching runtime router.

Run `npm run check:routing-collisions`. Explain its 13 source boundary pairs, 35 documentation
mappings/boundaries, and six canonical starter targets. This does **not** execute model routing.

## 1:15-2:30 - Generated identities, shared bodies

Open:

- [C35 entry](../src/copilotComponents/reviewVacationRequests/ReviewVacationRequestsCopilotComponent.tsx)
- [C35 web part](../src/webparts/vacationRequestApprovals/VacationRequestApprovalsWebPart.ts)
- [App dispatcher](../src/shared/components/ZavaOneApp.tsx)
- [Generator](../scripts/configure-reference-hosts.mjs)

The two wrappers supply an immutable intent to shared code. The generator owns wrapper content,
tool descriptions/schemas, and bundle/host registration after Yeoman creates the identities.
Changing a tool means updating its source contract and regenerating, not hand-editing generated files.

There are **75 SPFx identities**: 35 feature web parts + 3 workspace web parts + 37 Copilot Components.
The 37 are **35 business tools + workspace + Explorer**, not 37 separate business capabilities.

## 2:30-3:40 - React lifecycle and the honest expansion boundary

Open the [Copilot host base](../src/shared/hosts/ZavaOneCopilotComponentBase.tsx),
[web-part host base](../src/shared/hosts/ZavaOneWebPartBase.ts), and
[workspace](../src/shared/components/ZavaOneExperiences.tsx).

- React 18 roots persist across host rerenders and explicitly unmount on teardown/disposal.
- The host supplies its owner document and theme; full screen is requested, not locally asserted.
- Inline renders the focused body. Full screen switches to the composed Company/Personal workspace.
- The owning tab is derived from the capability catalog. Workspace children omit `toolProperties`.
  Therefore an outer persistent root does **not** imply selected-record or draft continuity.
- Tool schemas advertise some inputs that active bodies do not consume. Show the
  [consumption limits](../docs/intent-component-mapping.md#current-consumption-limits), especially
  C14 and C35. Do not demonstrate seeded defaults as proof of prompt prefilling.

Say: **"We distinguish the intended routing contract from what the running adapter actually carries."**

## 3:40-5:10 - Execute the safe decision

Open the C35 inline local route from [operations](./demo-operations.md#offline-fallback).

1. Reset; verify 4 pending / 2 processed (two processed records are seeded).
2. Open Johanna: `vac-1043`, 3 workdays, 11 -> 8 days, coverage **attention**.
3. Review, explicitly approve, inspect `ZAVA-LEAVE-1043`, then verify 3/3 in the queue.
4. Reset for the next run.

Open [ZavaSessionStore](../src/shared/services/ZavaSessionStore.ts) and its
[tests](../src/shared/services/ZavaSessionStore.test.ts).
Show pending-only decisions, decline-reason validation, revision increment, event notification,
`useSyncExternalStore`, and session-storage persistence.

This store is shared within one runtime; browser session storage is not a cross-host backend.
Other forms use mounted local state and may reset on remount/reload. A fixture receipt is never an
HR, finance, workplace, or ITSM submission.

## 5:10-6:20 - Real interaction and visual ownership

- Sales: use **Region** EMEA -> APAC; bookings **EUR 5.1M -> EUR 3.9M** and series geometry change.
  Its current trend is React-owned SVG; Period does not select a different series.
- Offices: use the map and equivalent buttons to select one office; show bundled geography and a
  fixed-instant IANA clock, not a live location service.
- Optional Equity cut: keyboard-select a D3 bar and inspect the exact-value table, keeping the
  received/estimated distinction visible. A currency label is not a live FX conversion.

Source: [Company experiences](../src/shared/components/CompanyCapabilityExperiences.tsx),
[personal workflows](../src/shared/components/PersonalWorkflowExperiences.tsx), and
[D3 chart](../src/shared/components/DecisionBarChart.tsx) and
[office map](../src/shared/components/OfficeMap.tsx).

## 6:20-7:20 - Three hosts, not three implementations

Show [bundle configuration](../config/config.json) and
[publisher configuration](../src/shared/catalog/webPartConfigurations.ts).

- 35 feature web parts: SharePoint web-part host only.
- Three composed workspace web parts: SharePoint web part/full page, Teams host support.
- Distributed Teams ZIPs: **personal-only**, despite the wrappers advertising TeamsTab support.
- Two host-specific bundles keep the Copilot runtime out of ordinary web parts.
- Top Actions/property panes are publisher controls, not prompt inputs. Workbench does not render
  Top Actions; use a real modern SharePoint page or inspect the configuration without claiming host proof.

## 7:20-8:20 - Dynamic tool discovery and bridge scope

Open [agent instructions](../copilot/instruction.txt), [plugin](../copilot/ai-plugin.json), and
[C35 schema](../src/copilotComponents/reviewVacationRequests/ReviewVacationRequestsCopilotComponentProperties.ts).

GA uses one `RemoteMCPServer` runtime with dynamic discovery: the plugin's static `functions` array
is empty. The **37 source tools** live in component manifests/schemas.
Six starters are curated entry points, not a platform cap.

News detail's **Ask Copilot about this story** sends a user-triggered follow-up. The local harness
records it without running a model. Do not claim the Revenue sample's general text-summary or
component-handoff protocol exists here.

## 8:20-9:30 - Reproducible checks, not borrowed evidence

Show prepared output for the checks actually run:

```powershell
npm run check:routing-collisions
npm run check:publication
npm run validate
npm run build
```

`build` already includes `validate`, clean production tests, packaging, dynamic-plugin/schema audit,
package audit, and release-evidence checks. A separate `check:responsive` run needs the UX server;
the build reads existing responsive evidence rather than replaying all browser states.

Use [release readiness](../docs/release-readiness.md) to distinguish the recorded 50-test result,
4,080-state responsive report, 39 engineering captures, and 15 publication captures from new results.
Exact package size/hashes come from the committed matrix; its old profile/host fields are not GA
certification. Do not regenerate an evidence timestamp to make an old rehearsal appear current.

## 9:30-10:00 - The boundary and next step

Say: **"This is an offline employee-experience reference with shared code and human confirmation.
Production needs authorized providers, durable workflow, and host-level acceptance. The remaining
gates are explicit rather than hidden behind a demo-ready badge."**

Open [the finalization checklist](../todo.md#remaining-release-gates). Name the next concrete gate:
authenticated GA routing and expansion rehearsal, followed by host accessibility and clean-release
evidence. Do not claim that documentation work completed those checks.

## Five-minute cut

Keep the C35 catalog trace (45s), shared host/expansion boundary (60s), full decision (90s),
dynamic MCP/host isolation (45s), and executed checks/remaining gates (60s).
Leave visual and publisher tours for questions; never omit explicit confirmation.
