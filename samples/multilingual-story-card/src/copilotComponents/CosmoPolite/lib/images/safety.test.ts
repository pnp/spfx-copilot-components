import { describe, expect, it } from 'vitest';
import { isSafeImage, isSensitiveText } from './safety';
import { pickImages } from './sources/commons';

describe('image safety', () => {
  // Real Commons hits for "spfx" (SharePoint Framework): special-effects make-up, burns, zombies.
  it('rules out the special-effects make-up that "spfx" finds on Commons', () => {
    expect(isSafeImage('File:Burn Makeup Complete Look at Scarlet Studios in Bugolobi.jpg', 'Make-up artists|CC-Zero|Special effects|Make-up')).toBe(false);
    expect(isSafeImage('File:As a film Make-up artist, Creating Zombies is something I enjoy doing.jpg', 'Zombies|Special effects')).toBe(false);
    expect(isSafeImage('File:Some studio photo.jpg', 'Make-up artists|Burns|Self-published work')).toBe(false);
    expect(isSafeImage('File:20190621 Special effects props for film.jpg', 'Special effects|Self-published work')).toBe(false);
  });

  it('rules out nudity, gore and violence by title, category or tag', () => {
    expect(isSafeImage('File:Nude study.jpg', '')).toBe(false);
    expect(isSafeImage('File:Portrait.jpg', 'Nudity in art|Paintings')).toBe(false);
    expect(isSafeImage('Untitled', ['wound', 'hospital'])).toBe(false);
    expect(isSensitiveText('Bloodstained_shirt.jpg')).toBe(true);
  });

  it('lets ordinary pictures through', () => {
    expect(isSafeImage('File:Stephansdom Wien.jpg', 'St. Stephen\'s Cathedral, Vienna|Gothic architecture in Austria')).toBe(true);
    expect(isSafeImage('File:Microsoft SharePoint conference keynote.jpg', 'Microsoft|Conferences in Las Vegas')).toBe(true);
    expect(isSafeImage('File:Helsinki Cathedral.jpg', ['church', 'helsinki', 'architecture'])).toBe(true);
    expect(isSafeImage(undefined, undefined)).toBe(true);
  });

  it('keeps such files out of the Commons results', () => {
    const page = (index: number, title: string, categories: string): Record<string, unknown> => ({
      index,
      title,
      imageinfo: [{ thumburl: `https://upload.wikimedia.org/wikipedia/commons/${index}.jpg`, thumbwidth: 800, thumbheight: 533, mime: 'image/jpeg', extmetadata: { Categories: { value: categories } } }]
    });
    const results = pickImages({
      query: {
        pages: [page(1, 'File:Scarlet Studios Team working on the Burn Sfx Makeup.jpg', 'Burns|Special effects|Make-up'), page(2, 'File:Office building.jpg', 'Office buildings')]
      }
    });
    expect(results.map((r) => r.src)).toEqual(['https://upload.wikimedia.org/wikipedia/commons/2.jpg']);
  });
});
