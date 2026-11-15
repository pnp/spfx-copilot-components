import * as React from 'react';
import { Button, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import type { CategoryId, ReviewFinding, ReviewSource } from '../domain/contracts';
import { categoryIds } from '../domain/contracts';
import { useContentLensStyles } from './ContentLens.styles';
import { highlightedEvidence } from './evidence';
import { OpenSourceLink, Pagination, SourceMetadata } from './SourceParts';
import { format, formatNodes, pageOf, sourceKey, unique } from './viewUtils';

export interface ICommentGroup { source: ReviewSource; findings: ReviewFinding[]; }

export interface ICommentsResultProps {
  strings: IContentLensStrings;
  labels: Record<CategoryId, string>;
  descriptions: Record<CategoryId, string>;
  headingRef: React.RefObject<HTMLHeadingElement>;
  siteTitle: string;
  /** "Comments · last 7 days · pages and news". */
  scope: string;
  demo: boolean;
  total: number;
  reviewed: number;
  flagged: ICommentGroup[];
  pending: ReviewSource[];
  unreviewed: ReviewSource[];
  clean: ReviewSource[];
  /** Comments whose review did not complete although some findings stand. */
  partlyReviewed: Set<string>;
  /** Comments the next request would review; Review N more is the card's only primary button. */
  canReviewMore: boolean;
  nextReviewCount?: number;
  canCheckMore: boolean;
  capped: boolean;
  busy: boolean;
  coolingDown: boolean;
  expanded: string[];
  pages: Record<string, number>;
  /** A notice to show, e.g. that Copilot gave no usable answer. */
  notice?: string;
  onReviewMore(): void;
  onCheckMore(): void;
  onRetry(): void;
  onToggle(key: string): void;
  onPageChange(list: string, page: number): void;
  onOpenLink(url: string): void;
  /** Back to the start, for another site or period. */
  onNewCheck(): void;
}

const useDiscussionStyles = makeStyles({
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' },
  item: { minWidth: 0 },
  row: {
    display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '12px',
    '@container (min-width: 900px)': { gridTemplateColumns: 'minmax(0,2fr) minmax(220px,1fr)' }
  },
  message: {
    display: 'grid', gridTemplateColumns: '28px minmax(0,1fr)', gap: '10px', padding: '12px', borderRadius: '6px',
    backgroundColor: tokens.colorNeutralBackground2, minWidth: 0
  },
  reply: { marginLeft: '24px' },
  avatar: {
    borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: tokens.colorBrandBackground2, color: tokens.colorBrandForeground1, fontSize: '12px'
  },
  author: { margin: 0, fontSize: '12px', lineHeight: '18px', fontWeight: 500 },
  note: {
    border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: '6px', padding: '10px 12px', alignSelf: 'start',
    display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0
  },
  page: { margin: '16px 0 8px', fontSize: '16px', fontWeight: 500 },
  copy: { margin: '4px 0', fontSize: '14px', lineHeight: '1.65', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }
});

/** The loaded discussion, including unflagged messages. Each message shows its review status. */
export function CommentsResult(props: ICommentsResultProps): React.ReactElement {
  const { strings: s } = props;
  const styles = useContentLensStyles();
  const threadStyles = useDiscussionStyles();
  const all = new Map<string, { source: ReviewSource; findings: ReviewFinding[]; status: string }>();
  const withoutFindings: Array<[ReviewSource[], string]> = [
    [props.clean, s.StatusClean],
    [props.pending, s.StatusPending],
    [props.unreviewed, s.StatusNotReviewed]
  ];
  withoutFindings.forEach(([sources, status]) => {
    sources.forEach(source => all.set(sourceKey(source), { source, findings: [], status }));
  });
  props.flagged.forEach(item => {
    const key = sourceKey(item.source);
    all.set(key, { ...item, status: props.partlyReviewed.has(key) ? s.PartlyReviewed : '' });
  });
  const sorted = Array.from(all.values()).sort((a, b) =>
    a.source.pageTitle.localeCompare(b.source.pageTitle) || a.source.createdAt.localeCompare(b.source.createdAt));
  const samePage = (a: ReviewSource, b: ReviewSource): boolean =>
    a.siteUrl === b.siteUrl && a.listId === b.listId && a.pageItemId === b.pageItemId;
  const hasParent = (source: ReviewSource): boolean => !!source.parentCommentId && sorted.some(item =>
    samePage(item.source, source) && item.source.kind === 'comment' && item.source.commentId === source.parentCommentId);
  const isReplyTo = (reply: ReviewSource, parent: ReviewSource): boolean => parent.kind === 'comment' && !!parent.commentId
    && reply.kind === 'reply' && samePage(reply, parent) && reply.parentCommentId === parent.commentId;
  // Each top-level message is followed by its replies.
  const discussion = sorted.filter(item => !hasParent(item.source)).reduce<typeof sorted>((items, item) => {
    items.push(item);
    items.push(...sorted.filter(reply => isReplyTo(reply.source, item.source)));
    return items;
  }, []);
  const discussionPageSize = 20;
  const attention = pageOf(discussion, props.pages.attention || 0, discussionPageSize);
  const link = (source: ReviewSource): React.ReactNode => props.demo
    ? undefined
    : <OpenSourceLink source={source} strings={s} onOpen={props.onOpenLink} />;
  const verdict = props.flagged.length
    ? formatNodes(
      s.CommentsVerdict,
      <strong key="n">{format(props.flagged.length === 1 ? s.CommentsCountOne : s.CommentsCount, props.flagged.length)}</strong>,
      props.reviewed,
      props.total
    )
    : format(s.CommentsVerdictNone, props.reviewed, props.total);
  return <section className={styles.stack} aria-label={s.ReviewWorkspace} data-testid="comments-result">
    <div className={styles.tight}>
      <h1 ref={props.headingRef} tabIndex={-1} className={styles.pageTitle}>{props.siteTitle}</h1>
      <p className={styles.meta}>{props.scope}</p>
    </div>
    <div className={styles.stack} style={{ gap: '12px' }}>
      <p className={styles.verdict} data-testid="review-status">{verdict}</p>
      {props.canReviewMore && !props.busy && <div>
        <Button className={styles.primary} appearance="primary" onClick={props.onReviewMore}>
          {format(s.ReviewMore, props.nextReviewCount ?? props.pending.length)}
        </Button>
      </div>}
      {props.notice && <p className={styles.warning}>{props.notice}</p>}
      {props.capped && <p className={styles.warning}>{s.ReviewLimitReached}</p>}
      <div className={styles.actions}>
        {props.unreviewed.length > 0 && !props.busy && !props.demo && <Button className={styles.small} appearance="secondary"
          size="small" onClick={props.onRetry}>{s.RetryNotReviewed}</Button>}
        {props.canCheckMore && !props.busy && <Button className={styles.small} appearance="secondary" size="small"
          disabled={props.coolingDown} onClick={props.onCheckMore}>{s.CheckMore}</Button>}
      </div>
    </div>
    <p className={styles.meta}>{s.Preview.discussionScope}</p>
    <ol className={threadStyles.list} data-testid="comment-findings" aria-label={s.Preview.discussion}>
      {attention.visible.map(({ source, findings, status }, index) => {
        const key = sourceKey(source);
        const open = props.expanded.indexOf(key) >= 0;
        const flagged = unique(findings.map(finding => finding.categoryId))
          .sort((a, b) => categoryIds.indexOf(a) - categoryIds.indexOf(b));
        const uncertain = findings.length > 0 && findings.every(finding => finding.needsContext);
        const author = source.commentAuthor || s.Preview.anonymous;
        const initials = source.commentAuthor
          ? source.commentAuthor.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()
          : '·';
        const number = props.flagged.findIndex(item => sourceKey(item.source) === key) + 1;
        const previous = attention.visible[index - 1]?.source;
        const markClass = mergeClasses(styles.mark, uncertain && styles.uncertain);
        return <li key={key} className={threadStyles.item} data-testid={findings.length ? 'finding-card' : 'discussion-message'}>
          {(!previous || !samePage(previous, source)) && <h2 className={threadStyles.page}>{source.pageTitle}</h2>}
          <div className={threadStyles.row}>
            <article className={mergeClasses(threadStyles.message, source.kind === 'reply' && threadStyles.reply)}>
              <span className={threadStyles.avatar} aria-hidden="true">{initials}</span>
              <div className={styles.tight}>
                <p className={threadStyles.author}>{author}</p>
                <SourceMetadata source={source} strings={s} note={status || undefined} />
                {source.kind === 'reply' && !hasParent(source) && <p className={styles.meta}>{s.Preview.parentMissing}</p>}
                <p className={threadStyles.copy}>
                  {highlightedEvidence(source.text, findings.map(finding => finding.excerpt), false, markClass)}
                </p>
                {open && <div className={styles.context}>
                  <p className={styles.contextText}>{source.contextText || s.NoAdditionalContext}</p>
                  <p className={styles.meta}>{s.ContextCoverage}</p>
                </div>}
                <div className={styles.actions}>
                  <Button className={styles.small} appearance="transparent" size="small" aria-expanded={open}
                    onClick={() => props.onToggle(key)}>{open ? s.HideDiscussion : s.ShowDiscussion}</Button>
                  {link(source)}
                </div>
              </div>
            </article>
            {!!findings.length && <aside className={threadStyles.note}>
              <p className={styles.meta}><span>{number}</span> · {props.demo ? s.Comparison.prepared : s.Preview.copilot}</p>
              {flagged.map(category => {
                const own = findings.filter(finding => finding.categoryId === category);
                const explanation = unique(own.map(finding => finding.explanation.trim()).filter(Boolean)).join(' ');
                const context = own.every(finding => finding.needsContext);
                const description = props.descriptions[category];
                // Without an explanation from Copilot, the line says what the check covers.
                const fallback = description ? description.charAt(0).toUpperCase() + description.slice(1) : '';
                const text = [explanation || fallback, context ? s.NeedsContextNote : ''].filter(Boolean).join(' ');
                return <p key={category} className={styles.noteLineSmall}>
                  <strong>{props.labels[category]}</strong>{text ? ' · ' + text : ''}
                </p>;
              })}
            </aside>}
          </div>
        </li>;
      })}
    </ol>
    {discussion.length > discussionPageSize && <Pagination pageSize={discussionPageSize} total={discussion.length}
      page={attention.page} label={s.ContentPagination} strings={s} onChange={page => props.onPageChange('attention', page)} />}
    <div className={styles.footer}>
      <p className={styles.footnote}>{s.SessionNotice}</p>
      <div className={styles.actions}>
        <Button className={styles.secondary} appearance="secondary" onClick={props.onNewCheck}>{s.NewCheck}</Button>
      </div>
    </div>
  </section>;
}
