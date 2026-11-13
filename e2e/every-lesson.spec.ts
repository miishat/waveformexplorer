import {test, expect} from '@playwright/test';
import {lessons} from '../src/content/lessons.ts';

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Every investigation must be solvable in the real UI with its own answer key.
for (const lesson of lessons) {
  test(`${lesson.id}: the Check step accepts its own answer key`, async ({page}) => {
    await page.goto('/');
    await page.evaluate(
      id =>
        localStorage.setItem(
          'tfv-session',
          JSON.stringify({lessonId: id, appearance: 'reference', sidebar: true, progress: {}}),
        ),
      lesson.id,
    );
    await page.reload();
    await expect(page.locator('.investigation-question')).toHaveText(lesson.question);
    for (let i = 0; i < 3; i++) await page.getByRole('button', {name: 'Continue'}).first().click();
    const task = lesson.locate!;
    const node = lesson.nodes.find(n => n.id === task.nodes[0])!;
    await page
      .getByRole('group', {name: 'Observation Time'})
      .getByRole('button', {name: lesson.frames[task.frames[0]].label, exact: true})
      .click();
    await page
      .locator('.guided-stage')
      .getByRole('button', {name: new RegExp(`^${escape(node.label)},`)})
      .click();
    await page.getByRole('button', {name: 'Confirm Cause'}).click();
    await expect(page.locator('.locate-result')).toContainText('Correct.');
    await page.locator('.answers button').nth(lesson.exercise.answer).click();
    await expect(page.locator('.answer-explanation')).toContainText('Correct.');
  });
}
