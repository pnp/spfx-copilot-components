import { describe, expect, it } from 'vitest';
import { detectMismatch, guessLanguage, reconcileLanguage } from './detect';

const EN: string =
  'Vienna is a city that takes its time. In the coffee houses people sit for hours with a melange and a newspaper, and nobody looks at the clock. ' +
  'St. Stephen’s Cathedral stands in the middle of it all, and the Giant Ferris Wheel has been turning in the Prater for more than a hundred years.';
const DE: string =
  'Wien ist eine Stadt, die sich Zeit lässt. In den Kaffeehäusern sitzen die Menschen stundenlang bei einer Melange und einer Zeitung, und niemand schaut auf die Uhr. ' +
  'Der Stephansdom steht mitten in der Stadt, und im Prater dreht sich das Riesenrad seit über hundert Jahren.';
const WIEN: string =
  'Wean is a Stod, de si Zeit lossn duad. In de Kaffeeheisa sitzn d’Leit stundnlong bei ana Melange und ana Zeitung, und kana schaut auf d’Uhr. ' +
  'Da Stephansdom steht mittn drin, und da Steffl schaut auf de Dächa owe. Im Prater draht si s’Riesnradl seit iwa hundat Joar.';
const ZUERI: string =
  'Züri isch e Stadt am See, wo mer eifach gern isch. Im Niederdorf hät s chli Gässli, und am Abig sitzed d Lüüt am Limmatquai. ' +
  'Vo de Quaibrugg gseht mer bi schönem Wätter bis i d Alpe, und im Summer gönd vill i d Badi am See.';
const FI: string =
  'Helsinki on meren kaupunki. Kauppatorilla myydään aamuisin kalaa, marjoja ja kahvia, ja lokit kiertelevät ostajien yllä. ' +
  'Valkoinen tuomiokirkko kohoaa Senaatintorin yläpuolelle, ja kesällä aurinko laskee vasta myöhään illalla.';
const FR: string =
  'Paris est une ville qui ne dort jamais. Sur les quais de la Seine, les bouquinistes vendent des livres anciens, et dans les cafés les gens parlent pendant des heures. ' +
  'La tour Eiffel domine le paysage, et le soir les lumières de la ville brillent sur le fleuve.';
const JA: string = '東京は、古いものと新しいものが共存する街です。浅草では浅草寺の雷門をくぐり、仲見世通りで人形焼きを味わえます。';
const ZH: string = '北京是一座历史悠久的城市。故宫是明清两代的皇宫，长城蜿蜒在城市北边的山上，每年都有很多游客来参观。';
const KO: string = '서울은 오래된 궁궐과 현대적인 빌딩이 함께 있는 도시입니다. 경복궁에서는 전통을 느낄 수 있습니다.';
const AR: string = 'القاهرة مدينة لا تنام. على ضفاف النيل تمتد أحياؤها القديمة والحديثة جنبًا إلى جنب.';
const RU: string = 'Москва — большой город. На Красной площади стоит собор Василия Блаженного, а метро считается одним из самых красивых в мире.';
const UK: string = 'Київ — столиця України. Над Дніпром височіє Києво-Печерська лавра, а Хрещатик є головною вулицею міста.';

describe('guessLanguage', () => {
  it.each([
    [EN, 'en'],
    [DE, 'de'],
    [WIEN, 'de'],
    [ZUERI, 'de'],
    [FI, 'fi'],
    [FR, 'fr'],
    [JA, 'ja'],
    [ZH, 'zh'],
    [KO, 'ko'],
    [AR, 'ar'],
    [RU, 'ru'],
    [UK, 'uk']
  ])('recognises %#', (text: string, lang: string) => {
    expect(guessLanguage(text)?.lang).toBe(lang);
  });

  it('gives up on short text', () => {
    expect(guessLanguage('Hallo Welt')).toBeUndefined();
  });
});

