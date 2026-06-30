import { test, expect } from '@playwright/test';

test.describe('Auth flows', () => {
  const unique = Date.now();
  const username = `e2euser_${unique}`;
  const password = 'Testpass123!';

  test('user can register with valid credentials', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByLabel('Full Name').fill('E2E Test User');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('user can login with valid credentials', async ({ page }) => {
    // Assumes the user was registered by the previous test (sequential execution)
    await page.goto('/login');

    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.locator('.alert-error')).toBeVisible();
  });

  test('protected route redirects to login when not authenticated', async ({ page }) => {
    // Clear any stored tokens
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    });

    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login/);
  });

  test('logout redirects to login page', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Logout
    await page.getByRole("button", { name: /đăng xuất/i }).click();

    await expect(page).toHaveURL(/\/login/);
  });
});
