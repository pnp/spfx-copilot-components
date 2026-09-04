import { access, copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import sharp from 'sharp';

const REPOSITORY_URL = 'https://github.com/pnp/spfx-copilot-components';
const OLD_REPOSITORY_SLUG = 'pnp/spfx-copilot-apps';
const REPOSITORY_SLUG = 'pnp/spfx-copilot-components';
const VISITOR_STATS_BASE_URL = 'https://m365-visitor-stats.azurewebsites.net/spfx-copilot-components';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isExternalTarget(target) {
  return /^(?:[a-z]+:|#)/i.test(target);
}

function repositoryTarget(slug, target, raw) {
  if (isExternalTarget(target)) {
    return normalizeRepositoryUrl(target);
  }

  const [fileTarget, fragment = ''] = target.split('#', 2);
  const repositoryPath = path.posix.normalize(
    path.posix.join('samples', slug, fileTarget.replaceAll('\\', '/')),
  );
  assert(
    repositoryPath.startsWith('samples/'),
    `Unsafe README link in ${slug}: ${target}`,
  );
  const encodedPath = repositoryPath.split('/').map(encodeURIComponent).join('/');
  const base = raw
    ? 'https://raw.githubusercontent.com/pnp/spfx-copilot-components/main'
    : `${REPOSITORY_URL}/blob/main`;
  return `${base}/${encodedPath}${fragment ? `#${fragment}` : ''}`;
}

export function normalizeRepositoryUrl(value) {
  return typeof value === 'string' ? value.replace(OLD_REPOSITORY_SLUG, REPOSITORY_SLUG) : value;
}

export function validateVisitorStatsTracker(slug, markdown) {
  const expectedTracker = `<img src="${VISITOR_STATS_BASE_URL}/samples/${slug}" />`;
  const finalLine = markdown.trimEnd().split(/\r?\n/).at(-1);
  assert(finalLine === expectedTracker, `${slug}: README must end with ${expectedTracker}`);

  const trackerCount = (markdown.match(/m365-visitor-stats\.azurewebsites\.net/g) ?? []).length;
  assert(trackerCount === 1, `${slug}: README must contain exactly one visitor-stats tracker`);
}

export function selectPrimaryImage(thumbnails) {
  return [...(thumbnails ?? [])]
    .filter((thumbnail) => thumbnail.type === 'image')
    .sort((left, right) => left.order - right.order)[0];
}

export function resolveThumbnailPath(repositoryRoot, slug, thumbnail) {
  assert(thumbnail?.url, `Missing image URL for ${slug}`);
  const pathnameParts = decodeURIComponent(new URL(thumbnail.url).pathname).split('/').filter(Boolean);
  const samplesIndex = pathnameParts.indexOf('samples');
  assert(samplesIndex >= 0, `Image URL for ${slug} does not contain a samples path: ${thumbnail.url}`);
  assert(pathnameParts[samplesIndex + 1] === slug, `Image URL folder does not match ${slug}: ${thumbnail.url}`);

  const relativeParts = pathnameParts.slice(samplesIndex + 2);
  assert(relativeParts.length > 0, `Image URL for ${slug} does not reference a file: ${thumbnail.url}`);
  const sampleRoot = path.resolve(repositoryRoot, 'samples', slug);
  const imagePath = path.resolve(sampleRoot, ...relativeParts);
  assert(imagePath.startsWith(`${sampleRoot}${path.sep}`), `Unsafe image path for ${slug}: ${thumbnail.url}`);
  return imagePath;
}

export function renderReadme(slug, markdown) {
  const withoutDuplicateHeader = markdown
    .replace(/^# .+\r?\n/, '')
    .replace(/<img[^>]+m365-visitor-stats[^>]*\/?>(?:\s*)/gi, '')
    .replace(/^!\[[^\]]*\]\([^)]*m365-visitor-stats[^)]*\)\s*$/gim, '');
  const linkedMarkdown = withoutDuplicateHeader.replace(
    /(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_match, imageMarker, label, target) =>
      `${imageMarker}[${label}](${repositoryTarget(slug, target, imageMarker === '!')})`,
  );

  return sanitizeHtml(marked.parse(linkedMarkdown, { gfm: true }), {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'img',
      'h1',
      'h2',
      'h3',
      'h4',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      code: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (_tagName, attributes) => ({
        tagName: 'a',
        attribs: attributes.href?.startsWith('http')
          ? { ...attributes, target: '_blank', rel: 'noopener noreferrer' }
          : attributes,
      }),
    },
  });
}

function metadataValue(sample, key) {
  return sample.metadata.find((item) => item.key === key)?.value;
}

export function normalizeSample(slug, sample, readmeMarkdown, imageMetadata) {
  const primaryImage = selectPrimaryImage(sample.thumbnails);
  assert(primaryImage, `No image thumbnail is defined for ${slug}`);

  return {
    slug,
    name: sample.name,
    title: sample.title,
    shortDescription: sample.shortDescription,
    longDescription: sample.longDescription,
    createdAt: sample.creationDateTime,
    updatedAt: sample.updateDateTime,
    products: sample.products.map((product) => product === 'Copilot' ? 'Microsoft 365 Copilot' : product),
    sampleType: metadataValue(sample, 'SAMPLE-TYPE'),
    clientTechnology: metadataValue(sample, 'CLIENT-SIDE-DEV'),
    spfxVersion: metadataValue(sample, 'SPFX-VERSION'),
    authors: sample.authors,
    references: sample.references,
    sourceUrl: normalizeRepositoryUrl(sample.url),
    downloadUrl: normalizeRepositoryUrl(sample.downloadUrl),
    preview: {
      alt: primaryImage.alt,
      width: imageMetadata.width,
      height: imageMetadata.height,
      src640: `generated/previews/${slug}-640.webp`,
      src960: `generated/previews/${slug}-960.webp`,
    },
    gallery: [...sample.thumbnails]
      .filter((thumbnail) => thumbnail.type === 'image')
      .sort((left, right) => left.order - right.order)
      .map((thumbnail) => ({
        alt: thumbnail.alt,
        url: normalizeRepositoryUrl(thumbnail.url),
      })),
    readmeHtml: renderReadme(slug, readmeMarkdown),
    searchText: [
      slug,
      sample.title,
      sample.shortDescription,
      ...sample.longDescription,
      ...sample.products,
      ...sample.authors.flatMap((author) => [author.name, author.gitHubAccount]),
    ].join(' ').toLocaleLowerCase('en-US'),
  };
}

