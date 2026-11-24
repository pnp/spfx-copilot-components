import * as React from 'react';
import { mergeClasses } from '@fluentui/react-components';
import { Checkmark16Filled } from '@fluentui/react-icons';
import type { AnswerValue, IWizardField } from '../models';
import { asList, asText, toggleOption } from '../logic/answers';
import { joinDateTime, splitDateTime, timeZoneLabel } from '../logic/dateTime';
import { currencySymbolForLocaleId } from '../logic/currency';
import { asHyperlink, HYPERLINK_DESC_MAX } from '../logic/hyperlink';
import { NO_LABEL, YES_LABEL } from '../logic/yesNo';
import { optionDelay, useWizardStyles } from './styles';

export interface IStepFieldProps {
  field: IWizardField;
  /** string for most steps; string[] for multichoice; "YYYY-MM-DDTHH:mm" for datetime. */
  value: AnswerValue;
  inputId: string;
  labelId: string;
  describedBy: string;
  invalid: boolean;
  compact: boolean;
  /** Motion on: options fade in one after another and buttons lift on hover. */
  motion?: boolean;
  onChange(value: AnswerValue): void;
  /** Enter (or Ctrl/Cmd+Enter in a multi-line step). */
  onSubmitStep(): void;
  /** A choice was picked by click or letter key (used for auto-advance). */
  onPicked?(value: string): void;
  /** Receives the element that should get focus when the step appears. */
  // eslint-disable-next-line @rushstack/no-new-null
  focusRef: React.MutableRefObject<HTMLElement | null>;
}

export function choiceKeyLabel(index: number): string {
  return index < 26 ? String.fromCharCode(65 + index) : String(index + 1);
}

/** Index for a pressed letter key (A = 0), or -1. */
export function choiceIndexForKey(key: string, count: number): number {
  if (!key || key.length !== 1) {
    return -1;
  }
  const code = key.toUpperCase().charCodeAt(0) - 65;
  return code >= 0 && code < Math.min(count, 26) ? code : -1;
}

function isPlainEnter(e: React.KeyboardEvent): boolean {
  return e.key === 'Enter' && !e.shiftKey && !e.altKey && !(e.nativeEvent as KeyboardEvent).isComposing;
}

