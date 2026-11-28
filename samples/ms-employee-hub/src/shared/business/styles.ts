// Kept inside the surface so the same publication inherits its host theme and owner document.
export const businessStyles = `
.slt-root{
  --sheet:var(--colorNeutralBackground1,#fff);--paper:color-mix(in srgb,var(--sheet) 92%,#a29366);
  --ink:color-mix(in srgb,var(--colorNeutralForeground1,#162b38) 86%,#194359);--muted:var(--colorNeutralForeground2,#465c68);
  --line:color-mix(in srgb,var(--ink) 20%,var(--sheet));--faint:color-mix(in srgb,var(--ink) 9%,var(--sheet));
  --accent:color-mix(in srgb,var(--ink) 46%,#009d89);--wash:color-mix(in srgb,var(--sheet) 91%,#348f79);
  --sea:#102d40;--deep:#0a2132;--ice:#f1faf9;--aqua:#a4e4cd;--apricot:#ffc49c;--rule:#476477;--focus:#ce8731;
  --ribbon-mint-start:#49af99;--ribbon-mint-end:#67c9b0;--ribbon-blue-start:#78a9c5;--ribbon-blue-end:#9bc6dc;
  --ribbon-iris-start:#9485c0;--ribbon-iris-end:#b4a1d6;--ribbon-slate-start:#98a6bf;--ribbon-slate-end:#b5c3d0;
  min-width:0;width:100%;container-type:inline-size;color:var(--ink);background:var(--paper);font:400 16px/1.48 'Segoe UI Variable','Segoe UI',system-ui,sans-serif;text-align:left;
}
.slt-root *,.slt-root *::before,.slt-root *::after{box-sizing:border-box}
.slt-body{min-width:0;max-width:1640px;margin:auto;padding:clamp(16px,2.4cqw,38px)}
.slt-inline{background:var(--sheet)}.slt-inline .slt-body{padding:5px clamp(8px,1.6cqw,16px) 2px}
.slt-root :is(p,h2,h3,figure,dl,dd){margin:0}.slt-root :is(h2,h3){color:inherit;font-weight:600;letter-spacing:-.043em;line-height:1.04}
.slt-root h2{max-width:26ch;font-size:clamp(36px,4.2cqw,72px);text-wrap:balance}.slt-root h2 em{font:inherit;color:var(--accent)}
.slt-inline h2{max-width:34ch;font-size:clamp(27px,4.4cqw,37px)}.slt-root h3{margin:8px 0 11px;font-size:clamp(23px,2.3cqw,36px);text-wrap:balance}
.slt-root svg{display:block;width:100%;height:auto}.slt-root :is(.slt-over,.slt-index,.slt-field>span,.slt-folio,.slt-stages,.slt-readout small,.slt-action-band small,.slt-checkpoint small){
  font-size:11px;font-weight:700;line-height:1.45;letter-spacing:.105em;text-transform:uppercase
}
.slt-root .slt-over{color:var(--accent);margin-bottom:8px}.slt-over span{color:var(--muted);padding:0 6px}
.slt-root .slt-index{display:flex;align-items:center;gap:8px;color:var(--accent)}.slt-index>span{display:inline-flex;flex:none;white-space:nowrap;align-items:center;gap:7px;letter-spacing:.045em;font-variant-numeric:tabular-nums}.slt-index>span::after{content:'';width:14px;height:1px;background:currentColor;opacity:.65}
.slt-root .slt-stamp{margin:11px 0 15px;color:var(--muted);font-size:12px}.slt-stamp span{padding:0 3px;opacity:.7}.slt-root .slt-note,.slt-root caption{color:var(--muted);font-size:14px}
.slt-root :is(button,input,select){max-width:100%;color:var(--ink);font:inherit}.slt-root :is(button,summary){cursor:pointer}
.slt-root button{padding:8px 13px;border:1px solid var(--line);border-radius:5px;background:var(--sheet);font-size:14px;font-weight:600;line-height:1.35}
.slt-root button:disabled{opacity:.55;cursor:not-allowed}.slt-root :is(button,select,input,summary,[role=button]):focus-visible{outline:3px solid var(--focus);outline-offset:3px}
.slt-root button:hover:not(:disabled){text-decoration:underline;text-underline-offset:3px}
.slt-root .slt-link{display:block;color:var(--accent);background:transparent;border:0;border-radius:0;text-align:left;text-decoration:none;padding:7px 0;box-shadow:none}
.slt-root .slt-link:hover{text-decoration:underline}.slt-root .slt-primary{padding:10px 15px;color:var(--ice);background:#075e54;border:1px solid #197c6d;border-radius:6px;box-shadow:none}
.slt-filters,.slt-foot{display:flex;align-items:end;flex-wrap:wrap;gap:9px 16px}.slt-filters{margin:16px 0}.slt-foot{margin-top:13px}
.slt-field{display:flex;min-width:0;max-width:100%;flex-direction:column;gap:4px}.slt-root .slt-field>span{font-size:10px;letter-spacing:.07em;color:var(--muted)}
.slt-field :is(select,input){min-height:34px;padding:5px 9px;border:1px solid var(--line);border-radius:5px;background:var(--sheet);font-size:14px}.slt-inline .slt-filters{margin:9px 0}
.slt-spread{display:grid;grid-template-columns:minmax(0,2fr) minmax(210px,.85fr);gap:clamp(18px,2.7cqw,45px);align-items:start}
.slt-margin{min-width:0;border-left:1px solid var(--line);padding-left:clamp(15px,2cqw,32px)}.slt-margin>p{margin:0 0 12px}
.slt-root .slt-details{margin-top:14px}.slt-details summary{padding:7px 0;color:var(--accent);font-weight:600}.slt-root table{width:100%;border-collapse:collapse;font-size:14px;font-variant-numeric:tabular-nums}
.slt-root caption{text-align:left;padding:7px 0}.slt-root th,.slt-root td{text-align:right;border-bottom:1px solid var(--line);padding:7px 6px}.slt-root th:first-child{text-align:left}.slt-root td{white-space:nowrap}
.slt-root thead th{color:var(--muted);font-size:12px}.slt-root th button{border:0;font:inherit;color:var(--ink);background:transparent;text-align:left;padding:3px 1px}
.slt-root tr[data-selected=true]{background:var(--wash)}.slt-root tr[data-selected=true] th button{color:var(--accent);box-shadow:none;text-decoration:underline;text-underline-offset:3px}
.slt-root .slt-empty,.slt-root .slt-error{border-left:3px solid var(--focus);background:var(--wash);padding:12px 16px;margin:12px 0}
.slt-inline .slt-evidence-actions{display:flex;flex-wrap:wrap;gap:4px 15px;align-items:baseline;justify-content:space-between;margin-top:8px}
.slt-inline .slt-evidence-actions .slt-details{margin:0}.slt-evidence-actions .slt-details[open]{flex:1 0 100%}

.slt-folio{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px 12px;padding-bottom:12px;border-bottom:1px solid var(--line);color:var(--muted)}
.slt-folio span{display:inline-flex;align-items:center;gap:10px}.slt-folio span:first-child{color:var(--accent)}
.slt-folio i{display:inline-block;width:20px;height:12px;background:linear-gradient(to top,var(--accent) 4px,transparent 4px) left/5px 100% no-repeat,linear-gradient(to top,var(--accent) 8px,transparent 8px) center/5px 100% no-repeat,linear-gradient(var(--accent),var(--accent)) right/5px 100% no-repeat}
.slt-folio b{font-weight:400;opacity:.6}.slt-mast,.slt-focusmast{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(230px,.85fr);gap:clamp(22px,4cqw,70px);align-items:center;padding:clamp(22px,2.7cqw,44px) 0}
.slt-mast h2{font-size:clamp(43px,5.6cqw,88px);line-height:.98;letter-spacing:-.055em;font-weight:590;text-wrap:initial}
.slt-root .slt-lede{max-width:60ch;margin-top:16px;color:var(--muted);font-size:clamp(15px,1.38cqw,21px);line-height:1.42}.slt-lede strong{color:var(--ink);font-weight:650}
.slt-edition{min-width:0;border-left:3px solid var(--accent);padding:0 0 0 clamp(14px,1.8cqw,28px)}
.slt-quarter-top{display:flex;justify-content:space-between;align-items:center;gap:8px}.slt-quarter-top .slt-field>span{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}.slt-quarter-top select{min-height:30px}
.slt-pace{display:flex;align-items:baseline;gap:10px;margin:5px 0 9px}.slt-pace strong{font-size:clamp(41px,4.2cqw,70px);letter-spacing:-.055em;font-weight:550;line-height:1.07;white-space:nowrap}.slt-pace span,.slt-edition>p{color:var(--muted);font-size:14px}
.slt-edition>p b{color:var(--ink)}.slt-edition>p span{padding:0 4px}.slt-pace-line,.slt-rail{display:block;position:relative;background:var(--line)}
.slt-pace-line{height:6px;margin:3px 0 9px}.slt-pace-line i,.slt-rail i{display:block;height:100%;background:var(--accent)}
.slt-pace-line b,.slt-rail b{position:absolute;width:2px;top:-3px;bottom:-3px;background:var(--ink);outline:1px solid var(--paper)}
.slt-mapspread,.slt-mapcompact{overflow:hidden;border-radius:15px;background:var(--sea);color:var(--ice)}.slt-mapspread{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(285px,1fr)}
.slt-atlas,.slt-ranking{min-width:0;padding:clamp(15px,2.1cqw,33px)}.slt-atlas{height:100%;background:radial-gradient(ellipse at 42% 70%,#1d4d62,transparent 72%),var(--sea)}
.slt-atlas .slt-index,.slt-ranking .slt-index{color:var(--aqua)}.slt-atlas h3{max-width:28ch;margin:9px 0 4px;color:var(--ice);font-size:clamp(23px,2.1cqw,34px)}
.slt-atlas svg{margin:5px auto;max-height:350px}.slt-mapcompact .slt-atlas svg{max-height:180px}.slt-graticule{stroke:#658497;stroke-width:.7;opacity:.5}
.slt-land{fill:#285061;stroke:#80a3af;stroke-width:.65}.slt-marker{cursor:pointer}.slt-marker .below{fill:var(--apricot)}.slt-marker .above{fill:var(--aqua)}
.slt-marker circle:is(.below,.above){stroke:var(--sea);stroke-width:1.4}.slt-ring{fill:none;stroke:var(--ice);stroke-width:2}.slt-locator{fill:none;stroke:var(--aqua);stroke-width:1;stroke-dasharray:2 3}
.slt-sign{stroke:#163344;stroke-width:2;pointer-events:none}.slt-marker text{font:650 16px 'Segoe UI',sans-serif;fill:var(--ice);stroke:var(--sea);stroke-width:3;paint-order:stroke;pointer-events:none}
.slt-map-key{display:flex;flex-wrap:wrap;gap:4px 16px;font-size:13px;font-weight:600}.slt-map-key span:first-child{color:var(--aqua)}.slt-map-key span:nth-child(2){color:var(--apricot)}
.slt-root .slt-map-credit{color:#c6d8df;font-size:12px;margin:5px 0 0}.slt-ranking{background:var(--deep);border-left:1px solid #385366;display:flex;flex-direction:column;justify-content:center}
.slt-ranking h3{margin:8px 0 0;color:var(--ice)}.slt-rank-table{display:grid;margin:13px 0 0}
.slt-root .slt-rank-row{display:grid;grid-template-columns:1.45em minmax(5.5em,1.15fr) minmax(2.4em,1fr) 4.65em;gap:7px;align-items:center;padding:9px 6px;border:0;border-bottom:1px solid #385365;border-radius:0;background:transparent;color:var(--ice);box-shadow:none;text-align:left;font-size:14px}
.slt-rank-row small{color:#adc3ce;font-size:11px;font-weight:400}.slt-rank-row b{text-align:right;font-variant-numeric:tabular-nums;font-weight:600}
.slt-root .slt-rank-row[aria-pressed=true]{background:#244153;box-shadow:inset 3px 0 var(--aqua)}.slt-diverge{position:relative;display:block;height:16px;background:linear-gradient(to right,transparent calc(50% - .5px),#b0c4cd 50%,transparent calc(50% + 1px))}
.slt-diverge i{position:absolute;height:6px;top:5px;border-radius:1px}.slt-diverge .down{right:50%;background:var(--apricot)}.slt-diverge .up{left:50%;background:var(--aqua)}
.slt-atlas-caption{display:flex;align-items:center;gap:10px;margin-top:13px;font-size:13px;color:var(--ice)}.slt-atlas-caption>b{display:grid;place-items:center;min-width:35px;height:35px;border:1px solid #648291;border-radius:50%;font-size:12px;letter-spacing:.04em}
.slt-atlas-caption small{display:block;color:#cadbe2;font-size:12px}
.slt-map-answer{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(160px,.8fr);align-items:center;gap:15px}.slt-map-aside{min-width:0}.slt-map-aside .slt-foot{gap:0 12px}
.slt-source-line,.slt-chapter{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:6px 16px}.slt-source-line{padding:6px 0;border-bottom:1px solid var(--line);font-size:12px;color:var(--muted)}
.slt-chapter{margin:20px 0 9px;padding:10px 0}.slt-chapter>div:first-child{flex:1 1 270px}.slt-chapter h3{font-size:clamp(32px,3.8cqw,58px);margin:7px 0}.slt-chapter p:not(.slt-index){color:var(--muted)}
.slt-plates{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:clamp(12px,1.7cqw,26px)}
.slt-plates article{min-width:0;padding:clamp(16px,2cqw,30px);border:1px solid var(--line);border-radius:12px;background:var(--sheet)}
.slt-plates article>p:not(.slt-index){color:var(--muted);font-size:14px}.slt-plates article>h3{font-size:clamp(23px,2.2cqw,34px)}.slt-plates .slt-flow{margin-top:20px}.slt-plates .slt-bridge{border:0;margin:20px 0 0;padding:0;background:transparent}
.slt-plates .slt-bridge figcaption{display:none}.slt-plates .slt-plate-reading{border-top:1px solid var(--line);padding-top:10px;margin-top:6px}.slt-plates .slt-plate-reading b{color:var(--ink)}
.slt-action-band{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(180px,.7fr);align-items:center;gap:18px 5cqw;border-left:4px solid var(--accent);border-radius:3px 12px 12px 3px;background:var(--wash);margin:22px 0 6px;padding:clamp(18px,2.4cqw,36px)}
.slt-action-band>div+div{padding-left:22px;border-left:1px solid var(--line)}.slt-action-band small,.slt-checkpoint small{display:block;color:var(--accent)}
.slt-action-band>div>strong{display:block;margin:4px 0 12px;font-size:24px;line-height:1.15;font-weight:550;letter-spacing:-.035em}

.slt-focusmast{align-items:end;padding-bottom:8px}.slt-focusmast h2{max-width:23ch}.slt-focusmast .slt-stamp{margin-bottom:0}
.slt-desk-note{max-width:43ch;padding-left:16px;border-left:3px solid var(--accent);color:var(--muted);font-size:15px}.slt-desk-note>p+p{margin-top:6px}.slt-desk-note b{color:var(--ink)}
.slt-full .slt-lead-review>.slt-filters{padding:11px 0 14px;margin:9px 0 16px;border-bottom:1px solid var(--line)}
.slt-lead-spread{display:grid;grid-template-columns:minmax(0,1.95fr) minmax(245px,.9fr);grid-template-areas:'plot margin' 'ledger margin';gap:18px clamp(18px,2cqw,32px);align-items:start}
.slt-lead-spread>.slt-graph{grid-area:plot}.slt-lead-margin{grid-area:margin;min-width:0}.slt-lead-spread>.slt-evidence-actions{grid-area:ledger;min-width:0}
.slt-graph{padding:clamp(14px,2cqw,30px);border:1px solid var(--line);border-radius:13px;background:var(--sheet)}.slt-graph h3{font-size:clamp(24px,2.3cqw,36px)}
.slt-flow{margin:12px 0 0;--plot-paper:var(--sheet);--plot-ink:var(--ink)}.slt-stages{display:grid;grid-template-columns:minmax(0,1fr) max-content minmax(0,1fr);gap:3px;color:var(--muted);border-bottom:1px solid var(--line);padding:0 2px 6px}
.slt-stages span:nth-child(2){text-align:center}.slt-stages span:last-child{text-align:right}.slt-flow svg{background:linear-gradient(90deg,transparent 49.9%,var(--faint) 50%,transparent 50.1%)}
.slt-flow text{font:600 13px 'Segoe UI',sans-serif;fill:var(--plot-ink);stroke:var(--plot-paper);stroke-width:3px;paint-order:stroke;stroke-linejoin:round}
.slt-node{fill:var(--plot-ink)}.slt-ribbon{opacity:.78;stroke:transparent;stroke-width:1.5px;cursor:pointer}.slt-ribbon.chosen,.slt-ribbon:hover,.slt-ribbon:focus-visible{opacity:1;stroke:var(--plot-ink)}
.slt-readout{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:5px 12px;padding:10px 0 0;border-top:1px solid var(--line);font-size:15px}
.slt-readout small{display:block;color:var(--muted);font-size:10px}.slt-readout b{font-weight:600}.slt-readout>span{font-variant-numeric:tabular-nums;color:var(--accent);font-size:18px;font-weight:600}
.slt-compare{padding:4px 0 17px;border-bottom:1px solid var(--line)}.slt-compare h3{margin-bottom:16px}.slt-compare-row{margin:12px 0 15px}
.slt-compare-row>div:first-child{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;font-size:15px;gap:3px 9px}.slt-compare-row span{font-variant-numeric:tabular-nums}
.slt-meter{height:7px;background:var(--line);margin-top:6px;border-radius:2px}.slt-meter i{display:block;height:100%;background:var(--accent);border-radius:inherit}
.slt-follow-note,.slt-checkpoint{margin-top:16px;border-left:3px solid var(--accent);background:var(--wash);padding:clamp(13px,1.6cqw,24px)}
.slt-follow-note>p:not(.slt-index),.slt-checkpoint>p:not(.slt-index){color:var(--muted);font-size:15px;margin-bottom:12px}.slt-follow-note h3,.slt-checkpoint h3{font-size:clamp(23px,2cqw,30px)}
.slt-lead-spread .slt-details{margin-top:0}.slt-lead-spread .slt-details summary{color:var(--ink);font-size:20px;letter-spacing:-.025em}
.slt-inline .slt-graph{background:radial-gradient(ellipse at 30% 0%,#234b5b,transparent 67%),var(--sea);color:var(--ice);border:0;padding:clamp(11px,1.65cqw,19px)}
.slt-inline .slt-graph .slt-index,.slt-inline .slt-readout>span{color:var(--aqua)}.slt-inline .slt-flow{--plot-paper:var(--sea);--plot-ink:var(--ice);margin-top:6px}
.slt-inline .slt-stages{font-size:10px;color:#c2d6dc;border-color:var(--rule)}.slt-inline .slt-readout{border-color:var(--rule);padding-top:6px;font-size:13px}.slt-inline .slt-readout small{display:none}.slt-inline .slt-readout>span{font-size:14px}

.slt-action-review>.slt-heading{margin-top:22px}.slt-root .slt-action-intro{max-width:64ch;margin:10px 0 16px;color:var(--muted)}
.slt-progress{display:flex;list-style:none;margin:17px 0 20px;padding:0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.slt-progress li{display:flex;align-items:center;gap:7px;position:relative;padding:11px 0;flex:1;color:var(--muted);font-size:13px;font-weight:600}
.slt-progress li span{display:grid;place-items:center;width:22px;height:22px;border:1px solid var(--line);border-radius:50%;font-size:10px;font-variant-numeric:tabular-nums}
.slt-progress li[aria-current=step]{color:var(--accent);box-shadow:inset 0 -2px var(--accent)}.slt-progress li[aria-current=step] span{background:#075e54;color:#fff;border-color:#075e54}.slt-progress li[data-done=true] span{color:var(--accent);background:var(--wash)}
.slt-action{min-width:0;padding:clamp(15px,2.2cqw,35px);border:1px solid var(--line);border-top:3px solid var(--accent);border-radius:3px 3px 12px 12px;background:var(--sheet)}
.slt-action h3{font-size:clamp(23px,2.3cqw,36px);max-width:30ch}.slt-action>p{margin-bottom:10px}.slt-action .slt-filters{align-items:start}.slt-action .slt-field{flex:1 1 150px}
.slt-citation{position:relative;border-left:4px solid var(--aqua);background:linear-gradient(110deg,#133a46,var(--deep));color:var(--ice);padding:clamp(13px,1.6cqw,23px);margin:14px 0;border-radius:2px 8px 8px 2px}
.slt-citation .slt-index{color:var(--aqua)}.slt-citation>strong{display:block;font-weight:600;font-size:clamp(18px,1.65cqw,26px);letter-spacing:-.025em;line-height:1.25;margin:6px 0}
.slt-citation>p:not(.slt-index){color:#c9dce2;font-size:13px}.slt-citation .slt-stamp{margin:6px 0 0}.slt-action .slt-foot{border-top:1px solid var(--line);padding-top:13px;justify-content:space-between}
.slt-root .slt-facts{display:grid;grid-template-columns:minmax(7rem,max-content) 1fr;column-gap:20px;margin:14px 0}
.slt-facts dt,.slt-facts dd{padding:7px 0;border-bottom:1px solid var(--faint)}.slt-facts dt{color:var(--muted);font-size:14px}.slt-facts dd{overflow-wrap:anywhere;font-weight:550;font-size:15px}
.slt-check{display:flex;align-items:center;gap:8px}.slt-check input{width:17px;height:17px;accent-color:var(--accent)}
.slt-checkpoint{margin:0;border-radius:2px 10px 10px 2px}.slt-checkpoint>div{border-top:1px solid var(--line);padding-top:9px}.slt-checkpoint strong{font-size:15px;font-weight:600}
.slt-register-area{padding:16px 0 0}.slt-register-area>p:not(.slt-index){font-size:14px;color:var(--muted)}.slt-root .slt-register{display:block;width:100%;padding:11px 12px;text-align:left;margin:10px 0 0;border-left:3px solid var(--accent)}.slt-register small{display:block;color:var(--muted);margin-top:3px;font-weight:400}
.slt-status{display:flex;gap:9px;align-items:center;color:var(--accent);font-size:13px;font-weight:600}.slt-status i{font-style:normal}.slt-status b{margin-left:auto;font-variant-numeric:tabular-nums;letter-spacing:.05em}
.slt-outcome{font-size:14px;color:var(--muted)}.slt-inline .slt-action-review>.slt-heading{margin-top:0}.slt-inline .slt-action{padding:11px 0 0;border:0;border-top:2px solid var(--accent)}.slt-inline .slt-action-intro{font-size:13px;margin:6px 0 10px}
.slt-inline .slt-citation{padding:10px 12px;margin:9px 0}.slt-inline .slt-action .slt-foot{margin-top:8px;padding-top:8px}.slt-inline .slt-action-review>.slt-heading{margin-bottom:9px}

.slt-bullets,.slt-bridge{background:var(--wash);border-top:2px solid var(--accent);padding:clamp(12px,2cqw,23px)}
.slt-root .slt-bullet{display:grid;grid-template-columns:5.2em minmax(0,1fr) 4.5em;align-items:center;width:100%;gap:8px;border:0;border-bottom:1px solid var(--line);border-radius:0;background:transparent;padding:14px 0;text-align:left}
.slt-bullet[aria-pressed=true] strong{text-decoration:underline;text-underline-offset:3px}.slt-bullet>span:last-child{text-align:right;font-variant-numeric:tabular-nums}.slt-rail{height:9px}.slt-bullets .slt-note{margin-top:12px}
.slt-bridge svg{margin-top:7px}.slt-chart-label{font:600 12px 'Segoe UI',sans-serif;fill:var(--ink);stroke:var(--wash);stroke-width:3;paint-order:stroke}
.slt-axis,.slt-connector{stroke:var(--muted);stroke-width:1}.slt-target{stroke:var(--muted);stroke-dasharray:3 4;stroke-width:1.4}.slt-step[role=button]{cursor:pointer}
.slt-step .stock{fill:#638bac}.slt-step .add{fill:#38a28a}.slt-step .sub{fill:#a2769c}.slt-step.active rect{stroke:var(--ink);stroke-width:2.5}
.slt-root .slt-market-read{padding:7px 0;margin:5px 0;font-size:14px}
@container(max-width:760px){
  .slt-mast,.slt-focusmast{grid-template-columns:minmax(0,1fr);gap:14px}.slt-mast h2 br{display:none}.slt-edition{display:grid;grid-template-columns:minmax(0,1fr) minmax(100px,.7fr);align-items:center;gap:2px 12px}
  .slt-quarter-top{grid-column:1/-1}.slt-pace{grid-column:1;margin:0}.slt-edition>p{grid-column:2;grid-row:2}.slt-pace-line{grid-column:1/-1;grid-row:3}
  .slt-mapspread{grid-template-columns:minmax(0,1fr)}.slt-ranking{border-left:0;border-top:1px solid var(--rule)}.slt-atlas svg{max-height:275px}.slt-marker text{font-size:21px}
  .slt-plates{grid-template-columns:minmax(0,1fr)}.slt-desk-note{max-width:60ch}.slt-lead-spread{grid-template-columns:minmax(0,1fr);grid-template-areas:'plot' 'margin' 'ledger';gap:16px}
  .slt-lead-margin{display:grid;grid-template-columns:1fr 1fr;gap:13px}.slt-follow-note{margin:0}.slt-compare{border:0;padding:0}
}
@container(max-width:620px){
  .slt-spread{grid-template-columns:minmax(0,1fr);gap:16px}.slt-margin{border-left:0;border-top:1px solid var(--line);padding:14px 0}
  .slt-lead-margin{grid-template-columns:minmax(0,1fr)}.slt-follow-note{padding:14px}.slt-action-band{grid-template-columns:1fr}.slt-action-band>div+div{padding:10px 0 0;border:0;border-top:1px solid var(--line)}
}
@container(max-width:500px){
  .slt-map-answer{grid-template-columns:1fr;gap:8px}.slt-map-aside .slt-index,.slt-map-aside h3{display:inline-block;margin:0 8px 0 0}.slt-map-aside h3{font-size:17px}.slt-map-aside p{font-size:13px}.slt-map-aside .slt-foot{margin:0}
  .slt-mast{padding:18px 0 14px}.slt-mast h2{font-size:clamp(36px,10.8cqw,48px)}.slt-mast .slt-lede{margin-top:9px;font-size:15px}.slt-edition{padding-left:10px}
  .slt-pace{flex-direction:column;align-items:start;gap:0}.slt-pace span{font-size:12px}.slt-marker text{font-size:26px}
  .slt-folio{font-size:9px;gap:3px 7px}.slt-folio span{gap:6px}.slt-folio i{width:16px}.slt-atlas h3{font-size:24px}
  .slt-root .slt-filters{gap:7px 9px}.slt-filters .slt-field{flex:1 1 98px}.slt-field select{width:100%}.slt-root .slt-stamp span{padding:0 1px}
  .slt-flow text{font-size:11px}.slt-stages{font-size:9px}.slt-focusmast{padding:16px 0 0}.slt-focusmast .slt-desk-note{font-size:14px}
  .slt-progress li{font-size:11px;gap:4px}.slt-progress li span{width:18px;height:18px;font-size:9px}.slt-facts dt,.slt-facts dd{padding:5px 0}
  .slt-root .slt-facts{grid-template-columns:minmax(75px,.75fr) minmax(0,1.25fr);column-gap:10px}
  .slt-root table{font-size:12px}.slt-root th,.slt-root td{padding:6px 2px}.slt-readout>span{font-size:15px}.slt-root .slt-rank-row{font-size:13px}
}
@container(max-width:335px){
  .slt-inline .slt-mapcompact .slt-atlas,.slt-inline .slt-bridge{padding-block:9px}
  .slt-inline .slt-map-key{gap:2px 8px;font-size:12px}.slt-inline .slt-action-review h3{max-width:none}
  .slt-inline .slt-bridge .slt-index{letter-spacing:.075em}
}
@media(forced-colors:active){
  .slt-ribbon{fill:CanvasText!important;stroke:Canvas}.slt-ribbon.chosen{fill:Highlight!important;stroke:Highlight}.slt-flow text,.slt-chart-label,.slt-marker text{fill:CanvasText;stroke:Canvas}
  .slt-node,.slt-marker .above,.slt-marker .below{fill:CanvasText}.slt-land{fill:Canvas;stroke:GrayText}.slt-marker .slt-ring,.slt-step.active rect{stroke:Highlight}
  .slt-meter i,.slt-rail i,.slt-diverge i{background:Highlight}.slt-rail b{background:CanvasText}
}
`;
