// Graph-backed implementation of ISiteSnapshotService.
//
// Best practice for an SPFx Copilot Component: use the brokered MSGraphClientV3
// from the component context (no token code, no PnPjs). Every call is wrapped
// so that if Graph is unavailable (workbench, missing permissions), the service
// falls back to sample data and the UI still renders.
//
// Required Graph permissions (declare in package-solution.json, approve in the
// SharePoint admin center):
//   Sites.Read.All, Files.Read.All  - reading the site, drive, items, permissions
//   Mail.Send                       - the "email me this" action

import { MSGraphClientV3 } from '@microsoft/sp-http';
import {
  IAnalyzeArgs,
  ISiteSnapshot,
  ISnapshotMetrics,
  IFileRow,
  IExternalShare,
  ITypeBucket,
  IOwnerBucket,
  IDuplicateSet,
  computeHealthScore
} from '../models';
import { ISiteSnapshotService } from './ISiteSnapshotService';
import { buildSampleSnapshot } from './sampleData';
import { categorize, CATEGORY_ORDER } from '../utils/FileTypes';

const MAX_ITEMS = 1000; // throttle-safe cap on files scanned across all libraries
const MAX_FOLDERS = 400; // cap on folders visited during recursion
const PERM_CAP = 80; // never check more than this many permissions per run
const SHARE_BATCH = 12; // permission checks run in parallel batches of this size
const DAY_MS = 24 * 60 * 60 * 1000;

// System document libraries to skip - not user content.
const SYSTEM_LIBRARIES = new Set(
  [
    'Style Library',
    'Form Templates',
    'FormServerTemplates',
    'Site Assets',
    'Site Pages',
    'Preservation Hold Library',
    'Teams Wiki Data',
    'Images',
    'Pages',
    'Templates',
    'Document Templates'
  ].map((n) => n.toLowerCase())
);

// Minimal shapes for the Graph fields we read (Graph returns much more).
interface IDriveItemLite {
  id: string;
  name: string;
  size?: number;
  webUrl: string;
  lastModifiedDateTime: string;
  folder?: unknown;
  shared?: unknown;
  file?: { hashes?: { quickXorHash?: string } };
  createdBy?: { user?: { displayName?: string } };
  driveId?: string; // which library this item came from (set during traversal)
}

interface ILibrary {
  id: string;
  name: string;
}

interface IPermissionLite {
  id?: string;
  link?: { scope?: string };
  grantedToIdentitiesV2?: { user?: { email?: string } }[];
}

export class SiteSnapshotService implements ISiteSnapshotService {
  public constructor(private graph: MSGraphClientV3) {}

  public async getSnapshot(
    args: IAnalyzeArgs,
    currentSiteUrl: string,
    nowMs: number
  ): Promise<ISiteSnapshot> {
    const target = args.siteUrl || currentSiteUrl;
    const generatedIso = new Date(nowMs).toISOString();

    try {
      const site = await this.resolveSite(target);
      const drive = await this.getDrive(site.id); // storage figure comes from the default library
      const libraries = await this.getLibraries(site.id, drive.id);
      const scan = await this.scanItems(libraries, args, nowMs);

      const daysSinceLastActivity = scan.lastActivityMs
        ? Math.floor((nowMs - scan.lastActivityMs) / DAY_MS)
        : 999;

      const metrics: ISnapshotMetrics = {
        storageUsedBytes: drive.used,
        storageTotalBytes: drive.total,
        totalDocs: scan.totalScanned,
        staleDocs: scan.staleDocs.length,
        externalItemCount: scan.externalShares.filter((s) => s.kind === 'external').length,
        anyoneLinkCount: scan.externalShares.filter((s) => s.kind === 'anyone').length,
        daysSinceLastActivity,
        emptyDocs: scan.emptyFiles.length,
        duplicateSets: scan.duplicates.length
      };

      return {
        siteName: site.name,
        siteUrl: site.webUrl || target,
        storageUsedBytes: drive.used,
        storageTotalBytes: drive.total,
        generatedIso,
        score: computeHealthScore(metrics),
        detail: {
          staleDocs: scan.staleDocs,
          largestFiles: scan.largestFiles,
          externalShares: scan.externalShares,
          emptyFiles: scan.emptyFiles,
          typeBreakdown: scan.typeBreakdown,
          ownerBreakdown: scan.ownerBreakdown,
          duplicates: scan.duplicates,
          duplicateWastedBytes: scan.duplicateWastedBytes,
          totalScanned: scan.totalScanned,
          foldersScanned: scan.foldersScanned,
          librariesScanned: scan.librariesScanned,
          truncated: scan.truncated
        },
        isSample: false
      };
    } catch {
      // Graph unavailable - fall back so the UI is still useful.
      return buildSampleSnapshot(target, generatedIso);
    }
  }

