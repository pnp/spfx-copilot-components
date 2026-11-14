import type { SPFI } from '@pnp/sp';
import type {
  IFilingDraft,
  IFilingReceipt,
  IRecentFilingRow,
  IRecentFilter,
  IValidationResult
} from '../models/filing';
import { PERIOD_DAYS } from '../models/filing';
import type {
  DepartmentKey,
  DocumentKindKey,
  FieldKey,
  FilingStatus,
  IDepartment,
  IDocumentKindDefinition
} from '../models/sources';
import { validateDraft, FIELD_ORDER } from '../logic/validation';
import { resolveDestination, IDestination } from '../logic/destination';
import { draftToReceipt, ILookups } from './mappers';
import { DocumentStoreUnavailableError, IDocumentStoreService } from './IDocumentStoreService';
import {
  CHOICE_BY_DEPARTMENT,
  CHOICE_BY_STATUS,
  COLUMN,
  DEPARTMENT_BY_CHOICE,
  FIELD_BY_COLUMN,
  IGNORED_REQUIRED_COLUMNS,
  KIND_CONFIG_BY_CONTENT_TYPE_NAME,
  LIBRARY_NAME,
  STATUS_BY_CHOICE,
  IKindConfig
} from './sharePointConfig';

/**
 * The live store, against the provisioned `Records` library
 * (`docs/TENANT-SETUP.md`). Mappers and view models are unchanged across the
 * swap (AGENTS.md R8); only this file and the factory differ from the mock.
 *
 * Two decisions from `todo.md` are compiled in here:
 *  - **D6** — `getKinds()` reads `requiredFields` and `dateFieldLabel` from the
 *    content types and takes the rest from a map keyed on content type NAME.
 *  - **D7** — `receiptNumber` is `F-` + the list item Id, known after the item
 *    exists but before `save()` resolves, so R25 holds; a metadata failure after
 *    upload recycles the uploaded file and throws, so "nothing is partially
 *    saved" stays true.
 *
 * `getKinds()` / `getDepartments()` are synchronous on the interface, so the
 * content types and choice columns are read once in `initializeAsync()` and
 * served from cache thereafter.
 */

/** Shape of a content-type field link as returned by `/_api/.../fieldlinks`. */
export interface IFieldLink {
  Name: string;
  DisplayName: string;
  Required: boolean;
  Hidden: boolean;
}

/** The subset of a list item the recent view needs. */
export interface IRecordListItem {
  Id: number;
  ContentTypeId: string;
  FileLeafRef: string;
  FileRef: string;
  /**
   * The file's size, through the expanded `File` (8.8 L8). Not
   * `File_x0020_Size`: that hidden computed column is refused in the list-item
   * `$select` with a 400, which failed the whole recent-filings read in the
   * tenant while the hand-typed fake served it happily.
   */
  File?: { Length?: string | number };
  FilingDepartment?: string;
  Vendor?: string;
  ReportOwner?: { Title?: string };
  DocumentDate?: string;
  Amount?: number;
  FilingStatus?: string;
  ReceiptNumber?: string;
  Created: string;
  Author?: { Title?: string };
}

/** A kind, plus the content type facts the live service needs to write items. */
export interface ILiveKind {
  definition: IDocumentKindDefinition;
  contentTypeId: string;
  contentTypeName: string;
}

export interface ISharePointDocumentStoreOptions {
  /** Library title. Defaults to the provisioned `Records`. */
  libraryName?: string;
  /** Cap on rows fetched per `getRecent` call. */
  maxRecent?: number;
}

export class SharePointDocumentStoreService implements IDocumentStoreService {
  /** Real library, real files — the sample-data line never shows. */
  public readonly isSampleData: boolean = false;
  private readonly _sp: SPFI;
  private readonly _libraryName: string;
  private readonly _maxRecent: number;

  private _kinds: ILiveKind[] = [];
  private _departments: IDepartment[] = [];
  private _currentUserId: number = 0;
  private _currentUserName: string = '';
  private _libraryRootPath: string = '';
  /** `https://host` of the records site, for absolute file and folder links (H5). */
  private _origin: string = '';
  private _ready: boolean = false;

