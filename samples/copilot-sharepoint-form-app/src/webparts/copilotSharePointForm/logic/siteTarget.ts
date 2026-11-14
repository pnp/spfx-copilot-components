const COLLECTION_ROOTS = ["sites", "teams", "personal"];

export interface INormalizedDestination {
  siteUrl: string;
  libraryName: string;
}

/**
 * Separates a SharePoint site address from a library path.
 * `https://tenant.sharepoint.com/Files` becomes the root site plus library Files.
 * `https://tenant.sharepoint.com/sites/hr/Documents` becomes the site `/sites/hr` plus Documents.
 */
export function normalizeDestination(siteUrl: string, libraryName: string): INormalizedDestination {
  const library = (libraryName || "").trim();
  const raw = (siteUrl || "").trim();
  if (!raw) {
    return { siteUrl: "", libraryName: library };
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { siteUrl: raw.replace(/\/+$/, ""), libraryName: library };
  }

  let path = safeDecode(parsed.pathname || "");
  path = path.replace(/\/+$/, "");
  path = path.replace(/\/(SitePages|_layouts|_catalogs)(\/.*)?$/i, "");
  path = path.replace(/\/Forms\/[^/]+$/i, "");
  path = path.replace(/\/+$/, "");

  const segments = path.split("/").filter((part) => part.length > 0);
  let siteSegments = segments.slice();
  let inferred = "";
  if (segments.length >= 2 && isCollectionRoot(segments[0])) {
    if (segments.length > 2) {
      inferred = segments.slice(2).join("/");
      siteSegments = segments.slice(0, 2);
    }
  } else if (segments.length >= 1 && !isCollectionRoot(segments[0])) {
    inferred = segments[segments.length - 1];
    siteSegments = segments.slice(0, -1);
  }

  const sitePath = siteSegments.length > 0 ? `/${siteSegments.join("/")}` : "";
  return {
    siteUrl: `${parsed.origin}${sitePath}`,
    libraryName: library || inferred
  };
}

function isCollectionRoot(segment: string): boolean {
  return COLLECTION_ROOTS.indexOf(segment.toLowerCase()) >= 0;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
