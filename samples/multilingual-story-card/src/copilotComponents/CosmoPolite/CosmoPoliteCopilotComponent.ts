import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import type { SPCopilotDisplayMode } from '@microsoft/sp-copilot-component';

import type { Action, IActionRunner } from '../../ui/actions';
import { h, showIn, type Child } from '../../ui/dom';
import { withViewTransition } from '../../ui/motion';
import { button } from '../../ui/atoms/button';
import { icon } from '../../ui/atoms/icon';
import { linkButton } from '../../ui/atoms/linkButton';
import { note } from '../../ui/atoms/note';
import { spacer } from '../../ui/atoms/spacer';
import { liveRegion, type ILiveRegion } from '../../ui/atoms/visuallyHidden';
import { languageChip } from '../../ui/molecules/languageChip';
import { notice } from '../../ui/molecules/notice';
import { radioGroup, type IRadioGroup } from '../../ui/molecules/radioGroup';
import { translatePicker } from '../../ui/molecules/translatePicker';
import { footer, toolbarGroup } from '../../ui/organisms/footer';
import { lookDisclosure } from '../../ui/organisms/lookDisclosure';
import { metaBar, type IMetaBar } from '../../ui/organisms/metaBar';
import { skeleton } from '../../ui/organisms/skeleton';
import { story, type IStory } from '../../ui/organisms/story';
import { card, cardFrame, type CardMode, type ICard } from '../../ui/templates/card';

import type { ICosmoPoliteCopilotComponentProperties } from './CosmoPoliteCopilotComponentProperties';
import { normalizeProps, type ICardInput } from './lib/normalize';
import { resolveCardLanguage, type ICardLanguage } from './lib/cardLanguage';
import { Conversation } from './lib/conversation';
import { englishStrings, format, UI_LANGUAGE_TAGS, type IUiStrings, type LanguageSource, type ThemeChoice } from './lib/strings';
import { contentDirection, displayName, formatMinutes, readingMinutes, splitSentences, textDirection } from './lib/language';
import { isAllowedLinkUrl } from './lib/images';
import { isSpeechSupported } from './lib/speech';
import { cardKey, loadCardState, loadPreferences, nextMount, saveCardState, savePreferences, type ICardState, type IPreferences } from './lib/state';
import { DESIGNS, LAYOUTS, type Design, type Layout } from './lib/presets';
import { resolveLook, resolveTheme, type ILook } from './lib/look';
import { canUseMode, hostLocale, requestFullHeight, type IFullHeightRequest } from './lib/host';
import { applyDocumentMode, applyDocumentTheme, DocumentLang, prepareHostDocument } from './lib/hostDocument';
import { ImageFigure } from './lib/imageFigure';
import { Voiceover, type VoiceAvailability } from './lib/voiceover';
import { snapshot } from './lib/snapshot';
import type { IDiagnosticsOptions } from './lib/diagnostics';

type LookKey = 'design' | 'layout' | 'theme';

// As soon as the bundle runs: SharePoint's grey loading bars go (the card shows its own skeleton)
// and its shell stops scrolling inside the iframe.
prepareHostDocument();

const THEME_CHOICES: ThemeChoice[] = ['auto', 'light', 'dark'];

/**
 * The page in atomic-design terms: it takes the story from the agent, resolves language and look
 * (lib/), and composes the shared pieces from src/ui (atoms → molecules → organisms → the card
 * template). The card is built ONCE per instance. Host context changes (display mode, theme) and
 * the user's switches (theme, layout, design) only change the template's state attributes, so
 * focus, scroll position and voiceover survive a switch between inline and fullscreen.
 */
