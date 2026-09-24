import * as React from 'react';
import {
  FluentProvider,
  IdPrefixProvider,
  webLightTheme,
  webDarkTheme,
  Title1,
  Title2,
  Body1,
  Caption1,
  Button,
  makeStyles,
  mergeClasses,
  tokens
} from '@fluentui/react-components';
import {
  Star24Filled,
  Timer24Regular,
  TargetArrow24Regular,
  NumberSymbol24Regular,
  ArrowClockwise24Regular,
  ArrowExpand24Regular,
  Chat24Regular,
  Trophy24Filled,
  DismissCircle24Regular
} from '@fluentui/react-icons';
import { createCopilotTextContent } from '@microsoft/sp-copilot-component';

import type { IStarMatchProps } from './IStarMatchProps';
import { ALL_NUMBERS } from './gameLogic';
import { useStarMatchGame } from './useStarMatchGame';

const LOW_TIME_THRESHOLD_SECONDS: number = 10;

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalXXL,
    backgroundImage: `linear-gradient(160deg, ${tokens.colorBrandBackground2} 0%, ${tokens.colorNeutralBackground1} 55%)`,
    minHeight: '100%',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: tokens.spacingVerticalXS
  },
  pillRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    padding: `${tokens.spacingVerticalSNudge} ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    fontWeight: tokens.fontWeightSemibold
  },
  pillDanger: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground2
  },
  pillWarning: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground2
  },
  starsCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalL,
    borderRadius: tokens.borderRadiusXLarge,
    backgroundImage: `linear-gradient(135deg, ${tokens.colorPaletteGoldBackground2} 0%, ${tokens.colorPaletteMarigoldBackground2} 100%)`,
    boxShadow: tokens.shadow8
  },
  starsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 24px)',
    gap: tokens.spacingHorizontalXS,
    justifyContent: 'center'
  },
  banner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalL,
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow16
  },
  bannerWon: {
    backgroundImage: `linear-gradient(135deg, ${tokens.colorPaletteGreenBackground2} 0%, ${tokens.colorPaletteLightGreenBackground2} 100%)`
  },
  bannerLost: {
    backgroundImage: `linear-gradient(135deg, ${tokens.colorPaletteRedBackground2} 0%, ${tokens.colorPaletteDarkOrangeBackground2} 100%)`
  },
  bannerIconRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  tileGrid: {
    display: 'flex',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap'
  },
  tile: {
    width: '56px',
    height: '56px',
    minWidth: '56px',
    fontWeight: tokens.fontWeightBold,
    fontSize: tokens.fontSizeBase500,
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow4,
    transitionProperty: 'transform, box-shadow',
    transitionDuration: tokens.durationFast,
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow8
    }
  },
  tileAvailable: {
    backgroundColor: tokens.colorNeutralBackground1
  },
  tileCandidate: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    border: `2px solid ${tokens.colorBrandStroke1}`
  },
  tileWrong: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground2,
    border: `2px solid ${tokens.colorPaletteRedBorder2}`
  },
  tileUsed: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
    opacity: 0.5
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  playAgainButton: {
    borderRadius: tokens.borderRadiusCircular
  }
});

const EXPANDED_WIDTH: number = 600;
const EXPANDED_HEIGHT: number = 520;
const COMPACT_WIDTH: number = 440;
const COMPACT_HEIGHT: number = 380;

/**
 * Star Match — a math game for kids. Each round draws a star count that is
 * always solvable using the numbers still on the board; the player picks one
 * or more of the nine numbers (1-9) that sum to the star count, using every
 * number exactly once before the timer runs out.
 */
export default function StarMatch(props: IStarMatchProps): React.ReactElement {
  const { userDisplayName, durationSeconds, hostContext, bridge, onRequestDisplayMode, onRequestSizeChange, strings } = props;
  const styles = useStyles();

  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
  const { tileStatuses, target, selectedSum, timeLeft, status, toggleNumber, reset } = useStarMatchGame(durationSeconds);

  const theme = hostContext.theme === 'dark' ? webDarkTheme : webLightTheme;
  const isLowTime = status === 'playing' && timeLeft <= LOW_TIME_THRESHOLD_SECONDS;

  const handleExpand = React.useCallback(async (): Promise<void> => {
    if (isExpanded) {
      await onRequestSizeChange(COMPACT_WIDTH, COMPACT_HEIGHT);
    } else {
      await onRequestDisplayMode('fullscreen');
      await onRequestSizeChange(EXPANDED_WIDTH, EXPANDED_HEIGHT);
    }
    setIsExpanded(!isExpanded);
  }, [isExpanded, onRequestDisplayMode, onRequestSizeChange]);

  // Let Copilot know how the round went, so it can react in the chat.
  const handleShareResult = React.useCallback(async (): Promise<void> => {
    const text = status === 'won'
      ? strings.ShareWinMessage.replace('{0}', String(timeLeft))
      : strings.ShareLoseMessage;
    await bridge.sendFollowUpMessageAsync([createCopilotTextContent(text)]);
  }, [bridge, status, timeLeft, strings]);

  const tileClassName = (n: number): string => {
    switch (tileStatuses[n]) {
      case 'candidate':
        return mergeClasses(styles.tile, styles.tileCandidate);
      case 'wrong':
        return mergeClasses(styles.tile, styles.tileWrong);
      case 'used':
        return mergeClasses(styles.tile, styles.tileUsed);
      default:
        return mergeClasses(styles.tile, styles.tileAvailable);
    }
  };

  return (
    <IdPrefixProvider value="copilot-component-">
      <FluentProvider theme={theme} targetDocument={props.targetDocument} style={{ minHeight: '100%' }}>
        <div className={styles.root}>
          <div className={styles.header}>
            <Title1>⭐ {strings.GameTitle}</Title1>
            <Body1>{strings.GameInstructions}</Body1>
          </div>

          <div className={styles.pillRow}>
            <div className={mergeClasses(styles.pill, isLowTime && styles.pillDanger)}>
              <Timer24Regular /> {strings.TimeLeftLabel} {timeLeft}s
            </div>
            <div className={mergeClasses(styles.pill, selectedSum > (target ?? 0) && styles.pillWarning)}>
              <TargetArrow24Regular /> {strings.SelectedLabel} {selectedSum}
            </div>
            <div className={styles.pill}>
              <NumberSymbol24Regular /> {strings.NumbersLeftLabel} {ALL_NUMBERS.filter((n) => tileStatuses[n] !== 'used').length}
            </div>
          </div>

          {status === 'playing' && target !== undefined && (
            <div className={styles.starsCard}>
              <Caption1>{strings.StarsLabel}</Caption1>
              <div className={styles.starsRow}>
                {Array.from({ length: target }).map((_, i) => (
                  <Star24Filled key={i} primaryFill={tokens.colorPaletteDarkOrangeForeground1} />
                ))}
              </div>
            </div>
          )}

          {status !== 'playing' && (
            <div className={mergeClasses(styles.banner, status === 'won' ? styles.bannerWon : styles.bannerLost)}>
              <div className={styles.bannerIconRow}>
                {status === 'won' ? <Trophy24Filled /> : <DismissCircle24Regular />}
                <Title2>{status === 'won' ? strings.WinTitle : strings.LoseTitle}</Title2>
              </div>
              <Body1>
                {status === 'won'
                  ? strings.WinMessage.replace('{0}', userDisplayName).replace('{1}', String(timeLeft))
                  : strings.LoseMessage.replace('{0}', userDisplayName)}
              </Body1>
            </div>
          )}

          <div className={styles.tileGrid}>
            {ALL_NUMBERS.map((n) => (
              <Button
                key={n}
                appearance="outline"
                className={tileClassName(n)}
                disabled={tileStatuses[n] === 'used' || status !== 'playing'}
                onClick={() => toggleNumber(n)}
              >
                {n}
              </Button>
            ))}
          </div>

          <div className={styles.actions}>
            <Button
              appearance="primary"
              shape="circular"
              className={styles.playAgainButton}
              icon={<ArrowClockwise24Regular />}
              onClick={reset}
            >
              {strings.PlayAgainButtonLabel}
            </Button>
            <Button appearance="secondary" icon={<ArrowExpand24Regular />} onClick={handleExpand}>
              {isExpanded ? strings.CompactButtonLabel : strings.ExpandButtonLabel}
            </Button>
            {status !== 'playing' && (
              <Button appearance="secondary" icon={<Chat24Regular />} onClick={handleShareResult}>
                {strings.ShareResultButtonLabel}
              </Button>
            )}
          </div>
        </div>
      </FluentProvider>
    </IdPrefixProvider>
  );
}
