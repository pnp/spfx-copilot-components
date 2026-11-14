jest.mock('@microsoft/sp-copilot-component', () => ({
  BaseCopilotComponent: class {
    public requestDisplayModeAsync: jest.Mock = jest.fn().mockResolvedValue(undefined);
  }
}));

jest.mock('@microsoft/sp-http', () => ({
  SPHttpClient: { configurations: { v1: {} } }
}));

jest.mock(
  './MyCopilotAppCopilotComponent.module.scss',
  () => ({
    __esModule: true,
    default: new Proxy(
      {},
      { get: (_target: object, key: string | symbol): string => String(key) }
    )
  }),
  { virtual: true }
);

jest.mock(
  'MyCopilotAppCopilotComponentStrings',
  () => ({ ExpandToFullscreenTitle: 'Expand to fullscreen' }),
  { virtual: true }
);

import MyCopilotAppCopilotComponent from './MyCopilotAppCopilotComponent';

const SITE_URL: string = 'https://contoso.sharepoint.com/sites/hr';
const OTHER_SITE_URL: string = 'https://contoso.sharepoint.com/sites/legal';

const LISTS: unknown = {
  value: [
    { Id: 'a1', Title: 'Documents', ItemCount: 12 },
    { Id: 'b2', Title: 'Tasks', ItemCount: 1 }
  ]
};

const ITEMS: unknown = {
  value: [{ Id: 1, Title: 'Budget', Modified: '2026-09-15T12:00:00Z' }]
};

interface IFakeResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

// The members of the entry class that the test drives. They are
// protected in the real class.
interface ITestComponent {
  context: unknown;
  properties: { siteUrl?: string };
  hostContext: { theme?: string; displayMode?: string };
  requestDisplayModeAsync: jest.Mock;
  onInit(): Promise<void>;
  render(): void;
}

