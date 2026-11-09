import * as React from 'react';

import { Text } from '@fluentui/react-text';
import { makeStyles } from '@griffel/react';
import { tokens } from '@fluentui/react-theme';
import { ArrowLeft20Regular, CheckmarkCircle20Filled, Send20Regular, Warning20Regular } from '@fluentui/react-icons';

import { calculateBusinessDays } from './experienceCalculations';

type RequestStage = 'edit' | 'review' | 'submitted';

const useStyles = makeStyles({
  stack: { display: 'flex', flexDirection: 'column', gap: '12px' },
  form: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', '@media (max-width: 460px)': { gridTemplateColumns: '1fr' } },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  span: { gridColumn: '1 / -1' },
  input: { minWidth: 0, padding: '8px', color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusMedium },
  alert: { display: 'grid', gridTemplateColumns: '24px minmax(0, 1fr)', gap: '8px', padding: '10px', color: tokens.colorPaletteMarigoldForeground2, backgroundColor: tokens.colorPaletteMarigoldBackground2, borderRadius: tokens.borderRadiusMedium },
  summary: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', '@media (max-width: 420px)': { gridTemplateColumns: '1fr' } },
  summaryItem: { padding: '10px', backgroundColor: tokens.colorNeutralBackground3, borderRadius: tokens.borderRadiusMedium },
  label: { color: tokens.colorNeutralForeground3 },
  actions: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  primary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', color: tokens.colorNeutralForegroundOnBrand, backgroundColor: tokens.colorBrandBackground, border: 'none', borderRadius: tokens.borderRadiusMedium, cursor: 'pointer', fontWeight: tokens.fontWeightSemibold },
  secondary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', color: tokens.colorNeutralForeground2, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusMedium, cursor: 'pointer', fontWeight: tokens.fontWeightSemibold },
  success: { display: 'grid', gridTemplateColumns: '32px minmax(0, 1fr)', gap: '10px', padding: '14px', color: tokens.colorPaletteGreenForeground1, backgroundColor: tokens.colorPaletteGreenBackground2, border: `1px solid ${tokens.colorPaletteGreenBorderActive}`, borderRadius: tokens.borderRadiusMedium },
  successIcon: { fontSize: '28px' },
  disclosure: { color: tokens.colorNeutralForeground3 }
});

export interface IRequestTimeOffWorkflowProps {
  params: Record<string, string | number | boolean | string[]>;
}

const RequestTimeOffWorkflow: React.FunctionComponent<IRequestTimeOffWorkflowProps> = ({ params }) => {
  const styles = useStyles();
  const promptLeaveType = String(params.leaveType || 'vacation');
  const promptStartDate = String(params.startDate || '2027-08-04');
  const promptEndDate = String(params.endDate || '2027-08-12');
  const promptReason = String(params.reason || 'Family trip');
  const [stage, setStage] = React.useState<RequestStage>('edit');
  const [leaveType, setLeaveType] = React.useState(promptLeaveType);
  const [startDate, setStartDate] = React.useState(promptStartDate);
  const [endDate, setEndDate] = React.useState(promptEndDate);
  const [reason, setReason] = React.useState(promptReason);
  const businessDays = calculateBusinessDays(startDate, endDate);

  React.useEffect(() => {
    setLeaveType(promptLeaveType);
    setStartDate(promptStartDate);
    setEndDate(promptEndDate);
    setReason(promptReason);
    setStage('edit');
  }, [promptLeaveType, promptStartDate, promptEndDate, promptReason]);

  if (stage === 'submitted') {
    return <div className={styles.stack} role="status" aria-live="polite"><div className={styles.success}><CheckmarkCircle20Filled className={styles.successIcon} /><span><Text size={400} block weight="semibold">Time-off request sent for approval</Text><Text size={200} block>Request PTO-2027-0812 was sent to Diego Siciliani. You will see the mocked decision in Request status.</Text></span></div><div className={styles.summary}><div className={styles.summaryItem}><Text size={100} block className={styles.label}>Dates</Text><Text weight="semibold">{startDate} to {endDate}</Text></div><div className={styles.summaryItem}><Text size={100} block className={styles.label}>Working days</Text><Text weight="semibold">{businessDays}</Text></div></div><Text size={200} className={styles.disclosure}>Showcase only: no request was sent to a live HR system.</Text></div>;
  }

  if (stage === 'review') {
    return <div className={styles.stack}><Text size={500} weight="semibold">Review your time-off request</Text><Text size={200} className={styles.disclosure}>Confirm the details before sending this mocked request to your manager.</Text><div className={styles.summary}><div className={styles.summaryItem}><Text size={100} block className={styles.label}>Leave type</Text><Text weight="semibold">{leaveType}</Text></div><div className={styles.summaryItem}><Text size={100} block className={styles.label}>Working days</Text><Text weight="semibold">{businessDays}</Text></div><div className={styles.summaryItem}><Text size={100} block className={styles.label}>Start date</Text><Text weight="semibold">{startDate}</Text></div><div className={styles.summaryItem}><Text size={100} block className={styles.label}>End date</Text><Text weight="semibold">{endDate}</Text></div><div className={`${styles.summaryItem} ${styles.span}`}><Text size={100} block className={styles.label}>Reason</Text><Text weight="semibold">{reason || 'No reason provided'}</Text></div></div><div className={styles.alert}><Warning20Regular /><Text size={200}>Customer review overlaps on August 6. Team coverage remains healthy with at least four people available.</Text></div><div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => setStage('edit')}><ArrowLeft20Regular /> Edit request</button><button type="button" className={styles.primary} onClick={() => setStage('submitted')}><Send20Regular /> Submit for approval</button></div></div>;
  }

  return <div className={styles.stack}><div className={styles.form}><label className={`${styles.field} ${styles.span}`}><Text size={200}>Leave type</Text><select aria-label="Leave type" className={styles.input} value={leaveType} onChange={(event) => setLeaveType(event.currentTarget.value)}><option value="vacation">Vacation</option><option value="sick">Sick leave</option><option value="personal">Personal</option></select></label><label className={styles.field}><Text size={200}>Start date</Text><input aria-label="Start date" className={styles.input} type="date" value={startDate} onChange={(event) => setStartDate(event.currentTarget.value)} /></label><label className={styles.field}><Text size={200}>End date</Text><input aria-label="End date" className={styles.input} type="date" value={endDate} onChange={(event) => setEndDate(event.currentTarget.value)} /></label><label className={`${styles.field} ${styles.span}`}><Text size={200}>Reason</Text><input aria-label="Reason" className={styles.input} value={reason} onChange={(event) => setReason(event.currentTarget.value)} /></label></div><div className={styles.alert}><Warning20Regular /><span><Text block weight="semibold">One calendar conflict</Text><Text size={200}>The customer review on August 6 overlaps. Team coverage remains healthy.</Text></span></div><Text size={200}>{businessDays} working days. No request is submitted until you confirm.</Text><button type="button" className={styles.primary} onClick={() => setStage('review')}>Review request</button></div>;
};

export default RequestTimeOffWorkflow;