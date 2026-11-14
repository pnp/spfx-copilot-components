import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import {
  buildOpenverseUrl,
  buildSearchUrl,
  commonsThumb,
  findPnpMember,
  nameKey,
  htmlToText,
  isRelevantArticle,
  isAllowedImageUrl,
  isAllowedLinkUrl,
  licenseLabel,
  pickImage,
  pickFileImages,
  pickLeadImageNames,
  pickMetObject,
  pickNasa,
  pickOpenverse,
  queryVariants,
  searchImages,
  searchPlan,
  type ISearchStep
} from './images';

describe('allowlists', () => {
  it('only allows https images from Wikimedia’s image hosts', () => {
    expect(
      isAllowedImageUrl('https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e3/Spire.jpg/960px-Spire.jpg?utm_source=commons.wikimedia.org')
    ).toBe(true);
    expect(isAllowedImageUrl('https://thumb.wikimedia.org.evil.com/x.jpg')).toBe(false);
    expect(isAllowedImageUrl('https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/x.jpg/800px-x.jpg')).toBe(true);
    expect(isAllowedImageUrl('http://upload.wikimedia.org/x.jpg')).toBe(false);
    expect(isAllowedImageUrl('https://upload.wikimedia.org.evil.com/x.jpg')).toBe(false);
    expect(isAllowedImageUrl(['javascript', 'alert(1)'].join(':'))).toBe(false);
    expect(isAllowedImageUrl('not a url')).toBe(false);
  });

  it('allows credit links to Commons, Creative Commons and Wikipedia', () => {
    expect(isAllowedLinkUrl('https://commons.wikimedia.org/wiki/File:X.jpg')).toBe(true);
    expect(isAllowedLinkUrl('https://creativecommons.org/licenses/by-sa/4.0')).toBe(true);
    expect(isAllowedLinkUrl('https://de.wikipedia.org/wiki/Wien')).toBe(true);
    expect(isAllowedLinkUrl('https://example.com')).toBe(false);
  });
});

describe('buildSearchUrl', () => {
  it('builds a CORS-enabled Commons search for bitmaps', () => {
    const url: URL = new URL(buildSearchUrl('Vienna Opera', 640));
    expect(url.origin).toBe('https://commons.wikimedia.org');
    expect(url.searchParams.get('origin')).toBe('*');
    expect(url.searchParams.get('gsrnamespace')).toBe('6');
    expect(url.searchParams.get('gsrsearch')).toBe('Vienna Opera filetype:bitmap');
    expect(url.searchParams.get('iiurlwidth')).toBe('640');
  });
});

describe('htmlToText', () => {
  it('keeps text only', () => {
    expect(htmlToText('<a href="//x">Jane <b>Doe</b></a><script>alert(1)</script>')).toBe('Jane Doe');
    expect(htmlToText(undefined)).toBeUndefined();
  });
});

describe('pickImage', () => {
  const page = (index: number, thumburl: string, mime: string = 'image/jpeg'): unknown => ({
    index,
    imageinfo: [
      {
        thumburl,
        thumbwidth: 800,
        thumbheight: 533,
        mime,
        descriptionurl: 'https://commons.wikimedia.org/wiki/File:X.jpg',
        extmetadata: {
          Artist: { value: '<a href="//commons.wikimedia.org/wiki/User:A">Anna</a>' },
          LicenseShortName: { value: 'CC BY-SA 4.0' },
          LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0' }
        }
      }
    ]
  });

  it('picks the best-ranked allowed bitmap', () => {
    const result = pickImage({
      query: {
        pages: [
          page(3, 'https://upload.wikimedia.org/c.jpg'),
          page(1, 'https://evil.example/a.jpg'),
          page(2, 'https://upload.wikimedia.org/b.svg', 'image/svg+xml'),
          page(4, 'https://upload.wikimedia.org/d.jpg')
        ]
      }
    });
    expect(result).toEqual({
      src: 'https://upload.wikimedia.org/c.jpg',
      width: 800,
      height: 533,
      pageUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg',
      artist: 'Anna',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      source: 'commons'
    });
  });

  it('returns undefined for empty responses', () => {
    expect(pickImage({})).toBeUndefined();
    expect(pickImage(undefined)).toBeUndefined();
  });
});

