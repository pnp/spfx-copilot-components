# Design source — file-uploader mockups

`mock.html` is the single source for every PNG in `../../assets/design/`.
One file, one state switch, so a renamed field or a new department is a
one-line edit and a re-render — never edit the PNGs by hand.

- `mock.html` — the mock. Query string selects what to draw:
  `?state=<name>&theme=light|dark&narrow=0|1`. States are the keys of the
  `states` object at the bottom of the file (`inline-draft`, `inline-review`,
  `fullscreen-bulk`, `recent-selected`, …). Open it in any browser to preview.
- `render.mjs` — renders the fixed shot list at the repo's widths
  (narrow 340, standard 760, full-screen 1280; body padding adds 32px) at
  2× scale, full page, straight into `assets/design/`. It also reports any
  horizontal overflow or console error per shot.

## Render

The component now carries Playwright as a dev dependency (for
`capture:visual`), and `render.mjs` resolves it upward from this folder — so from
the component root, `node docs/design-src/render.mjs` needs no install.
The original folder-local setup still works:

```powershell
cd components\file-uploader\docs\design-src
npm init -y ; npm i playwright@1.47.0 ; npx playwright install chromium
node render.mjs
```

`package.json`, the lockfile and `node_modules` created here are ignored by
this folder's `.gitignore`. Only `mock.html`, `render.mjs` and this file are
versioned.

## Conventions the mock already follows (keep them)

Widths, type scale, three accents, semantic amber/green/red, radii 4–8, no
nested cards, no prompt echo, no host-only controls (no "collapse to inline"
button — the host owns that), relative time in sample copy, fictional
organisation *Brightwater Community Foundation*. If a change would break one
of these, the rule wins.

After re-rendering, update the design inventory so it still matches the
files on disk.
