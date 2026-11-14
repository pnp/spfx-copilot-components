// @microsoft/sp-http cannot load outside the SPFx runtime. The view only
// needs the URL helper from the service module, so stub the package.
jest.mock('@microsoft/sp-http', () => ({
  SPHttpClient: { configurations: { v1: {} } }
}));

import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type {
  ISharePointList,
  ISharePointListItem
} from '../services/SharePointListsService';
import type { ISharePointListsProps, ISharePointListsStrings } from './ISharePointListsProps';
import SharePointLists from './SharePointLists';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

// jsdom has no ResizeObserver. The Fluent UI MessageBar needs one.
class ResizeObserverStub {
  public observe(): void { /* not needed in tests */ }
  public unobserve(): void { /* not needed in tests */ }
  public disconnect(): void { /* not needed in tests */ }
}
(window as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
  ResizeObserverStub;

const act = (React as typeof React & {
  act: (callback: () => void | Promise<void>) => Promise<void>;
}).act;

const SITE_URL: string = 'https://contoso.sharepoint.com/sites/hr';
const LISTS: ISharePointList[] = [
  { id: 'a1', title: 'Documents', itemCount: 2 },
  { id: 'b2', title: 'Tasks', itemCount: 0 }
];
const ITEMS: ISharePointListItem[] = [
  { id: 1, title: 'Budget.xlsx', modified: '2026-09-02T10:00:00Z' }
];
const STRINGS: ISharePointListsStrings = {
  ListsTitle: 'Lists',
  ExpandButtonLabel: 'Expand to fullscreen',
  BackButtonLabel: 'Back to lists',
  LoadingListsLabel: 'Loading lists',
  LoadingItemsLabel: 'Loading items',
  NoListsMessage: 'This site has no lists.',
  NoItemsMessage: 'This list has no items.',
  ItemCountLabel: '{0} items',
  SingleItemCountLabel: '1 item',
  GenericErrorMessage: 'Something went wrong. Try again.'
};

describe('SharePointLists', () => {
  let container: HTMLDivElement;
  let root: Root;
  let getLists: jest.Mock;
  let getItems: jest.Mock;
  let onRequestDisplayMode: jest.Mock;
  let props: ISharePointListsProps;

  async function render(): Promise<void> {
    await act(async () => {
      root.render(<SharePointLists {...props} />);
    });
  }

  async function click(selector: string): Promise<void> {
    const element = container.querySelector<HTMLElement>(selector);
    if (!element) {
      throw new Error(`No element matches ${selector}`);
    }
    await act(async () => {
      element.click();
    });
  }

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    getLists = jest.fn().mockResolvedValue(LISTS);
    getItems = jest.fn().mockResolvedValue(ITEMS);
    onRequestDisplayMode = jest.fn().mockResolvedValue(undefined);
    props = {
      service: { getLists, getItems },
      siteUrl: SITE_URL,
      fallbackSiteUrl: 'https://contoso.sharepoint.com',
      locale: 'en-US',
      hostContext: {
        theme: 'light',
        displayMode: 'inline',
        availableDisplayModes: ['inline', 'fullscreen']
      },
      onRequestDisplayMode,
      onContentResize: jest.fn(),
      targetDocument: document,
      strings: STRINGS
    };
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('loads and shows the lists of the site', async () => {
    await render();

    expect(getLists).toHaveBeenCalledWith(SITE_URL);
    expect(container.textContent).toContain('Documents');
    expect(container.textContent).toContain('Tasks');
    expect(container.textContent).toContain('2 items');
  });

  it('uses the singular label for a list with one item', async () => {
    getLists.mockResolvedValue([{ id: 'c3', title: 'Site Pages', itemCount: 1 }]);

    await render();

    expect(container.textContent).toContain('1 item');
    expect(container.textContent).not.toContain('1 items');
  });

  it('uses the fallback site when no site URL is given', async () => {
    props.siteUrl = undefined;

    await render();

    expect(getLists).toHaveBeenCalledWith('https://contoso.sharepoint.com');
  });

  it('shows the items of a list when the user selects it', async () => {
    await render();
    await click('[data-list-id="a1"]');

    expect(getItems).toHaveBeenCalledWith(SITE_URL, 'a1');
    expect(container.textContent).toContain('Budget.xlsx');
    expect(container.textContent).not.toContain('Tasks');
  });

  it('returns to the lists when the user selects Back', async () => {
    await render();
    await click('[data-list-id="a1"]');
    await click('[data-action="back"]');

    expect(container.textContent).toContain('Tasks');
    expect(container.textContent).not.toContain('Budget.xlsx');
  });

  it('shows an empty message when the site has no visible lists', async () => {
    getLists.mockResolvedValue([]);

    await render();

    expect(container.textContent).toContain('This site has no lists.');
  });

  it('shows an empty message when the list has no items', async () => {
    getItems.mockResolvedValue([]);

    await render();
    await click('[data-list-id="b2"]');

    expect(container.textContent).toContain('This list has no items.');
  });

  it('shows the error and does not call SharePoint for an invalid site URL', async () => {
    props.siteUrl = 'the HR site';

    await render();

    expect(getLists).not.toHaveBeenCalled();
    expect(container.textContent).toContain('"the HR site" is not a valid site URL.');
  });

  it('shows the error when SharePoint rejects the request', async () => {
    getLists.mockRejectedValue(new Error('SharePoint returned 404.'));

    await render();

    expect(container.textContent).toContain('SharePoint returned 404.');
  });

  it('reloads and drops the selection when the site URL changes', async () => {
    await render();
    await click('[data-list-id="a1"]');

    props = { ...props, siteUrl: 'https://contoso.sharepoint.com/sites/it' };
    await render();

    expect(getLists).toHaveBeenLastCalledWith('https://contoso.sharepoint.com/sites/it');
    expect(getItems).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('Tasks');
    expect(container.textContent).not.toContain('Budget.xlsx');
  });

  it('requests fullscreen when the user selects the expand button', async () => {
    await render();
    await click('[aria-label="Expand to fullscreen"]');

    expect(onRequestDisplayMode).toHaveBeenCalledWith('fullscreen');
  });

  it('hides the expand button in fullscreen mode', async () => {
    props.hostContext = { ...props.hostContext, displayMode: 'fullscreen' };

    await render();

    expect(container.querySelector('[aria-label="Expand to fullscreen"]')).toBeNull();
  });

  it('hides the expand button when the host does not offer fullscreen', async () => {
    props.hostContext = { ...props.hostContext, availableDisplayModes: ['inline'] };

    await render();

    expect(container.querySelector('[aria-label="Expand to fullscreen"]')).toBeNull();
  });
});
