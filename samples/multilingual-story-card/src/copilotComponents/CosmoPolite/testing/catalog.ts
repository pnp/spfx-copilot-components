// Test-only: the pattern catalog's entries, every piece of src/ui with its variants, by atomic
// level. catalog.test.ts renders each entry in light/dark × left-to-right/right-to-left. Labels
// come from the real string tables (English and Arabic), so the pieces show real lengths.

import type { IActionRunner } from '../../../ui/actions';
import { h } from '../../../ui/dom';
import { button } from '../../../ui/atoms/button';
import { chip } from '../../../ui/atoms/chip';
import { icon } from '../../../ui/atoms/icon';
import { linkButton } from '../../../ui/atoms/linkButton';
import { note } from '../../../ui/atoms/note';
import { optionPill } from '../../../ui/atoms/optionPill';
import { select } from '../../../ui/atoms/select';
import { spacer } from '../../../ui/atoms/spacer';
import { liveRegion, visuallyHidden } from '../../../ui/atoms/visuallyHidden';
import { credit } from '../../../ui/molecules/credit';
import { languageChip } from '../../../ui/molecules/languageChip';
import { notice } from '../../../ui/molecules/notice';
import { radioGroup, type IRadioGroup } from '../../../ui/molecules/radioGroup';
import { translatePicker } from '../../../ui/molecules/translatePicker';
import { voiceControls, type IVoiceControls } from '../../../ui/molecules/voiceControls';
import { dataTable, devPanel, keyValueTable, panelHeading } from '../../../ui/organisms/devPanel';
import { figure, type IFigure } from '../../../ui/organisms/figure';
import { footer } from '../../../ui/organisms/footer';
import { skeleton } from '../../../ui/organisms/skeleton';
import { lookDisclosure } from '../../../ui/organisms/lookDisclosure';
import { metaBar } from '../../../ui/organisms/metaBar';
import { story, type IStory } from '../../../ui/organisms/story';
import { card, type ICard } from '../../../ui/templates/card';
import type { IUiStrings } from '../lib/strings';

export type Level = 'atoms' | 'molecules' | 'organisms' | 'templates';
export const LEVELS: Level[] = ['atoms', 'molecules', 'organisms', 'templates'];

export interface ICatalogContext {
  theme: 'light' | 'dark';
  dir: 'ltr' | 'rtl';
  /** Language of the sample texts (en or ar). */
  lang: string;
  t: IUiStrings;
  sample: { title: string; sentences: string[]; name: string; alt: string };
  runner: IActionRunner;
  /** Unique per rendering (radio names, ids). */
  id: string;
}

export interface IVariant {
  label: string;
  render(ctx: ICatalogContext): Node;
}

export interface ICatalogEntry {
  level: Level;
  name: string;
  /** Source file, relative to src/ui. */
  source: string;
  description: string;
  variants: IVariant[];
}

/** A stand-in photo: deterministic, offline, landscape 3:2. */
export const SAMPLE_PHOTO: string =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f5d8a"/><stop offset="1" stop-color="#d9a35b"/></linearGradient></defs>' +
      '<rect width="960" height="640" fill="url(#g)"/><circle cx="700" cy="190" r="90" fill="#f4e3b5" opacity=".85"/>' +
      '<path d="M0 520 L180 380 L330 470 L520 300 L720 460 L960 340 L960 640 L0 640Z" fill="#1d3550" opacity=".85"/></svg>'
  );

const row = (...children: Node[]): HTMLElement => h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;align-items:center' }, children);

function photo(ctx: ICatalogContext): HTMLElement {
  const f: IFigure = figure();
  f.show({
    status: 'image',
    src: SAMPLE_PHOTO,
    alt: ctx.sample.alt,
    width: 960,
    height: 640,
    caption: credit(`${ctx.t.photo}: `, linkButton(ctx.runner, ctx.sample.name, () => undefined), ' · ', linkButton(ctx.runner, 'Public domain', () => undefined), ' · The Met')
  });
  f.element.querySelector('img')?.removeAttribute('data-loading');
  f.element.style.maxInlineSize = '320px';
  return f.element;
}

