// Optional diagnostics drawer (tool argument `debug: true`), on the shared devPanel organism. It
// can also check, inside the real Copilot iframe, whether speech synthesis and the image sources
// work. Results are plain JSON so they can be copied into a bug report. Developer-facing, English
// only. Loaded on demand (its own webpack chunk): most cards never need it.

import { copyText } from '../../../ui/dom';
import { dataTable, devPanel, keyValueTable, panelHeading, panelNote, type IDataRow, type IDevPanel } from '../../../ui/organisms/devPanel';
import { buildOpenverseUrl, buildSearchUrl, pickImage, pickOpenverse } from './images';
import { isSpeechSupported, pickVoice, waitForVoices } from './speech';

export interface IDiagnosticsOptions {
  language: string;
  /** Snapshot of host context, language sources, sizes, mount counter. Called on every refresh. */
  getInfo: () => Record<string, unknown>;
  announce: (text: string) => void;
}

type Results = Record<string, unknown>;

function errorText(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

function featureFlags(): Results {
  const css = (prop: string, value: string): boolean => typeof CSS !== 'undefined' && CSS.supports(prop, value);
  const media = (query: string): boolean => typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
  const intl: Record<string, unknown> = Intl as unknown as Record<string, unknown>;
  let textInfo: string = 'n/a';
  try {
    const loc: Record<string, unknown> = new Intl.Locale('ar') as unknown as Record<string, unknown>;
    textInfo = typeof loc.getTextInfo === 'function' ? 'getTextInfo()' : loc.textInfo ? 'textInfo' : 'missing';
  } catch {
    textInfo = 'Intl.Locale missing';
  }
  return {
    'Intl.Segmenter': typeof intl.Segmenter === 'function',
    'Intl.DisplayNames': typeof intl.DisplayNames === 'function',
    'Intl.Locale textInfo': textInfo,
    'light-dark()': css('color', 'light-dark(#000, #fff)'),
    'text-wrap: balance': css('text-wrap', 'balance'),
    'hyphens: auto': css('hyphens', 'auto'),
    'prefers-color-scheme: dark': media('(prefers-color-scheme: dark)'),
    'prefers-reduced-motion': media('(prefers-reduced-motion: reduce)'),
    'forced-colors': media('(forced-colors: active)'),
    userAgent: navigator.userAgent
  };
}

async function speechCheck(language: string): Promise<Results> {
  if (!isSpeechSupported()) {
    return { supported: false };
  }
  const before: number = window.speechSynthesis.getVoices().length;
  const started: number = Date.now();
  const voices: SpeechSynthesisVoice[] = await waitForVoices(3000);
  const match: SpeechSynthesisVoice | undefined = pickVoice(voices, language);
  const langs: string[] = [];
  voices.forEach((v: SpeechSynthesisVoice) => {
    if (langs.indexOf(v.lang) === -1) {
      langs.push(v.lang);
    }
  });
  return {
    supported: true,
    voicesBeforeEvent: before,
    voicesAfterWait: voices.length,
    waitedMs: Date.now() - started,
    naturalVoices: voices.filter((v: SpeechSynthesisVoice) => /natural|online/i.test(v.name)).length,
    languages: langs.sort(),
    [`voiceFor ${language}`]: match ? `${match.name} (${match.lang}, local: ${match.localService})` : null
  };
}

/** Openverse: reachable from this iframe, usable results, rate limit. */
async function openverseCheck(): Promise<Results> {
  const out: Results = {};
  const started: number = Date.now();
  try {
    const res: Response = await fetch(buildOpenverseUrl('Vienna St. Stephen Cathedral'));
    out.apiStatus = res.status;
    const found = pickOpenverse(await res.json());
    out.usable = found.length;
    out.first = found[0] ? { src: found[0].src, provider: found[0].provider, license: found[0].license } : 'no usable result';
  } catch (error) {
    out.apiError = errorText(error);
  }
  out.apiMs = Date.now() - started;
  return out;
}

async function commonsCheck(): Promise<Results> {
  const out: Results = {};
  const url: string = buildSearchUrl('Vienna St. Stephen Cathedral', 400);
  let src: string | undefined;
  const started: number = Date.now();
  try {
    // Same request as the card (no custom headers, so no CORS preflight).
    const res: Response = await fetch(url);
    out.apiStatus = res.status;
    const image = pickImage(await res.json());
    src = image?.src;
    out.apiResult = image ? { src: image.src, artist: image.artist, license: image.license } : 'no usable result';
  } catch (error) {
    // A TypeError without status is what both CSP (connect-src) and CORS failures look like here.
    out.apiError = errorText(error);
  }
  out.apiMs = Date.now() - started;
  if (src) {
    out.imageLoad = await new Promise<string>((resolve: (value: string) => void) => {
      const img: HTMLImageElement = new Image();
      img.onload = () => resolve(`ok ${img.naturalWidth}×${img.naturalHeight}`);
      img.onerror = () => resolve('error (CSP img-src?)');
      img.src = src as string;
    });
  }
  return out;
}

interface IStep {
  source?: string;
  kind?: string;
  query?: string;
  outcome?: string;
  count?: number;
  reason?: string;
  ms?: number;
}

/** "What did it look for?": every search step in order, then the pick and the reason. */
function imageSearchSection(search: Record<string, unknown> | undefined): HTMLElement[] {
  if (!search) {
    return [];
  }
  const steps: IStep[] = (search.steps as IStep[]) || [];
  const picked: Record<string, unknown> | undefined = search.picked as Record<string, unknown> | undefined;
  const result = (s: IStep): string =>
    s.outcome === 'found' ? `found ${s.count}` : s.outcome === 'failed' || s.outcome === 'skipped' ? `${s.outcome}: ${s.reason}` : 'nothing usable';
  return [
    panelHeading('Image search'),
    keyValueTable({ hint: search.kind, 'wikipedia article': search.wikipediaTitle, order: (search.plan as string[] | undefined)?.join(' → '), status: search.status }),
    dataTable(
      ['#', 'source', 'looked for', 'result', 'ms'],
      steps.map(
        (s: IStep, i: number): IDataRow => ({
          outcome: s.outcome,
          cells: [String(i + 1), s.source, s.kind === 'title' ? `article “${s.query}”` : `“${s.query}”`, result(s), s.ms]
        })
      ),
      'no search yet'
    ),
    picked
      ? keyValueTable({ picked: picked.why, from: [picked.provider || picked.source, picked.artist, picked.license].filter(Boolean).join(' · '), size: picked.size })
      : panelNote('No photo shown.')
  ];
}

interface ISpoken {
  index?: number;
  voice?: string;
  lang?: string;
  fresh?: boolean;
}

/** "Which voice read this?": the voices for the language, the one picked, and each sentence. */
function readAloudSection(voices: Record<string, unknown> | undefined): HTMLElement[] {
  if (!voices) {
    return [];
  }
  const spoken: ISpoken[] = (voices.spoken as ISpoken[] | undefined) || [];
  return [
    panelHeading('Read aloud'),
    keyValueTable({
      language: voices.language,
      availability: voices.availability,
      'voices for it': ((voices.candidates as string[] | undefined) || []).join(' · ') || 'none',
      chosen: voices.chosen
    }),
    dataTable(
      ['sentence', 'voice given', 'lang', 'from current list'],
      spoken.map((s: ISpoken): IDataRow => ({ cells: [s.index === 0 ? '0 (headline)' : s.index, s.voice, s.lang, s.fresh ? 'yes' : 'no'] })),
      'not played yet'
    )
  ];
}

export function renderDiagnostics(options: IDiagnosticsOptions): HTMLElement {
  const results: Results = { features: featureFlags() };
  const speechLog: string[] = [];
  // The actions refer to the drawer; they only run after a click, when it exists.
  const drawer: { panel?: IDevPanel } = {};

  const runChecks = async (): Promise<void> => {
    results.speech = 'running…';
    results.openverse = 'running…';
    results.commons = 'running…';
    drawer.panel?.refresh();
    const [speech, openverse, commons] = await Promise.all([speechCheck(options.language), openverseCheck(), commonsCheck()]);
    results.openverse = openverse;
    results.speech = speech;
    results.commons = commons;
    options.announce('Diagnostics updated');
  };

  // Speaking needs a user gesture in most engines, so it is a button, not part of the automatic run.
  const speakTest = (): void => {
    if (!isSpeechSupported()) {
      speechLog.push('speechSynthesis missing');
      return;
    }
    window.speechSynthesis.cancel();
    const u: SpeechSynthesisUtterance = new SpeechSynthesisUtterance('Servus. Hello. Hei. Hej.');
    u.lang = options.language;
    const log = (event: string): void => {
      speechLog.push(`${new Date().toISOString().slice(11, 23)} ${event}`);
      drawer.panel?.refresh();
    };
    u.onstart = () => log('start');
    u.onend = () => log('end');
    u.onerror = (e: SpeechSynthesisErrorEvent) => log(`error: ${e.error}`);
    u.onboundary = (e: SpeechSynthesisEvent) => log(`boundary ${e.name} @${e.charIndex}`);
    log(`speak (lang ${u.lang})`);
    window.speechSynthesis.speak(u);
  };

  drawer.panel = devPanel({
    title: 'Diagnostics',
    actions: [
      { label: 'Run checks', run: runChecks },
      { label: 'Speak test', run: speakTest },
      { label: 'Refresh', run: () => undefined },
      {
        label: 'Copy JSON',
        run: async () => {
          options.announce((await copyText(drawer.panel?.text() || '')) ? 'Copied' : 'Copy failed');
        }
      }
    ],
    sections: () => {
      const info: Record<string, unknown> = options.getInfo();
      const model = info.modelContext as { structured?: Record<string, unknown>; result?: string } | undefined;
      return [
        panelHeading('What the agent sent'),
        keyValueTable((info.agent as Record<string, unknown>) || {}),
        ...imageSearchSection(info.imageSearch as Record<string, unknown> | undefined),
        ...readAloudSection(info.voices as Record<string, unknown> | undefined),
        panelHeading('What the card told the model'),
        model ? keyValueTable({ ...(model.structured || {}), delivery: model.result || 'pending' }) : panelNote('Nothing yet.')
      ];
    },
    json: () => ({ ...options.getInfo(), checks: { ...results, speechTest: speechLog } }),
    onError: (error: unknown) => {
      results.lastError = errorText(error);
    }
  });
  return drawer.panel.element;
}
