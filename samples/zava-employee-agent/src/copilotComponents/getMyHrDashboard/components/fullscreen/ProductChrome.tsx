import * as React from 'react';

import { Text } from '@fluentui/react-text';
import { makeStyles, mergeClasses } from '@griffel/react';
import { tokens } from '@fluentui/react-theme';
import { Settings20Regular } from '@fluentui/react-icons';

import { getZavaFamily, ZAVA_FAMILIES } from '../../../shared/models/families';
import type { ZavaFamilyId } from '../../../shared/models/families';
import FamilyIcon from '../../../shared/components/FamilyIcon';
import { getZavaFamilyTheme } from '../../../shared/theme/familyThemes';

const useStyles = makeStyles({
  productBar: {
    height: '58px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
    boxSizing: 'border-box',
    paddingLeft: '18px',
    paddingRight: '18px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
  },
  mark: {
    width: '30px',
    height: '30px',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    color: tokens.colorNeutralForegroundOnBrand,
    backgroundImage: `linear-gradient(135deg, ${tokens.colorBrandBackground} 0%, ${tokens.colorPaletteBerryBackground3} 100%)`,
    borderRadius: tokens.borderRadiusMedium,
    fontWeight: tokens.fontWeightBold
  },
  title: { fontWeight: tokens.fontWeightSemibold },
  context: {
    color: tokens.colorNeutralForeground3,
    '@media (max-width: 720px)': { display: 'none' }
  },
  spacer: { flexGrow: 1 },
  mockBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    color: tokens.colorPaletteGreenForeground2,
    backgroundColor: tokens.colorPaletteGreenBackground2,
    borderRadius: tokens.borderRadiusCircular,
    '@media (max-width: 560px)': { display: 'none' }
  },
  mockDot: {
    width: '6px',
    height: '6px',
    backgroundColor: tokens.colorPaletteGreenForeground2,
    borderRadius: tokens.borderRadiusCircular
  },
  iconButton: {
    width: '34px',
    height: '34px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    color: tokens.colorNeutralForeground2,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    ':hover': { backgroundColor: tokens.colorSubtleBackgroundHover },
    ':focus-visible': {
      outlineColor: tokens.colorStrokeFocus2,
      outlineStyle: 'solid',
      outlineWidth: '2px'
    }
  },
  body: {
    minHeight: 0,
    flexGrow: 1,
    display: 'grid',
    gridTemplateColumns: '178px minmax(0, 1fr)',
    '@media (max-width: 1220px)': { gridTemplateColumns: '76px minmax(0, 1fr)' },
    '@media (max-width: 760px)': { display: 'block' }
  },
  rail: {
    minHeight: 0,
    padding: '20px 12px 14px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    overflowY: 'auto',
    '@media (max-width: 1220px)': { paddingLeft: '8px', paddingRight: '8px' },
    '@media (max-width: 760px)': { display: 'none' }
  },
  railLabel: {
    display: 'block',
    paddingLeft: '10px',
    paddingRight: '10px',
    paddingBottom: '10px',
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
    textTransform: 'uppercase',
    '@media (max-width: 1220px)': { display: 'none' }
  },
  railList: { display: 'flex', flexDirection: 'column', gap: '3px' },
  railItem: {
    minHeight: '38px',
    display: 'grid',
    gridTemplateColumns: '26px minmax(0, 1fr)',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 9px',
    color: tokens.colorNeutralForeground2,
    backgroundColor: 'transparent',
    borderTop: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    borderLeft: '3px solid transparent',
    borderRadius: tokens.borderRadiusMedium,
    textAlign: 'left',
    '@media (max-width: 1220px)': {
      gridTemplateColumns: '1fr',
      justifyItems: 'center',
      paddingLeft: 0,
      paddingRight: 0
    }
  },
  activeRailItem: {
    fontWeight: tokens.fontWeightSemibold
  },
  railItemHover: {
    cursor: 'pointer',
    ':hover': { backgroundColor: tokens.colorSubtleBackgroundHover },
    ':focus-visible': {
      outlineColor: tokens.colorStrokeFocus2,
      outlineStyle: 'solid',
      outlineWidth: '2px'
    }
  },
  railText: { '@media (max-width: 1220px)': { display: 'none' } },
  railIcon: {
    width: '24px',
    height: '24px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.borderRadiusMedium
  },
  mobileNav: {
    display: 'none',
    padding: '10px 12px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    '@media (max-width: 760px)': { display: 'block' }
  },
  select: {
    width: '100%',
    height: '44px',
    paddingLeft: '10px',
    paddingRight: '10px',
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium
  }
});

