import * as React from 'react';
import {
  Caption1,
  Persona,
  Tab,
  TabList,
  Text,
  makeStyles,
  tokens,
  type SelectTabData,
  type SelectTabEvent
} from '@fluentui/react-components';

import { ComponentHeader } from '../../shared/ComponentHeader';
import { LoadStatus, toErrorMessage, type LoadState } from '../../shared/LoadState';
import { ThemeProvider } from '../../shared/ThemeProvider';
import {
  isPermissionError,
  type ICalendarEvent,
  type IMailMessage,
  type IUserProfile
} from '../services/GraphProfileService';
import type { IMyProfileProps, ProfileView } from './IMyProfileProps';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalM,
    boxSizing: 'border-box',
    minWidth: 0
  },
  rows: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    listStyleType: 'none',
    margin: 0,
    padding: 0
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0
  },
  unread: {
    fontWeight: tokens.fontWeightSemibold
  },
  muted: {
    color: tokens.colorNeutralForeground3
  }
});

const DEFAULT_VIEW: ProfileView = 'mail';

function formatDateTime(value: string, locale: string): string {
  return new Date(value).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

/**
 * Shows the signed-in user's profile with their recent mail or their
 * calendar events for the next 7 days.
 *
 * The component renders at once with a loading state and loads the data in
 * effects, so the Copilot host never shows an empty frame while it waits.
 */
export default function MyProfile(props: IMyProfileProps): React.ReactElement {
  const { service, hostContext, onRequestDisplayMode, strings } = props;
  const styles = useStyles();

  const [view, setView] = React.useState<ProfileView>(props.initialView ?? DEFAULT_VIEW);
  const [profile, setProfile] = React.useState<LoadState<IUserProfile>>({ status: 'loading' });
  const [messages, setMessages] = React.useState<LoadState<IMailMessage[]>>({ status: 'loading' });
  const [events, setEvents] = React.useState<LoadState<ICalendarEvent[]>>({ status: 'loading' });

  // Tell the user when an administrator has not approved the Microsoft Graph
  // permissions yet. Show the message from the error in all other cases.
  const toMessage = React.useCallback(
    (error: unknown): string =>
      isPermissionError(error)
        ? strings.PermissionMessage
        : toErrorMessage(error, strings.GenericErrorMessage),
    [strings]
  );

  // A new tool invocation can pass a different view.
  React.useEffect(() => {
    setView(props.initialView ?? DEFAULT_VIEW);
  }, [props.initialView]);

  // Load the profile when the component starts.
  React.useEffect(() => {
    let cancelled: boolean = false;
    setProfile({ status: 'loading' });
    service.getProfile().then(
      (data: IUserProfile) => {
        if (!cancelled) {
          setProfile({ status: 'ready', data });
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          setProfile({ status: 'error', message: toMessage(error) });
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [service, toMessage]);

  // Load the mail or the calendar for the selected view.
  React.useEffect(() => {
    let cancelled: boolean = false;

    if (view === 'mail') {
      setMessages({ status: 'loading' });
      service.getMessages().then(
        (data: IMailMessage[]) => {
          if (!cancelled) {
            setMessages({ status: 'ready', data });
          }
        },
        (error: unknown) => {
          if (!cancelled) {
            setMessages({ status: 'error', message: toMessage(error) });
          }
        }
      );
    } else {
      setEvents({ status: 'loading' });
      service.getEvents(new Date()).then(
        (data: ICalendarEvent[]) => {
          if (!cancelled) {
            setEvents({ status: 'ready', data });
          }
        },
        (error: unknown) => {
          if (!cancelled) {
            setEvents({ status: 'error', message: toMessage(error) });
          }
        }
      );
    }

    return () => {
      cancelled = true;
    };
  }, [service, view, toMessage]);

  const handleTabSelect = React.useCallback(
    (_event: SelectTabEvent, data: SelectTabData): void => {
      setView(data.value as ProfileView);
    },
    []
  );

  // Request the Copilot host to switch this component to fullscreen mode.
  // The host decides. The next render reads the real display mode.
  const handleExpand = React.useCallback((): void => {
    onRequestDisplayMode('fullscreen').catch(() => undefined);
  }, [onRequestDisplayMode]);

  const canExpand: boolean =
    hostContext.displayMode !== 'fullscreen' &&
    (hostContext.availableDisplayModes ?? []).indexOf('fullscreen') !== -1;

  return (
    <ThemeProvider
      theme={hostContext.theme}
      targetDocument={props.targetDocument}
      onContentResize={props.onContentResize}
    >
      <div className={styles.root}>
        <ComponentHeader
          title={strings.ProfileTitle}
          canExpand={canExpand}
          expandLabel={strings.ExpandButtonLabel}
          onRequestFullscreen={handleExpand}
        />

        <LoadStatus state={profile} loadingLabel={strings.LoadingProfileLabel} />
        {profile.status === 'ready' && (
          <Persona
            name={profile.data.displayName}
            secondaryText={profile.data.jobTitle}
            tertiaryText={profile.data.mail}
            size="large"
          />
        )}

        <TabList selectedValue={view} onTabSelect={handleTabSelect}>
          <Tab value="mail" data-view="mail">
            {strings.MailTabLabel}
          </Tab>
          <Tab value="calendar" data-view="calendar">
            {strings.CalendarTabLabel}
          </Tab>
        </TabList>

        {view === 'mail' ? (
          <>
            <LoadStatus state={messages} loadingLabel={strings.LoadingMailLabel} />
            {messages.status === 'ready' && messages.data.length === 0 && (
              <Text>{strings.NoMessagesMessage}</Text>
            )}
            {messages.status === 'ready' && messages.data.length > 0 && (
              <ul className={styles.rows}>
                {messages.data.map((message: IMailMessage) => (
                  <li key={message.id} className={styles.row}>
                    <Text
                      className={message.isRead ? undefined : styles.unread}
                      block
                      truncate
                      wrap={false}
                    >
                      {message.subject}
                    </Text>
                    <Caption1 className={styles.muted}>
                      {message.from} · {formatDateTime(message.received, props.locale)}
                    </Caption1>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <LoadStatus state={events} loadingLabel={strings.LoadingCalendarLabel} />
            {events.status === 'ready' && events.data.length === 0 && (
              <Text>{strings.NoEventsMessage}</Text>
            )}
            {events.status === 'ready' && events.data.length > 0 && (
              <ul className={styles.rows}>
                {events.data.map((event: ICalendarEvent) => (
                  <li key={event.id} className={styles.row}>
                    <Text block truncate wrap={false}>
                      {event.subject}
                    </Text>
                    <Caption1 className={styles.muted}>
                      {formatDateTime(event.start, props.locale)}
                      {event.location.length > 0 ? ` · ${event.location}` : ''}
                    </Caption1>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </ThemeProvider>
  );
}