function sampleStory(ctx: ICatalogContext): IStory {
  return story({
    id: `${ctx.id}-title`,
    title: ctx.sample.title,
    sentences: ctx.sample.sentences,
    lang: ctx.lang,
    titleDir: ctx.dir,
    textDir: ctx.dir,
    joiner: ' '
  });
}

function sampleCard(ctx: ICatalogContext, layout: string, design: string, mode: 'inline' | 'fullscreen'): Node {
  const s: IStory = sampleStory(ctx);
  const f: IFigure = figure();
  f.show({
    status: 'image',
    src: SAMPLE_PHOTO,
    alt: ctx.sample.alt,
    width: 960,
    height: 640,
    caption: credit(`${ctx.t.photo}: `, linkButton(ctx.runner, ctx.sample.name, () => undefined), ' · CC BY 2.0')
  });
  f.element.querySelector('img')?.removeAttribute('data-loading');
  const c: ICard = card({
    lang: ctx.lang,
    dir: ctx.dir,
    labelledBy: s.headline.id,
    parts: {
      meta: metaBar({ chip: chip(`${ctx.t.detected}: ${ctx.t.languageName}`) }).element,
      title: s.headline,
      figure: f.element,
      text: s.body,
      footer: footer([button(ctx.runner, [icon('▶'), ctx.t.readAloud], () => undefined, { variant: 'primary' })])
    }
  });
  c.setState({ mode, theme: ctx.theme, design, layout });
  c.dispose();
  return h('div', { style: 'border:1px dashed var(--color-border-secondary)' }, c.shell);
}