  public constructor(sp: SPFI, options: ISharePointDocumentStoreOptions = {}) {
    this._sp = sp;
    this._libraryName = options.libraryName || LIBRARY_NAME;
    this._maxRecent = options.maxRecent || 500;
  }

  /**
   * Reads the content types, the department choices and the current user once.
   * Everything the synchronous interface methods return is settled here.
   */
  public async initializeAsync(): Promise<void> {
    if (this._ready) {
      return;
    }
    try {
      const list = this._sp.web.lists.getByTitle(this._libraryName);

      const root: { ServerRelativeUrl: string } = await list.rootFolder.select('ServerRelativeUrl')();
      this._libraryRootPath = root.ServerRelativeUrl;

      const web: { Url: string } = await this._sp.web.select('Url')();
      this._origin = new URL(web.Url).origin;

      const me: { Id: number; Title: string } = await this._sp.web.currentUser.select('Id', 'Title')();
      this._currentUserId = me.Id;
      this._currentUserName = me.Title;

      this._kinds = await this._readKinds();
      this._departments = await this._readDepartments();
      this._ready = true;
    } catch (e) {
      throw new DocumentStoreUnavailableError(
        'The records library "' + this._libraryName + '" could not be read: ' + describeError(e)
      );
    }
  }

  public getKinds(): IDocumentKindDefinition[] {
    this._assertReady();
    return this._kinds.map(k => k.definition);
  }

  public getDepartments(): IDepartment[] {
    this._assertReady();
    return this._departments;
  }

  public validate(draft: IFilingDraft): IValidationResult {
    return validateDraft(draft, this.getKinds());
  }

  public resolveDestination(draft: IFilingDraft, now: Date): IDestination | undefined {
    return resolveDestination(draft, this.getKinds(), this.getDepartments(), now);
  }

