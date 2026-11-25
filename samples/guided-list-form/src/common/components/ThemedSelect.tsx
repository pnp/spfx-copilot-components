import * as React from 'react';
import { createPortal } from 'react-dom';
import { mergeClasses } from '@fluentui/react-components';
import { Checkmark16Filled, ChevronDown16Regular } from '@fluentui/react-icons';
import { MENU_COLOR, MENU_OPTION_COLOR, menuTypeStyle, planMenuPosition, viewportFromWindow } from '../logic/themedSelectMenu';
import { ensureGlassScrollStyle, GLASS_SCROLL_CLASS, useWizardStyles } from './styles';

export interface IThemedSelectOption {
  value: string;
  label: string;
}

export interface IThemedSelectProps {
  id?: string;
  value: string;
  options: IThemedSelectOption[];
  placeholder: string;
  disabled?: boolean;
  'data-testid'?: string;
  onChange(value: string): void;
  onOpenChange?(open: boolean): void;
}

const TYPEAHEAD_MS = 700;

export function ThemedSelect(props: IThemedSelectProps): React.ReactElement {
  const styles = useWizardStyles();
  ensureGlassScrollStyle(typeof document !== 'undefined' ? document : undefined);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const typeRef = React.useRef({ prefix: '', at: 0 });
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [menu, setMenu] = React.useState({ top: 0, left: 0, width: 0, maxHeight: 240, flip: false });

  const selectedIndex = props.options.findIndex((o) => o.value === props.value);
  const selected = selectedIndex >= 0 ? props.options[selectedIndex] : undefined;
  const listId = `${props.id || 'wiz-select'}-list`;

  const close = React.useCallback((): void => {
    setOpen(false);
    if (props.onOpenChange) {
      props.onOpenChange(false);
    }
  }, [props]);

  const openMenu = React.useCallback((index?: number): void => {
    if (props.disabled) {
      return;
    }
    const next = typeof index === 'number' ? index : Math.max(0, selectedIndex);
    setActive(next);
    setOpen(true);
    if (props.onOpenChange) {
      props.onOpenChange(true);
    }
  }, [props, selectedIndex]);

  const choose = (value: string): void => {
    props.onChange(value);
    close();
    if (triggerRef.current) {
      triggerRef.current.focus();
    }
  };

  const measure = React.useCallback((): void => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }
    // Viewport coordinates only. Do not add scrollX/scrollY: getBoundingClientRect already
    // accounts for scroll, and position:fixed uses the same space.
    const box = trigger.getBoundingClientRect();
    const view = trigger.ownerDocument.defaultView;
    const planned = planMenuPosition(
      { top: box.top, bottom: box.bottom, left: box.left, width: box.width },
      viewportFromWindow(view || undefined)
    );
    setMenu(planned);
  }, []);

  React.useLayoutEffect(() => {
    if (!open) {
      return;
    }
    measure();
    const doc = triggerRef.current ? triggerRef.current.ownerDocument : document;
    const view = doc.defaultView;
    const onWin = (): void => measure();
    if (view) {
      view.addEventListener('resize', onWin);
    }
    doc.addEventListener('scroll', onWin, true);
    return () => {
      if (view) {
        view.removeEventListener('resize', onWin);
      }
      doc.removeEventListener('scroll', onWin, true);
    };
  }, [open, measure, props.options.length]);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const doc = triggerRef.current ? triggerRef.current.ownerDocument : document;
    const onPointer = (event: Event): void => {
      const target = event.target as Node | null;
      if (triggerRef.current && triggerRef.current.contains(target)) {
        return;
      }
      if (listRef.current && listRef.current.contains(target)) {
        return;
      }
      close();
    };
    doc.addEventListener('mousedown', onPointer);
    doc.addEventListener('touchstart', onPointer);
    return () => {
      doc.removeEventListener('mousedown', onPointer);
      doc.removeEventListener('touchstart', onPointer);
    };
  }, [open, close]);

  React.useEffect(() => {
    if (!open || !listRef.current) {
      return;
    }
    const el = listRef.current.querySelector(`[data-index="${active}"]`) as HTMLElement | null;
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [open, active]);

  const jumpTo = (letter: string): void => {
    const now = Date.now();
    const typed = now - typeRef.current.at < TYPEAHEAD_MS ? typeRef.current.prefix + letter : letter;
    typeRef.current = { prefix: typed, at: now };
    const start = typed.length === 1 ? active + 1 : 0;
    const pool = props.options.concat(props.options);
    const offset = typed.length === 1 ? start : 0;
    const index = pool.findIndex((o, i) => i >= offset && o.label.toLowerCase().indexOf(typed.toLowerCase()) === 0);
    if (index >= 0) {
      const next = index % props.options.length;
      if (!open) {
        openMenu(next);
      } else {
        setActive(next);
      }
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (props.disabled) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        openMenu(Math.max(0, selectedIndex));
        return;
      }
      setActive((i) => Math.min(props.options.length - 1, i + 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openMenu(Math.max(0, selectedIndex));
        return;
      }
      setActive((i) => Math.max(0, i - 1));
      return;
    }
    if (event.key === 'Home' && open) {
      event.preventDefault();
      setActive(0);
      return;
    }
    if (event.key === 'End' && open) {
      event.preventDefault();
      setActive(Math.max(0, props.options.length - 1));
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) {
        openMenu(Math.max(0, selectedIndex));
        return;
      }
      const option = props.options[active];
      if (option) {
        choose(option.value);
      }
      return;
    }
    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault();
        close();
      }
      return;
    }
    if (event.key === 'Tab') {
      if (open) {
        close();
      }
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      jumpTo(event.key);
    }
  };

  const menuNode = open ? (
    <ul
      ref={listRef}
      id={listId}
      role="listbox"
      className={mergeClasses(styles.selectMenu, GLASS_SCROLL_CLASS)}
      data-testid="wiz-list-menu"
      style={{
        position: 'fixed',
        top: `${menu.top}px`,
        left: `${menu.left}px`,
        width: `${menu.width}px`,
        maxHeight: `${menu.maxHeight}px`,
        ...menuTypeStyle()
      }}
    >
      {props.options.map((option, i) => {
        const isSelected = option.value === props.value;
        const isActive = i === active;
        return (
          <li
            key={option.value || `empty-${i}`}
            id={`${listId}-opt-${i}`}
            role="option"
            data-index={i}
            data-testid="wiz-list-option"
            aria-selected={isSelected}
            className={mergeClasses(styles.selectOption, isActive && styles.selectOptionActive, isSelected && styles.selectOptionOn)}
            style={menuTypeStyle(isSelected ? MENU_COLOR : MENU_OPTION_COLOR)}
            onMouseEnter={() => setActive(i)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(option.value)}
          >
            <span className={styles.selectOptionLabel}>{option.label}</span>
            {isSelected ? <span className={styles.selectCheck} data-testid="wiz-list-check" aria-hidden="true"><Checkmark16Filled /></span> : null}
          </li>
        );
      })}
    </ul>
  ) : null;

  const doc = triggerRef.current ? triggerRef.current.ownerDocument : (typeof document !== 'undefined' ? document : undefined);

  return (
    <div className={styles.selectWrap}>
      <button
        ref={triggerRef}
        type="button"
        id={props.id}
        className={mergeClasses(styles.selectTrigger, open && styles.selectTriggerOpen)}
        data-testid={props['data-testid']}
        disabled={props.disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-opt-${active}` : undefined}
        role="combobox"
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKeyDown}
      >
        <span className={selected ? styles.selectValue : styles.selectPlaceholder}>{selected ? selected.label : props.placeholder}</span>
        <ChevronDown16Regular className={mergeClasses(styles.selectChevron, open && styles.selectChevronOpen)} aria-hidden="true" />
      </button>
      {menuNode && doc && doc.body ? createPortal(menuNode, doc.body) : null}
    </div>
  );
}