describe('detectMismatch', () => {
  it('flags English text for a German request', () => {
    expect(detectMismatch('de', EN)).toBe('en');
    expect(detectMismatch('de-AT', EN)).toBe('en');
    expect(detectMismatch('ja', EN)).toBe('en');
  });

  it('accepts matching text, including dialect', () => {
    expect(detectMismatch('de', DE)).toBeUndefined();
    expect(detectMismatch('de-AT', WIEN)).toBeUndefined();
    expect(detectMismatch('gsw', ZUERI)).toBeUndefined();
    expect(detectMismatch('ja', JA)).toBeUndefined();
    expect(detectMismatch('en-US', EN)).toBeUndefined();
    expect(detectMismatch('fi', FI)).toBeUndefined();
  });

  it('flags German text for an English request', () => {
    expect(detectMismatch('en', DE)).toBe('de');
  });

  it('trusts the agent when it can’t tell', () => {
    expect(detectMismatch(undefined, EN)).toBeUndefined();
    expect(detectMismatch('de', 'Kurz.')).toBeUndefined();
    expect(detectMismatch('ru', UK)).toBeUndefined(); // same family: not flagged
  });
});

describe('reconcileLanguage', () => {
  const GERMAN: string =
    'Wien ist eine Stadt, die sich Zeit lässt. In den Kaffeehäusern sitzen die Menschen stundenlang bei einer Melange und einer Zeitung, und niemand schaut auf die Uhr.';
  const ENGLISH: string =
    'Vienna is a city that takes its time. In the coffee houses people sit for hours with a melange and a newspaper, and nobody looks at the clock.';

  it('trusts the agent when the text fits', () => {
    expect(reconcileLanguage('de-AT', GERMAN)).toEqual({ requested: 'de-AT', content: 'de-AT', mismatch: false });
  });

  it('flags English text for a German request and keeps the request', () => {
    expect(reconcileLanguage('de', ENGLISH)).toEqual({ requested: 'de', content: 'en', mismatch: true });
  });

  it('trusts German text over an "en" tag', () => {
    expect(reconcileLanguage('en-US', GERMAN)).toEqual({ requested: 'de', content: 'de', mismatch: false });
  });

  it('does nothing without a tag', () => {
    expect(reconcileLanguage(undefined, GERMAN)).toEqual({ requested: undefined, content: undefined, mismatch: false });
  });
});

describe('Portuguese and French cards keep their language', () => {
  const PT_PT: string =
    'Lisboa é uma cidade de sete colinas. O elétrico 28 sobe pelas ruas estreitas da Alfama, e das janelas ouve-se o fado. ' +
    'À noite, os miradouros enchem-se de gente que olha para o Tejo e para a ponte.';
  const PT_BR: string =
    'O Rio de Janeiro é uma cidade entre o mar e a montanha. Nas praias de Copacabana e Ipanema as pessoas caminham ao pôr do sol, ' +
    'e o Cristo Redentor olha para a baía de Guanabara.';
  const FR: string =
    'Paris est une ville qui se découvre à pied. Le long de la Seine, les bouquinistes vendent des livres anciens, ' +
    'et dans les cafés les gens restent des heures avec un café et le journal.';

  it('reconciles European and Brazilian Portuguese to Portuguese', () => {
    ['pt', 'pt-PT', 'pt-BR'].forEach((tag: string) => {
      expect(reconcileLanguage(tag, tag === 'pt-BR' ? PT_BR : PT_PT)).toEqual({ requested: tag, content: tag, mismatch: false });
    });
  });

  it('reconciles French to French', () => {
    expect(reconcileLanguage('fr', FR)).toEqual({ requested: 'fr', content: 'fr', mismatch: false });
    expect(reconcileLanguage('fr-CA', FR)).toEqual({ requested: 'fr-CA', content: 'fr-CA', mismatch: false });
  });

  it('trusts Portuguese and French text over an "en" tag', () => {
    expect(reconcileLanguage('en', PT_PT).content).toBe('pt');
    expect(reconcileLanguage('en', FR).content).toBe('fr');
  });
});

describe('Afrikaans', () => {
  it('is not mistaken for Dutch (no wrong-language warning)', () => {
    const AF: string =
      'Kaapstad is een van die mooiste stede in die wêreld. Die Tafelberg staan bo die stad en die see is nooit ver nie. ' +
      'In die Bo-Kaap is die huise in helder kleure geverf, en by die Waterfront eet mense vis en kyk na die bote.';
    expect(reconcileLanguage('af', AF)).toEqual({ requested: 'af', content: 'af', mismatch: false });
  });
});