  /**
   * Uploads each file, sets its metadata, and returns one receipt per draft in
   * order. All-or-nothing: every draft is validated before anything is written,
   * and any failure recycles every file this call has already uploaded.
   */
  public async save(drafts: IFilingDraft[], now: Date): Promise<IFilingReceipt[]> {
    this._assertReady();

    const targets: string[] = [];
    for (const d of drafts) {
      const v: IValidationResult = this.validate(d);
      if (!v.ok) {
        throw new Error('Draft ' + d.id + ' is not valid: ' + v.missing.join(', '));
      }
      if (!d.file.blob) {
        // The host handed us no bytes. Fail loudly rather than filing metadata
        // for a document that is not there (R25, R26 — degrade honestly).
        throw new Error(
          'No file content for "' + d.file.name + '". The Copilot host did not provide the ' +
            'chosen file; nothing was filed.'
        );
      }
      const nameProblem: string | undefined = fileNameProblem(d.file.name);
      if (nameProblem) {
        // Before anything uploads, so a bad name is a named error, not a raw
        // SharePoint failure halfway through a bulk save (audit M10).
        throw new Error(
          '"' + d.file.name + '" cannot be stored in SharePoint because ' + nameProblem +
            '. Rename the file and choose it again; nothing was filed.'
        );
      }
      const destination: IDestination | undefined = this.resolveDestination(d, now);
      if (!destination) {
        throw new Error('Destination could not be resolved for "' + d.file.name + '"; nothing was filed.');
      }
      const target: string = (destination.segments.join('/') + '/' + d.file.name).toLowerCase();
      if (targets.indexOf(target) >= 0) {
        throw new Error(
          'Two files named "' + d.file.name + '" would be saved to the same folder. Rename one and choose ' +
            'it again; nothing was filed.'
        );
      }
      targets.push(target);
    }

    // Owners before any write: an owner SharePoint cannot resolve fails the save
    // while nothing has been uploaded, so there is nothing to roll back (audit M7).
    const ownerIds: (number | undefined)[] = await Promise.all(
      drafts.map((d): Promise<number | undefined> =>
        this._kindOf(d.documentKind as DocumentKindKey).definition.requiredFields.indexOf('owner') >= 0
          ? this._resolveOwnerId((d.owner as string).trim())
          : Promise.resolve(undefined)
      )
    );

    const lookups: ILookups = { kinds: this.getKinds(), departments: this.getDepartments(), people: [] };
    const receipts: IFilingReceipt[] = [];
    const uploaded: string[] = [];

    try {
      for (let i = 0; i < drafts.length; i++) {
        const draft: IFilingDraft = drafts[i];
        const path: string = await this._ensureDestinationFolder(draft, now);
        if (await this._fileExists(path, draft.file.name)) {
          // Overwrite stays off; a collision fails with a reason and rolls back the rest (audit M10).
          throw new Error(
            'A file named "' + draft.file.name + '" is already in ' +
              displayPathOf(path, this._libraryRootPath, this._libraryName) + '. Rename the file and choose it again.'
          );
        }
        const serverRelativeUrl: string = await this._upload(draft, path);
        uploaded.push(serverRelativeUrl);
        const itemId: number = await this._setMetadata(draft, serverRelativeUrl, ownerIds[i]);
        const receipt: IFilingReceipt = draftToReceipt(
          draft,
          lookups,
          formatReceiptNumber(itemId),
          now,
          this._currentUserName
        );
        receipt.webUrl = absoluteUrlOf(this._origin, serverRelativeUrl);
        receipt.folderUrl = absoluteUrlOf(this._origin, path);
        receipts.push(receipt);
      }
      return receipts;
    } catch (e) {
      const orphans: string[] = await this._rollback(uploaded);
      if (orphans.length > 0) {
        throw new DocumentStoreUnavailableError(
          'Filing failed and the files could not be removed. These were left in the library and ' +
            'need deleting by hand: ' + orphans.join(', ') + '. Cause: ' + describeError(e)
        );
      }
      throw e instanceof DocumentStoreUnavailableError
        ? e
        : new DocumentStoreUnavailableError('Nothing was filed: ' + describeError(e));
    }
  }

  /**
   * The current user's filings, newest first. `Author` and `Created` are the
   * indexed columns (`docs/TENANT-SETUP.md` §5), so those two are filtered
   * server-side; kind / department / status are narrowed in memory, which keeps
   * the OData expression small and inside the list view threshold.
   */
  public async getRecent(filter: IRecentFilter, now: Date): Promise<IRecentFilingRow[]> {
    this._assertReady();
    const cutoff: Date = new Date(now.getTime() - PERIOD_DAYS[filter.period] * 24 * 60 * 60 * 1000);

    let items: IRecordListItem[];
    try {
      items = await this._sp.web.lists
        .getByTitle(this._libraryName)
        .items.select(
          'Id',
          'ContentTypeId',
          'FileLeafRef',
          'FileRef',
          // Size through the file, not File_x0020_Size, which $select refuses (8.8 L8).
          'File/Length',
          COLUMN.department,
          COLUMN.vendor,
          COLUMN.reportOwner + '/Title',
          COLUMN.documentDate,
          COLUMN.amount,
          COLUMN.status,
          COLUMN.receiptNumber,
          'Created',
          'Author/Title'
        )
        .expand(COLUMN.reportOwner, 'Author', 'File')
        .filter("AuthorId eq " + this._currentUserId + " and Created ge datetime'" + cutoff.toISOString() + "'")
        .orderBy('Created', false)
        .top(this._maxRecent)();
    } catch (e) {
      throw new DocumentStoreUnavailableError('Recent filings could not be read: ' + describeError(e));
    }

    const rows: IRecentFilingRow[] = [];
    for (const item of items) {
      const row: IRecentFilingRow | undefined = this._itemToRow(item);
      if (row) {
        rows.push(row);
      }
    }
    return rows
      .filter(r => !filter.documentKind || r.documentKind === filter.documentKind)
      .filter(r => !filter.department || r.department === filter.department)
      .filter(r => !filter.status || r.status === filter.status)
      .sort((a, b) => b.filedAt.getTime() - a.filedAt.getTime());
  }

