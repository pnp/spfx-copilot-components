# Copilot Components - UX in Copilot canvas

[![Copilot Components: interactive experiences that bring answers, actions, and rich business workflows directly into the Copilot canvas](./assets/copilot-components-github.png)](https://pnp.github.io/spfx-copilot-components/)

**[Explore the Copilot Components gallery](https://pnp.github.io/spfx-copilot-components/)**

This repository contains Microsoft and community provided samples that demonstrate how to build, extend, and customize **Copilot experiences for Microsoft Copilot**. The goal is to provide a curated, open collection of reusable SPFx Copilot components that help you get started faster when building Copilot UX components in the Microsoft Copilot canvas.

See more details from the announcement blog post at [Going beyond text in Microsoft 365 Copilot – Introducing SharePoint Copilot Apps](https://devblogs.microsoft.com/microsoft365dev/going-beyond-text-in-microsoft-365-copilot-introducing-sharepoint-copilot-apps/).

> [!NOTE]
> This repository is a community effort, maintained together with the [Microsoft 365 & Power Platform Community](https://aka.ms/community/home). Samples are provided _as is_ and are not officially supported products. See [SUPPORT.md](./SUPPORT.md) for details.

## Fast path to testing

**Ready-built packages.** Several samples include a ready-built `.sppkg` file under `sharepoint/solution/`. Follow that sample's README to upload the package to your tenant App Catalog and deploy the scenario without building it from source first. Sample-specific setup, permissions, and data prerequisites still apply.

**No Microsoft Copilot add-on is required during public preview.** You can build, deploy, and run Copilot UX components without a Microsoft Copilot add-on license or configuring consumption-based Copilot billing. An eligible Microsoft 365 user license, a SharePoint tenant, and the required deployment permissions are still needed. Optional services used by an individual sample, such as Microsoft Graph, external APIs, added knowledge sources, or Copilot Studio capabilities, can have separate licensing or usage costs. See the [official Copilot UX components preview guidance](https://learn.microsoft.com/sharepoint/dev/spfx/copilot/get-started/build-your-first-copilot-app#prerequisites).

## Get moving

- **Try** - [Test and demo Copilot UX components in minutes - in any Microsoft 365 tenant](https://www.youtube.com/watch?v=4asOZi4PNUQ)
- **Explore** - [Copilot Just Got a Body: Real Enterprise Apps, Live Inside the Canvas](https://www.youtube.com/watch?v=sq2HRK1J3_o)
- **Build** - [Creating your first Copilot UX component - Tutorial](https://www.youtube.com/watch?v=1TaK6osdvc0)

## What you'll find here

Each sample lives in its own self-contained folder under the [`samples`](./samples) directory and includes:

- A clear `README.md` describing what the sample does and how to run it.
- The complete source code required to build and deploy the sample.
- A mandatory `assets` folder containing a `sample.json` metadata file and at least one locally stored image referenced by its `thumbnails` collection. The first image by ascending `order` is used as the gallery preview; its filename can be chosen to fit the sample.

## Using the samples

To build and run these samples, you'll need to clone the repository and work within an individual sample folder.

Clone this repository:

```bash
git clone https://github.com/pnp/spfx-copilot-components.git
```

Navigate into the cloned repository:

```bash
cd spfx-copilot-components
```

Move into the sample you want to use, replacing `sample-folder-name` with the name of the sample:

```bash
cd samples
cd sample-folder-name
```

Each sample folder contains its own `README.md` with the exact prerequisites, build steps, and deployment instructions for that specific sample. Always follow the instructions in the sample's own `README.md`, as requirements may differ between samples.

## Contributing

### Zava RC0 readiness

The [RC0 upgrade report](./RC0-updates.md) tracks eight Zava samples contributed by Vesa Juvonen and My Day:
SPFx 1.24 RC0 / React 18, source and deployment-package validation, intent/starter ownership, refreshed
visuals, and remaining authenticated release gates. Other contributors' samples retain their own
documented framework versions.

Source builds of these prereleases require an approved Microsoft RC0 npm registry; public npm did not
provide the requested SDK version during validation. See the report for provenance and release gates.
Ready-built sample packages do not require a local source restore.

These samples come directly from Microsoft and the broader community. We welcome your contributions, issue reports, and suggestions for new samples.

Before submitting a pull request, please review the [Contribution Guidance](./CONTRIBUTING.md) so we can process your contribution as quickly as possible. You can use the assets in the [`templates`](./templates) folder as a starting point for your own sample.

All contributors on this repository will be acknowledged with special Copilot UX components Credly badge.

![SharePoint Skills Credly Badge](./assets/contributor-badge.png)

## Have issues or questions?

Before submitting an issue, determine whether it is a general SharePoint or SharePoint Framework issue, or an issue with a specific sample in this repository:

- For a general question or challenge with SharePoint Copilot Apps or the SharePoint Framework, submit the issue to the [SharePoint developer documentation issue tracker](https://github.com/SharePoint/sp-dev-docs/issues). Do not submit generic issues to this repository.
- For an issue with a specific sample in this repository, use the [sample issue form](https://github.com/pnp/spfx-copilot-components/issues/new?template=sample-issue.yml). Include the affected sample, exact reproduction steps, expected and actual behavior, and relevant environment details.

## Additional resources

- [Going beyond text in Microsoft 365 Copilot – Introducing Copilot UX components](https://devblogs.microsoft.com/microsoft365dev/going-beyond-text-in-microsoft-365-copilot-introducing-sharepoint-copilot-apps/)
- [Build agents for Microsoft Copilot](https://learn.microsoft.com/microsoft-365-copilot/extensibility/)
- [Overview of the SharePoint Framework](https://learn.microsoft.com/sharepoint/dev/spfx/sharepoint-framework-overview)
- [SharePoint Framework development tools and libraries](https://learn.microsoft.com/sharepoint/dev/spfx/tools-and-libraries)
- [Set up your Microsoft 365 development environment](https://learn.microsoft.com/sharepoint/dev/spfx/set-up-your-developer-tenant)

## Code of Conduct

This repository has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**

> Sharing is caring!
