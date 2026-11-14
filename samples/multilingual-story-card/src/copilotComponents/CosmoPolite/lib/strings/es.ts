import type { IUiStrings } from './types';

/** Translation reviewed by a native speaker. */
export const reviewed: boolean = false;

const strings: IUiStrings = {
  languageName: 'Español',
  detected: 'Detectado',
  source: 'Origen',
  sources: { agent: 'agente', hostLocale: 'configuración regional del host', sharePoint: 'SharePoint', browser: 'navegador', fallback: 'predeterminado' },
  readAloud: 'Leer en voz alta',
  pause: 'Pausar',
  resume: 'Reanudar',
  stop: 'Detener',
  reading: 'Leyendo en voz alta',
  paused: 'En pausa',
  stopped: 'Detenido',
  finished: 'Lectura finalizada',
  noVoice: 'No hay voz para {0}',
  speechUnavailable: 'La lectura en voz alta no está disponible aquí',
  expand: 'Vista completa',
  collapse: 'Vista compacta',
  tellMore: 'Cuéntame más',
  tellMorePrompt: 'Cuéntame más sobre «{0}».',
  translateTo: 'Traducir a',
  translatePrompt: 'Traduce esta tarjeta a {0}.',
  design: 'Diseño',
  designs: { editorial: 'Editorial', classic: 'Clásico', dramatic: 'Dramático', compact: 'Compacto', magazine: 'Revista' },
  designChanged: 'Diseño: {0}',
  look: 'Apariencia',
  layout: 'Disposición',
  layouts: { lead: 'Imagen principal', teaser: 'Avance', beside: 'Imagen lateral' },
  layoutChanged: 'Disposición: {0}',
  theme: 'Tema',
  themes: { auto: 'Automático', light: 'Claro', dark: 'Oscuro' },
  themeChanged: 'Tema: {0}',
  photo: 'Foto',
  noImage: 'No se ha encontrado ninguna foto',
  diagnostics: 'Diagnóstico',
  sent: 'Enviado',
  sendFailed: 'No se ha podido enviar',
  linkFailed: 'No se ha podido abrir el vínculo',
  loading: 'Cargando',
  readingTime: 'Tiempo de lectura: {0}',
  textIn: 'Texto: {0}',
  askedFor: 'solicitado: {0}',
  rewriteIn: 'Reescribir en {0}',
  rewritePrompt: 'Vuelve a escribir esta tarjeta en {0}, por favor.'
};

export default strings;