export const CATALOG: ICatalogEntry[] = [
  // ---- atoms ------------------------------------------------------------------------------------
  {
    level: 'atoms',
    name: 'button',
    source: 'atoms/button.ts',
    description: 'Every action. Variants: primary, small (inside a notice); states: done (✓ after success), disabled.',
    variants: [
      { label: 'default', render: (c: ICatalogContext) => button(c.runner, c.t.tellMore, () => undefined) },
      { label: 'primary with icon', render: (c: ICatalogContext) => button(c.runner, [icon('▶'), c.t.readAloud], () => undefined, { variant: 'primary' }) },
      { label: 'small', render: (c: ICatalogContext) => button(c.runner, c.t.rewriteIn.replace('{0}', c.t.languageName), () => undefined, { size: 'small' }) },
      {
        label: 'done',
        render: (c: ICatalogContext) => {
          const b: HTMLButtonElement = button(c.runner, c.t.tellMore, () => undefined, { confirm: true });
          b.setAttribute('data-state', 'done');
          return b;
        }
      },
      {
        label: 'disabled',
        render: (c: ICatalogContext) => {
          const b: HTMLButtonElement = button(c.runner, [icon('■'), c.t.stop], () => undefined);
          b.disabled = true;
          return b;
        }
      }
    ]
  },
  {
    level: 'atoms',
    name: 'linkButton',
    source: 'atoms/linkButton.ts',
    description: 'Looks like a link; opens the URL through the host (a sandboxed iframe cannot navigate).',
    variants: [{ label: 'default', render: (c: ICatalogContext) => linkButton(c.runner, c.sample.name, () => undefined) }]
  },
  {
    level: 'atoms',
    name: 'icon',
    source: 'atoms/icon.ts',
    description: 'Text glyphs. Direction-bearing arrows mirror in right-to-left; play never does.',
    variants: [
      { label: 'play (never mirrored)', render: () => icon('▶') },
      { label: 'expand (mirrors)', render: () => icon('⤢', { mirror: true }) },
      { label: 'go (mirrors)', render: () => icon('➜', { mirror: true }) }
    ]
  },
  {
    level: 'atoms',
    name: 'chip',
    source: 'atoms/chip.ts',
    description: 'A quiet rounded label for metadata.',
    variants: [{ label: 'default', render: (c: ICatalogContext) => chip(`${c.t.detected}: ${c.t.languageName}`) }]
  },
  {
    level: 'atoms',
    name: 'note',
    source: 'atoms/note.ts',
    description: 'Small secondary text: a hint, a label next to a control, a "not available" note.',
    variants: [{ label: 'default', render: (c: ICatalogContext) => note(c.t.speechUnavailable) }]
  },
  {
    level: 'atoms',
    name: 'spacer',
    source: 'atoms/spacer.ts',
    description: 'Pushes what follows it in a flex row to the inline end.',
    variants: [{ label: 'in a row', render: (c: ICatalogContext) => row(chip('A'), spacer(), chip('B')) }]
  },
  {
    level: 'atoms',
    name: 'select',
    source: 'atoms/select.ts',
    description: 'Native select with a placeholder; options may carry their own lang/dir.',
    variants: [
      {
        label: 'languages',
        render: (c: ICatalogContext) =>
          select({
            label: c.t.translateTo,
            placeholder: '…',
            options: [
              { value: 'de', label: 'Deutsch', lang: 'de', dir: 'ltr' },
              { value: 'ar', label: 'العربية', lang: 'ar', dir: 'rtl' },
              { value: 'ja', label: '日本語', lang: 'ja', dir: 'ltr' }
            ]
          })
      }
    ]
  },
  {
    level: 'atoms',
    name: 'optionPill',
    source: 'atoms/optionPill.ts',
    description: 'One choice of a radio group: a native radio under a pill.',
    variants: [
      { label: 'unchecked', render: (c: ICatalogContext) => optionPill({ name: `${c.id}-a`, value: 'a', label: c.t.designs.classic, onSelect: () => undefined }).element },
      {
        label: 'checked',
        render: (c: ICatalogContext) => {
          const p = optionPill({ name: `${c.id}-b`, value: 'b', label: c.t.designs.dramatic, onSelect: () => undefined });
          p.input.checked = true;
          p.input.setAttribute('checked', '');
          return p.element;
        }
      }
    ]
  },
  {
    level: 'atoms',
    name: 'visuallyHidden',
    source: 'atoms/visuallyHidden.ts',
    description: 'Screen-reader-only text and the polite live region. Invisible on purpose: the dashed box is empty.',
    variants: [
      { label: 'hidden text', render: (c: ICatalogContext) => h('div', { style: 'border:1px dashed;min-block-size:1em' }, visuallyHidden(c.t.loading)) },
      {
        label: 'live region',
        render: (c: ICatalogContext) => {
          const region = liveRegion();
          region.element.textContent = c.t.reading;
          return h('div', { style: 'border:1px dashed;min-block-size:1em' }, region.element);
        }
      }
    ]
  },

  // ---- molecules ---------------------------------------------------------------------------------
  {
    level: 'molecules',
    name: 'radioGroup',
    source: 'molecules/radioGroup.ts',
    description: 'Option pills in a fieldset with a legend; segmented joins them (legend for screen readers only).',
    variants: [
      {
        label: 'default',
        render: (c: ICatalogContext) => {
          const g: IRadioGroup = radioGroup({
            name: `${c.id}-design`,
            legend: c.t.design,
            options: [
              ['editorial', c.t.designs.editorial],
              ['classic', c.t.designs.classic],
              ['dramatic', c.t.designs.dramatic]
            ],
            onChange: () => undefined
          });
          g.sync('classic');
          return g.element;
        }
      },
      {
        label: 'segmented',
        render: (c: ICatalogContext) => {
          const g: IRadioGroup = radioGroup({
            name: `${c.id}-theme`,
            legend: c.t.theme,
            options: [
              ['auto', c.t.themes.auto],
              ['light', c.t.themes.light],
              ['dark', c.t.themes.dark]
            ],
            onChange: () => undefined,
            variant: 'segmented'
          });
          g.sync('auto');
          return g.element;
        }
      }
    ]
  },
  {
    level: 'molecules',
    name: 'languageChip',
    source: 'molecules/languageChip.ts',
    description: 'Detected language: its own name in its own script and direction, the tag, the source.',
    variants: [
      {
        label: 'Viennese',
        render: (c: ICatalogContext) =>
          languageChip({ label: `${c.t.detected}:`, name: 'Deutsch (Österreich)', nameLang: 'de-AT', nameDir: 'ltr', tag: 'de-AT', source: `${c.t.source}: ${c.t.sources.agent}` })
      },
      {
        label: 'Arabic',
        render: (c: ICatalogContext) =>
          languageChip({ label: `${c.t.detected}:`, name: 'العربية', nameLang: 'ar', nameDir: 'rtl', tag: 'ar', source: `${c.t.source}: ${c.t.sources.agent}` })
      }
    ]
  },
  {
    level: 'molecules',
    name: 'notice',
    source: 'molecules/notice.ts',
    description: 'A warning line with an optional fix.',
    variants: [
      {
        label: 'with action',
        render: (c: ICatalogContext) =>
          notice(`${c.t.textIn.replace('{0}', 'English')} · ${c.t.askedFor.replace('{0}', c.t.languageName)}`, button(c.runner, c.t.rewriteIn.replace('{0}', c.t.languageName), () => undefined, { size: 'small' }))
      }
    ]
  },
  {
    level: 'molecules',
    name: 'translatePicker',
    source: 'molecules/translatePicker.ts',
    description: 'Label, language list, confirm arrow (picking alone sends nothing).',
    variants: [
      {
        label: 'default',
        render: (c: ICatalogContext) =>
          translatePicker(c.runner, {
            label: c.t.translateTo,
            options: [
              { value: 'de', label: 'Deutsch', lang: 'de', dir: 'ltr' },
              { value: 'he', label: 'עברית', lang: 'he', dir: 'rtl' }
            ],
            onPick: () => true
          })
      }
    ]
  },
  {
    level: 'molecules',
    name: 'voiceControls',
    source: 'molecules/voiceControls.ts',
    description: 'Read-aloud buttons; the speech controller sets the state.',
    variants: (
      [
        ['idle', { playing: false, active: false, resumable: false }],
        ['playing', { playing: true, active: true, resumable: false }],
        ['paused', { playing: false, active: true, resumable: true }]
      ] as Array<[string, { playing: boolean; active: boolean; resumable: boolean }]>
    ).map(([label, state]: [string, { playing: boolean; active: boolean; resumable: boolean }]) => ({
      label,
      render: (c: ICatalogContext) => {
        const v: IVoiceControls = voiceControls(c.runner, { readAloud: c.t.readAloud, pause: c.t.pause, resume: c.t.resume, stop: c.t.stop }, { toggle: () => undefined, stop: () => undefined });
        v.update(state);
        return row(...v.elements);
      }
    }))
  },
  {
    level: 'molecules',
    name: 'credit',
    source: 'molecules/credit.ts',
    description: 'Photo credit with link buttons; wraps to the photo’s width.',
    variants: [
      {
        label: 'default',
        render: (c: ICatalogContext) =>
          credit(`${c.t.photo}: `, linkButton(c.runner, c.sample.name, () => undefined), ' · ', linkButton(c.runner, 'Public domain', () => undefined), ' · The Met')
      }
    ]
  },

  // ---- organisms ---------------------------------------------------------------------------------
  {
    level: 'organisms',
    name: 'metaBar',
    source: 'organisms/metaBar.ts',
    description: 'Chip, optional notice (own line), quiet info, a control at the inline end.',
    variants: [
      {
        label: 'with theme switch',
        render: (c: ICatalogContext) => {
          const g: IRadioGroup = radioGroup({
            name: `${c.id}-mtheme`,
            legend: c.t.theme,
            options: [
              ['auto', c.t.themes.auto],
              ['light', c.t.themes.light],
              ['dark', c.t.themes.dark]
            ],
            onChange: () => undefined,
            variant: 'segmented'
          });
          g.sync('auto');
          return metaBar({ chip: chip(`${c.t.detected}: ${c.t.languageName}`), info: c.t.readingTime.replace('{0}', '1 min'), end: g.element }).element;
        }
      },
      {
        label: 'with notice',
        render: (c: ICatalogContext) =>
          metaBar({
            chip: chip(`${c.t.detected}: ${c.t.languageName}`),
            notice: notice(c.t.textIn.replace('{0}', 'English'), button(c.runner, c.t.rewriteIn.replace('{0}', c.t.languageName), () => undefined, { size: 'small' }))
          }).element
      }
    ]
  },
  {
    level: 'organisms',
    name: 'figure',
    source: 'organisms/figure.ts',
    description: 'Photo with credit, a loading skeleton, or nothing (hidden: the template closes the gap).',
    variants: [
      { label: 'photo', render: (c: ICatalogContext) => photo(c) },
      {
        label: 'loading',
        render: (c: ICatalogContext) => {
          const f: IFigure = figure();
          f.show({ status: 'loading', label: c.t.loading });
          f.element.style.maxInlineSize = '320px';
          return f.element;
        }
      },
      {
        label: 'none (hidden)',
        render: () => {
          const f: IFigure = figure();
          f.show({ status: 'none' });
          return h('div', { style: 'border:1px dashed;min-block-size:1em' }, f.element);
        }
      }
    ]
  },
  {
    level: 'organisms',
    name: 'story',
    source: 'organisms/story.ts',
    description: 'Headline and text, one span per sentence; the sentence being read is marked.',
    variants: [
      {
        label: 'default',
        render: (c: ICatalogContext) => {
          const s: IStory = sampleStory(c);
          return h('div', { style: 'display:grid;gap:12px' }, s.headline, s.body);
        }
      },
      {
        label: 'reading sentence 2',
        render: (c: ICatalogContext) => {
          const s: IStory = sampleStory(c);
          s.setCurrent(2);
          return h('div', { style: 'display:grid;gap:12px' }, s.headline, s.body);
        }
      }
    ]
  },
  {
    level: 'organisms',
    name: 'footer',
    source: 'organisms/footer.ts',
    description: 'A toolbar row of actions, then whatever comes below it.',
    variants: [
      {
        label: 'default',
        render: (c: ICatalogContext) =>
          footer(
            [button(c.runner, [icon('▶'), c.t.readAloud], () => undefined, { variant: 'primary' }), spacer(), button(c.runner, c.t.tellMore, () => undefined)],
            note(c.t.speechUnavailable)
          )
      }
    ]
  },
  {
    level: 'organisms',
    name: 'lookDisclosure',
    source: 'organisms/lookDisclosure.ts',
    description: 'The advanced path, one level deeper: a native disclosure with a chevron.',
    variants: [false, true].map((open: boolean) => ({
      label: open ? 'open' : 'closed',
      render: (c: ICatalogContext) =>
        lookDisclosure({
          summary: c.t.look,
          open,
          onToggle: () => undefined,
          settings: [
            radioGroup({
              name: `${c.id}-l${open}`,
              legend: c.t.layout,
              options: [
                ['lead', c.t.layouts.lead],
                ['teaser', c.t.layouts.teaser]
              ],
              onChange: () => undefined
            }).element
          ]
        })
    }))
  },
  {
    level: 'organisms',
    name: 'skeleton',
    source: 'organisms/skeleton.ts',
    description: 'Card-shaped loading placeholder, shown before the content is ready (replaces the host’s grey bars).',
    variants: [{ label: 'default', render: (c: ICatalogContext) => skeleton(c.t.loading) }]
  },
  {
    level: 'organisms',
    name: 'devPanel',
    source: 'organisms/devPanel.ts',
    description: 'Developer drawer: actions, readable tables, raw JSON. English only by design.',
    variants: [
      {
        label: 'open',
        render: () => {
          const p = devPanel({
            title: 'Diagnostics',
            actions: [{ label: 'Refresh', run: () => undefined }],
            sections: () => [
              panelHeading('Image search'),
              keyValueTable({ hint: 'space', order: 'nasa → wikipedia' }),
              dataTable(
                ['#', 'source', 'result'],
                [
                  { cells: ['1', 'nasa', 'failed: http-429'], outcome: 'failed' },
                  { cells: ['2', 'wikipedia', 'found 3'], outcome: 'found' }
                ],
                'no search yet'
              )
            ],
            json: () => ({ example: true })
          });
          p.element.open = true;
          return p.element;
        }
      }
    ]
  },

  // ---- templates ---------------------------------------------------------------------------------
  {
    level: 'templates',
    name: 'card',
    source: 'templates/card.ts',
    description: 'Places meta, title, figure, text and footer; layouts, designs and modes are data attributes.',
    variants: [
      { label: 'lead · editorial · inline', render: (c: ICatalogContext) => sampleCard(c, 'lead', 'editorial', 'inline') },
      { label: 'teaser · classic · inline', render: (c: ICatalogContext) => sampleCard(c, 'teaser', 'classic', 'inline') },
      { label: 'beside · dramatic · fullscreen', render: (c: ICatalogContext) => sampleCard(c, 'beside', 'dramatic', 'fullscreen') },
      { label: 'magazine · fullscreen', render: (c: ICatalogContext) => sampleCard(c, 'lead', 'magazine', 'fullscreen') }
    ]
  }
];