describe('queryVariants', () => {
  it('tries the full query, its first two keywords, then the fallback', () => {
    expect(queryVariants('Vienna St. Stephen Cathedral', 'Wean, de Stod')).toEqual([
      'Vienna St. Stephen Cathedral',
      'Vienna St.',
      'Wean, de Stod'
    ]);
  });

  it('drops duplicates and empties', () => {
    expect(queryVariants('Helsinki', 'Helsinki')).toEqual(['Helsinki']);
    expect(queryVariants(undefined, undefined)).toEqual([]);
    expect(queryVariants(undefined, 'Title')).toEqual(['Title']);
  });
});

describe('Openverse', () => {
  const ov = (overrides: Record<string, unknown>): Record<string, unknown> => ({
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Vienna_organ.jpg',
    width: 4032,
    height: 3024,
    creator: 'TheMikeOrganist',
    license: 'by-sa',
    license_version: '4.0',
    license_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    foreign_landing_url: 'https://commons.wikimedia.org/w/index.php?curid=94813270',
    provider: 'wikimedia',
    filetype: 'jpg',
    ...overrides
  });

  it('asks for Wikimedia Commons images, no mature content', () => {
    const url: URL = new URL(buildOpenverseUrl('Vienna Opera'));
    expect(url.origin + url.pathname).toBe('https://api.openverse.org/v1/images/');
    expect(url.searchParams.get('q')).toBe('Vienna Opera');
    expect(url.searchParams.get('mature')).toBe('false');
    expect(url.searchParams.get('category')).toBeNull(); // only Flickr images carry it
    // Wikimedia Commons only: Flickr photos were too often of low quality.
    expect(url.searchParams.get('source')).toBe('wikimedia');
  });

  it('turns Commons originals into 960 px thumbnails', () => {
    expect(commonsThumb('https://upload.wikimedia.org/wikipedia/commons/0/0a/Vienna_organ.jpg', 4032)).toBe(
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0a/Vienna_organ.jpg/960px-Vienna_organ.jpg'
    );
    expect(commonsThumb('https://upload.wikimedia.org/wikipedia/commons/0/0a/Small.jpg', 800)).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/0/0a/Small.jpg'
    );
    expect(commonsThumb('https://example.com/x.jpg', 4000)).toBeUndefined();
  });

  it('names licences', () => {
    expect(licenseLabel('by-sa', '2.0')).toBe('CC BY-SA 2.0');
    expect(licenseLabel('cc0', '1.0')).toBe('CC0');
    expect(licenseLabel('pdm', undefined)).toBe('Public domain');
  });

  it('keeps large Commons photos with their credit, and no Flickr photos', () => {
    const results = pickOpenverse({
      results: [
        ov({}),
        ov({ provider: 'flickr', url: 'https://live.staticflickr.com/3161/2664706624_9391691280_b.jpg', width: 1024, height: 683, foreign_landing_url: 'https://www.flickr.com/photos/x/2664706624' }),
        ov({ provider: 'wikimedia', url: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Small.jpg', width: 332, height: 500 }), // too small
        ov({ provider: 'someprovider', url: 'https://cdn.example.com/x.jpg' }), // host not allowlisted
        ov({ filetype: 'svg' })
      ]
    });
    expect(results.length).toBe(1);
    expect(results[0]).toMatchObject({
      src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0a/Vienna_organ.jpg/960px-Vienna_organ.jpg',
      width: 960,
      height: 720,
      artist: 'TheMikeOrganist',
      license: 'CC BY-SA 4.0',
      source: 'openverse',
      provider: 'Wikimedia Commons'
    });
    expect(isAllowedImageUrl('https://live.staticflickr.com/3161/2664706624_9391691280_b.jpg')).toBe(false);
  });
});

describe('searchImages (Openverse, then Commons)', () => {
  const commonsPage = {
    query: {
      pages: [
        { index: 1, imageinfo: [{ thumburl: 'https://thumb.wikimedia.org/c.jpg', thumbwidth: 800, thumbheight: 533, mime: 'image/jpeg', extmetadata: {} }] }
      ]
    }
  };
  const json = (body: unknown, status: number = 200): Promise<Response> =>
    Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as unknown as Response);
  let calls: string[];

  beforeEach(() => {
    calls = [];
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).fetch;
  });

  function mockFetch(answer: (url: string) => Promise<Response>): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = (url: string) => {
      calls.push(url);
      return answer(url);
    };
  }

  it('falls back to Commons when Openverse is rate-limited', async () => {
    mockFetch((url: string) => (url.indexOf('https://api.openverse.org/') === 0 ? json({ detail: 'throttled' }, 429) : json(commonsPage)));
    const results = await searchImages(['ratelimit test'], ['openverse', 'commons']);
    expect(results[0].src).toBe('https://thumb.wikimedia.org/c.jpg');
    expect(results[0].source).toBe('commons');
  });

  it('falls back to Commons when Openverse finds nothing usable', async () => {
    mockFetch((url: string) => (url.indexOf('https://api.openverse.org/') === 0 ? json({ results: [] }) : json(commonsPage)));
    const results = await searchImages(['nothing usable test'], ['openverse', 'commons']);
    expect(results[0].source).toBe('commons');
  });

  it('rejects only when every source failed', async () => {
    mockFetch(() => Promise.reject(new TypeError('Failed to fetch')));
    await expect(searchImages(['offline test'], ['openverse', 'commons'])).rejects.toMatchObject({ reason: 'network' });
  });
});

