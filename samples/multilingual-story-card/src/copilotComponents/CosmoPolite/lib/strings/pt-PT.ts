import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Português (Portugal)',
  detected: 'Detetado',
  source: 'Origem',
  sources: { agent: 'agente', hostLocale: 'região do anfitrião', sharePoint: 'SharePoint', browser: 'browser', fallback: 'predefinição' },
  readAloud: 'Ler em voz alta',
  pause: 'Pausa',
  resume: 'Retomar',
  stop: 'Parar',
  reading: 'A ler em voz alta',
  paused: 'Em pausa',
  stopped: 'Parado',
  finished: 'Leitura concluída',
  noVoice: 'Nenhuma voz para {0}',
  speechUnavailable: 'A leitura em voz alta não está disponível aqui',
  expand: 'Vista completa',
  collapse: 'Vista compacta',
  tellMore: 'Diz-me mais',
  tellMorePrompt: 'Diz-me mais sobre «{0}».',
  translateTo: 'Traduzir para',
  translatePrompt: 'Traduz este cartão para {0}.',
  design: 'Design',
  designs: { editorial: 'Editorial', classic: 'Clássico', dramatic: 'Dramático', compact: 'Compacto', magazine: 'Revista' },
  designChanged: 'Design: {0}',
  look: 'Aspeto',
  layout: 'Esquema',
  layouts: { lead: 'Imagem principal', teaser: 'Destaque', beside: 'Imagem lateral' },
  layoutChanged: 'Esquema: {0}',
  theme: 'Tema',
  themes: { auto: 'Automático', light: 'Claro', dark: 'Escuro' },
  themeChanged: 'Tema: {0}',
  photo: 'Fotografia',
  noImage: 'Nenhuma fotografia encontrada',
  diagnostics: 'Diagnóstico',
  sent: 'Enviado',
  sendFailed: 'Não foi possível enviar',
  linkFailed: 'Não foi possível abrir a ligação',
  loading: 'A carregar',
  readingTime: 'Tempo de leitura: {0}',
  textIn: 'Texto: {0}',
  askedFor: 'pedido: {0}',
  rewriteIn: 'Reescrever em {0}',
  rewritePrompt: 'Reescreve este cartão em {0}, por favor.'
};

export default strings;
