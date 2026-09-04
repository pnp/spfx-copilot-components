import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://m365-visitor-stats.azurewebsites.net/**', (route) => route.abort());
});

async function fetchCatalog(request: APIRequestContext) {
  const response = await request.get('./catalog.json');
  expect(response.ok()).toBeTruthy();
  return response.json();
}

test('catalog loads and filters without layout navigation', async ({ page, request }) => {
  const catalog = await fetchCatalog(request);
  await page.goto('./');

  await expect(page.getByRole('heading', { level: 1, name: 'Copilot Components' })).toBeVisible();
  await expect(page.locator('[data-component-card]')).toHaveCount(catalog.components.length);
  await page.getByRole('searchbox', { name: 'Search components' }).fill('Work IQ');
  await expect(page.locator('[data-component-card]:visible')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 3, name: 'Work IQ Answers' })).toBeVisible();
  await expect(page).toHaveURL(/\?q=Work(?:%20|\+)IQ$/);
});

test('events sample increments catalog and contributor counts', async ({ page, request }) => {
  const catalog = await fetchCatalog(request);
  await page.goto('./');

  await expect(page.locator('.catalog-stat'))
    .toHaveAttribute('aria-label', `${catalog.components.length} community components`);
  await expect(page.locator('#result-count')).toHaveText(`Showing ${catalog.components.length} components`);
  await expect(page.getByRole('heading', { level: 3, name: 'SharePoint Events Copilot Agent' })).toBeVisible();

  await page.getByRole('combobox', { name: 'Contributor' }).selectOption('joaojmendes');
  await expect(page.locator('[data-component-card]:visible')).toHaveCount(2);
  await expect(page.locator('#result-count')).toHaveText('Showing 2 matching components');
  await expect(page).toHaveURL(/\?author=joaojmendes$/);

  await page.goto('./contributors/');
  const contributor = page.locator('.contributor-card').filter({ hasText: 'João Mendes' });
  await expect(contributor).toContainText('2 component samples');
});

test('component detail exposes source, download, and documentation', async ({ page }) => {
  await page.goto('./samples/apps-directory/');

  await expect(page.getByRole('heading', { level: 1, name: 'Apps directory' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Download sample' })).toHaveAttribute('href', /download-partial/);
  await expect(page.getByRole('link', { name: /View source/ })).toHaveAttribute('href', /spfx-copilot-components/);
  await expect(page.getByRole('heading', { level: 2, name: 'Setup and implementation' })).toBeVisible();
});

test('tracks visits using the current site route', async ({ page }) => {
  const tracker = page.locator('img[data-visitor-stats]');

  await page.goto('./');
  await expect(tracker).toHaveAttribute(
    'src',
    'https://m365-visitor-stats.azurewebsites.net/spfx-copilot-components/',
  );

  await page.goto('./contributors/');
  await expect(tracker).toHaveAttribute(
    'src',
    'https://m365-visitor-stats.azurewebsites.net/spfx-copilot-components/contributors',
  );

  await page.goto('./samples/apps-directory/');
  await expect(tracker).toHaveAttribute(
    'src',
    'https://m365-visitor-stats.azurewebsites.net/spfx-copilot-components/samples/apps-directory',
  );
});

test('defaults to light, switches themes accessibly, and persists the preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('./');

  const toggle = page.getByRole('switch', { name: 'Switch to dark mode' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(toggle).toHaveAttribute('aria-checked', 'false');

  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('switch', { name: 'Switch to light mode' })).toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('copilot-components-theme'))).toBe('dark');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('switch', { name: 'Switch to light mode' })).toHaveAttribute('aria-checked', 'true');
});

test('light and dark pages have no automatically detectable accessibility violations', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('copilot-components-theme', 'light'));
  await page.goto('./');
  const lightHomeResults = await new AxeBuilder({ page }).analyze();
  expect(lightHomeResults.violations).toEqual([]);

  await page.getByRole('switch', { name: 'Switch to dark mode' }).click();
  const darkHomeResults = await new AxeBuilder({ page }).analyze();
  expect(darkHomeResults.violations).toEqual([]);

  await page.goto('./samples/apps-directory/');
  const darkDetailResults = await new AxeBuilder({ page }).analyze();
  expect(darkDetailResults.violations).toEqual([]);
});

test('mobile navigation exposes all primary destinations', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'Mobile navigation behavior');
  await page.goto('./');
  await page.locator('.mobile-nav summary[aria-label="Open navigation"]').click();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Getting started' })).toBeVisible();
});

test('public catalog includes expected sample metadata', async ({ request }) => {
  const catalog = await fetchCatalog(request);
  expect(catalog.version).toBe(1);
  expect(catalog.components.length).toBeGreaterThan(0);
  expect(catalog.components).toEqual(expect.arrayContaining([
    expect.objectContaining({
      slug: 'events',
      title: 'SharePoint Events Copilot Agent',
      sourceUrl: 'https://github.com/pnp/spfx-copilot-components/tree/main/samples/events',
      authors: [expect.objectContaining({ gitHubAccount: 'joaojmendes' })],
    }),
  ]));
  expect(catalog.excludedSamples).toEqual([]);
});