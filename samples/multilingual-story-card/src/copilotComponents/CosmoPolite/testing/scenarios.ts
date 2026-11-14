// Preview scenarios: languages × themes × modes × presets that the static preview pages render.
// Pure data, so the harness stays short and a new scenario is one entry here.

import type { ICopilotComponentHostContext } from '@microsoft/sp-copilot-component';
import type { ICosmoPoliteCopilotComponentProperties } from '../CosmoPoliteCopilotComponentProperties';

export interface IScenario {
  name: string;
  host: ICopilotComponentHostContext;
  width: number;
  props: ICosmoPoliteCopilotComponentProperties;
}

const WIEN: string =
  'Wean is a Stod, de si Zeit lossn duad. In de Kaffeeheisa sitzn d’Leit stundnlong bei ana Melange und ana Zeitung, ' +
  'und kana schaut auf d’Uhr. Da Stephansdom steht mittn drin, und da Steffl schaut auf de Dächa owe. Im Prater draht si ' +
  's’Riesnradl seit iwa hundat Joar, und am Naschmorkt riacht’s noch Gewürzn aus da gaunzn Wöd. Wer im Summa an de Donau ' +
  'geht, findt an Strand mittn in da Stod. Und am Obnd, beim Heirign, kriagt ma an jungen Wein und a Brettljausn.';

const KAIRO: string =
  'القاهرة مدينة لا تنام. على ضفاف النيل تمتد أحياؤها القديمة والحديثة جنبًا إلى جنب. في خان الخليلي تفوح روائح التوابل ' +
  'والقهوة، وتلمع الفوانيس النحاسية في الأزقة الضيقة. وعلى الأفق الغربي تقف أهرامات الجيزة شاهدة على آلاف السنين من ' +
  'التاريخ. في المساء تتلألأ أضواء الكورنيش، ويجلس الناس في المقاهي يتحدثون حتى ساعات الفجر الأولى.';

const TOKYO: string =
  '東京は、古いものと新しいものが共存する街です。浅草では浅草寺の雷門をくぐり、仲見世通りで人形焼きを味わえます。' +
  '渋谷のスクランブル交差点では、一度に数千人が行き交います。新宿の高層ビルから見る夜景は、果てしなく続く光の海のようです。' +
  '春には上野公園や千鳥ヶ淵で桜が咲き誇り、多くの人が花見を楽しみます。';

const HELSINKI: string =
  'Helsinki on meren kaupunki. Kauppatorilla myydään aamuisin kalaa, marjoja ja kahvia, ja lokit kiertelevät ostajien yllä. ' +
  'Valkoinen tuomiokirkko kohoaa Senaatintorin yläpuolelle, ja Suomenlinnan merilinnoitus vartioi kaupungin edustaa. ' +
  'Kesällä aurinko laskee vasta myöhään illalla, ja ihmiset istuvat rannoilla ja puistoissa. Talvella kaupunki hiljenee, ' +
  'mutta saunat lämpenevät, ja avantouinti kuuluu monen viikkoon.';

const HOST = (theme: 'light' | 'dark', mode: 'inline' | 'fullscreen'): ICopilotComponentHostContext => ({
  theme,
  displayMode: mode,
  availableDisplayModes: ['inline', 'fullscreen']
});

const WIEN_PROPS: ICosmoPoliteCopilotComponentProperties = {
  language: 'de-AT',
  title: 'Wean, de Stod mit Zeit',
  text: WIEN,
  imageQuery: 'Vienna St. Stephen Cathedral',
  imageAlt: 'Da Stephansdom in Wean'
};

const BLACKOUT: string =
  'On a summer evening in 1977, New York suddenly went dark. A major blackout shut off lights across most of the city, stopping elevators, subways, and traffic signals. ' +
  'Yet amid the disruption, an unusual Broadway story unfolded. At some theaters, performers and musicians gathered outside and entertained stranded crowds without stage lights or amplification. ' +
  'Neighbors shared candles, strangers helped direct pedestrians, and rooftops became gathering places. The blackout also brought serious looting and fires, so it was far from romantic. ' +
  'Still, the night became a memorable portrait of New York: chaotic and vulnerable, but filled with moments of improvisation, humor, and unexpected community.';

