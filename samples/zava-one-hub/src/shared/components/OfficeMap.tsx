import * as React from 'react';
import { geoGraticule10, geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import type { GeometryObject, Topology } from 'topojson-specification';
import worldTopologyJson from 'world-atlas/countries-110m.json';
import { Button, makeStyles, tokens } from '@fluentui/react-components';
import { Location24Filled } from '@fluentui/react-icons';
import { formatOfficeTime, OFFICE_DEMO_INSTANT } from '../utils/officeTime';
import { EVERGREEN_NOW, formatDate } from '../utils/evergreenDates';

const offices = [
  { id: 'los-angeles', name: 'Los Angeles', region: 'North America', timeZone: 'America/Los_Angeles', coordinates: [-118.2437, 34.0522] as [number, number], detail: 'Customer studio / 555 Flower Street', people: 420, status: 'Open', amenities: 'Visitor center / Studio / Café' },
  { id: 'new-york', name: 'New York', region: 'North America', timeZone: 'America/New_York', coordinates: [-74.006, 40.7128] as [number, number], detail: 'Commercial hub / 11 Madison Avenue', people: 610, status: 'Open', amenities: 'Customer rooms / Wellness / Café' },
  { id: 'london', name: 'London', region: 'Europe', timeZone: 'Europe/London', coordinates: [-0.1276, 51.5072] as [number, number], detail: 'EMEA operations / 2 Kingdom Street', people: 530, status: 'Open', amenities: 'Town hall / Quiet floor / Café' },
  { id: 'helsinki', name: 'Helsinki', region: 'Europe', timeZone: 'Europe/Helsinki', coordinates: [24.9384, 60.1699] as [number, number], detail: 'Accessibility innovation lab / Aleksanterinkatu 15', people: 280, status: 'Tours Thursday', amenities: 'Innovation lab / Sauna / Café' },
  { id: 'singapore', name: 'Singapore', region: 'Asia Pacific', timeZone: 'Asia/Singapore', coordinates: [103.8198, 1.3521] as [number, number], detail: 'Customer support hub / Marina Boulevard', people: 360, status: 'Closed now', amenities: 'Support floor / Prayer room / Food hall' }
];

const worldTopology = worldTopologyJson as unknown as Topology;
const countryGeometry = worldTopology.objects.countries as GeometryObject;
const worldCountries = feature(worldTopology, countryGeometry);
const countryBorders = mesh(worldTopology, countryGeometry, (left, right) => left !== right);

const useStyles = makeStyles({
  root: { display: 'grid', gap: tokens.spacingVerticalM },
  map: { width: '100%', height: 'auto', minHeight: '260px', color: tokens.colorBrandForeground1, backgroundColor: '#eef5f7', borderRadius: tokens.borderRadiusLarge },
  ocean: { fill: '#eef5f7' },
  land: { fill: '#d3dfd7', stroke: 'none' },
  borders: { fill: 'none', stroke: '#93a9a1', strokeWidth: '.55px' },
  graticule: { fill: 'none', stroke: '#c7d8dc', strokeWidth: '.5px' },
  marker: { cursor: 'pointer', ':hover': { transform: 'scale(1.08)' }, ':focus-visible': { outline: `3px solid ${tokens.colorStrokeFocus2}` } },
  markerRing: { fill: 'rgba(255,255,255,.72)', stroke: tokens.colorPaletteRedBorderActive, strokeWidth: '1.5px' },
  markerCore: { fill: tokens.colorPaletteTealBackground2, stroke: '#ffffff', strokeWidth: '2px' },
  markerSelected: { fill: tokens.colorBrandBackground, strokeWidth: '4px' },
  markerDot: { fill: '#ffffff' },
  regionLabel: { fill: '#40545a', fontSize: '11px', fontWeight: tokens.fontWeightSemibold },
  officeList: { display: 'flex', gap: tokens.spacingHorizontalS, flexWrap: 'wrap' },
  detail: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: tokens.spacingHorizontalL, padding: tokens.spacingHorizontalL, backgroundColor: tokens.colorNeutralBackground2, borderLeft: `4px solid ${tokens.colorPaletteTealBorderActive}`, borderRadius: tokens.borderRadiusMedium, '@container zava-experience (max-width: 420px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
  detailCopy: { display: 'grid', gap: tokens.spacingVerticalXXS },
  detailMeta: { display: 'flex', gap: tokens.spacingHorizontalS, flexWrap: 'wrap', color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 },
  time: { fontSize: tokens.fontSizeHero700, lineHeight: tokens.lineHeightHero700, fontWeight: tokens.fontWeightSemibold }
});

export function OfficeMap(props: { instant?: Date }): React.ReactElement {
  const styles = useStyles();
  const [selectedId, setSelectedId] = React.useState<string>('helsinki');
  const selected = offices.find((office) => office.id === selectedId) || offices[1];
  const instant = props.instant || OFFICE_DEMO_INSTANT;
  const selectedTime = formatOfficeTime(instant, selected.timeZone);
  const projection = geoNaturalEarth1().fitExtent([[12, 12], [708, 348]], worldCountries);
  const path = geoPath(projection);
  const countryPath = path(worldCountries) || '';
  const borderPath = path(countryBorders) || '';
  const regionLabels = [{ name: 'North America', coordinates: [-100, 53] as [number, number] }, { name: 'Europe', coordinates: [12, 51] as [number, number] }, { name: 'Asia Pacific', coordinates: [110, 20] as [number, number] }];

  return (
    <div className={styles.root}>
      <svg className={styles.map} viewBox="0 0 720 360" role="img" aria-labelledby="office-map-title office-map-desc">
        <title id="office-map-title">Zava office world map</title>
        <desc id="office-map-desc">Select Los Angeles, New York, London, Helsinki, or Singapore. The office buttons below provide equivalent keyboard access.</desc>
        <rect className={styles.ocean} width="720" height="360" />
        <path className={styles.graticule} d={path(geoGraticule10()) || undefined} />
        <path className={styles.land} d={countryPath} />
        <path className={styles.borders} d={borderPath} />
        {regionLabels.map((region) => { const point = projection(region.coordinates) || [0, 0]; return <text key={region.name} className={styles.regionLabel} x={point[0]} y={point[1]} textAnchor="middle">{region.name}</text>; })}
        {offices.map((office) => {
          const point = projection(office.coordinates) || [0, 0];
          const radius = 7 + Math.sqrt(office.people) / 10;
          const officeTime = formatOfficeTime(instant, office.timeZone);
          return <g key={office.id} className={styles.marker} transform={`translate(${point[0]} ${point[1]})`} role="button" tabIndex={0} aria-label={`${office.name}, ${officeTime}, ${office.people} employees, ${office.status}`} onClick={() => setSelectedId(office.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedId(office.id); } }}><circle className={styles.markerRing} r={radius + 4} /><circle className={office.id === selectedId ? `${styles.markerCore} ${styles.markerSelected}` : styles.markerCore} r={radius} /><circle className={styles.markerDot} r="2.2" /></g>;
        })}
      </svg>
      <div className={styles.officeList} role="group" aria-label="Choose a Zava office">
        {offices.map((office) => <Button key={office.id} appearance={office.id === selectedId ? 'primary' : 'secondary'} icon={<Location24Filled />} onClick={() => setSelectedId(office.id)}>{office.name}</Button>)}
      </div>
      <div className={styles.detail} role="status">
        <div className={styles.detailCopy}><strong>{selected.name}</strong><span>{selected.detail}</span><span>{selected.amenities}</span><span className={styles.detailMeta}><span>{selected.region}</span><span>{selected.people} employees</span><span>{selected.status}</span><span>Reviewed {formatDate(EVERGREEN_NOW, { month: 'long', year: 'numeric' })}</span></span></div>
        <time className={styles.time} dateTime={instant.toISOString()}>{selectedTime}</time>
      </div>
    </div>
  );
}