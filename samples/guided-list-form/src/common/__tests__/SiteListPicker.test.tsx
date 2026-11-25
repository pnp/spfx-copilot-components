import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act as legacyAct } from 'react-dom/test-utils';
import { SiteListPicker } from '../components/SiteListPicker';
import type { IPickedSite, ISiteDirectory } from '../services/sites';
import type { ISiteList } from '../services/lists';

const act = ((React as unknown as { act?: typeof legacyAct }).act || legacyAct) as typeof legacyAct;
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class StubResizeObserver {
  public observe(): void {}
  public unobserve(): void {}
  public disconnect(): void {}
}
(window as unknown as { ResizeObserver: unknown }).ResizeObserver = StubResizeObserver;

const current: IPickedSite = {
  title: 'IT',
  url: 'https://contoso.sharepoint.com/sites/it',
  source: 'current'
};

interface ICounts {
  followed: number;
  recent: number;
  lists: number;
  search: number;
}

function makeDirectory(counts: ICounts, lists: ISiteList[] = [{ title: 'IT Requests', id: '1' }]): ISiteDirectory {
  return {
    currentSite: current,
    followedSites: async () => {
      counts.followed += 1;
      return [current];
    },
    recentSites: async () => {
      counts.recent += 1;
      return [];
    },
    searchSites: async () => {
      counts.search += 1;
      return [current];
    },
    listsFor: async () => {
      counts.lists += 1;
      return lists;
    }
  };
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = '';
});

async function flush(ms: number = 30): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

