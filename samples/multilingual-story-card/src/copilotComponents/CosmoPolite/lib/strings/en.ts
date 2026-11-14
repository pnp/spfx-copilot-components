import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = true;

const strings: IUiStrings = {
  languageName: 'English',
  detected: 'Detected',
  source: 'Source',
  sources: { agent: 'agent', hostLocale: 'host locale', sharePoint: 'SharePoint', browser: 'browser', fallback: 'default' },
  readAloud: 'Read aloud',
  pause: 'Pause',
  resume: 'Resume',
  stop: 'Stop',
  reading: 'Reading aloud',
  paused: 'Paused',
  stopped: 'Stopped',
  finished: 'Finished reading',
  noVoice: 'No voice for {0}',
  speechUnavailable: 'Read-aloud isn’t available here',
  expand: 'Full view',
  collapse: 'Compact view',
  tellMore: 'Tell me more',
  tellMorePrompt: 'Tell me more about “{0}”.',
  translateTo: 'Translate to',
  translatePrompt: 'Translate this card into {0}.',
  design: 'Design',
  designs: { editorial: 'Editorial', classic: 'Classic', dramatic: 'Dramatic', compact: 'Compact', magazine: 'Magazine' },
  designChanged: 'Design: {0}',
  look: 'Look',
  layout: 'Layout',
  layouts: { lead: 'Lead image', teaser: 'Teaser', beside: 'Side image' },
  layoutChanged: 'Layout: {0}',
  theme: 'Theme',
  themes: { auto: 'Auto', light: 'Light', dark: 'Dark' },
  themeChanged: 'Theme: {0}',
  photo: 'Photo',
  noImage: 'No photo found',
  diagnostics: 'Diagnostics',
  sent: 'Sent',
  sendFailed: 'Couldn’t send',
  linkFailed: 'Couldn’t open the link',
  loading: 'Loading',
  readingTime: 'Reading time: {0}',
  textIn: 'Text: {0}',
  askedFor: 'asked for: {0}',
  rewriteIn: 'Rewrite in {0}',
  rewritePrompt: 'Please write this card again in {0}.'
};

export default strings;