describe('searchPlan (the agent picks the kind of picture)', () => {
  it('puts Wikipedia first by default and Commons always last', () => {
    expect(searchPlan(undefined)).toEqual(['wikipedia', 'openverse', 'commons']);
    expect(searchPlan('wikipedia')).toEqual(['wikipedia', 'openverse', 'commons']);
    expect(searchPlan('museum')).toEqual(['met', 'wikipedia', 'openverse', 'commons']);
    expect(searchPlan('space')).toEqual(['nasa', 'wikipedia', 'openverse', 'commons']);
    expect(searchPlan('photo')).toEqual(['openverse', 'wikipedia', 'commons']);
  });
});

describe('Wikipedia lead images', () => {
  it('reads lead-image file names in rank order', () => {
    expect(
      pickLeadImageNames({
        query: {
          pages: [
            { index: 2, title: 'Death and the Maiden (Schiele)', pageimage: 'Death.jpg' },
            { index: 1, title: 'Egon Schiele', pageimage: 'Self.jpg' },
            { index: 3, title: 'Music for Egon Schiele' }
          ]
        }
      })
    ).toEqual(['Self.jpg', 'Death.jpg']);
  });

  it('ignores a redirect into a section of another article', () => {
    expect(
      pickLeadImageNames({
        query: { redirects: [{ from: 'Greek coffee', to: 'Turkish coffee', tofragment: 'Greece' }], pages: [{ title: 'Turkish coffee', pageimage: 'Turk.jpg' }] }
      })
    ).toEqual([]);
  });

  it('never takes the lead image of an article about something else (another person)', () => {
    // Real answer for "Jeff Teper Microsoft" (there is no "Jeff Teper" article): the first article
    // with a usable image was "Joe Belfiore", so the card showed a portrait of somebody else.
    const response = {
      query: {
        pages: [
          { index: 1, title: 'List of mergers and acquisitions by Microsoft' },
          { index: 2, title: 'Skype', pageimage: 'Skype_logo_(2019–present).svg' },
          { index: 3, title: 'Skype Technologies', pageimage: 'Skype_logo_(fully_transparent).svg' },
          { index: 4, title: 'Joe Belfiore', pageimage: 'Joe_Belfiore.jpg' },
          { index: 5, title: 'List of features removed in Windows 10' }
        ]
      }
    };
    const accept = (title: string): boolean => isRelevantArticle(title, 'Jeff Teper Microsoft', 'Jeff Teper');
    expect(pickLeadImageNames(response, accept)).toEqual([]);
  });

  it('keeps articles that are about the search', () => {
    expect(isRelevantArticle("St. Stephen's Cathedral, Vienna", 'Vienna St. Stephen Cathedral')).toBe(true);
    expect(isRelevantArticle('Apollo 11', 'Apollo 11 moon landing')).toBe(true);
    expect(isRelevantArticle('Egon Schiele', 'Schiele painting Death and the Maiden')).toBe(true);
    expect(isRelevantArticle('Rings of Saturn', 'Saturn rings')).toBe(true);
    expect(isRelevantArticle('Jeff Teper', 'Jeff Teper Microsoft', 'Jeff Teper')).toBe(true);
    // Real search results (keywords of the preview scenarios).
    expect(isRelevantArticle('Cairo', 'Cairo skyline Nile')).toBe(true);
    expect(isRelevantArticle('Walls of Jerusalem', 'Jerusalem Old City walls')).toBe(true);
  });

  it('drops articles that only share a word with the search, and other people with the same first name', () => {
    expect(isRelevantArticle('List of mergers and acquisitions by Microsoft', 'Jeff Teper Microsoft')).toBe(false);
    expect(isRelevantArticle('Joe Belfiore', 'Jeff Teper Microsoft')).toBe(false);
    expect(isRelevantArticle('Jeff Bezos', 'Jeff Teper Microsoft', 'Jeff Teper')).toBe(false);
    expect(isRelevantArticle('New York City ethnic enclaves', 'New York night street blackout')).toBe(false);
    // The named article was only a redirect: other coffee articles are not about Greek coffee.
    expect(isRelevantArticle('Coffee', 'Greek coffee briki', 'Greek coffee')).toBe(false);
  });

  it('builds images with credit and never shows non-free (fair-use) files', () => {
    const file = (title: string, nonFree: string): unknown => ({
      title: `File:${title}`,
      imageinfo: [
        {
          thumburl: `https://thumb.wikimedia.org/x/${title}`,
          thumbwidth: 960,
          thumbheight: 777,
          mime: 'image/jpeg',
          descriptionurl: `https://commons.wikimedia.org/wiki/File:${title}`,
          extmetadata: { Artist: { value: 'Egon Schiele' }, LicenseShortName: { value: 'Public domain' }, NonFree: { value: nonFree } }
        }
      ]
    });
    const images = pickFileImages({ query: { pages: [file('Logo.png', 'true'), file('Self portrait.jpg', 'false')] } }, ['Self_portrait.jpg', 'Logo.png']);
    expect(images.length).toBe(1);
    expect(images[0]).toMatchObject({ width: 960, height: 777, artist: 'Egon Schiele', source: 'wikipedia' });
  });
});

