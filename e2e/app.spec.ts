import {test, expect, type Page} from '@playwright/test';
import {lessons} from '../src/content/lessons.ts';

const first = lessons[0];
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stage = (page: Page) => page.locator('.guided-stage');

async function goToCheck(page: Page) {
  for (let i = 0; i < 3; i++) await page.getByRole('button', {name: 'Continue'}).first().click();
  await expect(page.getByRole('heading', {name: 'Test Your Interpretation'})).toBeVisible();
}

test.beforeEach(async ({page}) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('completing the first investigation updates progress', async ({page}) => {
  await goToCheck(page);
  const task = first.locate!;
  const frameLabel = first.frames[task.frames[0]].label;
  const nodeLabel = first.nodes.find(n => n.id === task.nodes[0])!.label;
  await page
    .getByRole('group', {name: 'Observation Time'})
    .getByRole('button', {name: frameLabel})
    .click();
  await stage(page)
    .getByRole('button', {name: new RegExp(`^${escape(nodeLabel)},`)})
    .click();
  await page.getByRole('button', {name: 'Confirm Cause'}).click();
  await expect(page.locator('.locate-result')).toContainText('Correct.');
  await page.locator('.answers button').nth(first.exercise.answer).click();
  await page.getByRole('button', {name: /Mark Lesson Complete/}).click();
  await expect(page.locator('.progress-card b')).toHaveText(`1/${lessons.length}`);
  await page.getByRole('button', {name: /All Investigations/}).click();
  await expect(page.locator('.index-table tr.current')).toContainText('Complete');
});

test('a wrong locate answer is called out without revealing the cause', async ({page}) => {
  await goToCheck(page);
  await stage(page)
    .getByRole('button', {
      name: new RegExp(`^${escape(first.nodes.find(n => n.id === first.target)!.label)},`),
    })
    .click();
  await page.getByRole('button', {name: 'Confirm Cause'}).click();
  await expect(page.locator('.locate-result')).not.toContainText('Correct.');
  await expect(page.locator('.exercise')).toHaveCount(0);
});

test('reloading offers to resume where the learner left off', async ({page}) => {
  await page.getByRole('button', {name: 'Continue'}).first().click();
  await page.reload();
  const card = page.locator('.resume-card');
  await expect(card).toContainText('Step 2 of 4');
  await card.getByRole('button', {name: 'Start Over'}).click();
  await expect(card).toHaveCount(0);
  await expect(page.getByRole('heading', {name: 'Start With the Result'})).toBeVisible();
});

test('theme choice persists across reloads', async ({page}) => {
  await page.getByRole('button', {name: 'Switch to Dark Theme'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', {name: 'Switch to Light Theme'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('symbol dialog traps focus and returns it on Escape', async ({page}) => {
  await page.getByRole('button', {name: 'Symbols'}).click();
  const card = page.locator('.atlas-card').first();
  await card.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', {name: 'Close Symbol Reference'})).toBeFocused();
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate(d => d.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(card).toBeFocused();
});

test('the picker separates the core and expert tracks', async ({page}) => {
  await page.getByRole('combobox', {name: 'Investigation'}).click();
  const menu = page.getByRole('listbox', {name: 'Investigation'});
  await expect(menu.getByText(/^Core Track/)).toBeVisible();
  await expect(menu.getByText(/^Expert Track/)).toBeVisible();
  const expert = lessons.find(l => l.track === 'expert')!;
  await menu.getByRole('option', {name: new RegExp(escape(expert.title))}).click();
  const hint = page.locator('.track-hint');
  await expect(hint).toContainText('Expert track.');
  await hint.getByRole('button').click();
  await expect(page.getByRole('combobox', {name: 'Investigation'})).toContainText(first.title);
  await expect(hint).toHaveCount(0);
});
