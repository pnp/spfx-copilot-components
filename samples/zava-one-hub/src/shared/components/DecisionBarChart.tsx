import * as React from 'react';
import { max } from 'd3-array';
import { scaleBand, scaleLinear } from 'd3-scale';
import { makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  root: { display: 'grid', gap: tokens.spacingVerticalM },
  svg: { width: '100%', height: 'auto', minHeight: '220px', overflow: 'visible' },
  label: { fill: tokens.colorNeutralForeground1, fontSize: tokens.fontSizeBase200 },
  value: { fill: tokens.colorNeutralForeground2, fontSize: tokens.fontSizeBase200, fontWeight: tokens.fontWeightSemibold },
  bar: { fill: tokens.colorBrandBackground, cursor: 'pointer', ':hover': { fill: tokens.colorBrandBackgroundHover } },
  table: { width: '100%', borderCollapse: 'collapse' },
  cell: { padding: tokens.spacingHorizontalS, borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, textAlign: 'left' }
});

export interface IDecisionBarChartProps {
  labels: readonly string[];
  scope: string;
  onSelect: (index: number) => void;
}

export function DecisionBarChart(props: IDecisionBarChartProps): React.ReactElement {
  const styles = useStyles();
  const multiplier = props.scope === 'Today' ? 0.72 : props.scope === 'This week' ? 0.88 : 1;
  const data = props.labels.map((label, index) => ({
    label,
    value: Math.round((92 - index * 17) * multiplier)
  }));
  const width = 620;
  const height = Math.max(220, data.length * 58 + 36);
  const margin = { top: 12, right: 46, bottom: 12, left: 190 };
  const y = scaleBand<string>().domain(data.map((item) => item.label)).range([margin.top, height - margin.bottom]).padding(0.28);
  const x = scaleLinear().domain([0, max(data, (item) => item.value) || 100]).nice().range([margin.left, width - margin.right]);

  return (
    <figure className={styles.root} aria-label={`${props.scope} comparison`}>
      <svg className={styles.svg} viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="decision-chart-title">
        <title id="decision-chart-title">{props.scope} values for the selected business metric</title>
        {data.map((item, index) => {
          const barY = y(item.label) || 0;
          return (
            <g key={item.label} role="button" tabIndex={0} aria-label={`${item.label}: ${item.value}`} onClick={() => props.onSelect(index)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') props.onSelect(index); }}>
              <text className={styles.label} x={0} y={barY + y.bandwidth() / 2 + 4}>{item.label}</text>
              <rect className={styles.bar} x={margin.left} y={barY} width={Math.max(2, x(item.value) - margin.left)} height={y.bandwidth()} rx={4} />
              <text className={styles.value} x={x(item.value) + 8} y={barY + y.bandwidth() / 2 + 4}>{item.value}</text>
            </g>
          );
        })}
      </svg>
      <table className={styles.table}>
        <caption>Exact values for {props.scope.toLowerCase()}</caption>
        <thead><tr><th className={styles.cell}>Measure</th><th className={styles.cell}>Value</th></tr></thead>
        <tbody>{data.map((item) => <tr key={item.label}><td className={styles.cell}>{item.label}</td><td className={styles.cell}>{item.value}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}