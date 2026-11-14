import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import { escape } from '@microsoft/sp-lodash-subset';

import type { IMyCopilotAppCopilotComponentProperties } from './MyCopilotAppCopilotComponentProperties';
import {
  SharePointListsService,
  parseSiteUrl,
  type ISharePointList,
  type ISharePointListItem
} from './SharePointListsService';

import styles from './MyCopilotAppCopilotComponent.module.scss';

import * as strings from 'MyCopilotAppCopilotComponentStrings';

const EXPAND_ICON: string = '⛶';
const DEFAULT_ERROR_MESSAGE: string = 'Something went wrong. Try again.';

function toErrorMessage(error: unknown): string {
  return error instanceof Error && error.message.length > 0
    ? error.message
    : DEFAULT_ERROR_MESSAGE;
}

export default class MyCopilotAppCopilotComponent extends BaseCopilotComponent<IMyCopilotAppCopilotComponentProperties> {
  private _service!: SharePointListsService;

  // View state. render() reads these fields and writes the UI.
  private _hasStarted: boolean = false;
  private _requestedSiteUrl: string | undefined;
  private _siteUrl: string | undefined;
  private _requestId: number = 0;
  private _isLoading: boolean = false;
  private _error: string | undefined;
  private _lists: ISharePointList[] = [];
  private _selectedList: ISharePointList | undefined;
  private _items: ISharePointListItem[] = [];
  private _nextFocusKey: string | undefined;

  protected async onInit(): Promise<void> {
    this._service = new SharePointListsService(this.context.spHttpClient);
  }

  protected render(): void {
    // The host calls render() again when the theme or the display mode
    // changes. Load only on the first render and when the agent sends
    // a different site.
    if (!this._hasStarted || this.properties.siteUrl !== this._requestedSiteUrl) {
      this._loadLists();
    }

    const isDarkTheme: boolean = this.hostContext.theme === 'dark';
    const isFullscreen: boolean = this.hostContext.displayMode === 'fullscreen';

    const rootClass: string = `${styles.myCopilotApp} ${isDarkTheme ? styles.dark : ''}`;
    const title: string = this._selectedList ? this._selectedList.title : 'Lists';

    const expandHtml: string = isFullscreen
      ? ''
      : `<span id="hc-expand" class="${styles.expand}" role="button" tabindex="0" title="${strings.ExpandToFullscreenTitle}" aria-label="${strings.ExpandToFullscreenTitle}">${EXPAND_ICON}</span>`;

    const siteHtml: string = this._siteUrl
      ? `<p class="${styles.site}">${escape(this._siteUrl)}</p>`
      : '';

    // innerHTML replaces the elements, so the focused control is lost.
    // Remember which control to focus after the new elements exist.
    const focusKey: string | undefined = this._nextFocusKey ?? this._getFocusedKey();
    this._nextFocusKey = undefined;

    this.context.domElement.innerHTML = `
      <section class="${rootClass}">
        <div class="${styles.header}">
          <p class="${styles.greeting}">${escape(title)}</p>
          ${expandHtml}
        </div>
        ${siteHtml}
        ${this._renderBody()}
      </section>`;

    this._bindEvents();
    this._restoreFocus(focusKey);
  }

  /**
   * Returns the id or the list ID of the focused control, when the
   * focus is inside the component.
   */
  private _getFocusedKey(): string | undefined {
    const active: Element | null = this.context.domElement.ownerDocument.activeElement;
    if (!active || !this.context.domElement.contains(active)) {
      return undefined;
    }

    return active.id || active.getAttribute('data-list-id') || undefined;
  }

  private _restoreFocus(focusKey: string | undefined): void {
    if (!focusKey) {
      return;
    }

    this.context.domElement
      .querySelectorAll<HTMLElement>('#hc-expand, #hc-back, [data-list-id]')
      .forEach((control: HTMLElement) => {
        if (control.id === focusKey || control.getAttribute('data-list-id') === focusKey) {
          control.focus();
        }
      });
  }

  private _renderBody(): string {
    const backHtml: string = this._selectedList
      ? `<button type="button" id="hc-back" class="${styles.back}">Back to lists</button>`
      : '';

    if (this._isLoading) {
      return `${backHtml}<p class="${styles.status}" role="status">Loading...</p>`;
    }

    if (this._error) {
      return `${backHtml}<p class="${styles.error}" role="alert">${escape(this._error)}</p>`;
    }

    return this._selectedList ? backHtml + this._renderItems() : this._renderLists();
  }

