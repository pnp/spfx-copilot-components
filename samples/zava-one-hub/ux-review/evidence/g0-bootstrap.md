# Zava One G0 Bootstrap Receipt

Validated 26 September 2026 in `samples/zava-one-hub`.

## Toolchain

- Node.js: `22.23.2` (supported package range `>=22.14.0 <23.0.0`)
- Yeoman: `5.1.0`
- SharePoint generator: `1.24.0-beta.5`
- Generator integrity: `sha512-6jXBOLc5QKQ4VnLmY3XdG+nX0MNhQMTA6d05aT7kh/jfxkIE0ktbmbe+XkchJ5iLk01y4OzZDiLv4QtkcpEctA==`
- SPFx packages: `1.24.0-beta.5`
- TypeScript: `5.8.3`
- React / ReactDOM: `18.3.1` / `18.3.1`
- React / ReactDOM types: `18.2.79` / `18.2.25`
- Fluent UI React Components / Icons: `9.74.9` / `2.0.314`
- Griffel React: `1.7.8`
- Framework-owned isolated React / ReactDOM under `@microsoft/sp-loader`: `17.0.1` / `17.0.1`

## Evidence

- `npm ls` reported one application React 18.3.1 runtime and the expected direct packages.
- `npx heft test --clean` passed before feature implementation.
- A generated C06 web-part/Copilot pair proved unique GUIDs, React roots, inline/full-screen display modes, and clean teardown.
- All final wrappers were subsequently generated with the same pinned beta.5 Yeoman generator; no scaffold was copied or renamed.
- The generator's web-part host defaults and Fluent v8 dependency were detected by focused audits and normalized by `scripts/configure-reference-hosts.mjs`.

## Known External Gate

Tenant-authenticated SharePoint, Teams, Copilot Workbench, CSP, iframe focus, and screen-reader host validation require the approved keynote tenant and remain open in `todo.md`.