  public async emailSnapshot(snapshot: ISiteSnapshot, recipient: string): Promise<boolean> {
    if (!recipient) return false;
    try {
      await this.graph.api('/me/sendMail').post({
        message: {
          subject: `Site Snapshot - ${snapshot.siteName} (${snapshot.score.score}/100)`,
          body: { contentType: 'html', content: this.buildEmailHtml(snapshot) },
          toRecipients: [{ emailAddress: { address: recipient } }]
        },
        saveToSentItems: true
      });
      return true;
    } catch {
      return false;
    }
  }

  // --- Graph helpers -------------------------------------------------------

  // Accept either an absolute site URL or a plain search term (e.g. "Marketing").
  private async resolveSite(
    target: string
  ): Promise<{ id: string; name: string; webUrl: string }> {
    if (/^https?:\/\//i.test(target)) {
      const u = new URL(target);
      const path = u.pathname.replace(/\/$/, '');
      const site = await this.graph
        .api(`/sites/${u.hostname}:${path}`)
        .select('id,displayName,name,webUrl')
        .get();
      return { id: site.id, name: site.displayName || site.name || path, webUrl: site.webUrl };
    }

    // Treat the input as a search term and take the best match.
    const res: { value?: { id: string; displayName?: string; name?: string; webUrl?: string }[] } =
      await this.graph.api(`/sites?search=${encodeURIComponent(target)}`).get();
    const hit = (res.value || [])[0];
    if (!hit) throw new Error('No matching site');
    return { id: hit.id, name: hit.displayName || hit.name || target, webUrl: hit.webUrl || '' };
  }

  private async getDrive(siteId: string): Promise<{ id: string; used: number; total: number }> {
    const drive = await this.graph.api(`/sites/${siteId}/drive`).select('id,quota').get();
    return { id: drive.id, used: drive.quota?.used || 0, total: drive.quota?.total || 0 };
  }

  // All user document libraries on the site, with system libraries skipped.
  private async getLibraries(siteId: string, defaultDriveId: string): Promise<ILibrary[]> {
    try {
      const res: { value?: { id: string; name?: string; driveType?: string }[] } = await this.graph
        .api(`/sites/${siteId}/drives`)
        .select('id,name,driveType')
        .get();
      const libs = (res.value || [])
        .filter((dr) => dr.driveType === 'documentLibrary')
        .filter((dr) => !SYSTEM_LIBRARIES.has((dr.name || '').toLowerCase()))
        .map((dr) => ({ id: dr.id, name: dr.name || 'Documents' }));
      return libs.length ? libs : [{ id: defaultDriveId, name: 'Documents' }];
    } catch {
      return [{ id: defaultDriveId, name: 'Documents' }];
    }
  }

  private async scanItems(
    libraries: ILibrary[],
    args: IAnalyzeArgs,
    nowMs: number
  ): Promise<{
    staleDocs: IFileRow[];
    largestFiles: IFileRow[];
    externalShares: IExternalShare[];
    emptyFiles: IFileRow[];
    typeBreakdown: ITypeBucket[];
    ownerBreakdown: IOwnerBucket[];
    duplicates: IDuplicateSet[];
    duplicateWastedBytes: number;
    totalScanned: number;
    foldersScanned: number;
    librariesScanned: number;
    truncated: boolean;
    lastActivityMs: number;
  }> {
    // Walk each user library until the global file cap is reached.
    const files: IDriveItemLite[] = [];
    let foldersScanned = 0;
    let truncated = false;
    let librariesScanned = 0;

    for (const lib of libraries) {
      if (truncated) break;
      librariesScanned += 1;
      const r = await this.traverse(lib.id, MAX_ITEMS - files.length);
      files.push(...r.files);
      foldersScanned += r.foldersScanned;
      if (r.truncated || files.length >= MAX_ITEMS) truncated = true;
    }

    const staleCutoff = nowMs - args.staleMonths * 30 * DAY_MS;

    const staleDocs: IFileRow[] = files
      .filter((it) => Date.parse(it.lastModifiedDateTime) < staleCutoff)
      .map((it) => this.toRow(it));

    // "Large files" are those at or above the chosen size (default handled by
    // the caller), biggest first. Capped so a huge library stays responsive.
    const largeThreshold = args.largeMb * 1024 * 1024;
    const largestFiles: IFileRow[] = [...files]
      .filter((it) => (it.size || 0) >= largeThreshold)
      .sort((a, b) => (b.size || 0) - (a.size || 0))
      .slice(0, 200)
      .map((it) => this.toRow(it));

    const emptyFiles: IFileRow[] = files
      .filter((it) => (it.size || 0) === 0)
      .map((it) => this.toRow(it));

    const lastActivityMs = files.reduce(
      (max, it) => Math.max(max, Date.parse(it.lastModifiedDateTime) || 0),
      0
    );

    const typeBreakdown = this.buildTypeBreakdown(files);
    const ownerBreakdown = this.buildOwnerBreakdown(files);
    const { duplicates, duplicateWastedBytes } = this.findDuplicates(files);

    // Only permission-check items that advertise a "shared" facet, capped.
    const candidates = files.filter((it) => it.shared).slice(0, PERM_CAP);
    const externalShares = await this.scanSharing(candidates, staleCutoff);

    return {
      staleDocs,
      largestFiles,
      externalShares,
      emptyFiles,
      typeBreakdown,
      ownerBreakdown,
      duplicates,
      duplicateWastedBytes,
      totalScanned: files.length,
      foldersScanned,
      librariesScanned,
      truncated,
      lastActivityMs
    };
  }

