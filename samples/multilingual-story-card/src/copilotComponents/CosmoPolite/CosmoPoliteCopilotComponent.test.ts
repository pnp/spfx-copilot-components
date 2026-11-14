import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { MockCopilotComponentContext, type IMockCopilotComponentContextParameters } from '@microsoft/sp-copilot-component/dist/test-api';
import type { ICopilotComponentHostContext } from '@microsoft/sp-copilot-component';

import CosmoPoliteCopilotComponent from './CosmoPoliteCopilotComponent';
import type { ICosmoPoliteCopilotComponentProperties } from './CosmoPoliteCopilotComponentProperties';

// Smoke render through the real BaseCopilotComponent lifecycle (onInit → render), without the
// SPFx loader. No image query, so no network.
interface IInternals {
  _internalRender(): void;
  _internalNotifyHostContextChanged(diff: Partial<ICopilotComponentHostContext>): void;
}

let lastComponent: IInternals | undefined;

async function mount(
  properties: Partial<ICosmoPoliteCopilotComponentProperties>,
  hostContext: ICopilotComponentHostContext = { theme: 'light', displayMode: 'inline' },
  copilotBridge?: unknown
): Promise<HTMLElement> {
  const domElement: HTMLElement = document.createElement('div');
  document.body.appendChild(domElement);
  const context: MockCopilotComponentContext = new MockCopilotComponentContext(
    copilotBridge
      ? { domElement, hostContext, copilotBridge: copilotBridge as IMockCopilotComponentContextParameters['copilotBridge'] }
      : { domElement, hostContext }
  );
  const component: CosmoPoliteCopilotComponent = new CosmoPoliteCopilotComponent();
  await context.initializeAsync(component, {
    language: 'en',
    title: 'Title',
    text: 'One. Two.',
    ...properties
  } as ICosmoPoliteCopilotComponentProperties);
  // initializeAsync stops before the first render; the loader then calls the (untyped) internal render.
  lastComponent = component as unknown as IInternals;
  lastComponent._internalRender();
  return domElement;
}

