/**
 * Component CSS, injected once per document (the Copilot host renders in its own iframe document).
 * Motion is deliberately small: a 300 ms check-mark draw-on, a short fade/scale-in of the result,
 * a calm fade-in for the X icon and a colour transition on the chosen option. No bursts, no shake.
 * Everything is switched off by `.wpq--static` (Animations toggle) and by prefers-reduced-motion.
 */
export const STYLE_ELEMENT_ID = 'weekly-pulse-quiz-styles';

export const WPQ_CSS = `
.wpq{font-family:inherit;color:var(--wpq-text);background:var(--wpq-card-bg);border:1px solid var(--wpq-border);border-radius:4px;overflow:hidden;max-width:760px}
.wpq *{box-sizing:border-box}
.wpq__banner{background:var(--wpq-banner-bg);color:var(--wpq-banner-text);padding:16px 20px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.wpq__title{margin:0;font-size:20px;line-height:28px;font-weight:600}
.wpq__intro{margin:4px 0 0;font-size:14px;line-height:20px}
.wpq__week{flex:none;background:var(--wpq-accent);color:var(--wpq-accent-text);font-size:12px;line-height:16px;font-weight:600;padding:4px 8px;border-radius:2px;white-space:nowrap}
.wpq__body{padding:20px;background:var(--wpq-card-bg)}
.wpq__fieldset{border:0;margin:0;padding:0;min-width:0}
.wpq__question{font-size:18px;line-height:24px;font-weight:600;margin:0 0 14px;padding:0}
.wpq__options{display:grid;gap:8px}
.wpq__option{position:relative;display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid var(--wpq-border);border-radius:4px;background:var(--wpq-card-bg);cursor:pointer;transition:background-color 200ms ease-out,border-color 200ms ease-out}
.wpq__option:hover{border-color:var(--wpq-selected-border)}
.wpq__option input{position:absolute;opacity:0;width:1px;height:1px;margin:0}
.wpq__letter{flex:none;width:28px;height:28px;border-radius:50%;border:1px solid var(--wpq-text);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;transition:background-color 200ms ease-out,color 200ms ease-out}
.wpq__optionText{font-size:15px;line-height:20px}
.wpq__option--selected{border:2px solid var(--wpq-selected-border);padding:9px 13px}
.wpq__option--selected .wpq__letter{background:var(--wpq-selected-border);border-color:var(--wpq-selected-border);color:var(--wpq-button-text)}
.wpq__option input:focus-visible + .wpq__letter{outline:2px solid var(--wpq-focus);outline-offset:3px}
.wpq__option--locked{cursor:default}
.wpq__option--locked:hover{border-color:var(--wpq-border)}
.wpq__option--correct{background:var(--wpq-correct-fill);border:2px solid var(--wpq-selected-border);padding:9px 13px;color:var(--wpq-correct-text)}
.wpq__option--correct .wpq__letter{background:var(--wpq-selected-border);border-color:var(--wpq-selected-border);color:var(--wpq-button-text)}
.wpq__option--wrong{border:2px dashed var(--wpq-text);padding:9px 13px}
.wpq__tag{margin-left:auto;font-size:12px;font-weight:600;white-space:nowrap}
.wpq__actions{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-top:16px}
.wpq__button{appearance:none;border:2px solid var(--wpq-button-bg);background:var(--wpq-button-bg);color:var(--wpq-button-text);font:inherit;font-size:14px;font-weight:600;line-height:20px;padding:6px 20px;border-radius:2px;cursor:pointer;transition:background-color 150ms ease-out}
.wpq__button:hover:not(:disabled){background:var(--wpq-button-hover);border-color:var(--wpq-button-hover)}
.wpq__button:focus-visible,.wpq__link:focus-visible{outline:2px solid var(--wpq-focus);outline-offset:2px}
.wpq__button:disabled{opacity:.45;cursor:not-allowed}
.wpq__button--secondary{background:transparent;color:var(--wpq-text);border-color:var(--wpq-text)}
.wpq__button--secondary:hover:not(:disabled){background:var(--wpq-surface);border-color:var(--wpq-text)}
.wpq__link{appearance:none;border:0;background:none;padding:0;font:inherit;font-size:14px;font-weight:600;color:var(--wpq-text);text-decoration:underline;cursor:pointer}
.wpq__privacy{font-size:12px;line-height:16px;margin:0}
.wpq__result{display:flex;align-items:flex-start;gap:12px;margin-top:16px;padding:12px 14px;border-radius:4px;background:var(--wpq-surface)}
.wpq__resultText{min-width:0}
.wpq__headline{margin:0;font-size:16px;line-height:22px;font-weight:600}
.wpq__reveal{margin:2px 0 0;font-size:14px;line-height:20px}
.wpq__icon{flex:none;width:32px;height:32px}
.wpq__why{margin-top:12px;padding:12px 14px;border-left:4px solid var(--wpq-selected-border);background:var(--wpq-surface)}
.wpq__whyTitle{margin:0 0 4px;font-size:14px;font-weight:600}
.wpq__justification{margin:0 0 6px;font-size:14px;line-height:20px;white-space:pre-line}
.wpq__notice{margin:0 0 12px;padding:8px 12px;font-size:13px;line-height:18px;border-left:4px solid var(--wpq-accent);background:var(--wpq-surface)}
.wpq__notice code{font-family:Consolas,monospace;font-size:12px;word-break:break-all}
.wpq__error{margin-top:12px;font-size:14px;line-height:20px;padding:8px 12px;border-left:4px solid var(--wpq-text);background:var(--wpq-surface)}
.wpq__empty{margin:0;font-size:15px;line-height:22px}
.wpq__muted{margin:0;font-size:14px}
.wpq__sr{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.wpq__dialogBody{color:#242424}

/* Set up lists (edit mode, site owners) */
.wpq__setup{margin:0 0 12px;padding:12px 14px;border:1px solid var(--wpq-border);border-left:4px solid var(--wpq-accent);background:var(--wpq-surface);font-size:13px;line-height:18px}
.wpq__setup p{margin:0 0 6px}
.wpq__setupTitle{font-size:14px;line-height:20px;font-weight:600}
.wpq__setup .wpq__actions{margin-top:10px}
.wpq__setupAlt{font-size:12px;line-height:16px}
.wpq__setup code,.wpq__setupAlt code{font-family:Consolas,monospace;font-size:12px;word-break:break-all}
/* Not set up yet (view mode and Copilot): friendly notice, no actions */
.wpq__notSetUp{margin:0;padding:14px 16px}
.wpq__notSetUp .wpq__setupTitle{margin:0 0 6px;font-size:16px;line-height:22px;color:var(--wpq-banner-bg)}
.wpq__notSetUp p{margin:0;font-size:14px;line-height:20px}
.wpq__plan{font-size:14px;line-height:20px}
.wpq__plan p{margin:0 0 8px}
.wpq__planSite{margin:12px 0 4px!important;font-weight:600;word-break:break-all}
.wpq__plan ul{margin:0 0 8px;padding-left:20px}
.wpq__plan li{margin:0 0 4px}
.wpq__steps{list-style:none;margin:0;padding:0;font-size:14px;line-height:20px}
.wpq__step{display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-bottom:1px solid #EDEBE9}
.wpq__stepMark{flex:none;width:18px;text-align:center;font-weight:700;color:var(--wpq-button-hover)}
.wpq__step--pending{color:#605E5C}
.wpq__step--pending .wpq__stepMark{color:#8A8886}
.wpq__step--failed .wpq__stepMark{color:#242424}
.wpq__step--failed .wpq__stepLabel{font-weight:600}
.wpq__step--running .wpq__stepLabel{font-weight:600}
.wpq__stepLabel{min-width:0;flex:1}
.wpq__stepDetail{flex:none;max-width:45%;font-size:12px;color:#605E5C;text-align:right}
.wpq__setupResult{margin:0 0 12px;padding:8px 12px;font-size:14px;line-height:20px;border-left:4px solid var(--wpq-button-hover);background:var(--wpq-surface)}
.wpq__setupResult--error{border-left-color:#242424;border-left-style:dashed}
.wpq__setupResult p{margin:0}
.wpq__setupResult p + p{margin-top:4px}
.wpq__setupSite{font-size:12px;color:#605E5C;margin:12px 0 2px;word-break:break-all}

/* Motion (simple and professional) */
.wpq--motion .wpq__result{animation:wpq-result-in 240ms ease-out both}
.wpq--motion .wpq__check{stroke-dasharray:24;stroke-dashoffset:24;animation:wpq-draw 300ms ease-out 120ms forwards}
.wpq--motion .wpq__x{opacity:0;animation:wpq-fade 240ms ease-out 80ms forwards}
.wpq--motion .wpq__why{animation:wpq-fade 200ms ease-out both}
@keyframes wpq-result-in{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
@keyframes wpq-draw{to{stroke-dashoffset:0}}
@keyframes wpq-fade{from{opacity:0}to{opacity:1}}
.wpq--static *,.wpq--static *::before,.wpq--static *::after{animation:none!important;transition:none!important}
.wpq--static .wpq__check{stroke-dashoffset:0!important}
.wpq--static .wpq__x{opacity:1!important}
@media (prefers-reduced-motion: reduce){
  .wpq *,.wpq *::before,.wpq *::after{animation:none!important;transition:none!important}
  .wpq .wpq__check{stroke-dashoffset:0!important}
  .wpq .wpq__x{opacity:1!important}
}
`;

export function ensureStyles(doc: Document | undefined): void {
  if (!doc || doc.getElementById(STYLE_ELEMENT_ID)) {
    return;
  }
  const style = doc.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = WPQ_CSS;
  (doc.head || doc.documentElement).appendChild(style);
}