  // Breadth-first walk of one library, paging each folder's children and capping
  // files and folders so a large library cannot run away. Each file is tagged
  // with its drive id so the permission check targets the right library.
  private async traverse(
    driveId: string,
    maxFiles: number
  ): Promise<{ files: IDriveItemLite[]; foldersScanned: number; truncated: boolean }> {
    const select = 'name,size,webUrl,lastModifiedDateTime,folder,shared,id,file,createdBy';
    const files: IDriveItemLite[] = [];
    const queue: string[] = ['root'];
    let foldersScanned = 0;
    let truncated = false;

    while (queue.length && !truncated) {
      const folderId = queue.shift() as string;
      foldersScanned += 1;

      let url = `/drives/${driveId}/items/${folderId}/children?$top=200&$select=${select}`;
      while (url) {
        const res: { value?: IDriveItemLite[]; ['@odata.nextLink']?: string } = await this.graph
          .api(url)
          .get();
        for (const it of res.value || []) {
          if (it.folder) {
            if (foldersScanned + queue.length < MAX_FOLDERS) queue.push(it.id);
          } else {
            it.driveId = driveId; // remember the library for permission checks
            files.push(it);
            if (files.length >= maxFiles) {
              truncated = true;
              break;
            }
          }
        }
        if (truncated) break;
        url = res['@odata.nextLink'] || '';
      }

      if (foldersScanned >= MAX_FOLDERS) truncated = true;
    }

    return { files, foldersScanned, truncated };
  }

  // Shape a Graph drive item into the file row the tables display.
  private toRow(it: IDriveItemLite): IFileRow {
    return {
      name: it.name,
      webUrl: it.webUrl,
      sizeBytes: it.size || 0,
      modifiedIso: it.lastModifiedDateTime,
      createdBy: it.createdBy?.user?.displayName || 'Unknown'
    };
  }

  // Count and size files per category, in a fixed display order.
  private buildTypeBreakdown(items: IDriveItemLite[]): ITypeBucket[] {
    const acc: Record<string, ITypeBucket> = {};
    for (const it of items) {
      const category = categorize(it.name || '');
      if (!acc[category]) acc[category] = { category, count: 0, sizeBytes: 0 };
      acc[category].count += 1;
      acc[category].sizeBytes += it.size || 0;
    }
    return CATEGORY_ORDER.map((c) => acc[c]).filter((b): b is ITypeBucket => !!b && b.count > 0);
  }

  // Count and size files per creator, so the UI can show who owns the most
  // content. Sorted by size (biggest owner first).
  private buildOwnerBreakdown(items: IDriveItemLite[]): IOwnerBucket[] {
    const acc: Record<string, IOwnerBucket> = {};
    for (const it of items) {
      const owner = it.createdBy?.user?.displayName || 'Unknown';
      if (!acc[owner]) acc[owner] = { owner, count: 0, sizeBytes: 0 };
      acc[owner].count += 1;
      acc[owner].sizeBytes += it.size || 0;
    }
    return Object.keys(acc)
      .map((k) => acc[k])
      .sort((a, b) => b.sizeBytes - a.sizeBytes);
  }