  // ---------------------------------------------------------------- internals

  private _assertReady(): void {
    if (!this._ready) {
      throw new Error('SharePointDocumentStoreService.initializeAsync() has not completed.');
    }
  }

  /**
   * Content types on the library supply `requiredFields` and `dateFieldLabel`;
   * `sharePointConfig` supplies the rest (D6). Read over REST — both CSOM routes
   * lie silently (`docs/GOTCHAS.md`), and PnPjs's `fieldLinks` is the REST one.
   *
   * A content type with no entry in the config map throws. So does a Required
   * field link the component has never heard of: silence there would produce a
   * kind that validates against fewer fields than the library enforces, and the
   * first symptom would be a save rejected by SharePoint with no explanation.
   */
  private async _readKinds(): Promise<ILiveKind[]> {
    const list = this._sp.web.lists.getByTitle(this._libraryName);
    const contentTypes: { Id: { StringValue: string }; Name: string }[] = await list.contentTypes
      .select('Id', 'Name')();

    const kinds: ILiveKind[] = [];
    for (const ct of contentTypes) {
      const config: IKindConfig | undefined = kindConfigFor(ct.Id.StringValue, ct.Name, this._libraryName);
      if (!config) {
        // SharePoint's own Folder type, always present on a library. Any other
        // unmapped type has already thrown (D6, amended 2026-09-11).
        continue;
      }
      const links: IFieldLink[] = await list.contentTypes
        .getById(ct.Id.StringValue)
        .fieldLinks.select('Name', 'DisplayName', 'Required', 'Hidden')();

      if (links.length === 0) {
        throw new Error(
          'Content type "' + ct.Name + '" returned no field links. Any lookup the kind ' +
            'definition depends on must throw when empty rather than produce an empty kind.'
        );
      }

      kinds.push({
        contentTypeId: ct.Id.StringValue,
        contentTypeName: ct.Name,
        definition: {
          key: config.key,
          label: ct.Name,
          requiredFields: requiredFieldsFrom(links, ct.Name),
          dateFieldLabel: dateFieldLabelFrom(links, ct.Name),
          folder: config.folder,
          defaultStatus: config.defaultStatus,
          statuses: config.statuses
        }
      });
    }

    const missing: string[] = [];
    for (const name in KIND_CONFIG_BY_CONTENT_TYPE_NAME) {
      if (kinds.filter(k => k.contentTypeName === name).length === 0) {
        missing.push(name);
      }
    }
    if (missing.length > 0) {
      throw new Error(
        'The library "' + this._libraryName + '" is missing content type(s): ' + missing.join(', ') +
          '. Run scripts/provision-records-library.ps1, then verify-records-library.ps1.'
      );
    }
    return kinds;
  }

  /** Department keys come from the choice column's own choices, in tenant order. */
  private async _readDepartments(): Promise<IDepartment[]> {
    const field: { Choices?: string[] } = await this._sp.web.fields
      .getByInternalNameOrTitle(COLUMN.department)
      .select('Choices')();

    const choices: string[] = field.Choices || [];
    if (choices.length === 0) {
      throw new Error('Column ' + COLUMN.department + ' returned no choices.');
    }
    const departments: IDepartment[] = [];
    for (const choice of choices) {
      const key: DepartmentKey | undefined = DEPARTMENT_BY_CHOICE[choice];
      if (!key) {
        throw new Error(
          'Department choice "' + choice + '" has no key in sharePointConfig. The component ' +
            'validates against a closed union, so a new choice needs a code change, not discovery.'
        );
      }
      departments.push({ key, label: choice });
    }
    return departments;
  }

