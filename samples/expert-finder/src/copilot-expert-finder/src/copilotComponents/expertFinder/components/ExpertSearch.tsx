import * as React from 'react';
import { Input, Select, Field, Button, makeStyles, tokens } from '@fluentui/react-components';
import { Search20Regular, FilterDismiss20Regular } from '@fluentui/react-icons';
import type { Expert } from '../models/Expert';
import { filterOptions, emptyFilters, type ExpertFilters } from '../utils/expertFilters';

const useStyles = makeStyles({
  toolbar: { display: 'grid', gridTemplateColumns: 'minmax(180px, 2fr) minmax(140px, 1fr) minmax(140px, 1fr) auto',
    gap: '16px', alignItems: 'end', padding: '24px 0', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    '@media (max-width: 900px)': { gridTemplateColumns: '1fr 1fr' },
    '@media (max-width: 500px)': { gridTemplateColumns: '1fr' } },
  clear: { minHeight: '32px', justifySelf: 'start' }
});

export function ExpertSearch({ experts, filters, onChange }: {
  experts: Expert[]; filters: ExpertFilters; onChange: (filters: ExpertFilters) => void;
}): React.ReactElement {
  const styles = useStyles();
  const departments = React.useMemo(() => filterOptions(experts.map(expert => expert.department)), [experts]);
  const roles = React.useMemo(() => filterOptions(experts.map(expert => expert.jobTitle)), [experts]);
  const active = !!(filters.name || filters.department || filters.role);
  return <div className={styles.toolbar} role="search" aria-label="Filter experts">
    <Field label="Search by name"><Input type="search" placeholder="Start typing a name…" contentBefore={<Search20Regular />}
      value={filters.name} onChange={(_, data) => onChange({ ...filters, name: data.value })} /></Field>
    <Field label="Department"><Select value={filters.department} onChange={(_, data) => onChange({ ...filters, department: data.value })}>
      <option value="">All departments</option>{departments.map(value => <option key={value} value={value}>{value}</option>)}
    </Select></Field>
    <Field label="Role"><Select value={filters.role} onChange={(_, data) => onChange({ ...filters, role: data.value })}>
      <option value="">All roles</option>{roles.map(value => <option key={value} value={value}>{value}</option>)}
    </Select></Field>
    <Button className={styles.clear} appearance="subtle" icon={<FilterDismiss20Regular />} disabled={!active} onClick={() => onChange({ ...emptyFilters })}>Clear filters</Button>
  </div>;
}
