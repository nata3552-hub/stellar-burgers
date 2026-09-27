import * as api from '@api';
import { configureStore } from '@reduxjs/toolkit';

import { deleteCookie, getCookie, setCookie } from '@utils/cookie';

import { rootReducer } from './rootReducer';
import {
  addIngredient,
  clearConstructor,
  moveIngredientDown,
  moveIngredientUp,
  removeIngredient,
} from './slices/burgerConstructorSlice';
import { fetchFeed } from './slices/feedSlice';
import { fetchIngredients } from './slices/ingredientsSlice';
import { clearCreatedOrder, createOrder, fetchOrderByNumber } from './slices/orderSlice';
import { fetchUserOrders } from './slices/userOrdersSlice';
import {
  checkUser,
  forgotPassword,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  updateUser,
} from './slices/userSlice';

import type { TIngredient, TOrder } from '@utils-types';

jest.mock('@api');
jest.mock('@utils/cookie');

const makeStore = (): ReturnType<
  typeof configureStore<ReturnType<typeof rootReducer>>
> => configureStore({ reducer: rootReducer });
const ingredient: TIngredient = {
  _id: 'main',
  name: 'Начинка',
  type: 'main',
  price: 50,
  proteins: 1,
  fat: 2,
  carbohydrates: 3,
  calories: 4,
  image: '',
  image_large: '',
  image_mobile: '',
};
const bun: TIngredient = { ...ingredient, _id: 'bun', type: 'bun', price: 100 };
const order: TOrder = {
  _id: 'order',
  number: 123,
  name: 'Бургер',
  status: 'done',
  ingredients: ['bun', 'main', 'main', 'bun'],
  createdAt: '2026-01-01T12:00:00Z',
  updatedAt: '2026-01-01T12:00:00Z',
};
const user = { name: 'Тест', email: 'test@example.com' };
const credentials = { email: user.email, password: 'test-password' };
const tokens = {
  success: true,
  user,
  accessToken: 'Bearer test',
  refreshToken: 'test-refresh',
};

beforeEach(() => {
  jest.resetAllMocks();
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string): string | null => storage.get(key) ?? null,
      setItem: (key: string, value: string): void => {
        storage.set(key, value);
      },
      removeItem: (key: string): void => {
        storage.delete(key);
      },
    },
  });
  jest
    .mocked(api.getFeedsApi)
    .mockResolvedValue({ success: true, orders: [order], total: 1, totalToday: 1 });
  jest.mocked(api.getOrdersApi).mockResolvedValue([order]);
  jest.mocked(api.loginUserApi).mockResolvedValue(tokens);
  jest.mocked(api.registerUserApi).mockResolvedValue(tokens);
});

test('constructor replaces buns and removes/moves only the chosen instance', () => {
  const store = makeStore();
  store.dispatch(addIngredient(bun));
  store.dispatch(addIngredient({ ...bun, _id: 'second-bun' }));
  store.dispatch(addIngredient(ingredient));
  store.dispatch(addIngredient(ingredient));
  const [first, second] = store.getState().burgerConstructor.ingredients;
  expect(first.id).not.toBe(second.id);
  expect(first.id).not.toBe(first._id);
  store.dispatch(moveIngredientUp(second.id));
  expect(store.getState().burgerConstructor.ingredients[0].id).toBe(second.id);
  store.dispatch(moveIngredientDown(second.id));
  expect(store.getState().burgerConstructor.ingredients[1].id).toBe(second.id);
  store.dispatch(removeIngredient(first.id));
  expect(store.getState().burgerConstructor.ingredients).toEqual([second]);
  store.dispatch(removeIngredient(store.getState().burgerConstructor.bun!.id));
  expect(store.getState().burgerConstructor.bun?._id).toBe('second-bun');
  store.dispatch(clearConstructor());
  expect(store.getState().burgerConstructor).toEqual({ bun: null, ingredients: [] });
});

test('empty ingredients and failed requests finish loading', async () => {
  const store = makeStore();
  jest
    .mocked(api.getIngredientsApi)
    .mockResolvedValueOnce([])
    .mockRejectedValueOnce(new Error('offline'));
  await store.dispatch(fetchIngredients());
  expect(store.getState().ingredients).toEqual({
    ingredients: [],
    isLoading: false,
    error: null,
  });
  await store.dispatch(fetchIngredients());
  expect(store.getState().ingredients).toMatchObject({
    isLoading: false,
    error: 'offline',
  });
});