  // Group files by content hash (quickXorHash) when present, else by name+size.
  // A set of two or more is a duplicate; wasted space is size * (count - 1).
  private findDuplicates(items: IDriveItemLite[]): {
    duplicates: IDuplicateSet[];
    duplicateWastedBytes: number;
  } {
    const groups: Record<string, IDriveItemLite[]> = {};
    for (const it of items) {
      const hash = it.file?.hashes?.quickXorHash;
      const key = hash || `${(it.name || '').toLowerCase()}::${it.size || 0}`;
      (groups[key] = groups[key] || []).push(it);
    }

    const duplicates: IDuplicateSet[] = [];
    let duplicateWastedBytes = 0;
    for (const key of Object.keys(groups)) {
      const group = groups[key];
      if (group.length < 2) continue;
      // Newest copy first, so the representative name is the latest one.
      const files = [...group].sort(
        (a, b) => Date.parse(b.lastModifiedDateTime) - Date.parse(a.lastModifiedDateTime)
      );
      const sizeBytes = files[0].size || 0;
      const wastedBytes = sizeBytes * (files.length - 1);
      duplicateWastedBytes += wastedBytes;
      duplicates.push({
        key,
        name: files[0].name,
        count: files.length,
        sizeBytes,
        wastedBytes,
        files: files.map((f) => ({ name: f.name, webUrl: f.webUrl, modifiedIso: f.lastModifiedDateTime }))
      });
    }
    duplicates.sort((a, b) => b.wastedBytes - a.wastedBytes);
    return { duplicates, duplicateWastedBytes };
  }

  private async scanSharing(
    items: IDriveItemLite[],
    staleCutoff: number
  ): Promise<IExternalShare[]> {
    const out: IExternalShare[] = [];

    // Check permissions in parallel batches so a wide site stays fast without
    // hammering Graph (which would trigger throttling).
    for (let i = 0; i < items.length; i += SHARE_BATCH) {
      const batch = items.slice(i, i + SHARE_BATCH);
      const results = await Promise.all(batch.map((it) => this.checkOneShare(it, staleCutoff)));
      results.forEach((r) => r && out.push(r));
    }

    // Show the most critical shares first.
    out.sort((a, b) => Number(!!b.isCritical) - Number(!!a.isCritical));
    return out;
  }

  private async checkOneShare(
    it: IDriveItemLite,
    staleCutoff: number
  ): Promise<IExternalShare | undefined> {
    const driveId = it.driveId || '';
    try {
      const perms: { value?: IPermissionLite[] } = await this.graph
        .api(`/drives/${driveId}/items/${it.id}/permissions`)
        .select('id,link,grantedToIdentitiesV2')
        .get();
      return this.classify(it, perms.value || [], staleCutoff);
    } catch {
      // ignore a single item's permission failure and keep scanning
      return undefined;
    }
  }

  private classify(
    item: IDriveItemLite,
    perms: IPermissionLite[],
    staleCutoff: number
  ): IExternalShare | undefined {
    for (const p of perms) {
      if (p.link?.scope === 'anonymous') {
        // An "Anyone" link on a stale document is the highest cleanup priority.
        const isCritical = Date.parse(item.lastModifiedDateTime) < staleCutoff;
        return {
          name: item.name,
          webUrl: item.webUrl,
          kind: 'anyone',
          sharedWith: 'Anyone with the link',
          isCritical
        };
      }
      const externals = (p.grantedToIdentitiesV2 || [])
        .map((g) => g.user?.email)
        .filter((e): e is string => !!e);
      if (externals.length) {
        return {
          name: item.name,
          webUrl: item.webUrl,
          kind: 'external',
          sharedWith: externals.join(', ')
        };
      }
    }
    return undefined;
  }

  private buildEmailHtml(s: ISiteSnapshot): string {
    const gb = (b: number): string => `${(b / 1024 ** 3).toFixed(2)} GB`;
    const criticalCount = s.detail.externalShares.filter((x) => x.isCritical).length;
    return [
      `<h2>Site Snapshot - ${this.escape(s.siteName)}</h2>`,
      `<p><b>Health: ${s.score.score}/100</b> (${s.score.verdict})</p>`,
      '<ul>',
      `<li>Storage: ${gb(s.storageUsedBytes)} of ${gb(s.storageTotalBytes)}</li>`,
      `<li>Stale documents: ${s.detail.staleDocs.length}</li>`,
      `<li>External shares: ${s.detail.externalShares.length}${criticalCount ? ` (${criticalCount} critical)` : ''}</li>`,
      `<li>Duplicate sets: ${s.detail.duplicates.length} (about ${gb(s.detail.duplicateWastedBytes)} wasted)</li>`,
      `<li>Empty files: ${s.detail.emptyFiles.length}</li>`,
      `<li>Files scanned: ${s.detail.totalScanned} in ${s.detail.foldersScanned} folders${s.detail.truncated ? ' (capped)' : ''}</li>`,
      '</ul>'
    ].join('');
  }

  private escape(v: string): string {
    return v.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
  }
}