function respond(status: number, body: unknown): IFakeResponse {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

async function flush(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe('MyCopilotAppCopilotComponent', () => {
  let element: HTMLElement;
  let get: jest.Mock;
  let component: ITestComponent;

  async function create(siteUrl: string | undefined): Promise<void> {
    // Focus works only on an element that is in the document.
    element = document.createElement('div');
    document.body.appendChild(element);
    component = new MyCopilotAppCopilotComponent() as unknown as ITestComponent;
    component.context = {
      domElement: element,
      spHttpClient: { get },
      pageContext: { cultureInfo: { currentUICultureName: 'en-US' } }
    };
    component.properties = { siteUrl };
    component.hostContext = { theme: 'light', displayMode: 'inline' };
    await component.onInit();
  }

  async function renderAndWait(): Promise<void> {
    component.render();
    await flush();
  }

  async function select(selector: string): Promise<void> {
    (element.querySelector(selector) as HTMLElement).click();
    await flush();
  }

  beforeEach(() => {
    get = jest.fn((url: string) =>
      Promise.resolve(respond(200, url.indexOf('/items') === -1 ? LISTS : ITEMS))
    );
  });

  afterEach(() => {
    element.remove();
  });

  // Makes the next request wait until the test settles it.
  function deferNextResponse(): (value: IFakeResponse) => void {
    let settle: (value: IFakeResponse) => void = () => undefined;
    get.mockImplementationOnce(
      () =>
        new Promise<IFakeResponse>((resolve) => {
          settle = resolve;
        })
    );
    return (value: IFakeResponse) => settle(value);
  }

  it('escapes an item title, a list ID and the title of the selected list', async () => {
    const html: string = '<img src=x onerror=alert(1)>';
    get.mockImplementation((url: string) =>
      Promise.resolve(
        respond(
          200,
          url.indexOf('/items') === -1
            ? { value: [{ Id: `a">${html}`, Title: html, ItemCount: 1 }] }
            : { value: [{ Id: 1, Title: html, Modified: '2026-09-15T12:00:00Z' }] }
        )
      )
    );
    await create(SITE_URL);
    await renderAndWait();
    expect(element.querySelector('img')).toBeNull();

    await select('[data-list-id]');

    expect(element.querySelector('#hc-back')).not.toBeNull();
    expect(element.querySelector('img')).toBeNull();
    expect(element.querySelectorAll('li')).toHaveLength(1);
    expect(element.querySelector('li')?.textContent).toContain(html);
  });

  it('does not load again when the host renders during a load', async () => {
    const settle: (value: IFakeResponse) => void = deferNextResponse();
    await create(SITE_URL);
    component.render();

    component.hostContext = { theme: 'dark', displayMode: 'inline' };
    component.render();
    settle(respond(200, LISTS));
    await flush();

    expect(get).toHaveBeenCalledTimes(1);
    expect(element.textContent).toContain('Documents');
  });

  it('ignores an item error that arrives after Back', async () => {
    await create(SITE_URL);
    await renderAndWait();
    const settle: (value: IFakeResponse) => void = deferNextResponse();
    (element.querySelector('[data-list-id="a1"]') as HTMLElement).click();

    (element.querySelector('#hc-back') as HTMLElement).click();
    settle(respond(500, {}));
    await flush();

    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(element.textContent).toContain('Tasks');
  });

  it('keeps the URL message when an earlier request fails later', async () => {
    const settle: (value: IFakeResponse) => void = deferNextResponse();
    await create(SITE_URL);
    component.render();

    component.properties = { siteUrl: 'the HR site' };
    component.render();
    settle(respond(500, {}));
    await flush();

    expect(element.querySelector('[role="alert"]')?.textContent).toBe(
      '"the HR site" is not a valid site URL.'
    );
  });

  it('says when a list has more items than the component shows', async () => {
    await create(SITE_URL);
    await renderAndWait();

    await select('[data-list-id="a1"]');
    expect(element.textContent).toContain('Showing the first 1 of 12 items.');

    await select('#hc-back');
    await select('[data-list-id="b2"]');
    expect(element.textContent).not.toContain('Showing the first');
  });

  it('moves focus to the Back control when a list is selected', async () => {
    await create(SITE_URL);
    await renderAndWait();

    await select('[data-list-id="a1"]');

    expect(document.activeElement?.id).toBe('hc-back');
  });

  it('returns focus to the list after Back', async () => {
    await create(SITE_URL);
    await renderAndWait();
    await select('[data-list-id="b2"]');

    await select('#hc-back');

    expect(document.activeElement?.getAttribute('data-list-id')).toBe('b2');
  });

  it('keeps focus on the same control when the host renders again', async () => {
    await create(SITE_URL);
    await renderAndWait();
    (element.querySelector('[data-list-id="b2"]') as HTMLElement).focus();

    component.hostContext = { theme: 'dark', displayMode: 'inline' };
    component.render();

    expect(document.activeElement?.getAttribute('data-list-id')).toBe('b2');
  });

  it('shows a loading state, then the lists of the site', async () => {
    await create(SITE_URL);

    component.render();
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Loading');

    await flush();
    expect(get.mock.calls[0][0]).toContain(`${SITE_URL}/_api/web/lists?`);
    expect(element.querySelector('[role="status"]')).toBeNull();
    expect(element.textContent).toContain(SITE_URL);
    expect(element.textContent).toContain('Documents');
    expect(element.textContent).toContain('12 items');
    expect(element.textContent).toContain('1 item');
    expect(element.textContent).not.toContain('1 items');
  });

  it('does not load again when the host renders again', async () => {
    await create(SITE_URL);
    await renderAndWait();
    await select('[data-list-id="a1"]');

    component.hostContext = { theme: 'dark', displayMode: 'fullscreen' };
    await renderAndWait();

    expect(get).toHaveBeenCalledTimes(2);
    expect(element.textContent).toContain('Budget');
  });

  it('loads the new site when the agent sends a different URL', async () => {
    await create(SITE_URL);
    await renderAndWait();
    await select('[data-list-id="a1"]');

    component.properties = { siteUrl: OTHER_SITE_URL };
    await renderAndWait();

    expect(get.mock.calls[2][0]).toContain(`${OTHER_SITE_URL}/_api/web/lists?`);
    expect(element.querySelector('#hc-back')).toBeNull();
    expect(element.textContent).toContain(OTHER_SITE_URL);
  });

  it('ignores a response that a newer request replaced', async () => {
    let resolveFirst: (value: IFakeResponse) => void = () => undefined;
    get.mockImplementationOnce(
      () =>
        new Promise<IFakeResponse>((resolve) => {
          resolveFirst = resolve;
        })
    );
    get.mockImplementationOnce(() =>
      Promise.resolve(respond(200, { value: [{ Id: 'c3', Title: 'Policies', ItemCount: 4 }] }))
    );
    await create(SITE_URL);
    component.render();

    component.properties = { siteUrl: OTHER_SITE_URL };
    await renderAndWait();
    resolveFirst(respond(200, LISTS));
    await flush();

    expect(element.textContent).toContain('Policies');
    expect(element.textContent).not.toContain('Documents');
  });

  it('escapes values that come from SharePoint', async () => {
    const title: string = '<img src=x onerror=alert(1)>';
    get.mockResolvedValue(respond(200, { value: [{ Id: 'a1', Title: title, ItemCount: 0 }] }));
    await create(SITE_URL);

    await renderAndWait();

    expect(element.querySelector('img')).toBeNull();
    expect(element.textContent).toContain(title);
  });

  it('shows a message and makes no request when the site URL is missing', async () => {
    await create(undefined);

    await renderAndWait();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('No site URL was given.');
    expect(get).not.toHaveBeenCalled();
  });

  it('escapes an invalid URL in the error message', async () => {
    await create('<b>hr</b>');

    await renderAndWait();

    expect(element.querySelector('b')).toBeNull();
    expect(element.querySelector('[role="alert"]')?.textContent).toBe(
      '"<b>hr</b>" is not a valid site URL.'
    );
  });

  it('shows a message when the user cannot access the site', async () => {
    get.mockResolvedValue(respond(403, {}));
    await create(SITE_URL);

    await renderAndWait();

    expect(element.querySelector('[role="alert"]')?.textContent).toBe(
      'You do not have access to this site.'
    );
  });

  it('shows a message when the site has no visible lists', async () => {
    get.mockResolvedValue(respond(200, { value: [] }));
    await create(SITE_URL);

    await renderAndWait();

    expect(element.textContent).toContain('This site has no lists.');
  });

  it('shows the items of the selected list with a Back control', async () => {
    await create(SITE_URL);
    await renderAndWait();

    await select('[data-list-id="a1"]');

    expect(get.mock.calls[1][0]).toContain(`${SITE_URL}/_api/web/lists(guid'a1')/items?`);
    expect(element.textContent).toContain('Documents');
    expect(element.textContent).toContain('Budget');
    expect(element.textContent).toContain('2026');
    expect(element.textContent).not.toContain('Tasks');
    expect(element.querySelector('#hc-back')).not.toBeNull();
  });

  it('returns to the lists without a new request', async () => {
    await create(SITE_URL);
    await renderAndWait();
    await select('[data-list-id="a1"]');

    await select('#hc-back');

    expect(get).toHaveBeenCalledTimes(2);
    expect(element.textContent).toContain('Tasks');
    expect(element.querySelector('#hc-back')).toBeNull();
  });

  it('shows a message when the list has no items', async () => {
    await create(SITE_URL);
    await renderAndWait();
    get.mockResolvedValue(respond(200, { value: [] }));

    await select('[data-list-id="a1"]');

    expect(element.textContent).toContain('This list has no items.');
  });

  it('shows the error and the Back control when the items cannot be loaded', async () => {
    await create(SITE_URL);
    await renderAndWait();
    get.mockResolvedValue(respond(500, {}));

    await select('[data-list-id="a1"]');

    expect(element.querySelector('[role="alert"]')?.textContent).toBe(
      'SharePoint returned an error (500).'
    );
    expect(element.querySelector('#hc-back')).not.toBeNull();
  });

  it('hides the expand control in fullscreen', async () => {
    await create(SITE_URL);
    component.hostContext = { theme: 'light', displayMode: 'fullscreen' };

    await renderAndWait();

    expect(element.querySelector('#hc-expand')).toBeNull();
  });

  it('requests fullscreen when the expand control is selected', async () => {
    await create(SITE_URL);
    await renderAndWait();

    await select('#hc-expand');

    expect(component.requestDisplayModeAsync).toHaveBeenCalledWith('fullscreen');
  });
});