export default class CosmoPoliteCopilotComponent extends BaseCopilotComponent<ICosmoPoliteCopilotComponentProperties> {
  private _input: ICardInput = normalizeProps(undefined);
  private _language: ICardLanguage | undefined;
  private _t: IUiStrings = englishStrings();
  private _stateKey: string = '';
  private _cardState: ICardState = {};
  /** The user's last chosen look; the starting point for every new card. */
  private _prefs: IPreferences = { theme: 'auto' };
  private _mount: number = 0;
  private _renderCount: number = 0;
  // Survives re-renders (it must exist before its text changes).
  private _status: ILiveRegion = liveRegion();
  private _docLang: DocumentLang = new DocumentLang();
  private _conversation: Conversation | undefined;
  // DOM built once; these are updated in place.
  private _card: ICard | undefined;
  private _image: ImageFigure | undefined;
  private _voice: Voiceover | undefined;
  private _radios: Partial<Record<LookKey, IRadioGroup>> = {};
  private _lastMode: CardMode | undefined;
  private _sizeRequest: IFullHeightRequest | undefined;

  // ---------------------------------------------------------------- lifecycle

  protected async onInit(): Promise<void> {
    this._mount = nextMount();
    const input: ICardInput = (this._input = normalizeProps(this.properties));
    this._prefs = loadPreferences();
    this._showSkeleton();
    const lang: ICardLanguage = await resolveCardLanguage(input.language, `${input.title} ${input.text}`, [
      ['hostLocale', hostLocale(this.hostContext)],
      ['sharePoint', this.context.pageContext?.cultureInfo?.currentUICultureName],
      ['browser', navigator.language]
    ]);
    this._language = lang;
    this._t = lang.strings;
    this._stateKey = cardKey(lang.reconciled.requested, input.title, input.text);
    this._cardState = loadCardState(this._stateKey);
    this._conversation = new Conversation({
      bridge: () => this.context.copilotBridge,
      uiLang: lang.ui.lang,
      strings: lang.strings,
      requested: lang.requested,
      title: input.title,
      announce: (text: string) => this._status.announce(text)
    });

    this._image = new ImageFigure({
      query: input.imageQuery,
      title: input.title,
      alt: input.imageAlt,
      kind: input.imageSource,
      wikipediaTitle: input.wikipediaTitle,
      lang: lang.requested,
      strings: lang.strings,
      link: (label: string, url: string) => linkButton(this._runner(), label, () => this._openLink(url))
    });
    this._image.load();
    return super.onInit();
  }

  protected async onTeardown(_reason: string | undefined): Promise<void> {
    this._voice?.dispose();
  }

  protected onDispose(): void {
    this._voice?.dispose();
    this._card?.dispose();
    this._docLang.release();
    super.onDispose();
  }

  // ------------------------------------------------------------------- render

  /** First call builds the card; every later call (host context change) only applies state. */
  protected render(): void {
    this._renderCount++;
    const first: boolean = !this._card || !this._card.root.isConnected;
    if (first) {
      this._build();
    }
    this._applyState();
    if (first) {
      // Tell the model what this card looks like, so the next card keeps the look.
      this._reportLook();
    }
  }

  private _mode(): CardMode {
    return this.hostContext?.displayMode === 'fullscreen' ? 'fullscreen' : 'inline';
  }

  private _look(): ILook {
    return resolveLook({ card: this._cardState, input: this._input, prefs: this._prefs, hostTheme: this.hostContext?.theme });
  }

  private _applyState(): void {
    if (!this._card) {
      return;
    }
    const mode: CardMode = this._mode();
    const look: ILook = this._look();
    this._card.setState({ mode, theme: look.theme, design: look.design, layout: look.layout });
    this._radios.theme?.sync(look.themeChoice);
    this._radios.layout?.sync(look.layout);
    this._radios.design?.sync(look.design);
    // Magazine is image-led: it needs a landscape photo (the figure swaps in place if it has one).
    this._image?.setPreferLandscape(look.design === 'magazine');
    // The whole iframe takes the card's background, so no host-coloured gaps remain around it.
    applyDocumentTheme(look.theme, getComputedStyle(this._card.root).getPropertyValue('--color-background-primary').trim());
    applyDocumentMode(mode);

    if (mode === 'fullscreen' && this._lastMode !== 'fullscreen') {
      requestFullHeight(
        this.hostContext,
        () => this._mode() === 'fullscreen',
        (width: number, height: number) => this.requestSizeChangeAsync(width, height),
        (asked: IFullHeightRequest) => (this._sizeRequest = asked)
      );
    }
    this._lastMode = mode;
  }