describe('CosmoPoliteCopilotComponent', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('lang');
  });

  it('shows its own skeleton in the host theme until the card is built', async () => {
    const domElement: HTMLElement = document.createElement('div');
    document.body.appendChild(domElement);
    const context: MockCopilotComponentContext = new MockCopilotComponentContext({ domElement, hostContext: { theme: 'dark', displayMode: 'fullscreen' } });
    const component: CosmoPoliteCopilotComponent = new CosmoPoliteCopilotComponent();
    await context.initializeAsync(component, { language: 'nl', title: 'Einstein', text: 'Een. Twee.' } as ICosmoPoliteCopilotComponentProperties);
    const frame: HTMLElement | null = domElement.querySelector('.skeleton');
    expect(frame).not.toBeNull();
    expect(frame?.parentElement?.getAttribute('data-theme')).toBe('dark');
    expect(frame?.parentElement?.getAttribute('data-mode')).toBe('fullscreen');
    (component as unknown as IInternals)._internalRender();
    expect(domElement.querySelector('.skeleton')).toBeNull();
    expect(domElement.querySelector('article h2')?.textContent).toBe('Einstein');
  });

  it("hides SharePoint's grey loading bars and its inner scroller, once per document", () => {
    const styles: NodeListOf<Element> = document.querySelectorAll('style#cosmo-boot');
    expect(styles.length).toBe(1);
    expect(styles[0].textContent).toContain('rect[id^="SPPortableComponentApplication"]');
    // SharePoint's shell must not scroll inside the iframe (one scrollbar: Copilot's).
    // Sized by the card (no minimum of 100 %), so the frame can shrink again.
    expect(styles[0].textContent).toContain(':root,:root>body{height:auto;overflow-y:visible}');
  });

  it('renders content in the detected language with its own lang and dir', async () => {
    const dom: HTMLElement = await mount({ language: 'ar', title: 'القاهرة', text: 'جملة أولى. جملة ثانية.' });
    const root: HTMLElement = dom.querySelector('article') as HTMLElement;
    expect(root.getAttribute('lang')).toBe('ar');
    expect(root.getAttribute('dir')).toBe('rtl');
    expect(root.getAttribute('data-theme')).toBe('light');
    expect(root.getAttribute('data-mode')).toBe('inline');
    expect(root.getAttribute('data-design')).toBe('dramatic');
    expect(root.getAttribute('data-layout')).toBe('beside');
    expect(dom.querySelector('h2')?.textContent).toBe('القاهرة');
    expect(dom.querySelectorAll('[class*="sentence"]').length).toBe(2);
  });

  it('uses the Japanese chrome table for Japanese', async () => {
    const dom: HTMLElement = await mount({ language: 'ja', title: '東京', text: '東京は大きい。京都は古い。' });
    const root: HTMLElement = dom.querySelector('article') as HTMLElement;
    expect(root.getAttribute('lang')).toBe('ja');
    expect(dom.querySelector('h2')?.getAttribute('lang')).toBe('ja');
  });

  it('keeps English chrome for a language without a UI table, but marks the content', async () => {
    const dom: HTMLElement = await mount({ language: 'eu', title: 'Bilbo', text: 'Bilbo hiri ederra da.' });
    const root: HTMLElement = dom.querySelector('article') as HTMLElement;
    expect(root.getAttribute('lang')).toBe('en');
    expect(dom.querySelector('h2')?.getAttribute('lang')).toBe('eu');
  });

  it('shows the detected language name in that language', async () => {
    const dom: HTMLElement = await mount({ language: 'de-AT' });
    expect(dom.textContent).toContain('Deutsch (Österreich)');
    expect(dom.textContent).toContain('Daspechtlt');
  });

  it('gives the frame the card’s language, not the user setting SharePoint put on <html>', async () => {
    // SharePoint renders PortableComponent.aspx?culture=en-US as <html lang="en-US" dir="ltr">.
    document.documentElement.lang = 'en-US';
    document.documentElement.dir = 'ltr';
    const dom: HTMLElement = await mount({ language: 'he', title: 'ירושלים', text: 'ירושלים היא עיר עתיקה. יש בה סמטאות צרות.' });
    expect(document.documentElement.lang).toBe('he');
    expect(document.documentElement.dir).toBe('rtl');
    // The live region sits outside the card: it carries the language itself.
    const status: HTMLElement = dom.querySelector('[role="status"]') as HTMLElement;
    expect(status.getAttribute('lang')).toBe('he');
    expect(status.getAttribute('dir')).toBe('rtl');
  });

  it('uses the design argument and renders the live region outside the card', async () => {
    const dom: HTMLElement = await mount({ design: 'dramatic' }, { theme: 'dark', displayMode: 'fullscreen' });
    const root: HTMLElement = dom.querySelector('article') as HTMLElement;
    expect(root.getAttribute('data-design')).toBe('dramatic');
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(dom.querySelectorAll('input[type="radio"][name^="cosmo-design-"]').length).toBe(5);
    expect(dom.querySelectorAll('input[type="radio"][name^="cosmo-layout-"]').length).toBe(3);
    expect(dom.querySelectorAll('input[type="radio"][name^="cosmo-theme-"]').length).toBe(3);
    const status: HTMLElement | null = dom.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    expect(root.contains(status)).toBe(false);
  });

  it('never renders model text as HTML', async () => {
    const dom: HTMLElement = await mount({ title: '<img src=x onerror=alert(1)>', text: '<b>bold</b>.' });
    expect(dom.querySelector('img')).toBeNull();
    expect(dom.querySelector('b')).toBeNull();
    expect(dom.querySelector('h2')?.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('switches display mode and theme in place, without rebuilding the card', async () => {
    const dom: HTMLElement = await mount({ language: 'de', title: 'Wien', text: 'Eins. Zwei.' });
    const root: HTMLElement = dom.querySelector('article') as HTMLElement;
    const button: HTMLElement | null = dom.querySelector('button');
    expect(root.getAttribute('data-mode')).toBe('inline');
    expect(root.getAttribute('data-layout')).toBe('beside');

    lastComponent?._internalNotifyHostContextChanged({ displayMode: 'fullscreen', theme: 'dark' });
    expect(dom.querySelector('article')).toBe(root);
    expect(dom.querySelector('button')).toBe(button);
    expect(root.getAttribute('data-mode')).toBe('fullscreen');
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(root.getAttribute('data-layout')).toBe('beside');

    const light: HTMLInputElement = dom.querySelector('input[name^="cosmo-theme-"][value="light"]') as HTMLInputElement;
    light.checked = true;
    light.dispatchEvent(new Event('change'));
    expect(root.getAttribute('data-theme')).toBe('light');
    expect(dom.querySelector('article')).toBe(root);
  });

  it('keeps a chosen layout across display modes', async () => {
    const dom: HTMLElement = await mount({ language: 'de', title: 'Wien', text: 'Eins. Zwei.' });
    const root: HTMLElement = dom.querySelector('article') as HTMLElement;
    const beside: HTMLInputElement = dom.querySelector('input[name^="cosmo-layout-"][value="beside"]') as HTMLInputElement;
    beside.checked = true;
    beside.dispatchEvent(new Event('change'));
    lastComponent?._internalNotifyHostContextChanged({ displayMode: 'fullscreen' });
    expect(root.getAttribute('data-layout')).toBe('beside');
  });

  it('flags English text for a German request and marks it as English', async () => {
    const dom: HTMLElement = await mount({
      language: 'de',
      title: 'Vienna, a city that takes its time',
      text:
        'Vienna is a city that takes its time. In the coffee houses people sit for hours with a melange and a newspaper, and nobody looks at the clock. ' +
        'The Giant Ferris Wheel has been turning in the Prater for more than a hundred years.'
    });
    expect(dom.querySelector('h2')?.getAttribute('lang')).toBe('en');
    expect(dom.querySelector('p[lang="en"]')).not.toBeNull();
    expect(dom.textContent).toContain('Deutsch');
  });

  it('trusts German text over an "en" tag and switches the chrome to German', async () => {
    const dom: HTMLElement = await mount({
      language: 'en',
      title: 'Wien, eine Stadt mit Zeit',
      text:
        'Wien ist eine Stadt, die sich Zeit lässt. In den Kaffeehäusern sitzen die Menschen stundenlang bei einer Melange und einer Zeitung, und niemand schaut auf die Uhr. ' +
        'Im Prater dreht sich das Riesenrad seit über hundert Jahren.'
    });
    const root: HTMLElement = dom.querySelector('article') as HTMLElement;
    expect(root.getAttribute('lang')).toBe('de');
    expect(dom.querySelector('h2')?.getAttribute('lang')).toBe('de');
    expect(dom.textContent).toContain('Erkannt');
    expect(dom.textContent).not.toContain('Rewrite');
  });

  it('starts a new card with the last chosen design and layout', async () => {
    const first: HTMLElement = await mount({ language: 'de', title: 'Wien', text: 'Eins. Zwei.' });
    const classic: HTMLInputElement = first.querySelector('input[name^="cosmo-design-"][value="classic"]') as HTMLInputElement;
    classic.checked = true;
    classic.dispatchEvent(new Event('change'));
    const lead: HTMLInputElement = first.querySelector('input[name^="cosmo-layout-"][value="lead"]') as HTMLInputElement;
    lead.checked = true;
    lead.dispatchEvent(new Event('change'));

    window.sessionStorage.clear(); // a new chat: only the preference survives
    const next: HTMLElement = await mount({ language: 'fi', title: 'Helsinki', text: 'Yksi. Kaksi.' });
    const root: HTMLElement = next.querySelectorAll('article')[next.querySelectorAll('article').length - 1] as HTMLElement;
    expect(root.getAttribute('data-design')).toBe('classic');
    expect(root.getAttribute('data-layout')).toBe('lead');

    const asked: HTMLElement = await mount({ language: 'fi', title: 'Turku', text: 'Yksi. Kaksi.', design: 'compact' });
    expect((asked.querySelector('article') as HTMLElement).getAttribute('data-design')).toBe('compact');
  });

  it('tells the model the card look when the card is built', async () => {
    const updateModelContextAsync: Mock = vi.fn(() => Promise.resolve());
    await mount({ language: 'de', title: 'Wien', text: 'Eins. Zwei.' }, { theme: 'light', displayMode: 'inline' }, {
      updateModelContextAsync
    });
    expect(updateModelContextAsync).toHaveBeenCalledTimes(1);
    const payload: { structuredContent: Record<string, unknown> } = updateModelContextAsync.mock.calls[0][0];
    expect(payload.structuredContent).toMatchObject({ design: 'dramatic', layout: 'beside', language: 'de' });
  });

  // A small speech engine fake: voices can arrive later (like Edge's online voices).
  interface IFakeSynth {
    spoken: Array<{ text: string; lang: string; voice: string | undefined }>;
    voices: Array<{ name: string; lang: string }>;
    fireVoicesChanged(): void;
  }

  function installSpeech(voices: Array<{ name: string; lang: string }>): IFakeSynth {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w: any = window;
    const listeners: Array<() => void> = [];
    const fake: IFakeSynth = {
      spoken: [],
      voices,
      fireVoicesChanged: () => listeners.slice().forEach((l: () => void) => l())
    };
    w.SpeechSynthesisUtterance = function (this: { text: string; lang: string; voice?: { name: string }; addEventListener(): void }, text: string) {
      this.text = text;
      this.lang = '';
      this.addEventListener = () => undefined;
    };
    w.speechSynthesis = {
      speak: (u: { text: string; lang: string; voice?: { name: string } }) => fake.spoken.push({ text: u.text, lang: u.lang, voice: u.voice?.name }),
      cancel: () => undefined,
      getVoices: () => fake.voices,
      addEventListener: (type: string, l: () => void) => {
        if (type === 'voiceschanged') {
          listeners.push(l);
        }
      },
      removeEventListener: (type: string, l: () => void) => {
        const i: number = listeners.indexOf(l);
        if (i !== -1) {
          listeners.splice(i, 1);
        }
      }
    };
    return fake;
  }

  function removeSpeech(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w: any = window;
    delete w.speechSynthesis;
    delete w.SpeechSynthesisUtterance;
  }

  async function settle(ms: number = 0): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  it('reads the headline first, with a voice of the text’s language', async () => {
    const synth: IFakeSynth = installSpeech([{ name: 'Microsoft Katja Online (Natural) - German (Germany)', lang: 'de-DE' }]);
    try {
      const dom: HTMLElement = await mount({ language: 'de', title: 'Wien bei Nacht', text: 'Eins. Zwei.' });
      (dom.querySelector('button') as HTMLButtonElement).click();
      await settle();
      expect(synth.spoken[0]).toEqual({ text: 'Wien bei Nacht', lang: 'de-DE', voice: 'Microsoft Katja Online (Natural) - German (Germany)' });
      expect(dom.querySelector('h2')?.className).toContain('current');
    } finally {
      removeSpeech();
    }
  });

  it('never reads Greek with an English voice', async () => {
    const synth: IFakeSynth = installSpeech([{ name: 'Microsoft Aria Online (Natural) - English (United States)', lang: 'en-US' }]);
    try {
      const dom: HTMLElement = await mount({ language: 'el', title: 'Ο ελληνικός καφές', text: 'Ο ελληνικός καφές ξεχωρίζει. Φτιάχνεται στο μπρίκι.' });
      (dom.querySelector('button') as HTMLButtonElement).click();
      await settle(1800); // waits 1.5 s for online voices (none arrive), then announces
      expect(synth.spoken).toEqual([]);
      expect(dom.querySelector('[role="status"]')?.textContent).toContain('Ελληνικά');
    } finally {
      removeSpeech();
    }
  });

  it('uses the Greek online voice once Edge has delivered it', async () => {
    const synth: IFakeSynth = installSpeech([{ name: 'Microsoft Aria Online (Natural) - English (United States)', lang: 'en-US' }]);
    try {
      const dom: HTMLElement = await mount({ language: 'el', title: 'Ο ελληνικός καφές', text: 'Ο ελληνικός καφές ξεχωρίζει. Φτιάχνεται στο μπρίκι.' });
      (dom.querySelector('button') as HTMLButtonElement).click();
      synth.voices = [...synth.voices, { name: 'Microsoft Athina Online (Natural) - Greek (Greece)', lang: 'el-GR' }];
      synth.fireVoicesChanged();
      await settle();
      expect(synth.spoken[0]).toEqual({ text: 'Ο ελληνικός καφές', lang: 'el-GR', voice: 'Microsoft Athina Online (Natural) - Greek (Greece)' });
    } finally {
      removeSpeech();
    }
  });

  it('hides read-aloud when no voice can read the language, and says so', async () => {
    const synth: IFakeSynth = installSpeech([{ name: 'Microsoft Aria Online (Natural) - English (United States)', lang: 'en-US' }]);
    try {
      const dom: HTMLElement = await mount(
        { language: 'pt-BR', title: 'O Rio de Janeiro', text: 'O Rio é uma cidade do mar. As praias são famosas.' },
        { theme: 'light', displayMode: 'fullscreen' }
      );
      const play: HTMLButtonElement = dom.querySelector('button') as HTMLButtonElement;
      expect(play.hidden).toBe(true);
      const noVoiceNote: HTMLElement | undefined = Array.from(dom.querySelectorAll('footer p')).find((p: Element) =>
        /Portugu/.test(p.textContent || '')
      ) as HTMLElement | undefined;
      expect(noVoiceNote?.hidden).toBe(false);

      // Edge delivers its online voices later: the buttons come back, the note goes.
      synth.voices = [...synth.voices, { name: 'Microsoft Francisca Online (Natural) - Portuguese (Brazil)', lang: 'pt-BR' }];
      synth.fireVoicesChanged();
      expect(play.hidden).toBe(false);
      expect(noVoiceNote?.hidden).toBe(true);
    } finally {
      removeSpeech();
    }
  });

  it('shows read-aloud straight away when a voice for the language is installed', async () => {
    installSpeech([{ name: 'Microsoft Denise Online (Natural) - French (France)', lang: 'fr-FR' }]);
    try {
      const dom: HTMLElement = await mount({ language: 'fr', title: 'Paris', text: 'Paris est une ville. La Seine la traverse.' });
      expect((dom.querySelector('button') as HTMLButtonElement).hidden).toBe(false);
    } finally {
      removeSpeech();
    }
  });

  it('names the voice next to the buttons, and follows Edge when a better one arrives', async () => {
    const synth: IFakeSynth = installSpeech([{ name: 'Microsoft Hortense - French (France)', lang: 'fr-FR' }]);
    try {
      const dom: HTMLElement = await mount({ language: 'fr', title: 'Paris', text: 'Paris est une ville. La Seine la traverse.' });
      const label = (): HTMLElement | undefined =>
        Array.from(dom.querySelectorAll('footer span')).find((s: Element) => / · fr-FR$/.test(s.textContent || '')) as HTMLElement | undefined;
      expect(label()?.textContent).toBe('Hortense · fr-FR');
      expect(label()?.hidden).toBe(false);

      synth.voices = [...synth.voices, { name: 'Microsoft Denise Online (Natural) - French (France)', lang: 'fr-FR' }];
      synth.fireVoicesChanged();
      expect(label()?.textContent).toBe('Denise · fr-FR');
      expect(label()?.title).toBe('Microsoft Denise Online (Natural) - French (France)');
    } finally {
      removeSpeech();
    }
  });

  it('shows no voice name when no voice can read the language', async () => {
    installSpeech([{ name: 'Microsoft Aria Online (Natural) - English (United States)', lang: 'en-US' }]);
    try {
      const dom: HTMLElement = await mount({ language: 'pt-BR', title: 'O Rio de Janeiro', text: 'O Rio é uma cidade do mar.' });
      expect(Array.from(dom.querySelectorAll('footer span')).some((s: Element) => / · /.test(s.textContent || '') && !(s as HTMLElement).hidden)).toBe(false);
    } finally {
      removeSpeech();
    }
  });

  it('sets right-to-left by the letters even when the tag is wrong', async () => {
    const dom: HTMLElement = await mount({
      language: 'en',
      title: 'ירושלים, עיר של אבן',
      text: 'ירושלים היא אחת הערים העתיקות בעולם. בעיר העתיקה יש סמטאות צרות, שווקים צבעוניים ומקומות קדושים לשלוש דתות.'
    });
    expect(dom.querySelector('h2')?.getAttribute('dir')).toBe('rtl');
    expect(dom.querySelector('h2')?.getAttribute('lang')).toBe('he');
    expect((dom.querySelector('article') as HTMLElement).getAttribute('dir')).toBe('rtl');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
  });

  it('lets the photo follow a right-to-left story when the labels are left-to-right', async () => {
    // Persian has no label set: English labels, Persian story.
    const fa: HTMLElement = await mount({ language: 'fa', title: 'اصفهان', text: 'اصفهان شهر زیبایی است. میدان نقش جهان بزرگ است.' });
    expect((fa.querySelector('article') as HTMLElement).getAttribute('dir')).toBe('ltr');
    expect((fa.querySelector('article') as HTMLElement).hasAttribute('data-mixed-dir')).toBe(true);
    // Urdu has its own labels: the whole card is right-to-left, nothing is mixed.
    document.body.innerHTML = '';
    const ur: HTMLElement = await mount({ language: 'ur', title: 'لاہور', text: 'لاہور ایک خوبصورت شہر ہے۔ یہاں بہت سے باغ ہیں۔' });
    expect((ur.querySelector('article') as HTMLElement).getAttribute('dir')).toBe('rtl');
    expect((ur.querySelector('article') as HTMLElement).hasAttribute('data-mixed-dir')).toBe(false);
    expect(ur.textContent).toContain('شناخت شدہ');
  });

  it('labels an Amharic card in Amharic', async () => {
    const dom: HTMLElement = await mount({ language: 'am', title: 'አዲስ አበባ', text: 'አዲስ አበባ የኢትዮጵያ ዋና ከተማ ናት። ብዙ ሰዎች ይኖሩባታል።' });
    expect((dom.querySelector('article') as HTMLElement).getAttribute('lang')).toBe('am');
    expect(dom.textContent).toContain('ተለይቷል');
  });

  it('keeps Latin text in an Arabic card left-to-right', async () => {
    const dom: HTMLElement = await mount({ language: 'ar', title: 'Egon Schiele', text: 'زار فيينا ورسم لوحات كثيرة. كان رساماً مهماً جداً.' });
    expect(dom.querySelector('h2')?.getAttribute('dir')).toBe('ltr');
    expect(dom.querySelector('p[lang]')?.getAttribute('dir')).toBe('rtl');
    expect((dom.querySelector('article') as HTMLElement).getAttribute('dir')).toBe('rtl');
  });

  it('puts layout and design one level deeper, in a remembered "Look" disclosure', async () => {
    const dom: HTMLElement = await mount({ language: 'de', title: 'Wien', text: 'Eins. Zwei.' }, { theme: 'light', displayMode: 'fullscreen' });
    const details: HTMLDetailsElement = dom.querySelector('footer details') as HTMLDetailsElement;
    expect(details).not.toBeNull();
    expect(details.open).toBe(false);
    expect(details.querySelector('summary')?.textContent).toBe('Darstellung');
    expect(details.querySelectorAll('input[name^="cosmo-layout-"]').length).toBe(3);
    expect(details.querySelectorAll('input[name^="cosmo-design-"]').length).toBe(5);
    details.open = true;
    details.dispatchEvent(new Event('toggle'));
    expect(window.localStorage.getItem('cosmopolite:v1:preferences')).toContain('"lookOpen":true');
  });

  it('offers Schweizer Hochdeutsch and Schwiizerdütsch, unmistakably named, and names the dialect in the request', async () => {
    const sendFollowUpMessageAsync: Mock = vi.fn(() => Promise.resolve({}));
    const dom: HTMLElement = await mount(
      { language: 'en', title: 'Zurich', text: 'Zurich is a city on a lake. It has an old town.' },
      { theme: 'light', displayMode: 'fullscreen' },
      { sendFollowUpMessageAsync, updateModelContextAsync: vi.fn(() => Promise.resolve()) }
    );
    const list: HTMLSelectElement = dom.querySelector('select') as HTMLSelectElement;
    const values: string[] = Array.from(list.options).map((o: HTMLOptionElement) => o.value);
    expect(values).toContain('gsw');
    expect(values).toContain('de-CH');
    // Named so they can't be confused.
    const label = (v: string): string => (Array.from(list.options).find((o: HTMLOptionElement) => o.value === v) as HTMLOptionElement).text;
    expect(label('de-CH')).toBe('Schweizer Hochdeutsch');
    expect(label('gsw')).toMatch(/Schwiizert?d?ü/);

    list.value = 'gsw';
    (list.nextElementSibling as HTMLButtonElement).click();
    // The request is written in the target language: its label set loads first.
    await vi.waitFor(() => expect(sendFollowUpMessageAsync).toHaveBeenCalled());
    const sent: string = JSON.stringify(sendFollowUpMessageAsync.mock.calls[0][0]);
    expect(sent).toContain('Übersetz die Charte');
    expect(sent).toContain('Schwiizerdütsch');
    // The target tag tells the agent which language the new card has (not the request's language).
    expect(sent).toContain('(gsw)');
  });

  it('shows a brief ✓ on "Tell me more" once Copilot accepted the follow-up', async () => {
    vi.useFakeTimers();
    try {
      const sendFollowUpMessageAsync: Mock = vi.fn(() => Promise.resolve({}));
      const dom: HTMLElement = await mount(
        { language: 'en', title: 'Vienna', text: 'One. Two.' },
        { theme: 'light', displayMode: 'fullscreen' },
        { sendFollowUpMessageAsync, updateModelContextAsync: vi.fn(() => Promise.resolve()) }
      );
      const tellMore: HTMLButtonElement = Array.from(dom.querySelectorAll('button')).find(
        (b: HTMLButtonElement) => b.textContent === 'Tell me more'
      ) as HTMLButtonElement;
      tellMore.click();
      for (let i: number = 0; i < 5; i++) {
        await Promise.resolve();
      }
      expect(sendFollowUpMessageAsync).toHaveBeenCalledTimes(1);
      expect(tellMore.getAttribute('data-state')).toBe('done');
      vi.advanceTimersByTime(1300);
      expect(tellMore.hasAttribute('data-state')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
