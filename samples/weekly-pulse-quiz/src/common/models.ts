/** Shared types for the Weekly Pulse Quiz web part and Copilot component. */

export type ChoiceKey = 'A' | 'B' | 'C' | 'D';
export const CHOICE_KEYS: ChoiceKey[] = ['A', 'B', 'C', 'D'];

export type AnonymityMode = 'Anonymous' | 'Named';
/**
 * IANA time zone the quiz week rolls over in: Monday 00:00 here, for every viewer wherever they are.
 * Change it to your organisation's zone (for example 'Europe/London' or 'America/New_York') and rebuild.
 * The web part, the Copilot component and the "Set up lists" time zone check all use this value.
 */
export const QUIZ_TIME_ZONE = 'UTC';
export type HostKind = 'WebPart' | 'Copilot';

export interface IQuizChoice {
  key: ChoiceKey;
  text: string;
}

export interface IQuizQuestion {
  id: number;
  title: string;
  year: number;
  week: number;
  choices: IQuizChoice[];
  /** Empty means poll mode: no right answer, no reveal. */
  correctChoice?: ChoiceKey;
  justification: string;
}

export interface IStoredResponse {
  id: number;
  questionId: number;
  choice: ChoiceKey;
  isCorrect?: boolean;
}

/** Everything the quiz needs at runtime. Web part: property pane. Copilot: config list + defaults. */
export interface IPulseSettings {
  questionsSiteUrl: string;
  questionsListTitle: string;
  responsesSiteUrl: string;
  responsesListTitle: string;
  anonymityMode: AnonymityMode;
  showCorrectAnswer: boolean;
  showJustification: boolean;
  animations: boolean;
  bannerTitle: string;
  introText: string;
  noQuizText: string;
}

export const DEFAULT_QUESTIONS_LIST = 'Weekly Pulse Questions';
export const DEFAULT_RESPONSES_LIST = 'Weekly Pulse Responses';
export const DEFAULT_CONFIG_LIST = 'Weekly Pulse Config';
export const JUSTIFICATION_MAX_LENGTH = 500;
/** Longer justifications start collapsed behind "Read more". */
export const JUSTIFICATION_PREVIEW_LENGTH = 200;

export const DEFAULT_SETTINGS: IPulseSettings = {
  questionsSiteUrl: '',
  questionsListTitle: DEFAULT_QUESTIONS_LIST,
  responsesSiteUrl: '',
  responsesListTitle: DEFAULT_RESPONSES_LIST,
  anonymityMode: 'Anonymous',
  showCorrectAnswer: true,
  showJustification: true,
  animations: true,
  bannerTitle: 'Weekly Pulse',
  introText: 'One quick question a week. Test what you know about how we work.',
  noQuizText: "There's no quiz this week. Check back on Monday."
};
