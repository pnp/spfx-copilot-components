/**
 * The redaction step of the Agent Review resource scanners. The Agent Map uses
 * it to remove secret-like values and signed URLs from skill text.
 */

/** Secret-like key=value assignments. The same pattern as the Agent Review scanners. */
const SECRET_PATTERN_SOURCE =
  "(?:password|passwd|secret|api[_-]?key|token|auth[_-]?key|credential|private[_-]?key)\\s*=\\s*[\"'][^\"']{4,}[\"']";

const SECRET_REDACT_PATTERN = new RegExp(SECRET_PATTERN_SOURCE, "gi");

/** Signed/SAS URL patterns: query-string signatures or Azure Blob Storage hosts. */
const SAS_URL_PATTERN_1 = /https?:\/\/[^\s"']+[?&](?:sig|sv|se|sp|spr|srt|ss)=[^\s"']*/gi;
const SAS_URL_PATTERN_2 = /https?:\/\/[^\s"']*\.blob\.core\.windows\.net[^\s"']*/gi;

/**
 * Redact secret-like key=value assignments and signed/SAS URLs from `text`
 * without truncating.
 *
 * @param text - The string to redact.
 * @returns A new string with secrets and signed URLs replaced by placeholders.
 */
export function redactSecrets(text: string): string {
  return text
    .replace(SECRET_REDACT_PATTERN, (match) => {
      const assignIdx = match.indexOf("=");
      return assignIdx >= 0 ? match.slice(0, assignIdx + 1) + " [REDACTED]" : "[REDACTED]";
    })
    .replace(SAS_URL_PATTERN_1, '[URL-REDACTED]')
    .replace(SAS_URL_PATTERN_2, '[URL-REDACTED]');
}
