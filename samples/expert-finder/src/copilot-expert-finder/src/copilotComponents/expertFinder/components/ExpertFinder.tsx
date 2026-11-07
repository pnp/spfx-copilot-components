import * as React from 'react';
import { FluentProvider, IdPrefixProvider, teamsLightTheme, teamsDarkTheme, Spinner, Button, makeStyles, tokens } from '@fluentui/react-components';
import { Search24Regular } from '@fluentui/react-icons';
import type { Expert, ExpertPhoto, ExpertPhotos, ExpertSkill } from '../models/Expert';
import type { IExpertFinderProps, IntroductionAction } from './IExpertFinderProps';
import { ExpertFinderHeader } from './ExpertFinderHeader';
import { ExpertFinderInline } from './ExpertFinderInline';
import { ExpertFinderFullscreen } from './ExpertFinderFullscreen';
import { emptyFilters } from '../utils/expertFilters';

const useStyles = makeStyles({
  root: { backgroundColor: tokens.colorNeutralBackground1, color: tokens.colorNeutralForeground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: '20px', overflow: 'hidden', boxShadow: tokens.shadow8 },
  body: { padding: '8px 24px 24px', '@media (max-width: 400px)': { paddingRight: '16px', paddingLeft: '16px' } },
  count: { margin: '16px 0 4px', fontWeight: 600 },
  state: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 16px', textAlign: 'center' },
  message: { margin: 0, color: tokens.colorNeutralForeground2, maxWidth: '420px', lineHeight: '22px' },
  error: { padding: '12px', marginTop: '16px', borderRadius: '8px', backgroundColor: tokens.colorPaletteRedBackground1, color: tokens.colorPaletteRedForeground1 }
});

type Results = { skill?: ExpertSkill; status: 'loading' | 'ready' | 'error'; experts: Expert[]; error?: string };