export const SCENARIOS: IScenario[] = [
  { name: 'de-AT · inline · light · teaser', host: HOST('light', 'inline'), width: 640, props: WIEN_PROPS },
  { name: 'de-AT · inline · dark · lead', host: HOST('dark', 'inline'), width: 640, props: { ...WIEN_PROPS, layout: 'lead' } },
  { name: 'de-AT · inline · light · beside', host: HOST('light', 'inline'), width: 640, props: { ...WIEN_PROPS, layout: 'beside' } },
  // Magazine inline: the photo spans the card at its own aspect ratio (the inline layouts' height
  // caps once squished it).
  { name: 'de-AT · inline · dark · beside · magazine', host: HOST('dark', 'inline'), width: 640, props: { ...WIEN_PROPS, layout: 'beside', design: 'magazine' } },
  // A member of the community team: their own portrait from pnp.github.io, no search.
  {
    name: 'pnp · en · inline · light · beside · team portrait',
    host: HOST('light', 'inline'),
    width: 640,
    props: {
      language: 'en',
      title: 'Vesa Juvonen and the PnP community',
      text: 'Vesa Juvonen has led the Microsoft 365 and Power Platform community initiative for years. Every week the community calls bring together people who share samples, tools and guidance. The idea is simple: sharing is caring, and everyone can contribute.',
      imageQuery: 'Vesa Juvonen SharePoint',
      layout: 'beside'
    }
  },
  { name: 'de-AT · inline · light · lead · magazine', host: HOST('light', 'inline'), width: 640, props: { ...WIEN_PROPS, layout: 'lead', design: 'magazine' } },
  { name: 'de-AT · fullscreen · light · lead', host: HOST('light', 'fullscreen'), width: 900, props: WIEN_PROPS },
  { name: 'de-AT · fullscreen · dark · beside · dramatic', host: HOST('dark', 'fullscreen'), width: 900, props: { ...WIEN_PROPS, layout: 'beside', design: 'dramatic' } },
  { name: 'de-AT · fullscreen · light · teaser · narrow 380', host: HOST('light', 'fullscreen'), width: 380, props: { ...WIEN_PROPS, layout: 'teaser' } },
  {
    name: 'ar · fullscreen · light · magazine (RTL)',
    host: HOST('light', 'fullscreen'),
    width: 900,
    props: { language: 'ar', title: 'القاهرة، مدينة لا تنام', text: KAIRO, imageQuery: 'Cairo skyline Nile', design: 'magazine', imageAlt: 'أفق القاهرة على النيل' }
  },
  {
    name: 'ar · inline · dark · teaser (RTL)',
    host: HOST('dark', 'inline'),
    width: 640,
    props: { language: 'ar', title: 'القاهرة، مدينة لا تنام', text: KAIRO, imageQuery: 'Cairo skyline Nile', imageAlt: 'أفق القاهرة على النيل' }
  },
  {
    name: 'ja · fullscreen · dark · classic',
    host: HOST('dark', 'fullscreen'),
    width: 900,
    props: { language: 'ja', title: '東京、古さと新しさの街', text: TOKYO, imageQuery: 'Tokyo Asakusa Sensoji', design: 'classic', imageAlt: '浅草寺の雷門' }
  },
  {
    name: 'fi · inline · dark · compact',
    host: HOST('dark', 'inline'),
    width: 640,
    props: { language: 'fi', title: 'Helsinki, meren kaupunki', text: HELSINKI, imageQuery: 'Helsinki Cathedral', design: 'compact', imageAlt: 'Helsingin tuomiokirkko' }
  },
  {
    name: 'de · inline · light · English text (mismatch)',
    host: HOST('light', 'inline'),
    width: 640,
    props: {
      language: 'de',
      title: 'Vienna, a city that takes its time',
      text: 'Vienna is a city that takes its time. In the coffee houses people sit for hours with a melange and a newspaper, and nobody looks at the clock. The Giant Ferris Wheel has been turning in the Prater for more than a hundred years.',
      imageQuery: 'Vienna Prater Riesenrad'
    }
  },
  {
    name: 'repro · en tag · fullscreen 1600 · light · beside · portrait',
    host: HOST('light', 'fullscreen'),
    width: 1600,
    props: { ...WIEN_PROPS, language: 'en', title: 'Da Nebel beim Schöpfl', imageQuery: 'Tokyo Asakusa Sensoji', layout: 'beside' }
  },
  {
    name: 'blackout · en · fullscreen 1600 · dark · defaults',
    host: HOST('dark', 'fullscreen'),
    width: 1600,
    props: { language: 'en-US', title: 'The night the lights went out on Broadway', text: BLACKOUT, imageQuery: 'New York night street blackout' }
  },
  {
    name: 'blackout · en · inline 640 · dark · defaults',
    host: HOST('dark', 'inline'),
    width: 640,
    props: { language: 'en-US', title: 'The night the lights went out on Broadway', text: BLACKOUT, imageQuery: 'New York night street blackout' }
  },
  {
    name: 'blackout · en · fullscreen 900 · light · defaults',
    host: HOST('light', 'fullscreen'),
    width: 900,
    props: { language: 'en-US', title: 'The night the lights went out on Broadway', text: BLACKOUT, imageQuery: 'New York night street blackout' }
  },
  {
    name: 'he · fullscreen 1100 · light · defaults (tag en)',
    host: HOST('light', 'fullscreen'),
    width: 1100,
    props: {
      language: 'en',
      title: 'ירושלים, עיר של אבן',
      text: 'ירושלים היא אחת הערים העתיקות בעולם. בעיר העתיקה יש סמטאות צרות, שווקים צבעוניים ומקומות קדושים לשלוש דתות. בערב האבן הירושלמית מקבלת גוון זהוב, ומהטיילת בארמון הנציב נשקף נוף מרהיב על חומות העיר. מוזיאון ישראל מציג את מגילות ים המלח, ובשוק מחנה יהודה מתערבבים ריחות של תבלינים, פירות ומאפים טריים.',
      imageQuery: 'Jerusalem Old City walls'
    }
  },
  {
    name: 'ja · fullscreen · light · magazine (portrait best hit)',
    host: HOST('light', 'fullscreen'),
    width: 900,
    props: { language: 'ja', title: '東京、古さと新しさの街', text: TOKYO, imageQuery: 'Tokyo Asakusa Sensoji', design: 'magazine', imageAlt: '浅草寺の雷門' }
  },
  {
    name: 'hint · en · museum · Schiele',
    host: HOST('light', 'fullscreen'),
    width: 1100,
    props: {
      language: 'en-US',
      title: 'Egon Schiele and his defining work',
      text: 'Egon Schiele was an Austrian Expressionist painter born in 1890 and a major figure of Viennese modernism. A protégé of Gustav Klimt, he became famous for an intense, angular style and psychologically charged portraits. Death and the Maiden (1915) is often regarded as a defining masterpiece.',
      imageQuery: 'Egon Schiele Death and the Maiden',
      imageSource: 'museum',
      wikipediaTitle: 'Death and the Maiden (Schiele)'
    }
  },
  {
    name: 'hint · de · space · Saturn',
    host: HOST('dark', 'fullscreen'),
    width: 1100,
    props: {
      language: 'de',
      title: 'Die Ringe des Saturn',
      text: 'Die Ringe des Saturn bestehen aus unzähligen Eis- und Gesteinsbrocken, von Staubkörnern bis zu hausgroßen Blöcken. Sie sind mehr als 270.000 Kilometer breit, aber oft nur zehn Meter dick. Die Raumsonde Cassini hat sie dreizehn Jahre lang aus nächster Nähe beobachtet.',
      imageQuery: 'Saturn rings Cassini',
      imageSource: 'space',
      wikipediaTitle: 'Rings of Saturn'
    }
  },
  {
    name: 'hint · el · wikipedia · Greek coffee',
    host: HOST('light', 'fullscreen'),
    width: 1100,
    props: {
      language: 'el',
      title: 'Ο ελληνικός καφές είναι μικρή τελετουργία',
      text: 'Ο ελληνικός καφές ξεχωρίζει όχι μόνο για τη γεύση του, αλλά και για τον τρόπο που πίνεται. Φτιάχνεται στο μπρίκι με πολύ ψιλοαλεσμένο καφέ, νερό και, αν θέλεις, ζάχαρη. Σερβίρεται σε μικρό φλιτζάνι.',
      imageQuery: 'Greek coffee briki',
      imageSource: 'wikipedia',
      wikipediaTitle: 'Greek coffee'
    }
  },
  {
    name: 'debug · en · space · moon landing',
    host: HOST('light', 'fullscreen'),
    width: 1000,
    props: {
      language: 'en-US',
      title: 'One small step',
      text: 'On 20 July 1969 Apollo 11 landed in the Sea of Tranquility. Neil Armstrong and Buzz Aldrin spent about two and a half hours outside the lunar module, while Michael Collins orbited above in the command module.',
      imageQuery: 'Apollo 11 moon landing',
      imageSource: 'space',
      wikipediaTitle: 'Apollo 11',
      debug: true
    }
  },
  {
    // Only a portrait exists (the named article's lead image): Magazine crops it to 3:2, and the
    // band must keep the face (it used to cut through the eyes).
    name: 'crop · en-GB · fullscreen · dark · magazine (portrait only)',
    host: HOST('dark', 'fullscreen'),
    width: 900,
    props: {
      language: 'en-GB',
      title: 'Jessica Walsh: bold ideas and visual storytelling',
      text:
        'Jessica Walsh is an American graphic designer, art director and creative entrepreneur known for bold, colourful work combining typography, photography, branding and conceptual storytelling. ' +
        'In 2019 she founded &Walsh, one of the relatively small number of major creative agencies led by a woman. ' +
        'She is particularly recognised for theatrical imagery, strong colour and playful typography.',
      imageQuery: 'Jessica Walsh designer',
      imageSource: 'wikipedia',
      wikipediaTitle: 'Jessica Walsh',
      design: 'magazine'
    }
  },
  {
    // Urdu: own (right-to-left) labels, Nastaliq, a Latin name with a leading symbol (&Walsh).
    name: 'ur · fullscreen · dark · magazine (Nastaliq, &Walsh)',
    host: HOST('dark', 'fullscreen'),
    width: 900,
    props: {
      language: 'ur',
      title: 'جیسیکا والش اور &Walsh',
      text:
        'جیسیکا والش ایک امریکی گرافک ڈیزائنر، آرٹ ڈائریکٹر اور کریئیٹو ڈائریکٹر ہیں۔ انہیں نیویارک میں اسٹیفن سیگمائسٹر کے ساتھ Sagmeister & Walsh میں کام کے ذریعے عالمی شہرت ملی۔ ' +
        '2019 میں انہوں نے &Walsh قائم کیا، جو برانڈنگ اور ڈیجیٹل ڈیزائن پر کام کرنے والی تخلیقی ایجنسی ہے۔',
      imageQuery: 'Jessica Walsh designer',
      imageSource: 'wikipedia',
      wikipediaTitle: 'Jessica Walsh',
      design: 'magazine'
    }
  },
  {
    // Persian has no label set: English (left-to-right) labels around a right-to-left story. The
    // text column must start on the right.
    name: 'fa · fullscreen · light · lead (English labels, RTL story)',
    host: HOST('light', 'fullscreen'),
    width: 900,
    props: {
      language: 'fa',
      title: 'اصفهان، نصف جهان',
      text:
        'اصفهان یکی از زیباترین شهرهای ایران است. میدان نقش جهان با مسجد شاه و کاخ عالی‌قاپو در قلب شهر قرار دارد. ' +
        'پل‌های تاریخی مانند سی‌وسه‌پل بر روی زاینده‌رود ساخته شده‌اند و عصرها پر از مردم است.',
      imageQuery: 'Isfahan Naqsh-e Jahan Square',
      layout: 'lead',
      design: 'editorial'
    }
  },
  {
    name: 'fa · fullscreen · dark · beside + inline teaser source (English labels, RTL story)',
    host: HOST('dark', 'fullscreen'),
    width: 900,
    props: {
      language: 'fa',
      title: 'اصفهان، نصف جهان',
      text:
        'اصفهان یکی از زیباترین شهرهای ایران است. میدان نقش جهان با مسجد شاه و کاخ عالی‌قاپو در قلب شهر قرار دارد. ' +
        'پل‌های تاریخی مانند سی‌وسه‌پل بر روی زاینده‌رود ساخته شده‌اند و عصرها پر از مردم است.',
      imageQuery: 'Isfahan Naqsh-e Jahan Square',
      layout: 'beside',
      design: 'dramatic'
    }
  },
  {
    name: 'fa · inline · light · teaser (English labels, RTL story)',
    host: HOST('light', 'inline'),
    width: 640,
    props: {
      language: 'fa',
      title: 'اصفهان، نصف جهان',
      text: 'اصفهان یکی از زیباترین شهرهای ایران است. میدان نقش جهان با مسجد شاه و کاخ عالی‌قاپو در قلب شهر قرار دارد.',
      imageQuery: 'Isfahan Naqsh-e Jahan Square',
      layout: 'teaser'
    }
  },
  {
    // Ethiopic script in the labels and the story (own label set since 1.0.28).
    name: 'am · fullscreen · light · lead (Ethiopic labels)',
    host: HOST('light', 'fullscreen'),
    width: 900,
    props: {
      language: 'am',
      title: 'አዲስ አበባ፣ አዲሷ አበባ',
      text: 'አዲስ አበባ የኢትዮጵያ ዋና ከተማ ናት። በከተማዋ መሃል የመስቀል አደባባይ ይገኛል። መርካቶ በአፍሪካ ካሉ ትላልቅ ገበያዎች አንዱ ነው። ቡና በየቀኑ በባህላዊ ሥነ ሥርዓት ይፈላል።',
      imageQuery: 'Addis Ababa city',
      layout: 'lead'
    }
  },
  {
    name: 'nophoto · fi · fullscreen · light · magazine',
    host: HOST('light', 'fullscreen'),
    width: 900,
    props: { language: 'fi', title: 'Helsinki, meren kaupunki', text: HELSINKI, imageQuery: 'no-such-photo-xyzzy-42', design: 'magazine' }
  },
  {
    name: 'nophoto · de-AT · inline · light · teaser',
    host: HOST('light', 'inline'),
    width: 640,
    props: { ...WIEN_PROPS, imageQuery: 'no-such-photo-xyzzy-42', layout: 'teaser' }
  },
  {
    name: 'fi · fullscreen · light · editorial · debug · no photo',
    host: HOST('light', 'fullscreen'),
    width: 900,
    props: { language: 'fi', title: 'Helsinki, meren kaupunki', text: HELSINKI, imageQuery: 'no-such-photo-xyzzy-42', debug: true }
  }
];
