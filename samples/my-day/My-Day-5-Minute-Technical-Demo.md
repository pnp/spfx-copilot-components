# My Day: 5-minute developer and architecture demo

## Purpose

Use this walkthrough after the business demo or in a developer session. It explains what a SharePoint
Copilot Component is at code level and follows the My Day request from declarative-agent routing into
the SPFx host, React views, deterministic services, session state, and the final `.sppkg`.

The technical message is:

> **A Copilot Component combines conversational tool routing with a host-aware React application, and
> packages the agent definition and interactive UX as one SPFx solution.**

## Presenter setup

Open Microsoft Copilot or Copilot Workbench beside VS Code. Pin these files in order:

1. `copilot/declarativeAgent.json`
2. `copilot/instruction.txt`
3. `src/copilotComponents/myDay/MyDayCopilotComponent.manifest.json`
4. `src/copilotComponents/myDay/MyDayCopilotComponentProperties.ts`
5. `src/copilotComponents/myDay/MyDayCopilotComponent.ts`
6. `src/copilotComponents/myDay/components/MyDayApp.tsx`
7. `src/copilotComponents/myDay/components/MyDayThemeProvider.tsx`
8. `src/copilotComponents/myDay/services/IMyDayDataService.ts`
9. `src/copilotComponents/myDay/services/MockMyDayDataService.ts`
10. `src/copilotComponents/myDay/services/planMyDay.ts`
11. `src/copilotComponents/myDay/utils/settings.ts`
12. `package.json`

Keep a terminal in `samples/my-day` with a recent `npm run build` result available.

## Timed walkthrough

### 0:00-0:35 - Show what a Copilot Component is

**In Copilot:** Ask:

> **What does my day look like?**

**Say:**

> "A Copilot Component is an SPFx client-side component that Copilot can call as a tool. Unlike a
> normal text response, it owns a DOM element inside the Copilot canvas and renders an interactive UX.
> The SharePoint solution packages this component together with the declarative agent that routes the
> request."

### 0:35-1:15 - Show agent routing and the tool contract

**In code:** Open `declarativeAgent.json`, `instruction.txt`, the component manifest, and the properties
schema.

**Point out:**

- conversation starters and the plugin action in `declarativeAgent.json`
- routing guidance that prefers the My Day UX over a prose response
- `componentType: "CopilotComponent"` and `copilotType: "Ux"`
- the `MyDayTool` description and its compiled Zod schema reference
- declared `inline` and `fullscreen` capabilities

**Say:**

> "The declarative agent decides when to call the tool. The component manifest gives that tool a
> deployment identity, description, schema, and supported display modes. The optional `focus` input
> selects the actual summary, meetings, tasks, news, mail or read-only plan view. The old unused
> `message` scaffold input is gone; all four starter targets have explicit supported focus values."

### 1:15-2:00 - Show the SPFx host boundary

**In code:** Open `MyDayCopilotComponent.ts`.

**Point out:**

- `BaseCopilotComponent<IMyDayCopilotComponentProperties>`
- current user resolution from the SPFx page context
- host-owned theme, display mode, available modes, and `ownerDocument`
- one retained React 18 `createRoot`, root reuse and unmount-before-base teardown
- `requestDisplayModeAsync('fullscreen')`

**Say:**

> "This class is the adapter between Copilot and React. Host context is read fresh on every render,
> so the component never invents its own display mode. It can request full screen, but the host remains
> authoritative and later re-renders the component with the actual mode."

### 2:00-2:40 - Show mode-specific React and iframe-safe theming

**In code:** Open `MyDayApp.tsx` and `MyDayThemeProvider.tsx`.

**Point out:**

- the root selects `MyDayInline` or `MyDayFullscreen` while retaining drill-down, data, local task checks and panel state
- host state flows down through props instead of mirrored React state
- Griffel targets `context.domElement.ownerDocument`
- Fluent light/dark theme follows host context
- the one-time stable remount handles style insertion in hosted iframe documents

**In UX:** Expand to full screen or switch the host theme.

**Say:**

> "Inline and full screen are separate experiences selected by one small root. Styling is also host
> aware: Griffel inserts styles into the document that actually owns the component, which matters in
> Workbench and Copilot iframe hosting. A regression test verifies that boundary."

### 2:40-3:30 - Show the swappable data architecture

**In code:** Open `IMyDayDataService.ts` and `MockMyDayDataService.ts`.

**Point out:**

- one view-model aggregate returned through the service interface
- source-shaped mock meetings, tasks, mail, news, user, weather, and quick actions
- relative offsets resolved against the current clock
- pure mappers from source records to lean UI models
- current signed-in user replacing only the mock user shell

**Say:**

> "The React components do not fetch Graph directly. They consume one service contract. The mock
> implementation resolves relative times, maps source-shaped records, and returns a coherent daily
> model. A future Graph and SharePoint implementation can satisfy the same interface without changing
> the views."

### 3:30-4:15 - Show deterministic intelligence and local state

**In UX:** Open **Plan my day**, then open **Settings**.

**In code:** Open `planMyDay.ts` and `settings.ts`.

**Point out:**

