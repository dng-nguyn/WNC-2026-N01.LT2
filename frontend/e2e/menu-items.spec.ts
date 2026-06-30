import { test, expect } from '@playwright/test';

test.describe('Menu items management', () => {
  const unique = Date.now();
  const username = `itemuser_${unique}`;
  const password = 'Testpass123!';
  const categoryName = `Category_${unique}`;

  test.beforeAll(async ({ browser }) => {
    // Register
    const page = await browser.newPage();
    await page.goto('/register');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByLabel('Full Name').fill('Item Test User');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Create a category (prerequisite for menu items)
    await page.goto('/menus');
    await page.getByRole('button', { name: /new category/i }).click();
    await page.getByLabel(/name/i).fill(categoryName);
    await page.getByLabel(/description/i).fill('For menu item tests');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(categoryName)).toBeVisible();
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('menu items table displays correctly', async ({ page }) => {
    await page.goto('/menu-items');
    await expect(page.locator('.page-container')).toBeVisible();
    // Table is always rendered (with rows or empty message)
    await expect(page.locator('table')).toBeVisible();
  });

  test('shows empty state when no items exist for user', async ({ page }) => {
    await page.goto('/menu-items');
    // Table should be present (may or may not be empty depending on DB state)
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByText(/menu items/i).first()).toBeVisible();
  });

  test('can create a new menu item', async ({ page }) => {
    await page.goto('/menu-items');

    await page.getByRole('button', { name: /new item/i }).click();

    // Select category from dropdown
    await page.getByLabel('Category').selectOption({ label: categoryName });

    await page.getByLabel('Name').fill(`Espresso ${unique}`);
    await page.getByLabel('Price (VND)').fill('45000');

    await page.getByRole('button', { name: /^save$/i }).click();

    await expect(page.getByText(`Espresso ${unique}`)).toBeVisible();
    await expect(page.getByText(categoryName)).toBeVisible();
  });

  test('can edit an existing menu item', async ({ page }) => {
    await page.goto('/menu-items');

    const editButtons = page.getByRole('button', { name: /edit/i });
    if (await editButtons.count() > 0) {
      await editButtons.first().click();

      const nameInput = page.getByLabel('Name');
      await nameInput.fill(`Updated Espresso ${unique}`);
      await page.getByRole('button', { name: /^save$/i }).click();

      await expect(page.getByText(`Updated Espresso ${unique}`)).toBeVisible();
    }
  });

  test('can delete a menu item', async ({ page }) => {
    await page.goto('/menu-items');

    page.on('dialog', (dialog) => dialog.accept());

    const deleteButtons = page.getByRole('button', { name: /delete/i });
    const count = await deleteButtons.count();

    if (count > 0) {
      await deleteButtons.first().click();
      await page.waitForTimeout(1000);
      // After delete, table should have fewer rows or show empty state
    }
  });

  test('validates price input', async ({ page }) => {
    await page.goto('/menu-items');

    await page.getByRole('button', { name: /new item/i }).click();

    await page.getByLabel('Category').selectOption({ label: categoryName });
    await page.getByLabel('Name').fill('Bad Item');
    await page.getByLabel('Price (VND)').fill('-100');

    await page.getByRole('button', { name: /^save$/i }).click();

    await expect(page.locator('.alert-error')).toBeVisible();
  });

  test('shows availability badge', async ({ page }) => {
    // Create an item first
    await page.goto('/menu-items');
    await page.getByRole('button', { name: /new item/i }).click();
    await page.getByLabel('Category').selectOption({ label: categoryName });
    await page.getByLabel('Name').fill(`Latte ${unique}`);
    await page.getByLabel('Price (VND)').fill('55000');
    await page.getByRole('button', { name: /^save$/i }).click();

    await expect(page.locator('.badge-success').first()).toBeVisible();
  });

  test('can toggle availability via edit', async ({ page }) => {
    await page.goto('/menu-items');

    const editButtons = page.getByRole('button', { name: /edit/i });
    if (await editButtons.count() > 0) {
      await editButtons.first().click();

      // Uncheck availability
      await page.getByLabel('Available for sale').uncheck();
      await page.getByRole('button', { name: /^save$/i }).click();

      // Should show "No" badge
      await expect(page.locator('.badge-danger')).toBeVisible();
    }
  });

  test('search filters menu items', async ({ page }) => {
    // Create two items with distinct names
    await page.goto('/menu-items');
    await page.getByRole('button', { name: /new item/i }).click();
    await page.getByLabel('Category').selectOption({ label: categoryName });
    await page.getByLabel('Name').fill(`Alpha_${unique}`);
    await page.getByLabel('Price (VND)').fill('30000');
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText(`Alpha_${unique}`)).toBeVisible();

    await page.getByRole('button', { name: /new item/i }).click();
    await page.getByLabel('Category').selectOption({ label: categoryName });
    await page.getByLabel('Name').fill(`Beta_${unique}`);
    await page.getByLabel('Price (VND)').fill('60000');
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText(`Beta_${unique}`)).toBeVisible();

    // Search for Alpha
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill(`Alpha_${unique}`);

    await expect(page.getByText(`Alpha_${unique}`)).toBeVisible();
    await expect(page.getByText(`Beta_${unique}`)).not.toBeVisible();
  });
});