  /**
   * Creates `Finance/<kind folder>/<Department>/<year>` under the library root,
   * one segment at a time and idempotently. Never pre-built by hand: a
   * hand-built tree means someone has to remember a new year every January
   * (`docs/TENANT-SETUP.md` §4).
   */
  private async _ensureDestinationFolder(draft: IFilingDraft, now: Date): Promise<string> {
    const destination: IDestination | undefined = this.resolveDestination(draft, now);
    if (!destination) {
      throw new Error('Destination could not be resolved for "' + draft.file.name + '".');
    }
    // segments[0] is the library itself, which already exists as the root folder.
    let path: string = this._libraryRootPath;
    for (const segment of destination.segments.slice(1)) {
      path = path + '/' + segment;
      try {
        await this._sp.web.folders.addUsingPath(path, true);
      } catch (e) {
        // addUsingPath with overwrite=true is idempotent, but a tenant that
        // refuses it should not stop a folder that is already there.
        const exists: boolean = await this._folderExists(path);
        if (!exists) {
          throw e;
        }
      }
    }
    return path;
  }

  private async _folderExists(path: string): Promise<boolean> {
    try {
      const folder: { Exists?: boolean } = await this._sp.web.getFolderByServerRelativePath(path).select('Exists')();
      // Read the flag rather than trusting a successful response (audit, Low).
      return folder.Exists === true;
    } catch {
      // Why it could not be read does not change the answer: treat anything
      // other than a successful read as "not there".
      return false;
    }
  }

  /** Whether a file of that name is already in the folder. Overwrite stays off either way (audit M10). */
  private async _fileExists(folderPath: string, name: string): Promise<boolean> {
    return this._sp.web.getFolderByServerRelativePath(folderPath).files.getByUrl(name).exists();
  }

  /** Uploads the bytes and returns the new file's server-relative URL. */
  private async _upload(draft: IFilingDraft, folderPath: string): Promise<string> {
    const blob: Blob = draft.file.blob as Blob;
    const added: unknown = await this._sp.web
      .getFolderByServerRelativePath(folderPath)
      .files.addUsingPath(draft.file.name, blob, { Overwrite: false });
    const url: string | undefined = serverRelativeUrlOf(added);
    if (!url) {
      throw new Error('Upload of "' + draft.file.name + '" returned no server-relative URL.');
    }
    return url;
  }

  /**
   * One update call sets the content type and every column, including the
   * receipt number derived from the item's own Id (D7). Returns that Id.
   */
  private async _setMetadata(
    draft: IFilingDraft,
    serverRelativeUrl: string,
    ownerId: number | undefined
  ): Promise<number> {
    const kind: ILiveKind = this._kindOf(draft.documentKind as DocumentKindKey);
    const item = await this._sp.web.getFileByServerRelativePath(serverRelativeUrl).getItem<{ Id: number }>();
    const itemId: number = item.Id;

    const values: { [name: string]: unknown } = {
      ContentTypeId: kind.contentTypeId,
      [COLUMN.department]: CHOICE_BY_DEPARTMENT[draft.department as string],
      [COLUMN.documentDate]: draft.documentDate,
      [COLUMN.amount]: draft.amount,
      [COLUMN.status]: CHOICE_BY_STATUS[draft.status as string],
      [COLUMN.receiptNumber]: formatReceiptNumber(itemId)
    };

    if (kind.definition.requiredFields.indexOf('vendor') >= 0) {
      values[COLUMN.vendor] = draft.vendor;
    }
    if (kind.definition.requiredFields.indexOf('owner') >= 0) {
      if (ownerId === undefined) {
        throw new Error('The report owner for "' + draft.file.name + '" was not resolved before upload.');
      }
      values[COLUMN.reportOwner + 'Id'] = ownerId;
    }

    await item.update(values);
    return itemId;
  }

