import { expect, test } from '@playwright/test';

import type { Page } from '@playwright/test';

const image =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="20" height="20"/%3E';
const ingredient = {
  _id: 'main',
  name: 'Тестовая начинка',
  type: 'main',
  price: 50,
  proteins: 1,
  fat: 2,
  carbohydrates: 3,
  calories: 4,
  image,
  image_large: image,
  image_mobile: image,
};
const bun = {
  ...ingredient,
  _id: 'bun',
  type: 'bun',
  name: 'Тестовая булка',
  price: 100,
};
const order = {
  _id: 'order',
  number: 123,
  name: 'Тестовый заказ',
  status: 'done',
  ingredients: ['bun', 'main', 'main', 'bun'],
  createdAt: '2026-01-01T12:00:00Z',
  updatedAt: '2026-01-01T12:00:00Z',
};

async function mockApi(
  page: Page,
  authenticated = false
): Promise<{
  submittedOrders: string[][];
  calls: Record<string, number>;
}> {
  let signedIn = authenticated;
  let user = { name: 'Тест', email: 'test@example.com' };
  const submittedOrders: string[][] = [];
  const calls: Record<string, number> = {};
  if (authenticated) {
    await page.addInitScript(() => {
      localStorage.setItem('refreshToken', 'test-refresh');
      document.cookie = 'accessToken=Bearer%20test; path=/';
    });
  }
  await page.route('**/*', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const endpoint = path.replace(/^.*\/api/, '');
    const method = route.request().method();
    let body: unknown;
    if (endpoint === '/ingredients') body = { success: true, data: [bun, ingredient] };
    else if (endpoint === '/orders/all')
      body = { success: true, orders: [order], total: 10, totalToday: 2 };
    else if (endpoint === '/orders/123') body = { success: true, orders: [order] };
    else if (/^\/orders\/\d+$/.test(endpoint)) body = { success: true, orders: [] };
    else if (endpoint === '/auth/login' || endpoint === '/auth/register') {
      signedIn = true;
      body = {
        success: true,
        user,
        accessToken: 'Bearer test',
        refreshToken: 'test-refresh',
      };
    } else if (endpoint === '/auth/token')
      body = { success: true, accessToken: 'Bearer test', refreshToken: 'test-refresh' };
    else if (endpoint === '/auth/user') {
      if (!signedIn) {
        await route.fulfill({
          status: 401,
          json: { success: false, message: 'You should be authorised' },
        });
        return;
      }
      if (method === 'PATCH') {
        const update = route.request().postDataJSON() as {
          name?: string;
          email?: string;
        };
        user = { name: update.name ?? user.name, email: update.email ?? user.email };
      }
      body = { success: true, user };
    } else if (endpoint === '/auth/logout') {
      signedIn = false;
      body = { success: true };
    } else if (endpoint === '/password-reset' || endpoint === '/password-reset/reset')
      body = { success: true };
    else if (endpoint === '/orders') {
      if (method === 'POST') {
        const payload = route.request().postDataJSON() as { ingredients: string[] };
        submittedOrders.push(payload.ingredients);
        body = { success: true, order, name: order.name };
      } else body = { success: true, orders: [order] };
    } else {
      await route.continue();
      return;
    }
    calls[`${method} ${endpoint}`] = (calls[`${method} ${endpoint}`] ?? 0) + 1;
    await route.fulfill({ json: body });
  });
  return { submittedOrders, calls };
}