export default function ExpertFinder(props: IExpertFinderProps): React.ReactElement {
  const styles = useStyles();
  const { skill, service, photoService } = props;
  const [results, setResults] = React.useState<Results>({ status: 'loading', experts: [] });
  const [photos, setPhotos] = React.useState<ExpertPhotos>({});
  const [retry, setRetry] = React.useState(0);
  const [filters, setFilters] = React.useState({ ...emptyFilters });
  const [expanding, setExpanding] = React.useState(false);
  const [hostError, setHostError] = React.useState('');
  const [introducingId, setIntroducingId] = React.useState<string>();
  const [introductionError, setIntroductionError] = React.useState<IntroductionAction['error']>();
  const introductionBusy = React.useRef(false);
  const introductionActive = React.useRef(true);
  React.useEffect(() => {
    introductionActive.current = true;
    return () => { introductionActive.current = false; };
  }, []);
  React.useEffect(() => { setFilters({ ...emptyFilters }); setHostError(''); }, [skill]);
  const fullscreen = props.hostContext.displayMode === 'fullscreen';
  const canExpand = !fullscreen && (props.hostContext.availableDisplayModes || []).indexOf('fullscreen') !== -1;

  React.useEffect(() => {
    if (!skill || !service) return;
    let active = true;
    setResults({ skill, status: 'loading', experts: [] });
    service.getExpertsBySkill(skill).then(experts => {
      if (!active) return;
      const initialPhotos: Record<string, ExpertPhoto> = {};
      experts.forEach(expert => {
        initialPhotos[expert.id] = { url: expert.photoUrl, loading: !!photoService && !!expert.userPrincipalName && !expert.photoUrl };
      });
      setPhotos(initialPhotos);
      setResults({ skill, status: 'ready', experts });
      // Warm the full skill result set so expanding does not start another Graph load.
      if (photoService) experts.forEach(expert => {
        if (expert.photoUrl || !expert.userPrincipalName) return;
        photoService.getPhotoUrl(expert.userPrincipalName).then(url => {
          if (active) setPhotos(current => ({ ...current, [expert.id]: { url, loading: !!url } }));
        }).catch(() => {
          if (active) setPhotos(current => ({ ...current, [expert.id]: { loading: false } }));
        });
      });
    }).catch((error: unknown) => {
      if (active) setResults({ skill, status: 'error', experts: [], error: error instanceof Error ? error.message : 'Unable to retrieve experts. Please try again.' });
    });
    return () => { active = false; };
  }, [skill, service, photoService, retry]);

  const settlePhoto = React.useCallback((id: string, failed: boolean): void => {
    setPhotos(current => {
      const photo = current[id];
      if (!photo || (!photo.loading && !failed)) return current;
      return { ...current, [id]: { url: failed ? undefined : photo.url, loading: false } };
    });
  }, []);

  const expand = async (): Promise<void> => {
    setExpanding(true); setHostError('');
    try { await props.onRequestFullscreen(); }
    catch { setHostError('The host could not open fullscreen. You can keep using this view.'); }
    finally { setExpanding(false); }
  };

  const introduce = (expert: Expert): Promise<void> => {
    if (introductionBusy.current) return Promise.resolve();
    introductionBusy.current = true;
    setIntroducingId(expert.id); setIntroductionError(undefined);
    return props.onIntroduceExpert(expert).then(() => {
      introductionBusy.current = false;
      if (introductionActive.current) setIntroducingId(undefined);
    }).catch((error: unknown) => {
      introductionBusy.current = false;
      if (introductionActive.current) {
        setIntroducingId(undefined);
        setIntroductionError({ expertId: expert.id,
          message: error instanceof Error ? error.message : 'Copilot could not request the introduction draft. Please try again.' });
      }
    });
  };

  const problem = props.inputError || props.configurationError || (!service ? 'The expert data source is not configured.' : undefined);
  const loading = !problem && (results.skill !== skill || results.status === 'loading');
  const experts = results.skill === skill ? results.experts : [];

  return <IdPrefixProvider value="expert-finder-">
    <FluentProvider theme={props.hostContext.theme === 'dark' ? teamsDarkTheme : teamsLightTheme} targetDocument={props.targetDocument}>
      <section className={styles.root} aria-label="Expert Finder">
        <ExpertFinderHeader skill={skill} isDemo={props.isDemo} fullscreen={fullscreen} />
        <div className={styles.body}>
          {problem ? <div className={styles.state} role="alert"><p className={styles.message}>{problem}</p></div>
            : loading ? <div className={styles.state} role="status"><Spinner label={`Finding experts in ${skill}…`} /></div>
            : results.status === 'error' ? <div className={styles.state} role="alert"><p className={styles.message}>{results.error}</p><Button onClick={() => setRetry(value => value + 1)}>Try again</Button></div>
            : experts.length === 0 ? <div className={styles.state} role="status"><Search24Regular /><strong>No experts found in {skill}</strong><p className={styles.message}>Try another skill by asking Copilot a new question.</p></div>
            : fullscreen ? <ExpertFinderFullscreen key={skill} experts={experts} photos={photos} onPhotoSettled={settlePhoto}
              availabilityService={props.availabilityService}
              meetingService={props.meetingService}
              introduction={{ pendingExpertId: introducingId, error: introductionError, onRequest: introduce }}
              filters={filters} onFiltersChange={setFilters} isDemo={props.isDemo} onOpenLink={props.onOpenLink} />
            : <><p className={styles.count} role="status">{experts.length} {experts.length === 1 ? 'expert' : 'experts'} found</p>
              <ExpertFinderInline experts={experts} photos={photos} onPhotoSettled={settlePhoto}
                isDemo={props.isDemo} canExpand={canExpand} expanding={expanding}
                onExpand={expand} onOpenLink={props.onOpenLink} /></>}
          {hostError && <div className={styles.error} role="alert">{hostError}</div>}
        </div>
      </section>
    </FluentProvider>
  </IdPrefixProvider>;
}
