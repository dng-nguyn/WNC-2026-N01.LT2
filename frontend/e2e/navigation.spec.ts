import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  const unique = Date.now();
  const username = `navuser_${unique}`;
  const password = 'Testpass123!';

  test.beforeAll(async ({ browser }) => {
    // Register a user
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
    // Login before each test
    await page.goto('/login');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('dashboard links navigate to POS, Menus, Menu Items', async ({ page }) => {
    // Navigate to POS
    await page.getByRole('link', { name: /pos/i }).click();
    await expect(page).toHaveURL(/\/pos/);

    // Navigate back to dashboard
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to Menus
    await page.getByRole('link', { name: /menus/i }).click();
    await expect(page).toHaveURL(/\/menus/);

    // Navigate back to dashboard
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to Menu Items
    await page.getByRole('link', { name: /menu items/i }).click();
    await expect(page).toHaveURL(/\/menu-items/);
  });

  test('POS has link back to Dashboard', async ({ page }) => {
    await page.goto('/pos');

    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('default route redirects to dashboard', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/dashboard/);
  });
});
