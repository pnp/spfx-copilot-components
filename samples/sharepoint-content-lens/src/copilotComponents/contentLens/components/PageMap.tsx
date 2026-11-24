import * as React from 'react';
import { mergeClasses } from '@fluentui/react-components';
import type { PageStructure } from '../domain/contracts';
import type { MapBlock, PageNote } from './notes';
import { noteRange } from './notes';
import { useContentLensStyles } from './ContentLens.styles';
import { format } from './viewUtils';

export interface IPageMapProps {
  strings: IContentLensStrings;
  structure: PageStructure;
  blocks: MapBlock[];
  notes: PageNote[];
  selected?: string;
  /** Width the map has, for the stacking rule; 0 when unknown. */
  width: number;
  full: boolean;
  onSelect(blockId: string): void;
}

/** A text column narrower than this stacks its row, as SharePoint does on a phone. */
const minTextColumn = 130;
const gap = 6;

/**
 * The page drawn block by block in its sections and columns. Every block can be chosen to show its notes below
 * the map; blocks with notes are yellow and carry their note numbers, web parts are grey.
 */
export function PageMap({ strings: s, structure, blocks, notes, selected, width, full, onSelect }: IPageMapProps): React.ReactElement {
  const styles = useContentLensStyles();
  const blockFor = (id: string): MapBlock | undefined => blocks.find(block => block.id === id);
  const indexedSections = structure.sections.map((section, index) => ({ section, index }));
  const regular = indexedSections.filter(item => !item.section.vertical);
  const vertical = indexedSections.filter(item => item.section.vertical);
  const renderRow = ({ section, index }: { section: PageStructure['sections'][number]; index: number }): React.ReactNode => {
    const factors = section.columns.map((_column, columnIndex) => section.factors?.[columnIndex] || 1);
    const total = factors.reduce((sum, value) => sum + value, 0);
    // The width the narrowest text column would get if the row kept its columns side by side.
    const columnSpace = width - gap * (section.columns.length - 1);
    const narrowest = section.columns.reduce((min, column, columnIndex) => {
      if (!column.some(item => item.kind === 'text')) return min;
      return Math.min(min, (columnSpace * factors[columnIndex]) / total);
    }, Number.POSITIVE_INFINITY);
    const stacked = !full && width > 0 && section.columns.length > 1 && narrowest < minTextColumn;
    return <li key={index} className={mergeClasses(styles.mapRow, stacked && styles.mapRowStacked)}
      data-testid="map-row" data-stacked={stacked || undefined}>
      {section.columns.map((column, columnIndex) => <div key={columnIndex} className={styles.mapColumnCell}
        style={stacked ? undefined : { flex: `${factors[columnIndex]} 1 0`, minWidth: 0 }}>
        {column.map(item => {
          const block = blockFor(item.id);
          if (!block) return undefined;
          const ownNotes = notes.filter(note => note.blockId === block.id);
          const webPart = block.kind === 'webPart';
          const label = block.label || (webPart ? s.OutlineWebPart : s.OutlineTextBlock);
          // Every block can be chosen, also one without notes, so its accessible name always gives its note count.
          const notCheckedSuffix = block.notChecked ? ', ' + s.NotCheckedByCopilot : '';
          const name = webPart
            ? format(ownNotes.length ? s.BlockWebPartNotes : s.BlockWebPart, label, ownNotes.length)
            : format(ownNotes.length ? s.BlockNotes : s.BlockNoNotes, label, ownNotes.length) + notCheckedSuffix;
          const isSelected = selected === block.id;
          const className = mergeClasses(
            styles.block,
            full && styles.blockFull,
            styles.blockChoice,
            webPart && styles.blockWebPart,
            ownNotes.length > 0 && styles.blockNotes,
            isSelected && styles.blockSelected
          );
          return <button key={block.id} type="button" className={className} aria-pressed={isSelected} aria-label={name}
            data-testid="map-block" onClick={() => onSelect(block.id)}>
            <span className={mergeClasses(styles.blockLabel, webPart && styles.blockLabelWebPart)}>{label}</span>
            <span className={styles.blockFoot}>
              {!webPart && block.notChecked ? <span className={styles.blockWarn}>{s.NotCheckedByCopilot}</span> : <span />}
              {ownNotes.length > 0 && <span className={styles.blockNumbers}>{noteRange(ownNotes)}</span>}
            </span>
          </button>;
        })}
      </div>)}
    </li>;
  };
  return <ol className={styles.map} aria-label={s.MapLabel} data-testid="page-map">
    {regular.map(renderRow)}
    {vertical.length > 0 && <li aria-hidden="true"><p className={styles.mapVertical}>{s.OutlineVertical}</p></li>}
    {vertical.map(renderRow)}
  </ol>;
}
