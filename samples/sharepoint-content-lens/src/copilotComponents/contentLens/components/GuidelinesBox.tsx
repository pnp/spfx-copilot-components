import * as React from 'react';
import {
  Field, Menu, MenuButton, MenuItemCheckbox, MenuList, MenuPopover, MenuTrigger, Textarea, makeStyles
} from '@fluentui/react-components';
import { maxGuidelineChars } from '../domain/contracts';
import { useContentLensStyles } from './ContentLens.styles';
import { format } from './viewUtils';

export interface IGuidelinesBoxProps {
  strings: IContentLensStrings;
  /** The guidelines a page check uses, one per line: what Copilot gets is what the box shows. */
  text: string;
  disabled: boolean;
  /** The example page has prepared answers only for its own guidelines. */
  demoNotice?: boolean;
  onTextChange(value: string): void;
}

const useStyles = makeStyles({
  textarea: { width: '100%', minWidth: 0 },
  // The menu renders inline in the card, so it needs its own stacking level above the text box that follows it.
  menuPopover: { zIndex: 1 }
});

/** Common guidelines, each with a stable id; their text is a line the reviewer can edit once it is in the box. */
export const commonGuidelineIds = [
  'dates', 'readers', 'sentences', 'abbreviations', 'activeVoice', 'neutral', 'promises', 'emphasis'
] as const;
export interface CommonGuideline { id: typeof commonGuidelineIds[number]; text: string; }

export function commonGuidelines(s: IContentLensStrings): CommonGuideline[] {
  const texts: Record<CommonGuideline['id'], string> = {
    dates: s.GuidelineDates,
    readers: s.GuidelineReaders,
    sentences: s.GuidelineSentences,
    abbreviations: s.GuidelineAbbreviations,
    activeVoice: s.GuidelineActiveVoice,
    neutral: s.GuidelineNeutral,
    promises: s.GuidelinePromises,
    emphasis: s.GuidelineEmphasis
  };
  return commonGuidelineIds.map(id => ({ id, text: texts[id] }));
}

const normalizeLine = (value: string): string => value.replace(/\s+/g, ' ').trim().toLowerCase();
/** A guideline counts as present when one line of the text is exactly it, ignoring case and spacing. */
export function hasLine(text: string, line: string): boolean {
  return text.split('\n').some(item => normalizeLine(item) === normalizeLine(line));
}
/** Adds a guideline on its own line, after the text as written. */
export function addLine(text: string, line: string): string {
  return text.trim() ? text.replace(/\s+$/, '') + '\n' + line : line;
}
/** Removes a guideline's line and any leading blank lines, and shortens a run of blank lines to one. Other lines stay as written. */
export function removeLine(text: string, line: string): string {
  return text.split('\n')
    .filter(item => normalizeLine(item) !== normalizeLine(line))
    .join('\n')
    .replace(/^\n+/, '')
    .replace(/\n{3,}/g, '\n\n');
}

/** What the page should follow, one guideline per line. A menu adds common ones. */
export function GuidelinesBox({ strings: s, text, disabled, demoNotice, onTextChange }: IGuidelinesBoxProps): React.ReactElement {
  const styles = useContentLensStyles();
  const local = useStyles();
  const common = commonGuidelines(s);
  // The menu's ticks mirror the box: a common guideline is ticked while its line is in the text.
  const present = common.filter(item => hasLine(text, item.text)).map(item => item.id);
  // A guideline can be added while the text stays within the limit; a ticked one stays enabled so it can be removed.
  const fits = (item: CommonGuideline): boolean =>
    present.indexOf(item.id) >= 0 || addLine(text, item.text).trim().length <= maxGuidelineChars;
  const change = (checked: string[]): void => {
    let next = text;
    common.forEach(item => {
      const ticked = checked.indexOf(item.id) >= 0;
      const wasTicked = present.indexOf(item.id) >= 0;
      if (ticked && !wasTicked) next = addLine(next, item.text);
      else if (!ticked && wasTicked) next = removeLine(next, item.text);
    });
    if (next !== text) onTextChange(next);
  };
  const tooLong = text.trim().length > maxGuidelineChars;
  const tooLongMessage = tooLong
    ? format(s.GuidelinesTooLong, maxGuidelineChars.toLocaleString(), text.trim().length.toLocaleString())
    : undefined;
  return <div className={styles.field}>
    <div className={styles.fieldHead}>
      <Menu inline checkedValues={{ common: present }} onCheckedValueChange={(_event, data) => change(data.checkedItems)}>
        <MenuTrigger>
          <MenuButton appearance="secondary" size="small" className={styles.small} disabled={disabled} data-testid="common-guidelines">
            {s.AddCommonGuidelines}
          </MenuButton>
        </MenuTrigger>
        <MenuPopover className={local.menuPopover}>
          <MenuList>
            {common.map(item => <MenuItemCheckbox key={item.id} name="common" value={item.id} disabled={!fits(item)}>
              {item.text}
            </MenuItemCheckbox>)}
          </MenuList>
        </MenuPopover>
      </Menu>
    </div>
    <Field validationState={tooLong ? 'error' : 'none'} validationMessage={tooLongMessage}
      hint={demoNotice ? s.RulesFixtureNotice : undefined}>
      <Textarea aria-label={s.RulesHeading} className={local.textarea} value={text} disabled={disabled} resize="vertical" rows={4}
        placeholder={s.GuidelinesPlaceholder} data-testid="guidelines" onChange={(_event, data) => onTextChange(data.value)} />
    </Field>
  </div>;
}
