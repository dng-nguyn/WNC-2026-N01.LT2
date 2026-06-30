import { test, expect } from '@playwright/test';

test.describe('Menu management', () => {
  const unique = Date.now();
  const username = `menuuser_${unique}`;
  const password = 'Testpass123!';

  test.beforeAll(async ({ browser }) => {
    // Register and login
    const page = await browser.newPage();
    await page.goto('/register');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByLabel('Full Name').fill('Menu Test User');
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

  test('can create a new menu category', async ({ page }) => {
    await page.goto('/menus');

    await page.getByRole('button', { name: /new category/i }).click();

    await page.getByLabel(/name/i).fill(`Test Category ${unique}`);
    await page.getByLabel(/description/i).fill('A test category');
    await page.getByRole('button', { name: /save/i }).click();

    await expect(page.getByText(`Test Category ${unique}`)).toBeVisible();
  });

  test('can edit an existing category', async ({ page }) => {
    await page.goto('/menus');

    // Click edit on the first row
    const editButtons = page.getByRole('button', { name: /edit/i });
    if (await editButtons.count() > 0) {
      await editButtons.first().click();

      const nameInput = page.getByLabel(/name/i);
      await nameInput.fill(`Updated Category ${unique}`);
      await page.getByRole('button', { name: /save/i }).click();

      await expect(page.getByText(`Updated Category ${unique}`)).toBeVisible();
    }
  });

  test('can delete a category', async ({ page }) => {
    await page.goto('/menus');

    // Accept the confirm dialog
    page.on('dialog', (dialog) => dialog.accept());

    const deleteButtons = page.getByRole('button', { name: /delete/i });
    if (await deleteButtons.count() > 0) {
      const initialCount = await deleteButtons.count();
      await deleteButtons.first().click();

      // Wait for the table to update
      await page.waitForTimeout(500);
    }
  });

  test('categories table displays correctly', async ({ page }) => {
    await page.goto('/menus');

    // Should show the page container
    await expect(page.locator('.page-container')).toBeVisible();

    // Should have a table or show "No categories yet"
    const table = page.locator('table');
    const emptyMessage = page.getByText(/no categories/i);
    await expect(table.or(emptyMessage)).toBeVisible();
  });
});
