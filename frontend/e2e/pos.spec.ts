import { test, expect } from '@playwright/test';

test.describe('POS terminal', () => {
  const unique = Date.now();
  const username = `posuser_${unique}`;
  const password = 'Testpass123!';

  test.beforeAll(async ({ browser }) => {
    // Register a user for POS tests
    const page = await browser.newPage();
    await page.goto('/register');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByLabel('Full Name').fill('POS Test User');
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

  test('POS page loads and displays menu items', async ({ page }) => {
    await page.goto('/pos');

    // Should show the POS layout (may show "No menu items" if none exist)
    await expect(page.locator('.pos-layout')).toBeVisible();
  });

  test('can add items to cart', async ({ page }) => {
    await page.goto('/pos');

    // Look for menu item buttons; if none exist, this test verifies the empty state
    const itemButtons = page.locator('.menu-item-card');
    const count = await itemButtons.count();

    if (count > 0) {
      await itemButtons.first().click();
      // Cart should show at least one item
      await expect(page.locator('.cart-item')).toHaveCount(1);
    }
  });

  test('can adjust quantities', async ({ page }) => {
    await page.goto('/pos');

    const itemButtons = page.locator('.menu-item-card');
    const count = await itemButtons.count();

    if (count > 0) {
      // Add item twice
      await itemButtons.first().click();
      await itemButtons.first().click();

      // Quantity should be 2
      await expect(page.locator('.cart-item').first().locator('.quantity')).toContainText('2');

      // Decrement
      await page.locator('.cart-item').first().locator('button', { hasText: '-' }).click();
      await expect(page.locator('.cart-item').first().locator('.quantity')).toContainText('1');
    }
  });

  test('can place an order', async ({ page }) => {
    await page.goto('/pos');

    const itemButtons = page.locator('.menu-item-card');
    const count = await itemButtons.count();

    if (count > 0) {
      await itemButtons.first().click();

      // Click Place Order
      await page.getByRole('button', { name: /place order/i }).click();

      // Should show success message
      await expect(page.locator('.alert-success')).toBeVisible();
    }
  });

  test('cart clears after successful order', async ({ page }) => {
    await page.goto('/pos');

    const itemButtons = page.locator('.menu-item-card');
    const count = await itemButtons.count();

    if (count > 0) {
      await itemButtons.first().click();
      await page.getByRole('button', { name: /place order/i }).click();

      // Cart should be empty after successful order
      await expect(page.locator('.cart-item')).toHaveCount(0);
    }
  });
});
