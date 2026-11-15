import * as React from 'react';
import { Select } from '@fluentui/react-components';

export type PreviewZoomValue = 'fit' | number;

const zoomPercents = [25, 33, 50, 67, 75, 90, 100, 125, 150];

/** One controlled setting can drive both comparison frames without reloading either page. */
export function PreviewZoom({ value, onChange, strings, shared = false }: {
  value: PreviewZoomValue;
  onChange(value: PreviewZoomValue): void;
  strings: IContentLensStrings;
  shared?: boolean;
}): React.ReactElement {
  return <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
    {shared ? strings.Preview.zoomBoth : strings.Preview.zoom}
    <Select size="small" value={String(value)} onChange={(_, data) => onChange(data.value === 'fit' ? 'fit' : Number(data.value))}>
      <option value="fit">{strings.Preview.fit}</option>
      {zoomPercents.map(percent => <option key={percent} value={percent}>{percent}%</option>)}
    </Select>
  </label>;
}
