import * as React from 'react';
import {
  Badge, Body1, Button, DrawerBody, DrawerHeader, DrawerHeaderTitle,
  OverlayDrawer, Spinner, Subtitle2
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import type { ICommunity } from '../models/ICommunity';
import type { CommunityServiceError } from '../services/GraphVivaEngageService';
import { privacyLabel } from './CommunityCard';
import { ServiceError } from './ServiceError';
import { useExplorerStyles } from './explorerStyles';

export function CommunityDetails(props: {
  open: boolean;
  community: ICommunity | undefined;
  error: CommunityServiceError | undefined;
  strings: IVivaEngageExplorerCopilotComponentStrings;
  onClose: () => void;
  onRetry: () => void;
}): React.ReactElement {
  const { community, strings } = props;
  const styles = useExplorerStyles();
  return (
    <OverlayDrawer open={props.open} position="end"
      onOpenChange={(_event, data) => { if (!data.open) props.onClose(); }}>
      <DrawerHeader>
        <DrawerHeaderTitle action={<Button appearance="subtle" icon={<Dismiss24Regular />}
          aria-label={strings.Close} onClick={props.onClose} />}>
          {strings.DetailsTitle}
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody className={styles.details}>
        {props.error ? <ServiceError error={props.error} strings={strings} onRetry={props.onRetry} /> :
          !community ? <Spinner label={strings.LoadingDetails} /> : (
            <>
              <Subtitle2 as="h2">{community.displayName || strings.Unnamed}</Subtitle2>
              <Badge appearance="tint">{privacyLabel(community, strings)}</Badge>
              <Body1 className={styles.fullDescription}>{community.description || strings.NoDescription}</Body1>
              <dl className={styles.definition}>
                <dt>{strings.CommunityId}</dt><dd className={styles.value}>{community.id}</dd>
                <dt>{strings.GroupId}</dt><dd className={styles.value}>{community.groupId || strings.NotProvided}</dd>
                <dt>{strings.Privacy}</dt><dd className={styles.value}>{privacyLabel(community, strings)}</dd>
              </dl>
              <Body1 className={styles.muted}>{strings.NavigationUnavailable}</Body1>
            </>
          )}
      </DrawerBody>
    </OverlayDrawer>
  );
}