export function StepField(props: IStepFieldProps): React.ReactElement {
  const { field, inputId, labelId, describedBy, invalid, compact, onChange, onSubmitStep, onPicked, focusRef } = props;
  const motion = !!props.motion;
  const value = asText(props.value);
  const styles = useWizardStyles();
  const optionRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  // Multichoice roving tab stop (which checkbox Tab lands on). Declared for every kind to keep hook order stable.
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);
  const aria = {
    'aria-describedby': describedBy || undefined,
    'aria-invalid': invalid || undefined,
    'aria-required': field.required || undefined
  };

  if (field.kind === 'choice') {
    const selected = field.choices.indexOf(value);
    const tabStop = selected >= 0 ? selected : 0;
    const pick = (index: number, focus: boolean, viaPointerOrKey: boolean): void => {
      const choice = field.choices[index];
      if (choice === undefined) {
        return;
      }
      const changed = choice !== value;
      onChange(choice);
      if (focus && optionRefs.current[index]) {
        (optionRefs.current[index] as HTMLButtonElement).focus({ preventScroll: true });
      }
      if (changed && viaPointerOrKey && onPicked) {
        onPicked(choice);
      }
    };
    const onKeyDown = (e: React.KeyboardEvent): void => {
      const current = selected >= 0 ? selected : optionRefs.current.indexOf(e.target as HTMLButtonElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        pick(Math.min(field.choices.length - 1, current + 1), true, false);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        pick(Math.max(0, current - 1), true, false);
      } else if (isPlainEnter(e)) {
        e.preventDefault();
        onSubmitStep();
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const index = choiceIndexForKey(e.key, field.choices.length);
        if (index >= 0) {
          e.preventDefault();
          pick(index, true, true);
        }
      }
    };
    return (
      <div role="radiogroup" aria-labelledby={labelId} {...aria} className={styles.choices} onKeyDown={onKeyDown}>
        {field.choices.map((choice, index) => {
          const isSelected = index === selected;
          return (
            <button
              key={choice}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={index === tabStop ? 0 : -1}
              className={mergeClasses(styles.choice, compact && styles.choiceCompact, motion && styles.choiceMotion, isSelected && styles.choiceSelected)}
              style={motion ? optionDelay(index) : undefined}
              data-choice={choice}
              ref={(el) => {
                optionRefs.current[index] = el;
                if (index === tabStop) {
                  focusRef.current = el;
                }
              }}
              onClick={() => pick(index, false, true)}
            >
              <span className={mergeClasses(styles.choiceKey, isSelected && styles.choiceKeySelected)} aria-hidden="true">
                {choiceKeyLabel(index)}
              </span>
              <span className={styles.choiceLabel}>{choice}</span>
              {isSelected ? <Checkmark16Filled className={styles.choiceCheck} aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
    );
  }

  if (field.kind === 'multichoice') {
    const picked = asList(props.value);
    let firstPicked = 0;
    for (let i = field.choices.length - 1; i >= 0; i--) {
      if (picked.indexOf(field.choices[i]) >= 0) {
        firstPicked = i;
      }
    }
    const tabStop = activeIndex >= 0 && activeIndex < field.choices.length ? activeIndex : firstPicked;
    const focusOption = (index: number): void => {
      setActiveIndex(index);
      const el = optionRefs.current[index];
      if (el) {
        el.focus({ preventScroll: true });
      }
    };
    const toggle = (index: number): void => {
      const choice = field.choices[index];
      if (choice !== undefined) {
        onChange(toggleOption(props.value, choice, field.choices));
      }
    };
    const onKeyDown = (e: React.KeyboardEvent): void => {
      const current = Math.max(0, optionRefs.current.indexOf(e.target as HTMLButtonElement));
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        focusOption(Math.min(field.choices.length - 1, current + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        focusOption(Math.max(0, current - 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        focusOption(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        focusOption(field.choices.length - 1);
      } else if (isPlainEnter(e)) {
        // Enter moves on (it never toggles); Space toggles through the button's native click.
        e.preventDefault();
        onSubmitStep();
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const index = choiceIndexForKey(e.key, field.choices.length);
        if (index >= 0) {
          e.preventDefault();
          toggle(index);
          focusOption(index);
        }
      }
    };
    return (
      <div role="group" aria-labelledby={labelId} {...aria} className={styles.choices} onKeyDown={onKeyDown}>
        {field.choices.map((choice, index) => {
          const isChecked = picked.indexOf(choice) >= 0;
          return (
            <button
              key={choice}
              type="button"
              role="checkbox"
              aria-checked={isChecked}
              tabIndex={index === tabStop ? 0 : -1}
              className={mergeClasses(styles.choice, compact && styles.choiceCompact, motion && styles.choiceMotion, isChecked && styles.choiceSelected)}
              style={motion ? optionDelay(index) : undefined}
              data-choice={choice}
              ref={(el) => {
                optionRefs.current[index] = el;
                if (index === tabStop) {
                  focusRef.current = el;
                }
              }}
              onFocus={() => setActiveIndex(index)}
              onClick={() => toggle(index)}
            >
              <span className={mergeClasses(styles.choiceKey, isChecked && styles.choiceKeySelected)} aria-hidden="true">
                {choiceKeyLabel(index)}
              </span>
              <span className={styles.choiceLabel}>{choice}</span>
              <span className={mergeClasses(styles.checkBox, isChecked && styles.checkBoxChecked)} aria-hidden="true">
                {isChecked ? <Checkmark16Filled /> : null}
              </span>
            </button>
          );
        })}
      </div>
    );
  }


  if (field.kind === 'yesno') {
    const options = [YES_LABEL, NO_LABEL];
    const keys = ['Y', 'N'];
    const selected = options.indexOf(value);
    const tabStop = selected >= 0 ? selected : 0;
    const pick = (index: number, focus: boolean, viaPointerOrKey: boolean): void => {
      const choice = options[index];
      if (choice === undefined) {
        return;
      }
      const changed = choice !== value;
      onChange(choice);
      if (focus && optionRefs.current[index]) {
        (optionRefs.current[index] as HTMLButtonElement).focus({ preventScroll: true });
      }
      if (changed && viaPointerOrKey && onPicked) {
        onPicked(choice);
      }
    };
    const onKeyDown = (e: React.KeyboardEvent): void => {
      const current = selected >= 0 ? selected : optionRefs.current.indexOf(e.target as HTMLButtonElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        pick(Math.min(options.length - 1, current + 1), true, false);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        pick(Math.max(0, current - 1), true, false);
      } else if (isPlainEnter(e)) {
        e.preventDefault();
        onSubmitStep();
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const letter = e.key.toUpperCase();
        const index = keys.indexOf(letter);
        if (index >= 0) {
          e.preventDefault();
          pick(index, true, true);
        }
      }
    };
    return (
      <div role="radiogroup" aria-labelledby={labelId} {...aria} className={styles.yesNo} onKeyDown={onKeyDown} data-testid="wiz-yesno">
        {options.map((choice, index) => {
          const isSelected = index === selected;
          return (
            <button
              key={choice}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={index === tabStop ? 0 : -1}
              className={mergeClasses(styles.yesNoButton, compact && styles.yesNoButtonCompact, motion && styles.choiceMotion, isSelected && styles.choiceSelected)}
              style={motion ? optionDelay(index) : undefined}
              data-choice={choice}
              ref={(el) => {
                optionRefs.current[index] = el;
                if (index === tabStop) {
                  focusRef.current = el;
                }
              }}
              onClick={() => pick(index, false, true)}
            >
              <span className={mergeClasses(styles.choiceKey, isSelected && styles.choiceKeySelected)} aria-hidden="true">
                {keys[index]}
              </span>
              <span className={styles.choiceLabel}>{choice}</span>
              {isSelected ? <Checkmark16Filled className={styles.choiceCheck} aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
    );
  }

  const fieldClass = mergeClasses(styles.field, compact && styles.fieldCompact, invalid && styles.fieldInvalid);

  if (field.kind === 'hyperlink') {
    const link = asHyperlink(props.value);
    const descId = `${inputId}-description`;
    const onEnter = (e: React.KeyboardEvent): void => {
      if (isPlainEnter(e)) {
        e.preventDefault();
        onSubmitStep();
      }
    };
    const setLink = (next: { url?: string; description?: string }): void => {
      onChange({ url: next.url !== undefined ? next.url : link.url, description: next.description !== undefined ? next.description : link.description });
    };
    return (
      <div className={styles.hyperlinkFields} data-testid="wiz-hyperlink">
        <div>
          <label htmlFor={inputId} className={styles.subLabel}>
            Link
          </label>
          <input
            id={inputId}
            className={fieldClass}
            type="url"
            inputMode="url"
            autoComplete="url"
            value={link.url}
            placeholder="https://"
            {...aria}
            ref={(el: HTMLInputElement | null) => {
              focusRef.current = el;
            }}
            onChange={(e) => setLink({ url: e.target.value })}
            onKeyDown={onEnter}
            data-testid="wiz-hyperlink-url"
          />
        </div>
        <div>
          <label htmlFor={descId} className={styles.subLabel}>
            Description (optional)
          </label>
          <input
            id={descId}
            className={fieldClass}
            type="text"
            maxLength={HYPERLINK_DESC_MAX}
            value={link.description}
            placeholder="Text to show for this link"
            aria-describedby={describedBy || undefined}
            ref={(el: HTMLInputElement | null) => {
              if (!focusRef.current) {
                focusRef.current = el;
              }
            }}
            onChange={(e) => setLink({ description: e.target.value })}
            onKeyDown={onEnter}
            data-testid="wiz-hyperlink-description"
          />
        </div>
      </div>
    );
  }

  if (field.kind === 'currency' || field.kind === 'number') {
    const symbol = field.kind === 'currency' ? currencySymbolForLocaleId(field.currencyLocaleId) : '';
    const input = (
      <input
        id={inputId}
        className={fieldClass}
        type="text"
        inputMode="decimal"
        value={value}
        placeholder={field.kind === 'currency' ? 'Type an amount…' : 'Type a number…'}
        {...aria}
        ref={(el: HTMLInputElement | null) => {
          focusRef.current = el;
        }}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (isPlainEnter(e)) {
            e.preventDefault();
            onSubmitStep();
          }
        }}
        data-testid={field.kind === 'currency' ? 'wiz-currency-input' : undefined}
      />
    );
    if (!symbol) {
      return input;
    }
    return (
      <div className={styles.numberRow} data-testid="wiz-currency">
        <span className={mergeClasses(styles.currencySymbol, compact && styles.currencySymbolCompact)} aria-hidden="true">
          {symbol}
        </span>
        {input}
      </div>
    );
  }

  if (field.kind === 'datetime') {
    const { date, time } = splitDateTime(value);
    const dateId = `${inputId}-date`;
    const timeId = `${inputId}-time`;
    const zoneId = `${inputId}-zone`;
    const onEnter = (e: React.KeyboardEvent): void => {
      if (isPlainEnter(e)) {
        e.preventDefault();
        onSubmitStep();
      }
    };
    return (
      <div role="group" aria-labelledby={labelId} aria-describedby={[describedBy, zoneId].filter(Boolean).join(' ')} className={styles.dateTime}>
        <div className={styles.dateTimePart}>
          <label htmlFor={dateId} className={styles.dateTimeLabel}>
            Date
          </label>
          <input
            id={dateId}
            type="date"
            className={fieldClass}
            value={date}
            aria-invalid={invalid || undefined}
            aria-required={field.required || undefined}
            ref={(el: HTMLInputElement | null) => {
              focusRef.current = el;
            }}
            onChange={(e) => onChange(joinDateTime(e.target.value, time))}
            onKeyDown={onEnter}
          />
        </div>
        <div className={styles.dateTimePart}>
          <label htmlFor={timeId} className={styles.dateTimeLabel}>
            Time
          </label>
          <input
            id={timeId}
            type="time"
            className={fieldClass}
            value={time}
            aria-invalid={invalid || undefined}
            aria-required={field.required || undefined}
            onChange={(e) => onChange(joinDateTime(date, e.target.value))}
            onKeyDown={onEnter}
          />
        </div>
        <span id={zoneId} className={mergeClasses(styles.hint, styles.dateTimeZone)} data-testid="timezone-hint">
          Your time zone: {timeZoneLabel(value || undefined)}
        </span>
      </div>
    );
  }

  if (field.kind === 'note') {
    return (
      <textarea
        id={inputId}
        className={mergeClasses(fieldClass, styles.textarea, compact && styles.fieldCompact)}
        value={value}
        rows={compact ? 3 : 4}
        placeholder={'Type your answer here\u2026'}
        {...aria}
        ref={(el: HTMLTextAreaElement | null) => {
          focusRef.current = el;
        }}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onSubmitStep();
          }
        }}
      />
    );
  }

  return (
    <input
      id={inputId}
      className={fieldClass}
      type={field.kind === 'date' ? 'date' : 'text'}
      value={value}
      placeholder={field.kind === 'text' ? 'Type your answer here\u2026' : undefined}
      {...aria}
      ref={(el: HTMLInputElement | null) => {
        focusRef.current = el;
      }}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (isPlainEnter(e)) {
          e.preventDefault();
          onSubmitStep();
        }
      }}
    />
  );
}
