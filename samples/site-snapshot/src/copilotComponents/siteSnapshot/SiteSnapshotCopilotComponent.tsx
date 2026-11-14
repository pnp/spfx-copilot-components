import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { BaseCopilotComponent, createCopilotTextContent } from '@microsoft/sp-copilot-component';
import type { SPCopilotDisplayMode } from '@microsoft/sp-copilot-component';
import type { MSGraphClientV3 } from '@microsoft/sp-http';

import SiteSnapshot from './components/SiteSnapshot/SiteSnapshot';
import type { ISiteSnapshotProps } from './components/SiteSnapshot/ISiteSnapshotProps';
import type { ISiteSnapshotCopilotComponentProperties } from './SiteSnapshotCopilotComponentProperties';

import { SiteSnapshotService } from './services/SiteSnapshotService';
import { ISiteSnapshotService } from './services/ISiteSnapshotService';
import CsvExport from './utils/CsvExport';
import Formatters from './utils/Formatters';
import { buildModelContextText, buildStructuredContext } from './utils/ModelContext';
import { IAnalyzeArgs, ISiteSnapshot } from './models';

const DEFAULT_STALE_MONTHS = 6;
const DEFAULT_LARGE_MB = 100;

/**
 * Site Snapshot Copilot Component.
 *
 * Thin host class: it fetches the snapshot in onInit (brokered Graph via
 * MSGraphClientV3, with a sample-data fallback), then mounts the React UI and
 * wires the export and email actions. All UI lives in components/, all data
 * access behind the service.
 */
export default class SiteSnapshotCopilotComponent extends BaseCopilotComponent<ISiteSnapshotCopilotComponentProperties> {
  private _root: Root | undefined;
  private _service: ISiteSnapshotService | undefined;
  private _snapshot: ISiteSnapshot | undefined;
  private _userEmail: string = '';

  protected async onInit(): Promise<void> {
    const graph: MSGraphClientV3 = await this.context.msGraphClientFactory.getClient('3');
    this._service = new SiteSnapshotService(graph);

    // The recipient default for the "Email me this" action.
    try {
      const me: { mail?: string; userPrincipalName?: string } = await graph
        .api('/me')
        .select('mail,userPrincipalName')
        .get();
      this._userEmail = me.mail || me.userPrincipalName || '';
    } catch {
      this._userEmail = '';
    }

    const args: IAnalyzeArgs = {
      siteUrl: this.properties.siteUrl,
      staleMonths: this.properties.staleMonths || DEFAULT_STALE_MONTHS,
      largeMb: this.properties.largeMb || DEFAULT_LARGE_MB
    };
    const currentSiteUrl = this.context.pageContext?.web?.absoluteUrl || '';
    this._snapshot = await this._service.getSnapshot(args, currentSiteUrl, Date.now());
    await this._shareWithModel(this._snapshot);
  }

  protected render(): void {
    const props: ISiteSnapshotProps = {
      snapshot: this._snapshot,
      isFullscreen: this.hostContext.displayMode === 'fullscreen',
      theme: this.hostContext.theme || 'light',
      // The chat can ask the dashboard to open a specific view (see the tool's
      // "focus" parameter). Passed straight through to the UI.
      focus: this.properties.focus,
      targetDocument: this.context.domElement.ownerDocument,
      onOpenFull: async () => {
        await this.requestDisplayModeAsync('fullscreen' as SPCopilotDisplayMode);
      },
      onExport: () => this._exportCsv(),
      onEmail: async () => {
        if (!this._service || !this._snapshot) return false;
        return this._service.emailSnapshot(this._snapshot, this._userEmail);
      }
    };

    if (!this._root) {
      this._root = createRoot(this.context.domElement);
    }
    this._root.render(React.createElement(SiteSnapshot, props));
  }

  protected async onTeardown(): Promise<void> {
    this._root?.unmount();
    this._root = undefined;
  }

  // The model only learns that a component rendered, not what it shows. Hand it
  // the results so follow-up questions ("why 75?", "which files are stale?")
  // get real answers. Best effort: the card must render even if the host
  // rejects the (beta) call.
  private async _shareWithModel(snapshot: ISiteSnapshot): Promise<void> {
    try {
      await this.context.copilotBridge.updateModelContextAsync({
        content: [createCopilotTextContent(buildModelContextText(snapshot))],
        structuredContent: buildStructuredContext(snapshot)
      });
    } catch {
      // Context sharing is an enhancement; the UI does not depend on it.
    }
  }

  // Flatten the detail lists into a single CSV and download it.
  private _exportCsv(): void {
    const s = this._snapshot;
    if (!s) return;
    const rows: unknown[][] = [];
    s.detail.staleDocs.forEach((d) => rows.push(['Stale', d.name, Formatters.date(d.modifiedIso), '']));
    s.detail.externalShares.forEach((x) => rows.push(['External share', x.name, x.kind, x.sharedWith]));
    s.detail.largestFiles.forEach((f) => rows.push(['Large file', f.name, Formatters.bytes(f.sizeBytes), '']));
    s.detail.duplicates.forEach((d) => rows.push(['Duplicate', d.name, `${d.count} copies`, Formatters.bytes(d.wastedBytes)]));
    s.detail.typeBreakdown.forEach((t) => rows.push(['Type', t.category, String(t.count), Formatters.bytes(t.sizeBytes)]));

    CsvExport.download(
      `site-snapshot-${s.siteName}`,
      ['Category', 'Name', 'Detail', 'Extra'],
      rows,
      this.context.domElement.ownerDocument
    );
  }
}