  /**
   * `ReportOwner` is a Person or Group column, so it is written as an Id. The
   * draft carries free text ("whose expenses these are") that Copilot or the
   * user typed, which `ensureUser` resolves only if it is an email or an exact
   * login. Anything else fails here with a message naming the field rather than
   * a SharePoint error the user cannot act on. See todo.md Decision 9.
   */
  private async _resolveOwnerId(owner: string): Promise<number> {
    try {
      const user: { Id: number } = await this._sp.web.ensureUser(owner);
      return user.Id;
    } catch {
      // The underlying failure is a raw SharePoint error the user cannot act
      // on. Replace it rather than append to it: this message reaches the
      // filing banner.
      throw new Error(
        'Report owner "' + owner + '" is not a person in this tenant. Enter their email address.'
      );
    }
  }

  /**
   * Recycles every file this save call uploaded, newest first. Returns the URLs
   * it could NOT remove so the caller can name them: a rollback that silently
   * half-worked is worse than one that reports what it left behind.
   */
  private async _rollback(uploaded: string[]): Promise<string[]> {
    const orphans: string[] = [];
    for (let i = uploaded.length - 1; i >= 0; i--) {
      try {
        await this._sp.web.getFileByServerRelativePath(uploaded[i]).recycle();
      } catch {
        // Keep going: one file that will not recycle must not strand the rest.
        // The caller names everything in `orphans` in the error it throws.
        orphans.push(uploaded[i]);
      }
    }
    return orphans;
  }

  private _kindOf(key: DocumentKindKey): ILiveKind {
    const kind: ILiveKind | undefined = this._kinds.filter(k => k.definition.key === key)[0];
    if (!kind) {
      throw new Error('Unknown document kind: ' + key);
    }
    return kind;
  }

  private _itemToRow(item: IRecordListItem): IRecentFilingRow | undefined {
    return itemToRow(item, this._kinds, this._departments, {
      libraryName: this._libraryName,
      libraryRootPath: this._libraryRootPath,
      origin: this._origin
    });
  }
}

// ------------------------------------------------------------------ pure bits
// Exported so they can be tested without a tenant. This is where the bugs in a
// live store actually live (AGENTS.md §4.1 — pure logic first); the network
// paths around them are proven by the first run against the dev tenant.

/**
 * List item -> the same `IRecentFilingRow` the mock produces (R8). Returns
 * undefined for a row that cannot be projected — a file of some other content
 * type, or one whose choice values predate the current config — rather than
 * throwing, because one odd row in the library should not blank the whole view.
 */
export function itemToRow(
  item: IRecordListItem,
  kinds: ILiveKind[],
  departments: IDepartment[],
  location: IRowLocation
): IRecentFilingRow | undefined {
  const kind: ILiveKind | undefined = kinds.filter(
    k => !!item.ContentTypeId && item.ContentTypeId.indexOf(k.contentTypeId) === 0
  )[0];
  if (!kind) {
    return undefined;
  }
  const departmentKey: DepartmentKey | undefined = DEPARTMENT_BY_CHOICE[item.FilingDepartment || ''];
  const status: FilingStatus | undefined = STATUS_BY_CHOICE[item.FilingStatus || ''];
  if (!departmentKey || !status) {
    return undefined;
  }
  const department: IDepartment | undefined = departments.filter(d => d.key === departmentKey)[0];

  return {
    id: String(item.Id),
    fileName: item.FileLeafRef,
    sizeBytes: Number((item.File && item.File.Length) || 0),
    documentKind: kind.definition.key,
    documentKindLabel: kind.definition.label,
    department: departmentKey,
    departmentLabel: department ? department.label : (item.FilingDepartment as string),
    vendor: item.Vendor || undefined,
    ownerName: item.ReportOwner && item.ReportOwner.Title ? item.ReportOwner.Title : undefined,
    documentDate: isoDateFromSharePoint(item.DocumentDate),
    amount: typeof item.Amount === 'number' ? item.Amount : 0,
    status,
    filedAt: new Date(item.Created),
    filedByName: item.Author && item.Author.Title ? item.Author.Title : '',
    receiptNumber: item.ReceiptNumber || formatReceiptNumber(item.Id),
    savedPath: displayPathOf(item.FileRef, location.libraryRootPath, location.libraryName),
    webUrl: location.origin ? absoluteUrlOf(location.origin, item.FileRef) : undefined
  };
}

