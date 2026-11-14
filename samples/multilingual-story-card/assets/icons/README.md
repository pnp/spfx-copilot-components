# Icons

Sources for the app icons (the "cosmo tag": two luggage tags, magenta in front of orange). The PNGs
are rendered from these with `rsvg-convert`:

| File | Rendered to | Used by |
| --- | --- | --- |
| `app-magenta-orange.svg` | `copilot/color.png` (192 × 192) | Teams / Copilot: the agent's colour icon |
| `app-magenta-orange.svg` | `sharepoint/images/AppIcon.png` (96 × 96) | SharePoint app catalog (`iconPath` in `config/package-solution.json`) |
| `tag-filled-24.svg`, fill set to white | `copilot/outline.png` (32 × 32) | Teams: the outline icon (white on transparent) |
| `tag-regular-24.svg` | — | Kept for a slot that wants the line version; at 32 px and below the filled one reads better |

```
rsvg-convert -w 192 -h 192 assets/icons/app-magenta-orange.svg -o copilot/color.png
rsvg-convert -w 96 -h 96 assets/icons/app-magenta-orange.svg -o sharepoint/images/AppIcon.png
sed 's/fill="#242424"/fill="#FFFFFF"/' assets/icons/tag-filled-24.svg | rsvg-convert -w 32 -h 32 -o copilot/outline.png
```