describe('The Met', () => {
  it('only takes public-domain objects with an image', () => {
    const ok = pickMetObject({
      isPublicDomain: true,
      primaryImageSmall: 'https://images.metmuseum.org/CRDImages/ep/web-large/DP-42549-001.jpg',
      artistDisplayName: 'Vincent van Gogh',
      objectURL: 'https://www.metmuseum.org/art/collection/search/436535'
    });
    expect(ok).toMatchObject({ artist: 'Vincent van Gogh', license: 'Public domain', provider: 'The Met', width: 0 });
    expect(pickMetObject({ isPublicDomain: false, primaryImageSmall: 'https://images.metmuseum.org/x.jpg' })).toBeUndefined();
    expect(pickMetObject({ isPublicDomain: true, primaryImageSmall: '' })).toBeUndefined();
  });
});

describe('NASA', () => {
  it('picks the smallest rendition of at least 900 px, public domain', () => {
    const images = pickNasa({
      collection: {
        items: [
          {
            data: [{ nasa_id: 'PIA02241', center: 'JPL' }],
            links: [
              { href: 'https://images-assets.nasa.gov/image/PIA02241/PIA02241~small.jpg', render: 'image', width: 640, height: 290, size: 18000 },
              { href: 'https://images-assets.nasa.gov/image/PIA02241/PIA02241~orig.jpg', render: 'image', width: 1760, height: 800, size: 89000 }
            ]
          }
        ]
      }
    });
    expect(images[0]).toMatchObject({
      src: 'https://images-assets.nasa.gov/image/PIA02241/PIA02241~orig.jpg',
      width: 1760,
      artist: 'NASA/JPL',
      license: 'Public domain',
      pageUrl: 'https://images.nasa.gov/details/PIA02241'
    });
  });
});

describe('searchImages with a named Wikipedia article', () => {
  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).fetch;
  });

  it('uses the article’s lead image before any keyword search', async () => {
    const urls: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = (url: string) => {
      urls.push(url);
      const body: unknown =
        url.indexOf('prop=pageimages') !== -1
          ? { query: { pages: [{ index: 1, title: 'Rings of Saturn', pageimage: 'Saturn_rings.jpg' }] } }
          : {
              query: {
                pages: [
                  {
                    title: 'File:Saturn rings.jpg',
                    imageinfo: [{ thumburl: 'https://thumb.wikimedia.org/s.jpg', thumbwidth: 960, thumbheight: 540, mime: 'image/jpeg', extmetadata: {} }]
                  }
                ]
              }
            };
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
    };
    const results = await searchImages(['Saturn rings unique query'], { sources: ['wikipedia', 'commons'], wikipediaTitle: 'Rings of Saturn' });
    expect(results[0].src).toBe('https://thumb.wikimedia.org/s.jpg');
    expect(urls[0]).toContain('titles=Rings%20of%20Saturn');
    expect(urls.some((u: string) => u.indexOf('commons.wikimedia.org') !== -1)).toBe(false);
  });
});

