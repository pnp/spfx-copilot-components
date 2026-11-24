import * as React from 'react';
import { Button, Link, mergeClasses } from '@fluentui/react-components';
import type { ReviewSource } from '../domain/contracts';
import { useContentLensStyles } from './ContentLens.styles';
import { format, itemsPerPage } from './viewUtils';

/** Page, kind and date of a comment, e.g. "Hybrid work guidelines · reply · 23 September 2026". */
export function SourceMetadata({ source, strings: s, note }: {
  source: ReviewSource;
  strings: IContentLensStrings;
  note?: string;
}): React.ReactElement {
  const styles = useContentLensStyles();
  const kind = source.kind === 'reply' ? s.Reply : source.kind === 'page' ? s.Page : s.Comment;
  const created = new Date(source.createdAt);
  return <p className={styles.meta}>{source.pageTitle} · {kind} · <time dateTime={source.createdAt} title={created.toLocaleString()}>
    {created.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</time>
    {note && <> · <span className={styles.warnSentence}>{note}</span></>}</p>;
}

export interface IOpenSourceLinkProps {
  source: ReviewSource;
  strings: IContentLensStrings;
  onOpen(url: string): void;
}

/** Opens the page through the host. A source without a URL, such as an example page, shows a note instead of a link. */
export function OpenSourceLink({ source, strings: s, onOpen }: IOpenSourceLinkProps): React.ReactElement {
  const styles = useContentLensStyles();
  const url = source.sourceUrl;
  if (!url) return <p className={styles.meta}>{s.FictionalNoLink}</p>;
  // A real link, so it is found among links and can be copied; the host does the opening.
  return <Link data-interception="off" href={url} target="_blank" rel="noopener noreferrer" className={styles.smallLink}
    aria-label={s.OpenPage + ' · ' + source.pageTitle}
    onClick={event => {
      event.preventDefault();
      onOpen(url);
    }}>
    {s.OpenPage}
  </Link>;
}

export interface IPaginationProps {
  pageSize?: number;
  total: number;
  page: number;
  label: string;
  strings: IContentLensStrings;
  onChange(page: number): void;
}

/** Previous and next for a list longer than one page; its owner shows it only then. */
export function Pagination({ total, page, label, strings: s, onChange, pageSize = itemsPerPage }: IPaginationProps): React.ReactElement {
  const styles = useContentLensStyles();
  const range = format(s.ItemRange, page * pageSize + 1, Math.min(total, (page + 1) * pageSize), total);
  return <nav className={mergeClasses(styles.row, styles.between)} aria-label={label}>
    <Button size="small" appearance="subtle" disabled={page === 0} onClick={() => onChange(page - 1)}>{s.PreviousItems}</Button>
    <p className={styles.meta} role="status">{range}</p>
    <Button size="small" appearance="subtle" disabled={(page + 1) * pageSize >= total} onClick={() => onChange(page + 1)}>
      {s.NextItems}
    </Button>
  </nav>;
}
