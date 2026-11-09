import * as React from 'react';
import { Avatar, Skeleton, SkeletonItem, makeStyles } from '@fluentui/react-components';
import type { Expert, ExpertPhoto } from '../models/Expert';

const useStyles = makeStyles({
  root: { position: 'relative', display: 'inline-flex', flexShrink: 0 },
  hidden: { visibility: 'hidden' },
  skeleton: { position: 'absolute', top: 0, left: 0 }
});

export function ExpertAvatar({ expert, photo, onPhotoSettled, size = 48 }: {
  expert: Expert; photo?: ExpertPhoto; onPhotoSettled: (id: string, failed: boolean) => void; size?: 48 | 72;
}): React.ReactElement {
  const styles = useStyles();
  const url = photo?.url || expert.photoUrl;
  const [failedUrl, setFailedUrl] = React.useState<string>();
  const failed = !!url && failedUrl === url;
  const loading = !!photo?.loading && !failed;

  React.useEffect(() => {
    if (!loading || !url) return;
    // Bound image decoding/loading too, after the separate Graph request timeout.
    const timer = window.setTimeout(() => {
      setFailedUrl(url);
      onPhotoSettled(expert.id, true);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [loading, url, expert.id, onPhotoSettled]);

  return <span className={styles.root} aria-hidden="true">
    <Avatar name={expert.displayName} size={size} color="brand" className={loading ? styles.hidden : undefined}
      image={url && !failed ? { src: url, alt: '', onLoad: () => onPhotoSettled(expert.id, false),
        onError: () => { setFailedUrl(url); onPhotoSettled(expert.id, true); } } : undefined} />
    {loading && <Skeleton className={styles.skeleton} animation="wave"><SkeletonItem shape="circle" size={size} /></Skeleton>}
  </span>;
}