test('ingredient routes: modal, close/back, direct URL and unknown id', async ({
  page,
}) => {
  await mockApi(page);
  await page.goto('/');
  await page.locator('a[href="/ingredients/main"]').click();
  await expect(page).toHaveURL(/\/ingredients\/main$/);
  await expect(page.locator('#modals')).toContainText('Тестовая начинка');
  await page.getByRole('button', { name: 'Закрыть' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/ingredients/main');
  await expect(page.getByText('Тестовая начинка', { exact: true })).toBeVisible();
  await expect(page.locator('#modals')).toBeEmpty();
  await page.goto('/ingredients/missing');
  await expect(page.getByText('Ингредиент не найден')).toBeVisible();
});

test('feed totals, duplicate ingredient price, refresh, modal and direct order', async ({
  page,
}) => {
  const { calls } = await mockApi(page);
  await page.goto('/feed');
  const card = page.getByRole('link').filter({ hasText: 'Тестовый заказ' });
  await expect(card).toContainText('300');
  await expect(page.getByText('Выполнено за все время:')).toBeVisible();
  const initialCalls = calls['GET /orders/all'];
  await page.getByRole('button', { name: 'Обновить' }).click();
  await expect.poll(() => calls['GET /orders/all']).toBeGreaterThan(initialCalls);
  await card.click();
  await expect(page.locator('#modals')).toContainText('#000123');
  await expect(page.locator('#modals')).toContainText('2 x 50');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/feed$/);
  await page.goto('/feed/123');
  await expect(page.getByText('#000123')).toBeVisible();
  await expect(page.locator('#modals')).toBeEmpty();
  await expect(page.getByRole('link', { name: 'Лента заказов' })).toHaveAttribute(
    'aria-current',
    'page'
  );
  await page.goto('/feed/999');
  await expect(page.getByRole('alert')).toHaveText('Заказ не найден');
});

test('protected route returns after login, profile save/cancel, history and logout', async ({
  page,
}) => {
  await mockApi(page);
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login$/);
  await page.locator('input[name="email"]').fill('test@example.com');
  await page.locator('input[name="password"]').fill('test-password');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.locator('input[name="name"]')).toHaveValue('Тест');
  await expect(page.getByRole('button', { name: 'Сохранить' })).toHaveCount(0);
  await page.locator('input[name="name"]').fill('Другое имя');
  await page.getByRole('button', { name: 'Отменить' }).click();
  await expect(page.locator('input[name="name"]')).toHaveValue('Тест');
  await page.locator('input[name="name"]').fill('Новое имя');
  await page.getByRole('button', { name: 'Сохранить' }).click();
  await expect(page.getByRole('button', { name: 'Сохранить' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Новое имя' })).toBeVisible();
  await page.getByRole('link', { name: 'История заказов' }).click();
  await expect(page.getByRole('link', { name: 'Новое имя' })).toHaveAttribute(
    'aria-current',
    'page'
  );
  await page.getByRole('link').filter({ hasText: 'Тестовый заказ' }).click();
  await expect(page.locator('#modals')).toContainText('Выполнен');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Выход' }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem('refreshToken'))).toBeNull();
  expect(
    (await page.context().cookies()).some((cookie) => cookie.name === 'accessToken')
  ).toBe(false);
});

test('constructor survives login and successful order clears it and refreshes lists', async ({
  page,
}) => {
  const { submittedOrders, calls } = await mockApi(page);
  await page.goto('/');
  for (const id of ['bun', 'main', 'main']) {
    await page
      .locator('li')
      .filter({ has: page.locator(`a[href="/ingredients/${id}"]`) })
      .getByRole('button', { name: 'Добавить' })
      .click();
  }
  await expect(page.getByTestId('order-summ')).toContainText('300');
  await expect(
    page.getByTestId('constructor-ingredients').getByText('Тестовая начинка')
  ).toHaveCount(2);
  await page.getByRole('button', { name: 'Оформить заказ' }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(submittedOrders).toHaveLength(0);
  await page.locator('input[name="email"]').fill('test@example.com');
  await page.locator('input[name="password"]').fill('test-password');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('order-summ')).toContainText('300');
  await page.getByRole('button', { name: 'Оформить заказ' }).click();
  await expect(page.locator('#modals')).toContainText('123');
  expect(submittedOrders).toEqual([['bun', 'main', 'main', 'bun']]);
  await expect.poll(() => calls['GET /orders/all']).toBeGreaterThan(0);
  await expect.poll(() => calls['GET /orders']).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Закрыть' }).click();
  await expect(page.getByTestId('constructor-ingredients')).toContainText(
    'Выберите начинку'
  );
});

test('forgot/reset flow and direct reset protection', async ({ page }) => {
  await mockApi(page);
  await page.goto('/reset-password');
  await expect(page).toHaveURL(/\/forgot-password$/);
  await page.locator('input[name="email"]').fill('test@example.com');
  await page.getByRole('button', { name: 'Восстановить', exact: true }).click();
  await expect(page).toHaveURL(/\/reset-password$/);
  await page.locator('input[name="password"]').fill('new-password');
  await page.locator('input[name="token"]').fill('test-code');
  await page.getByRole('button', { name: 'Сохранить' }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem('resetPassword'))).toBeNull();
});

test('registration logs in and authenticated auth pages redirect', async ({ page }) => {
  await mockApi(page);
  await page.goto('/register');
  await page.locator('input[name="name"]').fill('Тест');
  await page.locator('input[name="email"]').fill('test@example.com');
  await page.locator('input[name="password"]').fill('test-password');
  await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
  await expect(page).toHaveURL(/\/$/);
  for (const path of ['/login', '/register', '/forgot-password', '/reset-password']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/$/);
  }
  await page.goto('/profile/orders/123');
  await expect(page.getByText('#000123')).toBeVisible();
  await expect(page.locator('#modals')).toBeEmpty();
});

test('catalog failure does not block login or 404; empty feed ends loading', async ({
  page,
}) => {
  await mockApi(page);
  await page.route('**/ingredients', (route) =>
    route.fulfill({ status: 500, json: { message: 'offline' } })
  );
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('offline');
  await page.getByRole('link', { name: 'Личный кабинет' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Войти', exact: true })).toBeVisible();
  await page.goto('/missing');
  await expect(page.getByText('Страница не найдена. Ошибка 404.')).toBeVisible();
  await page.route('**/orders/all', (route) =>
    route.fulfill({ json: { success: true, orders: [], total: 0, totalToday: 0 } })
  );
  await page.goto('/feed');
  await expect(page.getByText('Заказов пока нет')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Обновить' })).toBeVisible();
});
