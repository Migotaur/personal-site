import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import defaults from '../public/content.json';

test('public navigation and project filters still work on mobile', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.typed')).not.toHaveText('');
  await page.locator('.mobile-nav-toggle').click();
  await page.locator('#navbar a[href="#portfolio"]').click();
  await expect(page.locator('#portfolio')).toHaveClass(/section-show/);
  await expect(page.locator('.portfolio-item')).toHaveCount(10);
  await page.locator('#portfolio-flters [data-filter=".filter-desktop"]').click();
  await expect(page.locator('.portfolio-item.filter-web').first()).toBeHidden();
  await expect(page.locator('.portfolio-item.filter-desktop').first()).toBeVisible();
  await expect(page.locator('.mobile-nav-toggle')).toHaveClass(/bi-list/);
  expect(errors).toEqual([]);
});

test('editor adds, reorders, removes, exports, and imports projects', async ({ page }) => {
  await page.goto('/#admin');
  await page.getByLabel('Section', { exact: true }).selectOption('projects');
  const list = page.locator('fieldset[data-field="projects.items"] > site-content-editor');
  const entries = list.locator(':scope > .entry');
  await expect(entries).toHaveCount(10);
  await list.locator(':scope > button').click();
  await expect(entries).toHaveCount(11);
  await entries.last().getByLabel('Name', { exact: true }).fill('New Angular project');
  await entries.last().getByLabel('Image', { exact: true }).fill('assets/img/portfolio/miggledev-1.jpg');
  await entries.last().getByLabel('Platform', { exact: true }).selectOption('mobile');
  await entries.last().getByRole('button', { name: 'Move New Angular project up', exact: true }).click();
  await expect(entries.nth(9).getByLabel('Name', { exact: true })).toHaveValue('New Angular project');
  await entries.last().getByRole('button', { name: 'Remove DigiCoach', exact: true }).click();
  await expect(entries).toHaveCount(10);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export content', exact: true }).click();
  const download = await downloadPromise;
  const exported = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(exported.projects.items[9].name).toBe('New Angular project');
  expect(exported.projects.items[9].platform).toBe('mobile');
  await page.getByLabel('Import content', { exact: true }).setInputFiles({ name: 'content.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) });
  await expect(page.getByRole('status')).toContainText('Imported into your draft');
  await expect(entries.nth(9).getByLabel('Name', { exact: true })).toHaveValue('New Angular project');
  await page.route('**/content.json', route => route.fulfill({ json: exported }));
  await page.goto('/#portfolio');
  await expect(page.locator('#portfolio')).toHaveClass(/section-show/);
  await expect(page.locator('.portfolio-item h4').last()).toHaveText('New Angular project');
});

test('editor rejects invalid imports without losing the draft', async ({ page }) => {
  await page.goto('/#admin');
  await page.getByLabel('Full name', { exact: true }).fill('Unpublished name');
  const invalid = structuredClone(defaults);
  invalid.profile.portrait = 'javascript:alert(1)';
  await page.getByLabel('Import content', { exact: true }).setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(invalid)) });
  await expect(page.getByRole('status')).toContainText('unsupported URL protocol');
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Unpublished name');
});

test('invalid remote content falls back to the bundled page', async ({ page }) => {
  await page.route('**/content-config.json', route => route.fulfill({ json: { supabaseUrl: 'https://example.supabase.co', supabasePublishableKey: 'test-publishable-key' } }));
  await page.route('https://example.supabase.co/rest/v1/**', route => route.fulfill({ json: { fields: { version: 2, projects: null } } }));
  await page.goto('/#portfolio');
  await expect(page.locator('#portfolio')).toHaveClass(/section-show/);
  await expect(page.locator('.portfolio-item')).toHaveCount(10);
});

test('language cards show experience and the requested overlapping usage labels', async ({ page }) => {
  await page.goto('/#resume');
  const cards = page.locator('.language-card');
  await expect(cards).toHaveCount(8);
  await expect(page.locator('#resume [role="progressbar"]')).toHaveCount(0);
  for (const name of defaults.resume.skills.map(skill => skill.name)) {
    const card = cards.filter({ has: page.getByRole('heading', { name, exact: true }) });
    await expect(card.locator('.language-experience')).toHaveText('3 years');
    await expect(card.getByText('Personal/Academic Projects', { exact: true })).toBeVisible();
    await expect(card.getByText('Professional Experience', { exact: true })).toHaveCount(['Java', 'Python'].includes(name) ? 1 : 0);
  }
  await page.goto('/#admin');
  await page.getByLabel('Section', { exact: true }).selectOption('resume');
  const skill = page.locator('fieldset[data-field="resume.skills"] > site-content-editor > .entry').first();
  await expect(skill.getByLabel('Experience', { exact: true })).toHaveValue('3 years');
  await expect(skill.getByLabel('Personal/Academic Projects', { exact: true })).toBeChecked();
  await expect(skill.getByLabel('Professional Experience', { exact: true })).toBeChecked();
});
