// @ts-check
/**
 * Breadth-first smoke crawl: major routes + light interactions.
 * Fails on browser console type "error" and uncaught page errors (with small allowlist).
 *
 * Requires backend + frontend dev servers (see README). Profile/location features do not
 * require VITE_GEONAMES_USERNAME for this spec — only normal page load is asserted.
 */
const { test, expect } = require('@playwright/test');

const testUser = {
  email: `smoke-${Date.now()}@example.com`,
  password: process.env.E2E_TEST_PASSWORD || 'TestPassword123!',
  name: 'Smoke Routes User',
};

/** @param {string} text */
function shouldIgnoreConsoleError(text) {
  const t = text;
  if (/favicon/i.test(t)) return true;
  if (/Download the React DevTools/i.test(t)) return true;
  // Unauthenticated shell checks /api/auth/me — Chromium logs failed resource as console error
  if ((/401|Unauthorized/i.test(t) || /Failed to load resource/i.test(t)) && /auth\/me/i.test(t)) {
    return true;
  }
  return false;
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {{ consoleErrors: string[], pageErrors: string[] }}
 */
function attachErrorSink(page) {
  const sink = { consoleErrors: [], pageErrors: [] };
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !shouldIgnoreConsoleError(msg.text())) {
      sink.consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    sink.pageErrors.push(err.stack || err.message);
  });
  return sink;
}

function assertNoErrors(sink) {
  expect.soft(sink.consoleErrors, `Console errors:\n${sink.consoleErrors.join('\n')}`).toEqual([]);
  expect.soft(sink.pageErrors, `Page errors:\n${sink.pageErrors.join('\n')}`).toEqual([]);
}

test.describe('Smoke: routes and console hygiene', () => {
  test('register, crawl authenticated pages, logout, public pages', async ({ page }) => {
    const sink = attachErrorSink(page);

    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    await page.getByRole('button', { name: /register/i }).click();
    await expect(page).toHaveURL(/\/register/);
    await page.getByLabel(/full name/i).fill(testUser.name);
    await page.getByLabel(/email address/i).fill(testUser.email);
    await page.locator('#password').fill(testUser.password);
    await page.locator('#confirmPassword').fill(testUser.password);
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/dashboard/i);
    assertNoErrors(sink);

    await page.getByRole('button', { name: /how it works/i }).click();
    await expect(page.getByRole('heading', { name: /how foodfornow works/i })).toBeVisible();
    await page.getByRole('button', { name: /^got it$/i }).click();
    await expect(page.getByRole('heading', { name: /how foodfornow works/i })).not.toBeVisible();
    assertNoErrors(sink);

    await page.goto('/recipes');
    await expect(page).toHaveURL(/\/recipes/);
    await expect(page.getByRole('heading', { name: /^recipes$/i })).toBeVisible();
    assertNoErrors(sink);

    const recipeLink = page.locator('a[href^="/recipes/"]').first();
    if ((await recipeLink.count()) > 0) {
      await recipeLink.click();
      await expect(page).toHaveURL(/\/recipes\/.+/, { timeout: 15000 });
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });
      assertNoErrors(sink);
    }

    await page.goto('/shopping-list');
    await expect(page.getByRole('heading', { name: /^shopping list$/i })).toBeVisible();
    assertNoErrors(sink);

    await page.goto('/pantry');
    await expect(page.getByRole('heading', { name: /^pantry$/i })).toBeVisible();
    assertNoErrors(sink);

    await page.goto('/ingredients');
    await expect(page.getByRole('heading', { name: /^ingredients$/i })).toBeVisible();
    assertNoErrors(sink);

    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /profile settings/i })).toBeVisible();
    assertNoErrors(sink);

    await page.goto('/achievements');
    await expect(page.getByRole('heading', { name: /^achievements$/i })).toBeVisible();
    assertNoErrors(sink);

    await page.goto('/how-to-use');
    await expect(page.getByRole('heading', { name: /how to use foodfornow/i })).toBeVisible();
    assertNoErrors(sink);

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/dashboard/i);

    await page.getByRole('button', { name: 'account of current user' }).click();
    await page.getByRole('menuitem', { name: /^logout$/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    assertNoErrors(sink);

    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    assertNoErrors(sink);

    await page.goto('/register');
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    assertNoErrors(sink);

    await page.goto('/forgot-password');
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByRole('heading', { name: /^forgot password$/i })).toBeVisible();
    assertNoErrors(sink);

    await page.goto('/reset-password');
    await expect(page).toHaveURL(/\/reset-password/);
    await expect(page.getByText(/invalid or missing reset link/i)).toBeVisible();
    assertNoErrors(sink);

    await page.goto('/scan');
    await expect(page).toHaveURL(/\/scan/);
    await expect(page.getByText(/invalid scan link/i)).toBeVisible();
    assertNoErrors(sink);

    expect(sink.consoleErrors).toEqual([]);
    expect(sink.pageErrors).toEqual([]);
  });
});
