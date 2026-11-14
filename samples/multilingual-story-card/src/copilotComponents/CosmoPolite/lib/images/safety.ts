// Keeps disturbing pictures off the card. Wikimedia Commons (searched directly and through Openverse)
// has no safe search: "SPFx" (SharePoint Framework) also means special-effects make-up there, and the
// hits were wounds, burns and horror make-up. Every Commons file is checked by its title and its
// categories (and Openverse results by title and tags) before it can be shown. Errs on the side of
// caution: a harmless photo filtered out leaves the next candidate; a disturbing one shown is worse.

/** Words and phrases (English, as Commons titles and categories are) that rule a picture out. */
const SENSITIVE: RegExp =
  /\b(special[ -]?effects?|s?p?fx|make-?up|prosthetics?|body[ -]?paint(?:ing)?|zombies?|gore|gory|blood(?:y|ied|stained)?|wounds?|wounded|injur(?:y|ies|ed)|burn (?:injur\w*|victims?)|corpses?|dead bodies|cadavers?|autops(?:y|ies)|mutilat\w*|decapitat\w*|nud(?:e|es|ity|ism|ist|ists)|naked|topless|erotic\w*|sexual\w*|sex|porn\w*|genital\w*|horror|tortur\w*|executions?|lynch\w*)\b/i;

/** Commons categories that are fine as words but mark disturbing pictures as a category. */
const SENSITIVE_CATEGORIES: string[] = ['burns', 'violence', 'death'];

/** True when a title, a description or a category list names something the card must not show. */
export function isSensitiveText(text: string | undefined): boolean {
  return !!text && SENSITIVE.test(text.replace(/[_]/g, ' '));
}

/**
 * A picture may be shown unless its title or one of its categories or tags is sensitive.
 * `categories` is Commons' "A|B|C" list (extmetadata Categories) or a list of tags.
 */
export function isSafeImage(title: string | undefined, categories: string | string[] | undefined): boolean {
  const list: string[] = Array.isArray(categories) ? categories : (categories || '').split('|');
  if (isSensitiveText(title)) {
    return false;
  }
  return !list.some((c: string) => isSensitiveText(c) || SENSITIVE_CATEGORIES.indexOf(c.trim().toLowerCase()) !== -1);
}