/** Where a library lives, for turning a `FileRef` into what the views show. */
export interface IRowLocation {
  /** The library's title — the first segment of every displayed path. */
  libraryName: string;
  /** The library root's server-relative URL, e.g. `/sites/records/Records`. */
  libraryRootPath: string;
  /** `https://host`; empty when unknown, and then no link is produced. */
  origin: string;
}

/**
 * A file's server-relative URL -> the "Records / Finance / … / file.pdf" form
 * the mock and every receipt use, so a live row reads the same as a mock one
 * (R8, audit H5). A file outside the library root keeps its raw path.
 */
export function displayPathOf(fileRef: string, libraryRootPath: string, libraryName: string): string {
  const root: string = libraryRootPath.replace(/\/+$/, '');
  if (root === '' || fileRef.indexOf(root + '/') !== 0) {
    return fileRef;
  }
  return [libraryName].concat(fileRef.slice(root.length + 1).split('/')).join(' / ');
}

/** Origin + server-relative path -> an absolute URL, each segment encoded ("Expense reports", "#", "%"). */
export function absoluteUrlOf(origin: string, serverRelativePath: string): string {
  return origin.replace(/\/+$/, '') + serverRelativePath.split('/').map(encodeURIComponent).join('/');
}

/** SharePoint's Folder content type, and every type derived from it. Always on a document library. */
const FOLDER_CONTENT_TYPE_PREFIX: string = '0X0120';

/**
 * A library content type -> its config half (D6, amended 2026-09-11). Folder is
 * SharePoint's own and always present, so it returns `undefined` and is skipped.
 * Any other type the config does not know throws, naming it: a stray type would
 * otherwise go unnoticed until someone filed against it.
 */
export function kindConfigFor(contentTypeId: string, contentTypeName: string, libraryName: string): IKindConfig | undefined {
  if (contentTypeId.toUpperCase().indexOf(FOLDER_CONTENT_TYPE_PREFIX) === 0) {
    return undefined;
  }
  if (!Object.prototype.hasOwnProperty.call(KIND_CONFIG_BY_CONTENT_TYPE_NAME, contentTypeName)) {
    throw new Error(
      'The library "' + libraryName + '" carries content type "' + contentTypeName + '", which the ' +
        'component does not know. Remove it from the library or add it to sharePointConfig, then run ' +
        'scripts/verify-records-library.ps1.'
    );
  }
  return KIND_CONFIG_BY_CONTENT_TYPE_NAME[contentTypeName];
}

/** Whole names SharePoint refuses, compared case-insensitively. */
const RESERVED_FILE_NAMES: string[] = ['.LOCK', 'CON', 'PRN', 'AUX', 'NUL', 'DESKTOP.INI']
  .concat(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => 'COM' + n))
  .concat(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => 'LPT' + n));

/**
 * Why SharePoint would refuse a file name, or `undefined` when it would take it
 * (audit M10). Checked before anything uploads, so the user gets a reason they
 * can act on instead of a raw failure halfway through a save.
 */
