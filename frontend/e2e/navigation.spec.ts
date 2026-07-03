import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  const unique = Date.now();
  const username = `navuser_${unique}`;
  const password = 'Testpass123!';

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/register');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByLabel('Full Name').fill('Nav Test User');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('sidebar links navigate to POS, Tables, Transaction History', async ({ page }) => {
    const sidebar = page.locator('.sidebar-nav');

    await sidebar.getByRole('link', { name: /pos/i }).click();
    await expect(page).toHaveURL(/\/pos/);

    await sidebar.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await sidebar.getByRole('link', { name: /tables/i }).click();
    await expect(page).toHaveURL(/\/tables/);

    await sidebar.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await sidebar.getByRole('link', { name: /transaction/i }).click();
    await expect(page).toHaveURL(/\/transactions/);
  });

  test('POS has sidebar link back to Dashboard', async ({ page }) => {
    await page.goto('/pos');
    const sidebar = page.locator('.sidebar-nav');
    await sidebar.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('default route redirects to dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
