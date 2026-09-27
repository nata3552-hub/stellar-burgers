import path from 'path';

import { expect, test } from '@playwright/test';

import type { Page } from '@playwright/test';

const harPath = path.join(process.cwd(), 'tests', 'hars', 'constructor.har');
const apiUrl = 'https://norma.education-services.ru/api/**';
const bunName = 'Тестовая космическая булка';
const mainName = 'Тестовая галактическая начинка';

const addIngredient = async (page: Page, name: string): Promise<void> => {
  await page
    .locator('li')
    .filter({ hasText: name })
    .getByRole('button', { name: 'Добавить' })
    .click();
};

test.describe('burger constructor', () => {
  test.beforeEach(async ({ page }) => {
    await page.routeFromHAR(harPath, {
      notFound: 'abort',
      update: false,
      url: apiUrl,
    });
  });

  test('adds a bun and a filling to the correct constructor sections', async ({
    page,
  }) => {
    await page.goto('/');

    await addIngredient(page, bunName);
    await addIngredient(page, mainName);

    await expect(page.getByTestId('constructor-bun-1')).toContainText(bunName);
    await expect(page.getByTestId('constructor-bun-2')).toContainText(bunName);
    await expect(page.getByTestId('constructor-ingredients')).toContainText(mainName);
  });

  test('shows the selected ingredient details and closes the modal in both ways', async ({
    page,
  }) => {
    await page.goto('/');
    const ingredientLink = page.getByRole('link').filter({ hasText: mainName });

    await ingredientLink.click();
    const modalRoot = page.locator('#modals');
    await expect(modalRoot.getByText(mainName, { exact: true })).toBeVisible();
    await expect(modalRoot.getByText('222', { exact: true })).toBeVisible();
    await expect(modalRoot.getByText('21', { exact: true })).toBeVisible();
    await expect(modalRoot.getByText('22', { exact: true })).toBeVisible();
    await expect(modalRoot.getByText('23', { exact: true })).toBeVisible();

    await modalRoot.getByRole('button', { name: 'Закрыть' }).click();
    await expect(modalRoot).toBeEmpty();

    await ingredientLink.click();
    await expect(modalRoot.getByText(mainName, { exact: true })).toBeVisible();
    await page.getByTestId('modal-overlay').click({ position: { x: 1, y: 1 } });
    await expect(modalRoot).toBeEmpty();
  });

  test('creates an order for an authenticated user and clears the constructor', async ({
    context,
    page,
  }) => {
    await context.addCookies([
      {
        name: 'accessToken',
        value: 'Bearer fake-access-token',
        url: 'http://localhost:4000',
      },
    ]);
    await page.addInitScript(() => {
      localStorage.setItem('refreshToken', 'fake-refresh-token');
    });
    await page.goto('/');

    await addIngredient(page, bunName);
    await addIngredient(page, mainName);
    await page.getByRole('button', { name: 'Оформить заказ' }).click();

    const modalRoot = page.locator('#modals');
    await expect(modalRoot).not.toBeEmpty();
    await expect(page.getByTestId('order-number')).toHaveText('123456');
    await expect(page.getByTestId('constructor-bun-1')).toHaveCount(0);
    await expect(page.getByTestId('constructor-bun-2')).toHaveCount(0);
    await expect(page.getByTestId('constructor-ingredients')).not.toContainText(
      mainName
    );
    await expect(page.getByText('Выберите булки', { exact: true })).toHaveCount(2);
    await expect(page.getByText('Выберите начинку', { exact: true })).toBeVisible();

    await modalRoot.getByRole('button', { name: 'Закрыть' }).click();
    await expect(modalRoot).toBeEmpty();
  });
});
