/**
 * A canvas in the form a Site Pages list item stores it in `CanvasContent1`: HTML with one element per control,
 * its settings as entity-encoded JSON in `data-sp-controldata`, a text block's HTML inside `data-sp-rte`, and a web
 * part's searchable texts, HTML, links and images as child elements of `data-sp-htmlproperties`, emptied in its JSON.
 * The page API returns the same controls as a JSON array, which is what the controls here are written as.
 */
const encode = (value: unknown): string => JSON.stringify(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/\{/g, '&#123;').replace(/\}/g, '&#125;').replace(/:/g, '&#58;');
const text = (value: string): string => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attribute = (value: string): string => text(value).replace(/"/g, '&quot;');
const entries = (value: unknown): Array<[string, string]> => Object.keys(value && typeof value === 'object' ? value : {})
  .map(key => [key, String((value as Record<string, unknown>)[key])]);
const control = (data: unknown, inner: string = ''): string =>
  `<div data-sp-canvascontrol="" data-sp-canvasdataversion="1.0" data-sp-controldata="${encode(data)}">${inner}</div>`;

export function storedCanvas(controls: object[]): string {
  return '<div>' + (controls as Array<Record<string, unknown>>).map(({ innerHTML, webPartData, ...data }) => {
    if (data.controlType === 4) return control(data, `<div data-sp-rte="">${String(innerHTML || '')}</div>`);
    // Web parts and section backgrounds (control type 14) carry web part data.
    if (data.controlType !== 3 && !webPartData) return control(data);
    const part = webPartData && typeof webPartData === 'object' ? webPartData as Record<string, unknown> : {};
    const processed = part.serverProcessedContent && typeof part.serverProcessedContent === 'object' ? part.serverProcessedContent as Record<string, unknown> : {};
    const properties = [
      ...entries(processed.searchablePlainTexts).map(([name, value]) => `<div data-sp-prop-name="${attribute(name)}" data-sp-searchableplaintext="true">${text(value)}</div>`),
      ...entries(processed.htmlStrings).map(([name, value]) => `<div data-sp-prop-name="${attribute(name)}">${value}</div>`),
      ...entries(processed.links).map(([name, value]) => `<a data-sp-prop-name="${attribute(name)}" href="${attribute(value)}"></a>`),
      ...entries(processed.imageSources).map(([name, value]) => `<img data-sp-prop-name="${attribute(name)}" src="${attribute(value)}" />`)
    ].join('');
    const stored = { ...part, serverProcessedContent: { ...processed, htmlStrings: {}, searchablePlainTexts: {}, imageSources: {}, links: {} } };
    return control(data, `<div data-sp-webpart="" data-sp-webpartdataversion="1.0" data-sp-webpartdata="${encode(stored)}">` +
      `<div data-sp-componentid="">${text(String(part.id || ''))}</div><div data-sp-htmlproperties="">${properties}</div></div>`);
  }).join('') + '</div>';
}