export function fileNameProblem(name: string): string | undefined {
  if (name.trim() === '') {
    return 'the name is empty';
  }
  const badCharacter: RegExpExecArray | null = /["*:<>?/\\|]/.exec(name);
  if (badCharacter) {
    return 'it contains the character ' + badCharacter[0];
  }
  if (/^\s/.test(name) || /[\s.]$/.test(name)) {
    return 'it starts with a space or ends with a space or a period';
  }
  if (name.indexOf('~$') === 0) {
    return 'it starts with ~$';
  }
  if (name.toLowerCase().indexOf('_vti_') >= 0) {
    return 'it contains _vti_';
  }
  if (RESERVED_FILE_NAMES.indexOf(name.toUpperCase()) >= 0) {
    return 'SharePoint reserves that name';
  }
  return undefined;
}

/**
 * A date-only SharePoint column -> the `YYYY-MM-DD` the view models use.
 *
 * **Do not route this through `logic/dates.ts#toIsoDate`.** That formatter reads
 * local calendar parts, and SharePoint returns a date-only field at UTC
 * midnight (`2026-08-15T00:00:00Z`). Anywhere west of Greenwich — Kurt's own
 * `America/Chicago` included — `new Date(...)` then `getDate()` lands on the
 * previous day, so an invoice dated the 15th reads back as the 14th and the
 * destination year flips on 1 January. The stored string already carries the
 * calendar date the user chose, so take it verbatim.
 */
export function isoDateFromSharePoint(value: string | undefined): string {
  if (!value) {
    return '';
  }
  const match: RegExpMatchArray | null = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  if (match) {
    return match[1];
  }
  // Not an ISO string at all. Fall back to UTC parts, never local ones.
  const parsed: Date = new Date(value);
  if (isNaN(parsed.getTime())) {
    return '';
  }
  const month: number = parsed.getUTCMonth() + 1;
  const day: number = parsed.getUTCDate();
  return (
    parsed.getUTCFullYear() +
    '-' +
    (month < 10 ? '0' + month : String(month)) +
    '-' +
    (day < 10 ? '0' + day : String(day))
  );
}

/** `F-` + the list item Id, zero-padded to five so numbers sort as strings (D7). */
export function formatReceiptNumber(itemId: number): string {
  let padded: string = String(itemId);
  while (padded.length < 5) {
    padded = '0' + padded;
  }
  return 'F-' + padded;
}

/**
 * Required field links -> `FieldKey[]`, in `FIELD_ORDER`. `documentKind` is
 * always required and is never a column: it is the content type itself.
 */
export function requiredFieldsFrom(links: IFieldLink[], contentTypeName: string): FieldKey[] {
  const keys: FieldKey[] = ['documentKind'];
  for (const link of links) {
    if (!link.Required || link.Hidden) {
      continue;
    }
    // Built-ins the form never collects — the file name arrives with the upload
    // (8.8 L1). Skipped before the guard below, which is otherwise unchanged.
    if (IGNORED_REQUIRED_COLUMNS.indexOf(link.Name) >= 0) {
      continue;
    }
    const key: FieldKey | undefined = FIELD_BY_COLUMN[link.Name];
    if (!key) {
      throw new Error(
        'Content type "' + contentTypeName + '" requires column "' + link.Name + '", which the ' +
          'component does not know. Validation switches on a closed field union, so a new required ' +
          'column needs a code change.'
      );
    }
    if (keys.indexOf(key) < 0) {
      keys.push(key);
    }
  }
  return FIELD_ORDER.filter(f => keys.indexOf(f) >= 0);
}

/** The per-content-type display-name override on `DocumentDate`. */
export function dateFieldLabelFrom(links: IFieldLink[], contentTypeName: string): string {
  const link: IFieldLink | undefined = links.filter(l => l.Name === COLUMN.documentDate)[0];
  if (!link || !link.DisplayName) {
    throw new Error(
      'Content type "' + contentTypeName + '" has no display name for ' + COLUMN.documentDate +
        '. Read it over REST (/fieldlinks) — CSOM returns it empty.'
    );
  }
  return link.DisplayName;
}

/**
 * PnPjs has changed the return shape of `addUsingPath` between majors — v3
 * wrapped the file info in `{ data }`, v4 returns it directly. Accept either
 * rather than pinning the component to one shape.
 */
export function serverRelativeUrlOf(added: unknown): string | undefined {
  const direct = added as { ServerRelativeUrl?: string } | undefined;
  if (direct && typeof direct.ServerRelativeUrl === 'string') {
    return direct.ServerRelativeUrl;
  }
  const wrapped = added as { data?: { ServerRelativeUrl?: string } } | undefined;
  if (wrapped && wrapped.data && typeof wrapped.data.ServerRelativeUrl === 'string') {
    return wrapped.data.ServerRelativeUrl;
  }
  return undefined;
}

function describeError(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  return String(e);
}
