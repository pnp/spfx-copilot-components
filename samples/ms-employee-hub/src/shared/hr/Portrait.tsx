import * as React from 'react';

export default function Portrait(): React.ReactElement {
  return <figure className="hrw-campaign">
    <div className="hrw-campaign-composition" role="img" aria-label="Campaign photography: a laughing person in a blue arch and a smaller portrait of two people together.">
      <div className="hrw-campaign-flourish"/>
      <div className="hrw-campaign-cover"/>
      <div className="hrw-campaign-inset"/>
    </div>
    <div className="hrw-campaign-note" aria-hidden="true"><small>Field notes</small><strong>All of you.</strong><i>✳</i></div>
    <figcaption>Here to grow.<strong>Space to be you.</strong></figcaption>
  </figure>;
}