  private _renderLists(): string {
    if (this._lists.length === 0) {
      return `<p class="${styles.status}">This site has no lists.</p>`;
    }

    const rows: string = this._lists
      .map((list: ISharePointList) => {
        const count: string = `${list.itemCount} ${list.itemCount === 1 ? 'item' : 'items'}`;
        return `
          <li>
            <button type="button" class="${styles.listButton}" data-list-id="${escape(list.id)}">
              <span class="${styles.value}">${escape(list.title)}</span>
              <span class="${styles.label}">${escape(count)}</span>
            </button>
          </li>`;
      })
      .join('');

    return `<ul class="${styles.list}">${rows}</ul>`;
  }

  private _renderItems(): string {
    if (this._items.length === 0) {
      return `<p class="${styles.status}">This list has no items.</p>`;
    }

    const locale: string = this.context.pageContext.cultureInfo.currentUICultureName;

    const rows: string = this._items
      .map((item: ISharePointListItem) => {
        const modified: string = new Date(item.modified).toLocaleDateString(locale);
        return `
          <li class="${styles.item}">
            <span class="${styles.value}">${escape(item.title)}</span>
            <span class="${styles.label}">Modified ${escape(modified)}</span>
          </li>`;
      })
      .join('');

    // The service gets one page of items. Say so when the list has more.
    const total: number = this._selectedList ? this._selectedList.itemCount : 0;
    const moreHtml: string =
      total > this._items.length
        ? `<p class="${styles.status}">${escape(
            `Showing the first ${this._items.length} of ${total} items.`
          )}</p>`
        : '';

    return `<ul class="${styles.list}">${rows}</ul>${moreHtml}`;
  }

  // innerHTML replaces the elements, so add the event listeners again
  // after every render.
  private _bindEvents(): void {
    const expandButton: HTMLElement | null = this.context.domElement.querySelector('#hc-expand');
    if (expandButton) {
      expandButton.addEventListener('click', this._handleRequestFullscreen);
      expandButton.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this._handleRequestFullscreen().catch(() => undefined);
        }
      });
    }

    const backButton: HTMLElement | null = this.context.domElement.querySelector('#hc-back');
    if (backButton) {
      backButton.addEventListener('click', this._handleBack);
    }

    this.context.domElement
      .querySelectorAll<HTMLElement>('[data-list-id]')
      .forEach((button: HTMLElement) => {
        button.addEventListener('click', () => {
          this._handleSelectList(button.getAttribute('data-list-id'));
        });
      });
  }

  private _loadLists(): void {
    this._hasStarted = true;
    this._requestedSiteUrl = this.properties.siteUrl;
    this._selectedList = undefined;
    this._lists = [];
    this._items = [];

    let siteUrl: string;
    try {
      siteUrl = parseSiteUrl(this.properties.siteUrl);
    } catch (error) {
      // Cancel a request that is still running for the previous site.
      this._requestId++;
      this._siteUrl = undefined;
      this._isLoading = false;
      this._error = toErrorMessage(error);
      return;
    }

    this._siteUrl = siteUrl;
    this._load(this._service.getLists(siteUrl), (lists: ISharePointList[]) => {
      this._lists = lists;
    });
  }

  /**
   * Tracks a request in the view state and renders again when it
   * finishes. The caller renders the loading state.
   */
  private _load<T>(request: Promise<T>, onLoaded: (data: T) => void): void {
    const requestId: number = ++this._requestId;
    this._isLoading = true;
    this._error = undefined;

    request.then(
      (data: T) => {
        // Ignore a response that a newer request replaced.
        if (requestId !== this._requestId) {
          return;
        }
        this._isLoading = false;
        onLoaded(data);
        this.render();
      },
      (error: unknown) => {
        if (requestId !== this._requestId) {
          return;
        }
        this._isLoading = false;
        this._error = toErrorMessage(error);
        this.render();
      }
    );
  }

  private _handleSelectList = (listId: string | null): void => {
    const list: ISharePointList | undefined = this._lists.filter(
      (candidate: ISharePointList) => candidate.id === listId
    )[0];
    if (!list || !this._siteUrl) {
      return;
    }

    this._selectedList = list;
    this._items = [];
    this._load(this._service.getItems(this._siteUrl, list.id), (items: ISharePointListItem[]) => {
      this._items = items;
    });
    this._nextFocusKey = 'hc-back';
    this.render();
  };

  private _handleBack = (): void => {
    // Cancel an item request that is still running.
    this._requestId++;
    // Put the focus back on the list the user came from.
    this._nextFocusKey = this._selectedList ? this._selectedList.id : undefined;
    this._selectedList = undefined;
    this._items = [];
    this._isLoading = false;
    this._error = undefined;
    this.render();
  };

  private _handleRequestFullscreen = async (): Promise<void> => {
    await this.requestDisplayModeAsync('fullscreen');
  };
}
