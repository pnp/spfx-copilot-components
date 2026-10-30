import { settingsFromConfigRow } from '../logic/config';
import { DEFAULT_SETTINGS } from '../models';

const origin = 'https://fabrikam.sharepoint.com';

describe('settingsFromConfigRow (Copilot settings from the Weekly Pulse Config list)', () => {
  it('uses built-in defaults when the list or row is missing', () => {
    const s = settingsFromConfigRow(undefined, origin, origin);
    expect(s).toEqual({ ...DEFAULT_SETTINGS, questionsSiteUrl: origin, responsesSiteUrl: origin });
    expect(s.anonymityMode).toBe('Anonymous');
  });

  it('reads every column of the config row', () => {
    const s = settingsFromConfigRow(
      {
        AnonymityMode: 'Named',
        ShowCorrectAnswer: false,
        ShowJustification: false,
        Animations: false,
        ResponsesSiteUrl: 'https://fabrikam.sharepoint.com/sites/pulse',
        ResponsesListTitle: 'Pulse Answers',
        QuestionsListTitle: 'Pulse Questions',
        BannerTitle: 'Veckans puls',
        IntroText: 'Hej',
        NoQuizText: 'Ingen fråga'
      },
      origin,
      origin
    );
    expect(s.anonymityMode).toBe('Named');
    expect(s.showCorrectAnswer).toBe(false);
    expect(s.showJustification).toBe(false);
    expect(s.animations).toBe(false);
    expect(s.responsesSiteUrl).toBe('https://fabrikam.sharepoint.com/sites/pulse');
    expect(s.responsesListTitle).toBe('Pulse Answers');
    expect(s.questionsListTitle).toBe('Pulse Questions');
    expect(s.bannerTitle).toBe('Veckans puls');
  });

  it('applies the URL lock to the config row too', () => {
    const s = settingsFromConfigRow({ ResponsesSiteUrl: 'https://evil.example.com/x', AnonymityMode: 'something' }, origin, origin);
    expect(s.responsesSiteUrl).toBe(origin);
    expect(s.anonymityMode).toBe('Anonymous');
  });

  it('treats null SharePoint values as "use default"', () => {
    const s = settingsFromConfigRow({ ShowCorrectAnswer: null, Animations: null, BannerTitle: null }, origin, origin);
    expect(s.showCorrectAnswer).toBe(true);
    expect(s.animations).toBe(true);
    expect(s.bannerTitle).toBe('Weekly Pulse');
  });
});