  /**
   * Before anything is awaited: a card-shaped skeleton in the host's theme (and the user's chosen
   * theme), so the iframe is never a grey or white box while the strings and the photo load.
   * _build replaces it.
   */
  private _showSkeleton(): void {
    const theme: 'light' | 'dark' = resolveTheme(this._prefs.theme, this.hostContext?.theme);
    const frame: HTMLElement = cardFrame({ mode: this._mode(), theme }, skeleton('Loading'));
    this.context.domElement.replaceChildren(frame);
    const root: HTMLElement | null = frame.firstElementChild as HTMLElement | null;
    applyDocumentTheme(theme, root ? getComputedStyle(root).getPropertyValue('--color-background-primary').trim() : '');
    applyDocumentMode(this._mode());
  }

  private _build(): void {
    this._voice?.dispose(); // a rebuild (root disconnected by the host) must not leave an old player speaking
    this._card?.dispose();
    const lang: ICardLanguage = this._lang();
    const t: IUiStrings = this._t;
    const runner: IActionRunner = this._runner();
    const id: string = this.context.instanceId;
    const sentences: string[] = splitSentences(this._input.text, lang.content);

    // Direction per element, from its own letters first, then the language tag: a mislabelled
    // Arabic or Hebrew text still reads right to left.
    const content: IStory = story({
      id: `cosmo-title-${id}`,
      title: this._input.title,
      sentences,
      lang: lang.content,
      titleDir: contentDirection(this._input.title, lang.content),
      textDir: contentDirection(this._input.text, lang.content),
      // Chinese and Japanese don't put spaces between sentences.
      joiner: /^(ja|zh)\b/i.test(lang.content) ? '' : ' '
    });
    // No voice for this language here: the read-aloud buttons hide and a quiet note says why.
    const noVoice: HTMLElement = showIn('fullscreen', note(format(t.noVoice, displayName(lang.content, lang.ui.lang))));
    noVoice.hidden = true;
    // The headline is read aloud first: it is entry 0 of the story's parts.
    this._voice = new Voiceover({
      texts: this._input.title ? [this._input.title, ...sentences] : sentences,
      story: content,
      lang: lang.content,
      uiLang: lang.ui.lang,
      voiceHint: this._input.voice,
      resumeAt: this._cardState.sentence,
      strings: t,
      runner,
      announce: (text: string) => this._status.announce(text),
      onPosition: (index: number | undefined) => {
        this._cardState.sentence = index;
        saveCardState(this._stateKey, this._cardState);
      },
      onAvailability: (state: VoiceAvailability) => {
        noVoice.hidden = state !== 'none';
      }
    });

    const choice = (key: LookKey, legend: string, options: Array<[string, string]>, variant?: 'segmented'): IRadioGroup =>
      radioGroup({ name: `cosmo-${key}-${id}`, legend, options, onChange: (v: string) => this._setLook(key, v), variant });
    this._radios = {
      theme: choice('theme', t.theme, THEME_CHOICES.map((c: ThemeChoice) => [c, t.themes[c]]), 'segmented'),
      layout: choice('layout', t.layout, LAYOUTS.map((l: Layout) => [l, t.layouts[l]])),
      design: choice('design', t.design, DESIGNS.map((d: Design) => [d, t.designs[d]]))
    };

    this._card = card({
      lang: lang.ui.lang,
      dir: textDirection(lang.ui.lang),
      labelledBy: content.headline.id,
      contentDir: contentDirection(this._input.text, lang.content),
      parts: {
        meta: this._renderMeta(runner),
        title: content.headline,
        figure: this._image?.element,
        text: content.body,
        footer: footer(
          this._renderToolbar(runner),
          // Layout and design are the advanced path: one level deeper, open state remembered.
          showIn(
            'fullscreen',
            lookDisclosure({
              summary: t.look,
              open: this._prefs.lookOpen === true,
              onToggle: (open: boolean) => {
                this._prefs = savePreferences({ lookOpen: open });
              },
              settings: [this._radios.layout?.element, this._radios.design?.element]
            })
          ),
          isSpeechSupported() ? noVoice : showIn('fullscreen', note(t.speechUnavailable)),
          this._input.debug ? this._renderDiagnostics() : null
        )
      }
    });

    this._card.root.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this._voice?.playing) {
        e.preventDefault();
        this._voice.stop();
      }
    });
    // The live region sits outside the card: give it the card's language and direction itself, so
    // announcements ("Reading aloud", "Sent") are read in that language.
    this._status.element.setAttribute('lang', lang.ui.lang);
    this._status.element.setAttribute('dir', textDirection(lang.ui.lang));
    this.context.domElement.replaceChildren(this._card.shell, this._status.element);
    // WCAG 3.1.1: the frame's language is the card's, not the user's SharePoint setting the host put
    // on <html> (restored on dispose).
    this._docLang.claim(lang.ui.lang);
  }

  private _renderMeta(runner: IActionRunner): HTMLElement {
    const lang: ICardLanguage = this._lang();
    const t: IUiStrings = this._t;
    const source: LanguageSource = lang.reconciled.requested ? 'agent' : lang.ui.source;
    const bar: IMetaBar = metaBar({
      chip: languageChip({
        label: `${t.detected}:`,
        name: displayName(lang.requested),
        nameLang: lang.requested,
        nameDir: textDirection(lang.requested),
        tag: lang.requested,
        source: `${t.source}: ${t.sources[source]}`
      }),
      // The text came back in another language than the user wrote in: say so, offer a rewrite.
      notice: lang.reconciled.mismatch
        ? notice(
            `${format(t.textIn, displayName(lang.content, lang.ui.lang))} · ${format(t.askedFor, displayName(lang.requested, lang.ui.lang))}`,
            button(runner, format(t.rewriteIn, displayName(lang.requested, lang.ui.lang)), () => this._conversation?.rewrite(), {
              confirm: true,
              size: 'small'
            })
          )
        : undefined,
      info: this._input.text ? format(t.readingTime, formatMinutes(readingMinutes(this._input.text, lang.content), lang.ui.lang)) : undefined,
      end: this._radios.theme?.element
    });
    if (bar.info) {
      showIn('fullscreen', bar.info);
    }
    return bar.element;
  }

  private _renderToolbar(runner: IActionRunner): Child[] {
    const lang: ICardLanguage = this._lang();
    const t: IUiStrings = this._t;
    // Both modes' controls exist; the template shows the ones for the current mode. Two groups,
    // read-aloud and actions, so a narrow card puts the actions on their own line as a whole.
    const children: Child[] = [];
    children.push(showIn('fullscreen', button(runner, t.tellMore, () => this._conversation?.tellMore(), { confirm: true })));
    const current: string[] = [lang.content.toLowerCase(), lang.requested.toLowerCase()];
    // Both Swiss entries, named so they can't be confused (and sorted side by side): Schweizer
    // Hochdeutsch (de-CH, standard German, Swiss spelling) and Schwiizerdütsch (gsw, the dialect).
    const targets: Array<[string, string]> = UI_LANGUAGE_TAGS.filter((tag: string) => current.indexOf(tag.toLowerCase()) === -1)
      .map((tag: string) => [tag, displayName(tag)] as [string, string])
      .sort((a: [string, string], b: [string, string]) => a[1].localeCompare(b[1], lang.ui.lang));
    children.push(
      showIn(
        'fullscreen',
        translatePicker(runner, {
          label: t.translateTo,
          options: targets.map(([tag, name]: [string, string]) => ({ value: tag, label: name, lang: tag, dir: textDirection(tag) })),
          onPick: (tag: string) => this._conversation?.translate(tag) || false
        })
      )
    );
    if (canUseMode(this.hostContext, 'inline')) {
      children.push(showIn('fullscreen', button(runner, t.collapse, () => this._requestMode('inline'))));
    }
    if (canUseMode(this.hostContext, 'fullscreen')) {
      children.push(showIn('inline', button(runner, [icon('⤢', { mirror: true }), t.expand], () => this._requestMode('fullscreen'))));
    }
    return [toolbarGroup('read', this._voice?.controls || []), spacer(), toolbarGroup('actions', children)];
  }

  /** The diagnostics drawer is its own chunk: most cards never load it. */
  private _renderDiagnostics(): HTMLElement {
    const slot: HTMLElement = h('div');
    import(/* webpackChunkName: "cosmopolite-devpanel" */ './lib/diagnostics')
      .then((mod: { renderDiagnostics(options: IDiagnosticsOptions): HTMLElement }) => {
        slot.replaceChildren(
          mod.renderDiagnostics({
            language: this._lang().content,
            announce: (text: string) => this._status.announce(text),
            getInfo: () =>
              snapshot({
                properties: this.properties,
                hostContext: this.hostContext,
                input: this._input,
                language: this._lang(),
                modelContext: this._conversation?.modelContext,
                imageSearch: this._image?.diagnostics(),
                voices: this._voice?.diagnostics(),
                mount: this._mount,
                renders: this._renderCount,
                root: this._card?.root,
                state: this._card ? { mode: this._mode(), ...this._look() } : undefined,
                fullHeightRequest: this._sizeRequest,
                htmlLangOwned: this._docLang.owned,
                hostLang: this._docLang.hostLang
              })
          })
        );
      })
      .catch(() => undefined);
    return slot;
  }

  // ------------------------------------------------------------------ actions

  /** One switch for theme, layout and design: persist, re-apply, announce, tell the model. */
  private _setLook(key: LookKey, value: string): void {
    const t: IUiStrings = this._t;
    if (key === 'theme') {
      this._prefs = savePreferences({ theme: value as ThemeChoice });
      this._applyState();
      this._status.announce(format(t.themeChanged, t.themes[value as ThemeChoice]));
      return;
    }
    this._cardState = { ...this._cardState, [key]: value };
    saveCardState(this._stateKey, this._cardState);
    this._prefs = savePreferences({ [key]: value });
    // Photo, headline and text glide to their new place instead of jumping.
    withViewTransition(() => this._applyState());
    this._status.announce(key === 'layout' ? format(t.layoutChanged, t.layouts[value as Layout]) : format(t.designChanged, t.designs[value as Design]));
    this._reportLook();
  }

  private _reportLook(): void {
    const { design, layout, themeChoice } = this._look();
    this._conversation?.reportLook({ design, layout, theme: themeChoice });
  }

  /** The iframe can't navigate; links open through the Copilot bridge. */
  private async _openLink(url: string): Promise<void> {
    if (!isAllowedLinkUrl(url)) {
      return;
    }
    const result = await this.context.copilotBridge.openLinkAsync(url);
    if (result?.isError) {
      this._status.announce(this._t.linkFailed);
    }
  }

  private async _requestMode(mode: SPCopilotDisplayMode): Promise<void> {
    await this.requestDisplayModeAsync(mode);
  }

  // ------------------------------------------------------------------ helpers

  /** Resolved in onInit, before the first render. */
  private _lang(): ICardLanguage {
    if (!this._language) {
      throw new Error('CosmoPolite: render before onInit');
    }
    return this._language;
  }

  /** Every control runs its action through this: a failure is announced, the button shows no ✓. */
  private _runner(): IActionRunner {
    return {
      run: (action: Action): Promise<boolean> =>
        Promise.resolve()
          .then(action)
          .then(
            (result: void | boolean) => result !== false,
            () => {
              this._status.announce(this._t.sendFailed);
              return false;
            }
          )
    };
  }
}
