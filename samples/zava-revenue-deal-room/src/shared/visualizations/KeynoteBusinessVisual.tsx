import * as React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import { scaleLinear } from 'd3-scale';
import { arc, area, line, pie, type PieArcDatum } from 'd3-shape';
import { PERSONA_MEDIA } from '../media';
import type { IBusinessVisualItem, IBusinessVisualModel } from '../businessVisualModel';

const useStyles = makeStyles({
  root: { minWidth: 0, margin: 0 },
  svg: { width: '100%', display: 'block', overflow: 'visible', '& [role="button"]': { cursor: 'pointer' }, '& [role="button"]:focus-visible': { outline: `2px solid ${tokens.colorBrandStroke1}` }, '@media (forced-colors: active)': { '& path, & line': { stroke: 'CanvasText' }, '& rect, & circle': { stroke: 'CanvasText' } } },
  text: { fill: tokens.colorNeutralForeground1, fontSize: '12px' },
  muted: { fill: tokens.colorNeutralForeground2, fontSize: '11px' },
  caption: { color: tokens.colorNeutralForeground2, fontSize: tokens.fontSizeBase200, lineHeight: tokens.lineHeightBase200, marginTop: '4px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px', minWidth: 0 },
  tile: { padding: '8px', border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusMedium, backgroundColor: tokens.colorNeutralBackground1, minWidth: 0, overflowWrap: 'anywhere' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: tokens.fontSizeBase200, '& td, & th': { padding: '7px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, textAlign: 'left' } },
  badge: { display: 'inline-block', padding: '2px 6px', borderRadius: tokens.borderRadiusMedium, backgroundColor: tokens.colorBrandBackground2, fontWeight: tokens.fontWeightSemibold },
  value: { color: tokens.colorBrandForeground1, fontSize: tokens.fontSizeBase400, fontWeight: tokens.fontWeightSemibold }
});
const abbreviated = (text: string, characters: number): string => text.length > characters ? `${text.slice(0, Math.max(3, characters - 3))}...` : text;
const money = (value: number): string => `${value < 0 ? '-' : ''}$${Math.abs(value) >= 1000000 ? `${(Math.abs(value) / 1000000).toFixed(2)}M` : `${Math.round(Math.abs(value) / 1000)}k`}`;
const statusColor = (state: string): string => ['verified', 'complete', 'champion', 'some verified proof'].indexOf(state) >= 0 ? tokens.colorPaletteGreenBackground3 :
  ['blocked', 'contrary', 'missing'].indexOf(state) >= 0 ? tokens.colorPaletteRedBackground3 :
    ['stale', 'at-risk', 'unconfirmed'].indexOf(state) >= 0 ? tokens.colorPaletteMarigoldBackground3 : tokens.colorBrandBackground;
const numericValue = (item: IBusinessVisualItem): number => {
  if (typeof item.value !== 'number' || !Number.isFinite(item.value)) throw new Error(`Missing business chart value: ${item.id}`);
  return item.value;
};
const numericPosition = (item: IBusinessVisualItem): number => {
  if (typeof item.days !== 'number' || !Number.isFinite(item.days)) throw new Error(`Missing business chart position: ${item.id}`);
  return item.days;
};

export default function KeynoteBusinessVisual(props: {
  readonly model: IBusinessVisualModel;
  readonly onSelect?: (id: string) => void;
}): React.ReactElement {
  const styles = useStyles();
  const container = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(640);
  const titleId = React.useId();
  React.useEffect(() => {
    const element = container.current;
    if (!element) return;
    const measure = (): void => { if (element.clientWidth > 0) setWidth(element.clientWidth); };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const model = props.model;
  const x = (logical: number): number => logical / 500 * width;
  const controls = (item: IBusinessVisualItem): React.SVGProps<SVGGElement> => {
    const select = props.onSelect;
    return select ? {
      role: 'button', tabIndex: 0, 'aria-label': `Inspect ${item.id}`,
      onClick: () => select(item.id),
      onKeyDown: event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(item.id); } }
    } : {};
  };
  const hit = (left: number, top: number, w: number, h: number): React.ReactElement => <rect x={left} y={top} width={w} height={h} fill="transparent" pointerEvents="all" data-svg-hit-target="true"/>;
  const tooltip = (item: IBusinessVisualItem): React.ReactElement => <title>{item.label}: {item.detail} / {item.source}</title>;
  const wrap = (children: React.ReactNode, height = 164): React.ReactElement => <svg className={styles.svg} style={{ height }} viewBox={`0 0 ${width} ${height}`} role={props.onSelect ? 'group' : 'img'} aria-labelledby={titleId} data-business-visual={model.kind}><title id={titleId}>{model.title}</title><desc>{model.semantics}</desc>{children}</svg>;
  if (model.errors.length) return <p role="alert" className={styles.caption}>{model.errors.join(' ')}</p>;
  if (!model.items.length) return <figure className={styles.root} data-business-kind={model.kind}><p role="status">No recorded data supports this view in the requested scope. No default was substituted.</p><figcaption className={styles.caption}>{model.semantics}</figcaption></figure>;
  let visual: React.ReactNode;
  switch (model.kind) {
    case 'account-growth-footprint': {
      const total = model.items.reduce((sum, item) => sum + numericValue(item), 0);
      let offset = 4;
      visual = wrap(model.items.map(item => {
        const size = total ? (width - 8) * numericValue(item) / total : 0;
        const left = offset; offset += size;
        return <g key={item.id} {...controls(item)}>{tooltip(item)}<rect x={left} y="12" width={Math.max(1, size - 4)} height="118" rx="8" fill={item.state === 'Commit' ? tokens.colorPaletteGreenBackground3 : tokens.colorBrandBackground2} stroke={tokens.colorBrandStroke1}/>{props.onSelect && hit(left, 12, Math.max(1, size - 4), 118)}{size > 70 && <><text x={left + 10} y="42" className={styles.text}>{abbreviated(item.label, Math.floor((size - 20) / 7))}</text><text x={left + 10} y="69" className={styles.text} fontWeight="700">{money(numericValue(item))}</text><text x={left + 10} y="99" className={styles.muted}>{item.state}</text></>}</g>;
      }));
      break;
    }
    case 'buyer-relationship-network': {
      visual = wrap(<>
        <rect x={x(186)} y="82" width={x(128)} height="26" rx="7" fill={tokens.colorBrandBackground2} stroke={tokens.colorBrandStroke1}/><text x={x(250)} y="100" textAnchor="middle" className={styles.text}>Decision roles</text>
        {model.items.map((item, index) => {
          const px = x([60, 250, 440, 60, 250, 440][index]); const py = [50, 24, 50, 155, 181, 155][index];
          const radius = 18 + (numericValue(item) - 55) / 9;
          const portrait = PERSONA_MEDIA[item.label];
          const clip = `${titleId.replace(/:/g, '')}-buyer-${index}`;
          const nameY = py + (index < 3 ? 29 : -43);
          const roleY = py + (index < 3 ? 44 : -28);
          return <g key={item.id}><line aria-hidden="true" pointerEvents="none" x1={x(250)} y1="95" x2={px} y2={py} stroke={tokens.colorNeutralStroke1} strokeDasharray={item.owner === 'Economic buyer' ? '4 4' : undefined}/><g {...controls(item)}>{tooltip(item)}<circle cx={px} cy={py} r={radius + 2} fill={statusColor(item.state)}/>{portrait ? <><defs><clipPath id={clip}><circle cx={px} cy={py} r="16"/></clipPath></defs><image href={portrait.src} x={px - 16} y={py - 16} width="32" height="32" clipPath={`url(#${clip})`}/></> : <text x={px} y={py + 4} textAnchor="middle" fill={tokens.colorNeutralForegroundOnBrand} fontSize="11">{item.label.split(' ').map(part => part[0]).slice(0, 2).join('')}</text>}{props.onSelect && hit(px - 56, Math.max(0, Math.min(py - 26, nameY - 13)), 112, index < 3 ? 76 : 82)}<text x={px} y={nameY} textAnchor="middle" className={styles.text}>{abbreviated(item.label, width < 480 ? 12 : 19)}</text><text x={px} y={roleY} textAnchor="middle" className={styles.muted}>{abbreviated(item.owner || '', width < 480 ? 12 : 24)} / {numericValue(item)}</text></g></g>;
        })}
      </>, 220);
      break;
    }
    case 'signature-blocker-network':
      visual = wrap(model.items.map((item, index) => <g key={item.id} {...controls(item)}>{tooltip(item)}<rect x="4" y={6 + index * 38} width={x(230)} height="29" rx="6" fill={statusColor(item.state)} opacity=".18"/><rect x="4" y={6 + index * 38} width="5" height="29" rx="2" fill={statusColor(item.state)}/><text x="14" y={25 + index * 38} className={styles.text}>{abbreviated(item.label, width < 480 ? 19 : 29)}</text><path d={`M${x(234)},${20 + index * 38} C${x(260)},${20 + index * 38} ${x(270)},${20 + index * 38} ${x(296)},${20 + index * 38}`} fill="none" stroke={statusColor(item.state)} strokeWidth="2"/><rect x={x(298)} y={6 + index * 38} width={x(194)} height="29" rx="6" fill={tokens.colorNeutralBackground2}/><text x={x(309)} y={25 + index * 38} className={styles.text}>{item.days === undefined ? 'Judgment / not a gate' : `+${item.days}d checkpoint`}</text>{props.onSelect && hit(0, 4 + index * 38, width, 34)}</g>), Math.max(96, model.items.length * 38 + 8));
      break;
    case 'meeting-agenda-clock': {
      const sectors = pie<IBusinessVisualItem>().value(numericValue).sort(null)([...model.items]);
      const draw = arc<PieArcDatum<IBusinessVisualItem>>().innerRadius(22).outerRadius(65).padAngle(.035);
      const colors = [tokens.colorBrandBackground, tokens.colorPaletteMarigoldBackground3, tokens.colorPaletteBlueForeground2];
      visual = wrap(<><g transform={`translate(${x(108)},82)`}>{sectors.map((sector, index) => <path key={sector.data.id} d={draw(sector) || undefined} fill={colors[index]}/>) }<text x="0" y="3" textAnchor="middle" className={styles.text} fontWeight="700">30m</text></g>{model.items.map((item, index) => <g key={item.id}>{tooltip(item)}<circle cx={x(222)} cy={36 + index * 43} r="5" fill={colors[index]}/><text x={x(235)} y={40 + index * 43} className={styles.text}>{abbreviated(item.label, width < 480 ? 19 : 28)}</text><text x={x(235)} y={58 + index * 43} className={styles.muted}>{item.value} proposed minutes</text></g>)}</>);
      break;
    }
    case 'mutual-dependency-plan':
      visual = wrap(<><text x="5" y="20" className={styles.muted}>Draft target and customer-owned dependencies</text>{model.items.map((item, index) => {
        const px = x(44 + index * 136);
        return <g key={item.id}>{tooltip(item)}{index > 0 && <path d={`M${x(44 + (index - 1) * 136) + 25},70 H${px - 25}`} fill="none" stroke={tokens.colorBrandStroke1} strokeWidth="3" strokeDasharray={item.state === 'proposal' ? '4 3' : undefined}/>}<rect x={px - 26} y="44" width="52" height="52" rx="9" fill={statusColor(item.state)} opacity=".24"/><text x={px} y="76" textAnchor="middle" className={styles.text} fontWeight="700">+{item.days}d</text><text x={px} y="117" textAnchor="middle" className={styles.text}>{item.label}</text><text x={px} y="137" textAnchor="middle" className={styles.muted}>{item.state}</text></g>;
      })}</>);
      break;
    case 'meeting-claim-reconciliation':
      visual = <table className={styles.table} data-business-visual={model.kind}><caption>{model.title}</caption><thead><tr><th>Proposed claim</th><th>Buyer source</th><th>Support</th></tr></thead><tbody>{model.items.map(item => <tr key={item.id}><th>{item.label}</th><td>{item.source}</td><td><span className={styles.badge}>{item.state === 'verified' ? 'Supported' : 'Unknown'}</span></td></tr>)}</tbody></table>;
      break;
    case 'requirement-proof-trace':
      visual = wrap(model.items.map((item, index) => <g key={item.id}>{tooltip(item)}<rect x={x(8 + index * 166)} y={index === 0 ? 28 : 51} width={x(150)} height="83" rx="8" fill={tokens.colorBrandBackground2} stroke={statusColor(item.state)}/><text x={x(83 + index * 166)} y={index === 0 ? 54 : 77} textAnchor="middle" className={styles.text}>{abbreviated(item.label, width < 480 ? 14 : 22)}</text><text x={x(83 + index * 166)} y={index === 0 ? 77 : 100} textAnchor="middle" className={styles.muted}>{item.state}</text><text x={x(83 + index * 166)} y={index === 0 ? 98 : 122} textAnchor="middle" className={styles.muted}>{abbreviated(item.detail, width < 480 ? 16 : 27)}</text>{index < 2 && <path d={`M${x(158 + index * 166)},77 H${x(173 + index * 166)}`} stroke={tokens.colorBrandStroke1} strokeWidth="2" strokeDasharray="4 3"/>}</g>));
      break;
    case 'working-capital-runway': {
      const requested = model.items[1]?.days;
      const end = Math.max(90, requested || 30);
      const position = scaleLinear().domain([0, end]).range([x(25), x(472)]);
      visual = wrap(<><text x="5" y="22" className={styles.text}>{model.metrics[0]?.display} incremental exposure</text><line x1={position(0)} x2={position(end)} y1="82" y2="82" stroke={tokens.colorNeutralStroke1} strokeWidth="6"/>{requested !== undefined && requested > 30 && <rect x={position(30)} y="58" width={position(requested) - position(30)} height="48" fill={tokens.colorPaletteMarigoldBackground3} opacity=".5"/>}{model.items.map(item => item.days !== undefined && <g key={item.id}>{tooltip(item)}<line x1={position(item.days)} x2={position(item.days)} y1="48" y2="116" stroke={statusColor(item.state)} strokeWidth="3"/><text x={position(item.days)} y={item.id === 'policy' ? 42 : 138} textAnchor="middle" className={styles.text}>{item.label} / {item.days}d</text></g>)}</>);
      break;
    }
    case 'forecast-buyer-proof-funnel':
      visual = wrap(<><path d={`M${x(12)},28 H${x(245)} L${x(210)},145 H${x(47)} Z`} fill={tokens.colorBrandBackground2} stroke={tokens.colorBrandStroke1}/><text x={x(128)} y="66" textAnchor="middle" className={styles.text}>Seller-weighted</text><text x={x(128)} y="92" textAnchor="middle" className={styles.text} fontWeight="700">{model.metrics[0]?.display}</text>{model.items.map((item, index) => <g key={item.id}>{tooltip(item)}<circle cx={x(288)} cy={39 + index * 43} r="8" fill={statusColor(item.state)}/><text x={x(308)} y={44 + index * 43} className={styles.text}>{abbreviated(item.label, width < 480 ? 18 : 28)}</text><text x={x(308)} y={61 + index * 43} className={styles.muted}>{item.state}</text></g>)}</>);
      break;
    case 'strategy-choice-canvas':
      visual = wrap(model.items.map((item, index) => <g key={item.id} {...controls(item)}>{tooltip(item)}<path d={`M${x(10 + index * 165)},${25 + index * 9} H${x(157 + index * 165)} V${128 + index * 9} H${x(10 + index * 165)} Z`} fill={tokens.colorNeutralBackground2} stroke={statusColor(item.state)} strokeWidth="2"/><text x={x(83 + index * 165)} y={52 + index * 9} textAnchor="middle" className={styles.text}>Play {index + 1}</text><text x={x(83 + index * 165)} y={81 + index * 9} textAnchor="middle" className={styles.text}>{['Access', 'Proof', 'Value'][index]}</text><text x={x(83 + index * 165)} y={106 + index * 9} textAnchor="middle" className={styles.muted}>{item.state}</text>{props.onSelect && hit(x(10 + index * 165), 25 + index * 9, x(147), 103)}</g>));
      break;
    case 'executive-introduction-path':
      visual = wrap(<><text x="5" y="16" className={styles.text}>Purpose: {abbreviated(model.metrics[0]?.display || 'Enter objective', width < 480 ? 38 : 74)}</text><path d={`M${x(77)},77 H${x(423)}`} stroke={tokens.colorPaletteBlueForeground2} strokeWidth="3" strokeDasharray="6 4"/>{model.items.map((item, index) => {
        const px = x(77 + index * 173); const portrait = PERSONA_MEDIA[item.label];
        const clip = `${titleId.replace(/:/g, '')}-executive-${index}`;
        return <g key={item.id}>{tooltip(item)}<circle cx={px} cy="77" r="28" fill={tokens.colorBrandBackground2} stroke={tokens.colorBrandStroke1}/>{portrait && <><defs><clipPath id={clip}><circle cx={px} cy="77" r="21"/></clipPath></defs><image href={portrait.src} x={px - 21} y="56" width="42" height="42" clipPath={`url(#${clip})`}/></>}<text x={px} y="34" textAnchor="middle" className={styles.muted}>{abbreviated(item.owner || '', width < 480 ? 16 : 22)}</text><text x={px} y="126" textAnchor="middle" className={styles.text}>{abbreviated(item.label, width < 480 ? 15 : 22)}</text><text x={px} y="146" textAnchor="middle" className={styles.muted}>{item.state}</text></g>;
      })}</>);
      break;
    case 'commitment-owner-board':
      visual = <div className={styles.grid} data-business-visual={model.kind}>{model.items.map(item => <button type="button" key={item.id} className={styles.tile} onClick={() => props.onSelect?.(item.id)} disabled={!props.onSelect} aria-label={`Inspect ${item.id}`}><span className={styles.badge}>{item.value === 0 ? 'Buyer-owned' : 'Seller-owned'}</span><strong style={{ display: 'block', marginTop: '6px' }}>{abbreviated(item.label, 42)}</strong><span>{item.owner}</span><span style={{ display: 'block', color: statusColor(item.state) }}>{item.state} / {item.days !== undefined && item.days >= 0 ? '+' : ''}{item.days}d</span></button>)}</div>;
      break;
    case 'customer-payback-timeline': {
      const values = model.items.map(numericValue);
      const sx = scaleLinear().domain([0, 12]).range([x(28), x(476)]);
      const sy = scaleLinear().domain([Math.min(...values, 0), Math.max(...values, 1)]).range([137, 25]);
      const curve = line<IBusinessVisualItem>().x(item => sx(numericPosition(item))).y(item => sy(numericValue(item)));
      const field = area<IBusinessVisualItem>().x(item => sx(numericPosition(item))).y0(sy(0)).y1(item => sy(numericValue(item)));
      const payback = model.metrics.find(item => item.label === 'Payback')?.value;
      visual = wrap(<><line x1={sx(0)} x2={sx(12)} y1={sy(0)} y2={sy(0)} stroke={tokens.colorNeutralStroke1} strokeDasharray="3 3"/><path d={field([...model.items]) || undefined} fill={tokens.colorPaletteGreenBackground3} opacity=".3"/><path d={curve([...model.items]) || undefined} fill="none" stroke={tokens.colorBrandForeground1} strokeWidth="3"/>{payback !== undefined && payback !== null && payback <= 12 && <g><line x1={sx(payback)} x2={sx(payback)} y1="22" y2="139" stroke={tokens.colorPaletteMarigoldBorderActive} strokeDasharray="4 3"/><text x={sx(payback)} y="18" textAnchor="middle" className={styles.text}>{payback.toFixed(1)}m payback</text></g>}{model.items.map(item => <g key={item.id}>{tooltip(item)}<circle cx={sx(numericPosition(item))} cy={sy(numericValue(item))} r="4" fill={tokens.colorBrandBackground}/><text x={sx(numericPosition(item))} y="157" textAnchor="middle" className={styles.muted}>{item.label}</text>{numericPosition(item) === 0 && <text x={sx(0) + 6} y={sy(numericValue(item)) - 8} className={styles.text}>{money(numericValue(item))} initial investment</text>}{numericPosition(item) === 12 && <text x={sx(12) - 6} y={sy(numericValue(item)) + (numericValue(item) < 0 ? -10 : 18)} textAnchor="end" className={styles.text}>{money(numericValue(item))} year-one net</text>}</g>)}<text x={sx(0)} y="17" className={styles.muted}>Annual {model.metrics[0]?.display}</text></>);
      break;
    }
    case 'proposal-release-controls':
      visual = <div data-business-visual={model.kind}><p className={styles.caption}>Proposed disposition: <strong>{model.metrics[1]?.display}</strong></p>{model.items.map((item, index) => <div key={item.id} className={styles.tile} style={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr) auto', gap: '8px', marginBottom: '6px', alignItems: 'center' }}><span className={styles.badge}>{index + 1}</span><div><strong>{item.label}</strong><small style={{ display: 'block' }}>{item.source}</small></div><span style={{ color: statusColor(item.state), fontWeight: 600 }}>{item.state === 'verified' ? 'Passed' : 'Blocked'}</span></div>)}</div>;
      break;
    case 'success-outcome-canvas':
      visual = <div className={styles.grid} data-business-visual={model.kind}>{model.items.map((item, index) => <div key={item.id} className={styles.tile}><span className={styles.badge}>{index + 1} / {item.label}</span><p title={item.detail} style={{ margin: '5px 0' }}>{abbreviated(item.detail, 74)}</p><small>{item.state} / full value in the form</small></div>)}</div>;
      break;
    case 'business-capability-map':
      visual = <div className={styles.grid} data-business-visual={model.kind}>{model.items.map(item => <div key={item.id} className={styles.tile}><span className={styles.value}>{item.value}</span><strong style={{ display: 'block' }}>{item.label}</strong><small>registered matching operations</small></div>)}</div>;
      break;
    case 'pipeline-health-matrix':
      visual = <table className={styles.table} data-business-visual={model.kind}><caption>{model.title}</caption><thead><tr><th>Stage</th><th>Deals</th><th>Buyer proof</th><th>Open value</th></tr></thead><tbody>{model.items.map(item => <tr key={item.id}><th>{item.label}</th><td>{item.value}</td><td style={{ backgroundColor: item.secondary ? tokens.colorPaletteGreenBackground1 : tokens.colorNeutralBackground2 }}>{item.secondary} with verified evidence</td><td>{item.detail}</td></tr>)}</tbody></table>;
      break;
    case 'country-opportunity-footprint':
      throw new Error('Country opportunity graphics must use the country map experience, not a generic fallback.');
    default: {
      const unhandled: never = model.kind;
      throw new Error(`Unhandled business visual: ${unhandled}`);
    }
  }
  const rationale = model.semantics.split('. ')[0];
  return <figure className={styles.root} data-business-kind={model.kind}><div ref={container}>{visual}</div><figcaption className={styles.caption}>{abbreviated(rationale, 220)}.{rationale.length > 220 && ' Full rationale is retained in the draft/model context.'}</figcaption></figure>;
}