test('feed keeps latest response and server totals', async () => {
  const store = makeStore();
  await store.dispatch(fetchFeed());
  expect(store.getState().feed).toMatchObject({
    orders: [order],
    total: 1,
    totalToday: 1,
    isLoading: false,
  });
  store.dispatch(fetchFeed.pending('old'));
  store.dispatch(fetchFeed.pending('new'));
  store.dispatch(fetchFeed.fulfilled({ orders: [], total: 0, totalToday: 0 }, 'old'));
  expect(store.getState().feed.orders).toEqual([order]);
  store.dispatch(fetchFeed.rejected(new Error('offline'), 'new'));
  expect(store.getState().feed).toMatchObject({ isLoading: false, error: 'offline' });
});

test.each([
  { success: false, orders: [order] },
  { success: true, orders: [] },
  { success: true, orders: [{ ...order, number: 999 }] },
])('order rejects an unsuccessful or missing match: %j', async (response) => {
  const store = makeStore();
  jest.mocked(api.getOrderByNumberApi).mockResolvedValue(response);
  await store.dispatch(fetchOrderByNumber(123));
  expect(store.getState().order.details).toBeNull();
  expect(store.getState().order.detailsLoading).toBe(false);
  expect(store.getState().order.detailsError).toBeTruthy();
});

test('late order response cannot overwrite the next requested number', () => {
  const store = makeStore();
  store.dispatch(fetchOrderByNumber.pending('old', 123));
  store.dispatch(fetchOrderByNumber.pending('new', 124));
  store.dispatch(fetchOrderByNumber.fulfilled(order, 'old', 123));
  expect(store.getState().order.details).toBeNull();
  store.dispatch(fetchOrderByNumber.fulfilled({ ...order, number: 124 }, 'new', 124));
  expect(store.getState().order.details?.number).toBe(124);
});

test('initial auth check finishes without tokens and after rejection', async () => {
  const store = makeStore();
  await store.dispatch(checkUser());
  expect(api.getUserApi).not.toHaveBeenCalled();
  expect(store.getState().user.isAuthChecked).toBe(true);
  jest.mocked(getCookie).mockReturnValue('expired');
  jest.mocked(api.getUserApi).mockRejectedValue(new Error('jwt expired'));
  await store.dispatch(checkUser());
  expect(store.getState().user).toMatchObject({ user: null, isAuthChecked: true });
  expect(store.getState().user.requests.check.isLoading).toBe(false);
});

test('refresh-only initialization obtains the current user', async () => {
  const store = makeStore();
  localStorage.setItem('refreshToken', 'refresh');
  jest.mocked(api.refreshToken).mockResolvedValue(tokens);
  jest.mocked(api.getUserApi).mockResolvedValue({ success: true, user });
  await store.dispatch(checkUser());
  expect(api.refreshToken).toHaveBeenCalledTimes(1);
  expect(store.getState().user.user).toEqual(user);
});

test('login/register persist API tokens; update changes user', async () => {
  const store = makeStore();
  await store.dispatch(loginUser(credentials));
  expect(setCookie).toHaveBeenCalledWith('accessToken', tokens.accessToken);
  expect(localStorage.getItem('refreshToken')).toBe(tokens.refreshToken);
  expect(store.getState().user.user).toEqual(user);
  await store.dispatch(registerUser({ ...credentials, name: user.name }));
  jest
    .mocked(api.updateUserApi)
    .mockResolvedValue({ success: true, user: { ...user, name: 'Новое имя' } });
  await store.dispatch(updateUser({ name: 'Новое имя' }));
  expect(store.getState().user.user?.name).toBe('Новое имя');
});

test('logout clears private state and ignores late history/profile responses', async () => {
  const store = makeStore();
  await store.dispatch(loginUser(credentials));
  await store.dispatch(fetchUserOrders());
  store.dispatch(fetchUserOrders.pending('late-history'));
  store.dispatch(updateUser.pending('late-profile', { name: 'Late' }));
  jest.mocked(api.logoutApi).mockResolvedValue({ success: true });
  await store.dispatch(logoutUser());
  store.dispatch(fetchUserOrders.fulfilled([order], 'late-history'));
  store.dispatch(updateUser.fulfilled(user, 'late-profile', { name: 'Late' }));
  expect(store.getState().user.user).toBeNull();
  expect(store.getState().userOrders.orders).toEqual([]);
  expect(deleteCookie).toHaveBeenCalledWith('accessToken');
  expect(localStorage.getItem('refreshToken')).toBeNull();
});

