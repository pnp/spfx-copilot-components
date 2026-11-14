import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Português (Brasil)',
  detected: 'Detectado',
  source: 'Fonte',
  sources: { agent: 'agente', hostLocale: 'localidade do host', sharePoint: 'SharePoint', browser: 'navegador', fallback: 'padrão' },
  readAloud: 'Ler em voz alta',
  pause: 'Pausar',
  resume: 'Retomar',
  stop: 'Parar',
  reading: 'Lendo em voz alta',
  paused: 'Pausado',
  stopped: 'Parado',
  finished: 'Leitura concluída',
  noVoice: 'Nenhuma voz para {0}',
  speechUnavailable: 'A leitura em voz alta não está disponível aqui',
  expand: 'Exibição completa',
  collapse: 'Exibição compacta',
  tellMore: 'Conte mais',
  tellMorePrompt: 'Conte mais sobre “{0}”.',
  translateTo: 'Traduzir para',
  translatePrompt: 'Traduza este cartão para {0}.',
  design: 'Design',
  designs: { editorial: 'Editorial', classic: 'Clássico', dramatic: 'Dramático', compact: 'Compacto', magazine: 'Revista' },
  designChanged: 'Design: {0}',
  look: 'Aparência',
  layout: 'Layout',
  layouts: { lead: 'Imagem principal', teaser: 'Chamada', beside: 'Imagem lateral' },
  layoutChanged: 'Layout: {0}',
  theme: 'Tema',
  themes: { auto: 'Automático', light: 'Claro', dark: 'Escuro' },
  themeChanged: 'Tema: {0}',
  photo: 'Foto',
  noImage: 'Nenhuma foto encontrada',
  diagnostics: 'Diagnóstico',
  sent: 'Enviado',
  sendFailed: 'Não foi possível enviar',
  linkFailed: 'Não foi possível abrir o link',
  loading: 'Carregando',
  readingTime: 'Tempo de leitura: {0}',
  textIn: 'Texto: {0}',
  askedFor: 'solicitado: {0}',
  rewriteIn: 'Reescrever em {0}',
  rewritePrompt: 'Reescreva este cartão em {0}, por favor.'
};

export default strings;