describe('SiteListPicker directory identity', () => {
  it('does not reload when it is rendered again with a new directory object, and clears both spinners', async () => {
    const counts: ICounts = { followed: 0, recent: 0, lists: 0, search: 0 };
    act(() => {
      root.render(<SiteListPicker directory={makeDirectory(counts)} onPick={() => undefined} />);
    });
    await flush(40);
    expect(counts.followed).toBe(1);
    expect(counts.recent).toBe(1);
    expect(counts.lists).toBe(1);
    expect(container.querySelector('[data-testid="wiz-sites-spinner"]')).toBeNull();
    expect(container.querySelector('[data-testid="wiz-lists-spinner"]')).toBeNull();
    const trigger = container.querySelector('#wiz-list-select') as HTMLButtonElement;
    expect(trigger).not.toBeNull();
    await act(async () => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flush(40);
    expect((document.body.textContent || '')).toContain('IT Requests');
    await act(async () => {
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    });
    await flush(40);

    act(() => {
      root.render(<SiteListPicker directory={makeDirectory(counts)} onPick={() => undefined} />);
    });
    await flush(40);
    expect(counts.followed).toBe(1);
    expect(counts.recent).toBe(1);
    expect(counts.lists).toBe(1);
    expect(counts.search).toBe(0);
    expect(container.querySelector('[data-testid="wiz-sites-spinner"]')).toBeNull();
    expect(container.querySelector('[data-testid="wiz-lists-spinner"]')).toBeNull();
  });

  it('clears the lists spinner when the site has no lists', async () => {
    const emptyCounts: ICounts = { followed: 0, recent: 0, lists: 0, search: 0 };
    act(() => {
      root.render(<SiteListPicker directory={makeDirectory(emptyCounts, [])} onPick={() => undefined} />);
    });
    await flush(40);
    expect(emptyCounts.lists).toBe(1);
    expect(container.querySelector('[data-testid="wiz-lists-spinner"]')).toBeNull();
    expect((container.textContent || '')).toContain('No custom lists on this site');
  });

  it('clears the lists spinner when lists cannot be loaded', async () => {
    const failCounts: ICounts = { followed: 0, recent: 0, lists: 0, search: 0 };
    const failing: ISiteDirectory = {
      ...makeDirectory(failCounts),
      listsFor: async () => {
        failCounts.lists += 1;
        throw new Error('nope');
      }
    };
    act(() => {
      root.render(<SiteListPicker directory={failing} onPick={() => undefined} />);
    });
    await flush(40);
    expect(failCounts.lists).toBe(1);
    expect(container.querySelector('[data-testid="wiz-lists-spinner"]')).toBeNull();
    expect((container.textContent || '')).toMatch(/couldn/);
  });
});

describe('SiteListPicker selected site', () => {
  const lumen: IPickedSite = {
    title: 'Lumen Team',
    url: 'https://contoso.sharepoint.com/sites/lumen',
    source: 'followed'
  };

  function twoSiteDirectory(): ISiteDirectory {
    const counts: ICounts = { followed: 0, recent: 0, lists: 0, search: 0 };
    return {
      currentSite: current,
      followedSites: async () => {
        counts.followed += 1;
        return [current, lumen];
      },
      recentSites: async () => {
        counts.recent += 1;
        return [];
      },
      searchSites: async () => [current, lumen],
      listsFor: async (url: string) => {
        counts.lists += 1;
        return url === lumen.url ? [{ title: 'Milestones', id: '2' }] : [{ title: 'IT Requests', id: '1' }];
      }
    };
  }

  it('marks the current site as selected on load without moving focus', async () => {
    act(() => {
      root.render(<SiteListPicker directory={twoSiteDirectory()} onPick={() => undefined} />);
    });
    await flush(40);
    const buttons = Array.from(container.querySelectorAll('[data-testid="wiz-site-option"]')) as HTMLButtonElement[];
    expect(buttons).toHaveLength(2);
    expect(buttons[0].getAttribute('aria-selected')).toBe('true');
    expect(buttons[1].getAttribute('aria-selected')).toBe('false');
    expect(buttons[0].querySelector('[data-testid="wiz-site-check"]')).not.toBeNull();
    expect(buttons[1].querySelector('[data-testid="wiz-site-check"]')).toBeNull();
    expect(document.activeElement).not.toBe(container.querySelector('#wiz-list-select'));
  });

  it('highlights the clicked site, scrolls the list step into view, and focuses the list select', async () => {
    const scroll = jest.fn();
    const focus = jest.fn();
    const proto = HTMLElement.prototype as HTMLElement & { scrollIntoView: (arg?: unknown) => void; focus: (arg?: unknown) => void };
    const originalScroll = proto.scrollIntoView;
    const originalFocus = proto.focus;
    proto.scrollIntoView = scroll;
    proto.focus = function (this: HTMLElement, arg?: unknown): void {
      focus(this && this.id);
      if (typeof originalFocus === 'function') {
        originalFocus.call(this, arg);
      }
    };
    try {
      act(() => {
        root.render(<SiteListPicker directory={twoSiteDirectory()} onPick={() => undefined} />);
      });
      await flush(40);
      const before = Array.from(container.querySelectorAll('[data-testid="wiz-site-option"]')) as HTMLButtonElement[];
      act(() => {
        before[1].click();
      });
      await flush(80);
      const buttons = Array.from(container.querySelectorAll('[data-testid="wiz-site-option"]')) as HTMLButtonElement[];
      expect(buttons[1].getAttribute('aria-selected')).toBe('true');
      expect(buttons[0].getAttribute('aria-selected')).toBe('false');
      expect(buttons[1].querySelector('[data-testid="wiz-site-check"]')).not.toBeNull();
      expect(buttons[0].querySelector('[data-testid="wiz-site-check"]')).toBeNull();
      expect((container.querySelector('label[for="wiz-list-select"]') as HTMLElement).textContent).toContain('Lumen Team');
      expect(scroll).toHaveBeenCalled();
      expect(focus).toHaveBeenCalledWith('wiz-list-select');
      const select = container.querySelector('#wiz-list-select') as HTMLButtonElement;
      expect(select.tagName).toBe('BUTTON');
      expect(select.getAttribute('role')).toBe('combobox');
      if (document.hasFocus()) {
        expect(document.activeElement).toBe(select);
      }
    } finally {
      proto.scrollIntoView = originalScroll;
      proto.focus = originalFocus;
    }
  });

  it('picks a list from the themed combobox rather than a native select', async () => {
    const picks: string[] = [];
    act(() => {
      root.render(<SiteListPicker directory={twoSiteDirectory()} onPick={(siteUrl, listTitle) => picks.push(`${siteUrl}|${listTitle}`)} />);
    });
    await flush(40);
    const trigger = container.querySelector('#wiz-list-select') as HTMLButtonElement;
    expect(trigger).not.toBeNull();
    await act(async () => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flush(40);
    const option = Array.from(document.querySelectorAll('[data-testid="wiz-list-option"]')).find((o) => (o.textContent || '') === 'IT Requests') as HTMLElement;
    expect(option).not.toBeNull();
    await act(async () => {
      option.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await flush(40);
    const use = container.querySelector('[data-testid="wiz-use-list"]') as HTMLButtonElement;
    expect(use).not.toBeNull();
    expect((use.textContent || '').trim()).toBe('Open the form');
    expect(use.getAttribute('aria-label')).toBeNull();
    await act(async () => {
      use.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(picks).toEqual(['https://contoso.sharepoint.com/sites/it|IT Requests']);
  });
});

describe('SiteListPicker site cards', () => {
  it('shows the site name only, with the full URL in the title and aria-label', async () => {
    const lumen: IPickedSite = {
      title: 'Lumen Team',
      url: 'https://contoso.sharepoint.com/sites/lumen',
      source: 'followed'
    };
    const directory: ISiteDirectory = {
      currentSite: current,
      followedSites: async () => [current, lumen],
      recentSites: async () => [],
      searchSites: async () => [current, lumen],
      listsFor: async () => [{ title: 'IT Requests', id: '1' }]
    };
    act(() => {
      root.render(<SiteListPicker directory={directory} onPick={() => undefined} />);
    });
    await flush(40);
    expect(container.textContent || '').not.toContain('Only sites on this tenant are shown.');
    expect(container.textContent || '').not.toContain('Pick a site, then a custom list.');
    const buttons = Array.from(container.querySelectorAll('[data-testid="wiz-site-option"]')) as HTMLButtonElement[];
    expect(buttons).toHaveLength(2);
    expect(buttons[0].textContent || '').toBe('IT');
    expect(buttons[1].textContent || '').toBe('Lumen Team');
    expect(buttons[0].textContent || '').not.toContain('https://');
    expect(buttons[1].textContent || '').not.toContain('https://');
    expect(buttons[0].getAttribute('title')).toBe(current.url);
    expect(buttons[1].getAttribute('title')).toBe(lumen.url);
    expect(buttons[0].getAttribute('aria-label')).toBe(`IT, ${current.url}`);
    expect(buttons[1].getAttribute('aria-label')).toBe(`Lumen Team, ${lumen.url}`);
  });

  it('preselects the preferred site when Change list returns to the picker', async () => {
    const lumen: IPickedSite = {
      title: 'Lumen Team',
      url: 'https://contoso.sharepoint.com/sites/lumen',
      source: 'followed'
    };
    const directory: ISiteDirectory = {
      currentSite: current,
      followedSites: async () => [current, lumen],
      recentSites: async () => [],
      searchSites: async () => [current, lumen],
      listsFor: async () => [{ title: 'Milestones', id: '2' }]
    };
    act(() => {
      root.render(<SiteListPicker directory={directory} preferredSiteUrl={lumen.url} onPick={() => undefined} />);
    });
    await flush(40);
    const buttons = Array.from(container.querySelectorAll('[data-testid="wiz-site-option"]')) as HTMLButtonElement[];
    expect(buttons[1].getAttribute('aria-selected')).toBe('true');
    expect(buttons[0].getAttribute('aria-selected')).toBe('false');
    expect((container.querySelector('label[for="wiz-list-select"]') as HTMLElement).textContent).toContain('Lumen Team');
  });
});

describe('SiteListPicker current site title', () => {
  it('shows the real site title and List on <title>, not This site, and dedupes followed copies', async () => {
    const generic: IPickedSite = {
      title: 'Current site',
      url: current.url,
      source: 'current'
    };
    const named: IPickedSite = {
      title: 'IT helpdesk',
      url: current.url,
      source: 'followed'
    };
    const lumen: IPickedSite = {
      title: 'Lumen Team',
      url: 'https://contoso.sharepoint.com/sites/lumen',
      source: 'recent'
    };
    const directory: ISiteDirectory = {
      currentSite: generic,
      followedSites: async () => [generic, named],
      recentSites: async () => [named, lumen],
      searchSites: async () => [named, lumen],
      listsFor: async () => [{ title: 'IT Requests', id: '1' }]
    };
    act(() => {
      root.render(<SiteListPicker directory={directory} onPick={() => undefined} />);
    });
    await flush(40);
    const text = container.textContent || '';
    expect(text).not.toContain('This site');
    expect(text).not.toContain('List on This site');
    expect(text).not.toContain('List on Current site');
    expect(text).toContain('List on IT helpdesk');
    const buttons = Array.from(container.querySelectorAll('[data-testid="wiz-site-option"]')) as HTMLButtonElement[];
    expect(buttons).toHaveLength(2);
    expect(buttons[0].textContent || '').toBe('IT helpdesk');
    expect(buttons[1].textContent || '').toBe('Lumen Team');
    expect((container.querySelector('label[for="wiz-list-select"]') as HTMLElement).textContent).toBe('List on IT helpdesk');
  });

  it('shows Current site and List on Current site until a real title is known', async () => {
    const generic: IPickedSite = {
      title: 'Current site',
      url: current.url,
      source: 'current'
    };
    const directory: ISiteDirectory = {
      currentSite: generic,
      followedSites: async () => [generic],
      recentSites: async () => [],
      searchSites: async () => [generic],
      listsFor: async () => [{ title: 'IT Requests', id: '1' }]
    };
    act(() => {
      root.render(<SiteListPicker directory={directory} onPick={() => undefined} />);
    });
    await flush(40);
    const text = container.textContent || '';
    expect(text).not.toContain('This site');
    expect((container.querySelector('label[for="wiz-list-select"]') as HTMLElement).textContent).toBe('List on Current site');
    const buttons = Array.from(container.querySelectorAll('[data-testid="wiz-site-option"]')) as HTMLButtonElement[];
    expect(buttons).toHaveLength(1);
    expect(buttons[0].textContent || '').toBe('Current site');
  });
});
