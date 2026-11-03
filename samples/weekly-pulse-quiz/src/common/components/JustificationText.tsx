import * as React from 'react';
import { previewJustification } from '../logic/feedback';

/** Justification with a "Read more" / "Show less" toggle for long text (used in dialog and Copilot panel). */
export function JustificationText(props: { text: string; id: string }): React.ReactElement {
  const [expanded, setExpanded] = React.useState(false);
  const preview = previewJustification(props.text);
  return (
    <div>
      <p className="wpq__justification" id={props.id} data-testid="wpq-justification">
        {expanded || !preview.isLong ? preview.full : preview.preview}
      </p>
      {preview.isLong && (
        <button type="button" className="wpq__link" aria-expanded={expanded} aria-controls={props.id} onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}
