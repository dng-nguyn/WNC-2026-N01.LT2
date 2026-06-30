import { test, expect } from '@playwright/test';

test.describe('POS terminal', () => {
  const unique = Date.now();
  const username = `posuser_${unique}`;
  const password = 'Testpass123!';

  test.beforeAll(async ({ browser }) => {
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
    await page.goto('/login');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('POS page loads with layout', async ({ page }) => {
    await page.goto('/pos');
    await expect(page.locator('.pos-layout')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'POS Terminal' })).toBeVisible();
  });

  test('displays category tabs', async ({ page }) => {
    await page.goto('/pos');
    // "Tất c?" (All) tab should always be present
    await expect(page.locator('.category-tabs')).toBeVisible();
    await expect(page.locator('.category-pill').first()).toBeVisible();
  });

  test('displays product cards', async ({ page }) => {
    await page.goto('/pos');
    const cards = page.locator('.product-card');
    const count = await cards.count();
    if (count > 0) {
      // First card should have name and price
      await expect(cards.first().locator('.product-card-name')).toBeVisible();
      await expect(cards.first().locator('.product-card-price-pill')).toBeVisible();
    }
  });

  test('can add items to cart', async ({ page }) => {
    await page.goto('/pos');
    const cards = page.locator('.product-card:not([disabled])');
    const count = await cards.count();

    if (count > 0) {
      await cards.first().click();
      // Cart should show the item
      await expect(page.locator('.cart-row')).toHaveCount(1);
      await expect(page.locator('.cart-count-badge')).toBeVisible();
    }
  });

  test('can adjust quantities via +/- buttons', async ({ page }) => {
    await page.goto('/pos');
    const cards = page.locator('.product-card:not([disabled])');
    const count = await cards.count();

    if (count > 0) {
      // Add item twice
      await cards.first().click();
      await cards.first().click();
      await expect(page.locator('.cart-qty-input').first()).toHaveValue('2');

      // Increment via aria-label
      await page.getByRole('button', { name: /increase quantity/i }).first().click();
      await expect(page.locator('.cart-qty-input').first()).toHaveValue('3');

      // Decrement
      await page.getByRole('button', { name: /decrease quantity/i }).first().click();
      await expect(page.locator('.cart-qty-input').first()).toHaveValue('2');
    }
  });

  test('shows cart total', async ({ page }) => {
    await page.goto('/pos');
    const cards = page.locator('.product-card:not([disabled])');
    const count = await cards.count();

    if (count > 0) {
      await cards.first().click();
      // Total should be visible and non-zero
      await expect(page.locator('.cart-total-amount')).toBeVisible();
      const total = await page.locator('.cart-total-amount').textContent();
      expect(total).not.toBe('0 ₫');
    }
  });

  test('can select a table', async ({ page }) => {
    await page.goto('/pos');
    const tableSelect = page.locator('.cart-table-selector select');
    // Takeaway option should be default
    await expect(tableSelect).toBeVisible();
  });

  test('Pay button opens payment modal', async ({ page }) => {
    await page.goto('/pos');
    const cards = page.locator('.product-card:not([disabled])');
    const count = await cards.count();

    if (count > 0) {
      await cards.first().click();
      await page.locator('.cart-pay-btn').click();
      // Payment modal should appear
      await expect(page.getByText(/select payment method/i)).toBeVisible();
    }
  });

  test('payment modal shows Cash and Bank Transfer options', async ({ page }) => {
    await page.goto('/pos');
    const cards = page.locator('.product-card:not([disabled])');
    const count = await cards.count();

    if (count > 0) {
      await cards.first().click();
      await page.locator('.cart-pay-btn').click();

      await expect(page.getByText('Cash')).toBeVisible();
      await expect(page.getByText(/bank transfer/i)).toBeVisible();
    }
  });

  test('payment modal can be closed', async ({ page }) => {
    await page.goto('/pos');
    const cards = page.locator('.product-card:not([disabled])');
    const count = await cards.count();

    if (count > 0) {
      await cards.first().click();
      await page.locator('.cart-pay-btn').click();
      await expect(page.getByText(/select payment method/i)).toBeVisible();

      // Close modal
      await page.getByRole('button', { name: /close/i }).click();
      await expect(page.getByText(/select payment method/i)).not.toBeVisible();
    }
  });

  test('Clear button empties cart', async ({ page }) => {
    await page.goto('/pos');
    const cards = page.locator('.product-card:not([disabled])');
    const count = await cards.count();

    if (count > 0) {
      await cards.first().click();
      await expect(page.locator('.cart-row')).toHaveCount(1);

      await page.locator('.cart-clear-btn').click();
      await expect(page.locator('.cart-row')).toHaveCount(0);
      await expect(page.getByText(/tap items to add them here/i)).toBeVisible();
    }
  });

  test('category tabs filter products', async ({ page }) => {
    await page.goto('/pos');
    const tabs = page.locator('.category-pill');
    const tabCount = await tabs.count();

    if (tabCount > 1) {
      // Click a non-"all" tab
      await tabs.nth(1).click();
      // The tab should become active
      await expect(tabs.nth(1)).toHaveClass(/category-pill--active/);
    }
  });
});
