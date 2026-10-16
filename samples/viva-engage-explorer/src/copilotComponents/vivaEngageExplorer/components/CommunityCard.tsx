import * as React from 'react';
import { Avatar, Badge, Body1, Button, Card, Subtitle2 } from '@fluentui/react-components';
import { ArrowRight20Regular, LockClosed16Regular, Globe16Regular } from '@fluentui/react-icons';
import type { ICommunity } from '../models/ICommunity';
import { useExplorerStyles } from './explorerStyles';

export function privacyLabel(community: ICommunity, strings: IVivaEngageExplorerCopilotComponentStrings): string {
  return community.privacy === 'public' ? strings.Public :
    community.privacy === 'private' ? strings.Private : strings.Unknown;
}

export const CommunityCard = React.memo(function CommunityCard(props: {
  community: ICommunity;
  strings: IVivaEngageExplorerCopilotComponentStrings;
  onDetails: (id: string) => void;
}): React.ReactElement {
  const { community, strings, onDetails } = props;
  const styles = useExplorerStyles();
  const name = community.displayName || strings.Unnamed;
  return (
    <Card className={styles.card}>
      <div className={styles.cardHeading}>
        <Avatar name={name} color="brand" shape="square" aria-hidden="true" />
        <Subtitle2 as="h3" className={styles.cardTitle}>{name}</Subtitle2>
      </div>
      <Badge appearance="tint" color={community.privacy === 'public' ? 'brand' : 'subtle'}
        icon={community.privacy === 'public' ? <Globe16Regular /> : community.privacy === 'private' ? <LockClosed16Regular /> : undefined}>
        {privacyLabel(community, strings)}
      </Badge>
      <Body1 className={styles.description}>{community.description || strings.NoDescription}</Body1>
      <div>
        <Button appearance="subtle" icon={<ArrowRight20Regular />} iconPosition="after"
          aria-label={`${strings.Details}: ${name}`} onClick={() => onDetails(community.id)}>
          {strings.Details}
        </Button>
      </div>
    </Card>
  );
});
