import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  // Use admin credentials (MANAGER role) to test all nav items
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill(adminUsername);
    await page.getByLabel('Password').fill(adminPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('sidebar links navigate to all pages (MANAGER)', async ({ page }) => {
    const sidebar = page.locator('.sidebar-nav');

    // All users
    await sidebar.getByRole('link', { name: /pos/i }).click();
    await expect(page).toHaveURL(/\/pos/);

    await sidebar.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await sidebar.getByRole('link', { name: /^🪑 Tables$/ }).click();
    await expect(page).toHaveURL(/\/tables/);

    await sidebar.getByRole('link', { name: /transaction/i }).click();
    await expect(page).toHaveURL(/\/transactions/);

    // MANAGER-only
    await sidebar.getByRole('link', { name: /manage employees/i }).click();
    await expect(page).toHaveURL(/\/employees/);

    await sidebar.getByRole('link', { name: /manage tables/i }).click();
    await expect(page).toHaveURL(/\/manage-tables/);

    await sidebar.getByRole('link', { name: /menu categories/i }).click();
    await expect(page).toHaveURL(/\/menus/);

    await sidebar.getByRole('link', { name: /menu items/i }).click();
    await expect(page).toHaveURL(/\/menu-items/);
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