test('password reset flag is set and cleared only on success', async () => {
  const store = makeStore();
  jest.mocked(api.forgotPasswordApi).mockResolvedValue({ success: true });
  await store.dispatch(forgotPassword({ email: user.email }));
  expect(localStorage.getItem('resetPassword')).toBe('true');
  jest
    .mocked(api.resetPasswordApi)
    .mockRejectedValueOnce(new Error('wrong token'))
    .mockResolvedValueOnce({ success: true });
  await store.dispatch(resetPassword({ password: 'new-password', token: 'code' }));
  expect(localStorage.getItem('resetPassword')).toBe('true');
  await store.dispatch(resetPassword({ password: 'new-password', token: 'code' }));
  expect(localStorage.getItem('resetPassword')).toBeNull();
});

test('order creation submits repeated server ids, clears only on success, refreshes lists', async () => {
  const store = makeStore();
  await store.dispatch(loginUser(credentials));
  store.dispatch(addIngredient(bun));
  store.dispatch(addIngredient(ingredient));
  store.dispatch(addIngredient(ingredient));
  jest
    .mocked(api.orderBurgerApi)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ success: true, order, name: order.name });
  await store.dispatch(createOrder());
  expect(store.getState().burgerConstructor.ingredients).toHaveLength(2);
  expect(store.getState().order.createLoading).toBe(false);
  await store.dispatch(createOrder());
  expect(api.orderBurgerApi).toHaveBeenLastCalledWith(['bun', 'main', 'main', 'bun']);
  expect(store.getState().burgerConstructor).toEqual({ bun: null, ingredients: [] });
  expect(store.getState().order.createdOrder).toEqual(order);
  expect(api.getFeedsApi).toHaveBeenCalled();
  expect(api.getOrdersApi).toHaveBeenCalled();
  store.dispatch(clearCreatedOrder());
  expect(store.getState().order.createdOrder).toBeNull();
  expect(store.getState().user.user).toEqual(user);
});

test('unauthorized order is rejected before calling API', async () => {
  const store = makeStore();
  store.dispatch(addIngredient(bun));
  await store.dispatch(createOrder());
  expect(api.orderBurgerApi).not.toHaveBeenCalled();
  expect(store.getState().burgerConstructor.bun).not.toBeNull();
});

test('profile update during order creation preserves the session and completes the order', async () => {
  const store = makeStore();
  await store.dispatch(loginUser(credentials));
  store.dispatch(addIngredient(bun));
  const sessionId = store.getState().user.sessionId;
  let completeOrder:
    | ((response: Awaited<ReturnType<typeof api.orderBurgerApi>>) => void)
    | undefined;
  jest.mocked(api.orderBurgerApi).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        completeOrder = resolve;
      })
  );
  const request = store.dispatch(createOrder());
  jest.mocked(api.updateUserApi).mockResolvedValue({
    success: true,
    user: { name: 'Updated', email: 'updated@example.com' },
  });
  await store.dispatch(updateUser({ name: 'Updated', email: 'updated@example.com' }));
  expect(store.getState().user.sessionId).toBe(sessionId);
  completeOrder!({ success: true, order, name: order.name });
  await request;
  expect(store.getState().order.createdOrder).toEqual(order);
  expect(store.getState().burgerConstructor.bun).toBeNull();
  expect(api.getOrdersApi).toHaveBeenCalledTimes(1);
});

test.each(['logout', 'relogin', 'switch-user'])(
  'late order cannot affect a changed session: %s',
  async (change) => {
    const store = makeStore();
    await store.dispatch(loginUser(credentials));
    store.dispatch(addIngredient(bun));
    const sessionId = store.getState().user.sessionId;
    let completeOrder:
      | ((response: Awaited<ReturnType<typeof api.orderBurgerApi>>) => void)
      | undefined;
    jest.mocked(api.orderBurgerApi).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          completeOrder = resolve;
        })
    );
    const request = store.dispatch(createOrder());
    if (change !== 'switch-user') {
      jest.mocked(api.logoutApi).mockResolvedValue({ success: true });
      await store.dispatch(logoutUser());
    }
    if (change === 'relogin') await store.dispatch(loginUser(credentials));
    if (change === 'switch-user') {
      jest.mocked(api.loginUserApi).mockResolvedValue({
        ...tokens,
        user: { name: 'Other', email: 'other@example.com' },
      });
      await store.dispatch(loginUser({ ...credentials, email: 'other@example.com' }));
    }
    expect(store.getState().user.sessionId).not.toBe(sessionId);
    store.dispatch(addIngredient(bun));
    completeOrder!({ success: true, order, name: order.name });
    await request;
    expect(store.getState().order.createdOrder).toBeNull();
    expect(store.getState().burgerConstructor.bun).not.toBeNull();
    expect(api.getOrdersApi).not.toHaveBeenCalled();
  }
);