- ranking of upcoming meetings, high-priority tasks, flagged mail, and focus time
- the same `IFocusPlan` contract a future live intelligence service can return
- reduced-motion-aware staged reveal in the Plan my day panel
- typed settings with guarded `sessionStorage`
- visible-panel state driving the responsive grid rather than only changing labels

**Say:**

> "The sample separates the intelligence contract from the presentation. Today `planMyDay` is a pure,
> deterministic function, so the result is explainable and reliable. Settings are intentionally
> session-only and they materially change the dashboard layout. Neither path writes to an external
> Microsoft 365 service."

### 4:15-5:00 - Show packaging and release gates

**In code:** Open `package.json`, `.npmrc`, and `scripts/validate-registry-dependencies.mjs`.

**In terminal:** Run or show the latest output from:

```bash
npm run build
```

**Expected proof:**

- dependencies use the approved public/Microsoft RC0 registry hosts with no committed credentials
- TypeScript and ESLint complete without warnings
- all 14 lifecycle, focus/state and owner-document Jest tests pass
- the declarative agent ZIP is generated
- a hashed JavaScript bundle is included in `sharepoint/solution/my-day.sppkg`

**Say:**

> "The release command validates dependency provenance, compiles and tests the React component,
> expands the agent package, and produces one deployable SharePoint package. The `.sppkg` carries both
> the Copilot tool UX and its declarative-agent assets, so deployment follows the familiar SharePoint
> App Catalog model."

## Architecture map

```text
Natural-language request
  -> declarative agent instructions and action
  -> MyDayTool in the Copilot Component manifest
  -> BaseCopilotComponent host adapter
  -> host context + signed-in user + tool properties
  -> MyDayApp display-mode selector
  -> inline summary OR full-screen dashboard
  -> IMyDayDataService
  -> time-relative mock records + pure mappers
  -> deterministic focus plan + session-only settings
  -> React UI inside the Copilot-owned document
```

## What is reusable

| Decision | Why it matters |
| --- | --- |
| Declarative agent plus component tool | Conversational routing can produce interactive UX instead of prose |
| `BaseCopilotComponent` host adapter | Keeps Copilot lifecycle and React application concerns separate |
| Dedicated inline and full-screen views | Each display mode can serve a different depth of task |
| Host-derived state through props | Theme and layout stay aligned with the actual Copilot host |
| Owner-document Griffel renderer | Styles load in the component's hosted iframe document |
| Service interface and pure mappers | Mock data can be replaced without rewriting UI components |
| Deterministic `IFocusPlan` contract | A future intelligence service can replace sample logic behind the same UX |
| Guarded session settings | Demonstrates stateful personalization without external persistence |
| Heft production package | Agent metadata and component assets deploy together as an `.sppkg` |

## Useful code references

- Agent definition: `copilot/declarativeAgent.json`
- Routing behavior: `copilot/instruction.txt`
- Tool identity and display modes: `src/copilotComponents/myDay/MyDayCopilotComponent.manifest.json`
- Tool schema: `src/copilotComponents/myDay/MyDayCopilotComponentProperties.ts`
- Copilot host adapter: `src/copilotComponents/myDay/MyDayCopilotComponent.ts`
- Display-mode selector: `src/copilotComponents/myDay/components/MyDayApp.tsx`
- Owner-document theming: `src/copilotComponents/myDay/components/MyDayThemeProvider.tsx`
- Inline experience: `src/copilotComponents/myDay/components/MyDayInline.tsx`
- Full-screen experience: `src/copilotComponents/myDay/components/MyDayFullscreen.tsx`
- Service contract: `src/copilotComponents/myDay/services/IMyDayDataService.ts`
- Mock implementation: `src/copilotComponents/myDay/services/MockMyDayDataService.ts`
- Source-to-view mapping: `src/copilotComponents/myDay/services/mappers.ts`
- Focus-plan logic: `src/copilotComponents/myDay/services/planMyDay.ts`
- Session settings: `src/copilotComponents/myDay/utils/settings.ts`
- Dependency provenance: `scripts/validate-registry-dependencies.mjs`

## Presenter guardrails

- This sample targets SPFx `1.24.0-rc.0`; describe it as preview technology.
- The single composed `MyDayTool` has a meaningful optional focus schema; do not call it six independently registered tools.
- Meetings, tasks, mail, news, weather, quick actions, and focus recommendations are deterministic
  sample data.
- Only the user's name and profile-photo URL come from the signed-in SharePoint context.
- `requestDisplayModeAsync` requests full screen; it does not let the component own host layout state.
- The local test proves style insertion behavior, not authenticated tenant CSP, focus, high contrast,
  or screen-reader behavior.
- Do not describe session settings or quick actions as writes to Graph, Outlook, To Do, or SharePoint.

## Technical rehearsal checklist

- [ ] Pin the twelve source files in the listed order.
- [ ] Confirm the prompt invokes `MyDayTool`.
- [ ] Show the manifest before implementation details.
- [ ] Expand once to demonstrate host-owned display mode.
- [ ] Toggle the host theme or point to `ownerDocument` rendering.
- [ ] Open Plan my day and explain deterministic ranking accurately.
- [ ] Change one setting and show that it changes the real layout.
- [ ] Keep recent warning-free `npm run build` output visible.
- [ ] Finish within five minutes and leave detailed implementation questions for Q&A.
