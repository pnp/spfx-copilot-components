import * as React from 'react';

const glyphs = {
  search: 'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  menu: 'M4 6h16M4 12h16M4 18h16', arrow: 'M3 12h16m-6-6 6 6-6 6', launch: 'M5 19 18 6M8 6h10v10',
  chat: 'M20 17a3 3 0 0 1-3 3H8l-5 2 1-6V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4Zm-12-7h9m-9 4h6',
  device: 'M3 4h18v13H3Zm5 17h8m-4-4v4', apps: 'M3 5h8v8H3Zm11 6h7v10h-7ZM5 16h6v5H5Zm11-9 3-4 3 4-3 3Z',
  book: 'M12 5Q8 2 3 4v15q5-2 9 1 4-3 9-1V4q-5-2-9 1Zm0 0v15',
  shield: 'm12 2 8 4v6q0 6-8 10-8-4-8-10V6Zm-4 10 3 3 5-6', bell: 'M4 17h16l-2-4V9a6 6 0 0 0-12 0v4Zm5 2a3 3 0 0 0 6 0',
  plus: 'M3 12h18M12 3v18', pulse: 'M2 14h5l3-9 4 14 3-8h5'
};
export function TechIcon({ name }: { name: keyof typeof glyphs }): React.ReactElement {
  return <svg className="tw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true"><path d={glyphs[name]}/></svg>;
}
export function DeviceArt({ type = 'Laptop' }: { type?: string }): React.ReactElement {
  return <span aria-hidden="true" className="tw-family-art" data-family={type}/>;
}
export function EquipmentArt({ category }: { category: 'Displays' | 'Docks' | 'Audio' }): React.ReactElement {
  if (category === 'Audio') return <DeviceArt type="Headset"/>;
  return <svg viewBox="0 0 300 145" aria-hidden="true" focusable="false">{category === 'Displays' ?
    <g transform="rotate(-3 150 73)"><path fill="#7683ac" d="M142 97h16l4 25 25 4-2 4h-72l2-4 23-5z"/><rect x="46" y="12" width="207" height="100" rx="6" fill="#435078"/><path fill="#c7dcfe" d="M52 18h195v85H52z"/><path fill="#a59cda" d="M52 98Q95 37 143 71t104-35v67H52z"/><path fill="#cfb4e5" d="M52 102q48-39 97-13t98-37v51H52z"/></g> :
    <g><path fill="none" stroke="#667195" strokeWidth="5" d="M207 60q47-43 50-7t-1 48"/><path fill="#515d80" d="m250 96 13 1-1 17-11-1z"/><path fill="#adb9d7" d="m46 72 135-39 53 24-135 42z"/><path fill="#7380a7" d="m46 72 53 27v18L46 90z"/><path fill="#4a577b" d="m99 99 135-42-1 19-134 41z"/><g fill="#cdd5ea"><path d="m116 101 17-5v5l-17 5zm28-8 17-5v5l-17 5zm31-10 23-7v5l-23 7z"/></g></g>}
  </svg>;
}