function publicRecord(component) {
  const { readmeHtml: _readmeHtml, searchText: _searchText, ...record } = component;
  return record;
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function generateGallery({ repositoryRoot, siteRoot }) {
  const samplesRoot = path.join(repositoryRoot, 'samples');
  const schemaPath = path.join(repositoryRoot, '.github', 'schemas', 'sample.schema.json');
  const generatedRoot = path.join(siteRoot, 'src', 'generated');
  const publicRoot = path.join(siteRoot, 'public');
  const previewRoot = path.join(publicRoot, 'generated', 'previews');
  const brandRoot = path.join(publicRoot, 'generated', 'brand');

  await Promise.all([
    rm(generatedRoot, { recursive: true, force: true }),
    rm(path.join(publicRoot, 'generated'), { recursive: true, force: true }),
  ]);
  await Promise.all([
    mkdir(generatedRoot, { recursive: true }),
    mkdir(previewRoot, { recursive: true }),
    mkdir(brandRoot, { recursive: true }),
  ]);

  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  const validateSample = ajv.compile(JSON.parse(await readFile(schemaPath, 'utf8')));
  const entries = await readdir(samplesRoot, { withFileTypes: true });
  const slugs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  const components = [];
  const excludedSamples = [];

  for (const slug of slugs) {
    const sampleRoot = path.join(samplesRoot, slug);
    const readmeMarkdown = await readFile(path.join(sampleRoot, 'README.md'), 'utf8');
    validateVisitorStatsTracker(slug, readmeMarkdown);
    const samplePath = path.join(sampleRoot, 'assets', 'sample.json');
    if (!(await exists(samplePath))) {
      excludedSamples.push({ slug, reason: 'Missing assets/sample.json' });
      console.warn(`[gallery] ${slug}: missing assets/sample.json; excluded from catalog`);
      continue;
    }

    const sampleDocument = JSON.parse(await readFile(samplePath, 'utf8'));
    assert(
      validateSample(sampleDocument),
      `${slug} sample.json failed schema validation: ${ajv.errorsText(validateSample.errors)}`,
    );
    const sample = sampleDocument[0];
    assert(sample.updateDateTime >= sample.creationDateTime, `${slug}: updateDateTime precedes creationDateTime`);
    const primaryImage = selectPrimaryImage(sample.thumbnails);
    const sourceImage = resolveThumbnailPath(repositoryRoot, slug, primaryImage);
    assert(await exists(sourceImage), `${slug}: referenced image does not exist: ${sourceImage}`);
    const imageMetadata = await sharp(sourceImage).metadata();
    assert(imageMetadata.width && imageMetadata.height, `${slug}: referenced image cannot be decoded`);

    await Promise.all([
      sharp(sourceImage)
        .resize({ width: 640, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(path.join(previewRoot, `${slug}-640.webp`)),
      sharp(sourceImage)
        .resize({ width: 960, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(path.join(previewRoot, `${slug}-960.webp`)),
    ]);

    components.push(normalizeSample(
      slug,
      sample,
      readmeMarkdown,
      imageMetadata,
    ));
  }

  components.sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt) || left.title.localeCompare(right.title),
  );
  const contributors = [...new Map(
    components.flatMap((component) => component.authors)
      .map((author) => [author.gitHubAccount.toLocaleLowerCase('en-US'), author]),
  ).values()].sort((left, right) => left.name.localeCompare(right.name));
  const products = [...new Set(components.flatMap((component) => component.products))].sort();
  const generatedAt = `${components.reduce(
    (latest, component) => component.updatedAt > latest ? component.updatedAt : latest,
    '1970-01-01',
  )}T00:00:00.000Z`;
  const internalCatalog = { version: 1, generatedAt, components, contributors, products, excludedSamples };
  const publicCatalog = {
    ...internalCatalog,
    components: components.map(publicRecord),
  };

  await Promise.all([
    writeFile(path.join(generatedRoot, 'catalog.json'), `${JSON.stringify(internalCatalog, null, 2)}\n`),
    writeFile(path.join(publicRoot, 'catalog.json'), `${JSON.stringify(publicCatalog, null, 2)}\n`),
    copyFile(
      path.join(repositoryRoot, 'assets', 'copilot-apps-teaser-slide.png'),
      path.join(brandRoot, 'copilot-components.png'),
    ),
    copyFile(
      path.join(repositoryRoot, 'assets', 'sharepoint-copilot-apps-badge.png'),
      path.join(brandRoot, 'contributor-badge.png'),
    ),
  ]);

  return {
    sampleFolderCount: slugs.length,
    componentCount: components.length,
    contributorCount: contributors.length,
    excludedSamples,
  };
}