# My Day workspace instructions

Follow the [synchronized creation guide](../agentic-creation-rules.md) for the current
SPFx 1.24.0-rc.0, React 18.3.1, Fluent UI v9 and Griffel baseline. The repository golden
guide is authoritative; do not restore obsolete React 17 or legacy render APIs.

- This is one composed, read-only daily-cockpit Copilot Component, not a web part.
  Preserve its generated identity and `MyDayTool` name. Optional `focus` selects a
  visible facet of that same experience; it is not a new independently registered tool.
- Use one retained `createRoot` per host DOM element and unmount before base teardown.
  Passive theme, dimensions and display-mode changes must not discard drill-down state.
- Declare children explicitly on wrapper props. DOM tests use client roots and `act`
  from React, with the React act environment enabled.
- Host context owns inline/fullscreen state. Never request a mode the host does not
  advertise, and never use raw parent-window messaging.
- Mock data stays behind the existing data-service interface. Do not install PnPjs,
  PnP controls, live Graph integrations or unrelated dependencies speculatively.
- Keep conversation starters, supported focus values, agent instructions and packaged
  output consistent. Unsupported or unused tool properties must not be advertised.
- Preserve deterministic, read-only focus planning and session-only settings. A prompt
  must not complete tasks, change meetings, send mail or perform external writes.
- Run the documented production build, root lifecycle/behavior tests, browser visual
  checks and final `.sppkg`/agent audits. Keep only deployment packages and intentional
  evidence; ignore generated/debug output and the local agent hotfix fingerprint.
- Local validation does not certify authenticated Copilot routing, CSP, focus restoration
  or host screen-reader behavior. Record these remaining release gates explicitly.