describe('search trace (diagnostics)', () => {
  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).fetch;
  });

  it('records every step: the named article, a failing source, the fallback that found it', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = (url: string) => {
      if (url.indexOf('en.wikipedia.org') !== -1) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ query: { pages: [{ title: 'Moon landing', pageimage: 'Map.svg' }] } }) });
      }
      if (url.indexOf('images-api.nasa.gov') !== -1) {
        return Promise.resolve({ ok: false, status: 429, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            query: { pages: [{ index: 1, imageinfo: [{ thumburl: 'https://thumb.wikimedia.org/m.jpg', thumbwidth: 960, thumbheight: 640, mime: 'image/jpeg', extmetadata: {} }] }] }
          })
      });
    };
    const trace: ISearchStep[] = [];
    const results = await searchImages(['trace moon landing'], { sources: ['nasa', 'commons'], wikipediaTitle: 'Moon landing trace', trace });
    expect(results[0].src).toBe('https://thumb.wikimedia.org/m.jpg');
    expect(trace.map((t: ISearchStep) => `${t.source}/${t.kind}/${t.outcome}`)).toEqual(['nasa/keywords/failed', 'commons/keywords/found']);
    expect(trace[0].reason).toBe('http-429');
  });

  it('notes the article lookup when Wikipedia is in the plan', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ query: { pages: [] } }) });
    const trace: ISearchStep[] = [];
    await searchImages(['trace empty'], { sources: ['wikipedia'], wikipediaTitle: 'Nothing here trace', trace });
    expect(trace[0]).toMatchObject({ source: 'wikipedia', kind: 'title', query: 'Nothing here trace', outcome: 'empty' });
    expect(trace[1]).toMatchObject({ source: 'wikipedia', kind: 'keywords', query: 'trace empty', outcome: 'empty' });
  });
});

describe('PnP community team portraits', () => {
  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).fetch;
  });

  it('finds a member by the whole name, accents and case aside', () => {
    expect(nameKey('Adam Wójcik')).toBe('adam wojcik');
    expect(findPnpMember(['adam wojcik SharePoint'])?.file).toBe('adamwojcik.webp');
    expect(findPnpMember(['Vesa Juvonen PnP community'])?.name).toBe('Vesa Juvonen');
    expect(findPnpMember(['Vesa'])).toBeUndefined();
    expect(findPnpMember(['Vesa Juvonenberg'])).toBeUndefined();
    expect(findPnpMember([undefined, '', 'Vienna cathedral'])).toBeUndefined();
  });

  it('shows the member’s own portrait from pnp.github.io, without any request to search', async () => {
    const urls: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = (url: string) => {
      urls.push(url);
      return Promise.reject(new Error('no network expected'));
    };
    const trace: ISearchStep[] = [];
    const results = await searchImages(['Stefan Bauer SharePoint'], { wikipediaTitle: undefined, trace });
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      src: 'https://pnp.github.io/images/team/stefanbauer.webp',
      width: 400,
      height: 400,
      pageUrl: 'https://pnp.github.io/#team',
      source: 'pnp',
      provider: 'pnp.github.io'
    });
    expect(urls).toEqual([]);
    expect(trace).toEqual([{ source: 'pnp', kind: 'name', query: 'Stefan Bauer', outcome: 'found', count: 1, ms: 0 }]);
    expect(isAllowedImageUrl(results[0].src)).toBe(true);
    expect(isAllowedLinkUrl('https://pnp.github.io/#team')).toBe(true);
  });

  it('beats a named Wikipedia article about the same person', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = () => Promise.reject(new Error('no network expected'));
    const results = await searchImages(['portrait'], { wikipediaTitle: 'Andrew Connell' });
    expect(results[0].source).toBe('pnp');
  });
});