export interface IProductChromeProps {
  activeFamily: ZavaFamilyId;
  settingsButtonRef: React.RefObject<HTMLButtonElement>;
  onOpenSettings: () => void;
}

export const ProductBar: React.FunctionComponent<IProductChromeProps> = (props) => {
  const styles = useStyles();
  return (
    <header className={styles.productBar}>
      <span className={styles.mark} aria-hidden="true">Z</span>
      <Text size={400} className={styles.title}>Zava Employee Agent</Text>
      <Text size={200} className={styles.context}>{getZavaFamily(props.activeFamily).label}</Text>
      <span className={styles.spacer} />
      <span className={styles.mockBadge}>
        <span className={styles.mockDot} aria-hidden="true" />
        <Text size={200}>Mock data · Offline</Text>
      </span>
      <button
        ref={props.settingsButtonRef}
        type="button"
        className={styles.iconButton}
        aria-label="Open settings"
        title="Settings"
        onClick={props.onOpenSettings}
      >
        <Settings20Regular />
      </button>
    </header>
  );
};

export interface IFamilyNavigationProps {
  activeFamily: ZavaFamilyId;
  onSelectFamily: (family: ZavaFamilyId, trigger?: HTMLElement) => void;
}

export const FamilyNavigation: React.FunctionComponent<IFamilyNavigationProps> = (props) => {
  const styles = useStyles();
  return (
    <>
      <aside className={styles.rail} aria-label="Employee Agent sections">
        <Text size={100} className={styles.railLabel}>Your workspace</Text>
        <nav className={styles.railList}>
          {ZAVA_FAMILIES.map((family) => {
            const active = family.id === props.activeFamily;
            const theme = getZavaFamilyTheme(family.themeVariant);
            return (
              <button
                key={family.id}
                type="button"
                className={mergeClasses(
                  styles.railItem,
                  styles.railItemHover,
                  active && styles.activeRailItem
                )}
                aria-current={active ? 'page' : undefined}
                aria-label={family.label}
                data-family-nav={family.id}
                data-family-theme={family.themeVariant}
                title={family.label}
                onClick={(event) => props.onSelectFamily(family.id, event.currentTarget)}
                style={active ? {
                  color: theme.foregroundColor,
                  backgroundColor: theme.subtleBackgroundColor,
                  borderLeftColor: theme.accentColor
                } : undefined}
              >
                <span
                  className={styles.railIcon}
                  aria-hidden="true"
                  style={{ color: theme.foregroundColor, backgroundColor: theme.subtleBackgroundColor }}
                >
                  <FamilyIcon family={family.id} />
                </span>
                <span className={styles.railText}>{family.railLabel}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      <div className={styles.mobileNav}>
        <label>
          <Text size={200} block>Employee Agent section</Text>
          <select
            className={styles.select}
            value={props.activeFamily}
            aria-label="Employee Agent section"
            onChange={(event) => props.onSelectFamily(event.target.value as ZavaFamilyId, event.currentTarget)}
          >
            {ZAVA_FAMILIES.map((family) => (
              <option key={family.id} value={family.id} data-family-option={family.id}>
                {family.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
};

export const ChromeBody: React.FunctionComponent<{ children?: React.ReactNode }> = (props) => {
  const styles = useStyles();
  return <div className={styles.body}>{props.children}</div>;
};