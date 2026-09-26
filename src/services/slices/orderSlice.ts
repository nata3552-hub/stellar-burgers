import { getOrderByNumberApi, orderBurgerApi } from '@api';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { clearConstructor } from './burgerConstructorSlice';
import { fetchFeed } from './feedSlice';
import { fetchUserOrders } from './userOrdersSlice';
import { logoutUser } from './userSlice';

import type { TConstructorState, TOrder, TUser } from '@utils-types';

type OrderState = {
  createdOrder: TOrder | null;
  createLoading: boolean;
  createError: string | null;
  createRequestId: string | null;
  details: TOrder | null;
  detailsNumber: number | null;
  detailsLoading: boolean;
  detailsError: string | null;
  detailsRequestId: string | null;
};

const initialState: OrderState = {
  createdOrder: null,
  createLoading: false,
  createError: null,
  createRequestId: null,
  details: null,
  detailsNumber: null,
  detailsLoading: false,
  detailsError: null,
  detailsRequestId: null,
};

export const createOrder = createAsyncThunk<
  TOrder,
  void,
  {
    state: {
      burgerConstructor: TConstructorState;
      user: { user: TUser | null; sessionId: string | null };
      order: OrderState;
    };
  }
>(
  'order/create',
  async (_, { getState, dispatch }) => {
    const {
      burgerConstructor,
      user: { user, sessionId },
    } = getState();
    if (!user) throw new Error('Войдите, чтобы оформить заказ');
    if (!burgerConstructor.bun) throw new Error('Выберите булку');
    const ids = [
      burgerConstructor.bun._id,
      ...burgerConstructor.ingredients.map((item) => item._id),
      burgerConstructor.bun._id,
    ];
    const response = await orderBurgerApi(ids);
    if (getState().user.sessionId !== sessionId || !getState().user.user)
      throw new Error('Сессия пользователя изменилась');
    dispatch(clearConstructor());
    void dispatch(fetchUserOrders());
    void dispatch(fetchFeed());
    return response.order;
  },
  { condition: (_, { getState }) => !getState().order.createLoading }
);

export const fetchOrderByNumber = createAsyncThunk<TOrder, number>(
  'order/fetchByNumber',
  async (number) => {
    if (!Number.isSafeInteger(number) || number <= 0)
      throw new Error('Некорректный номер заказа');
    const response = await getOrderByNumberApi(number);
    if (!response.success) throw new Error('Не удалось загрузить заказ');
    const order = response.orders.find((item) => item.number === number);
    if (!order) throw new Error('Заказ не найден');
    return order;
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearCreatedOrder: (state) => {
      state.createdOrder = null;
      state.createError = null;
    },
    clearOrderDetails: (state) => {
      state.details = null;
      state.detailsNumber = null;
      state.detailsLoading = false;
      state.detailsError = null;
      state.detailsRequestId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state, action) => {
        state.createdOrder = null;
        state.createLoading = true;
        state.createError = null;
        state.createRequestId = action.meta.requestId;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        if (state.createRequestId !== action.meta.requestId) return;
        state.createdOrder = action.payload;
        state.createLoading = false;
      })
      .addCase(createOrder.rejected, (state, action) => {
        if (state.createRequestId !== action.meta.requestId) return;
        state.createLoading = false;
        state.createError = action.error.message ?? 'Не удалось оформить заказ';
      })
      .addCase(logoutUser.fulfilled, () => initialState)
      .addCase(fetchOrderByNumber.pending, (state, action) => {
        state.details = null;
        state.detailsNumber = action.meta.arg;
        state.detailsLoading = true;
        state.detailsError = null;
        state.detailsRequestId = action.meta.requestId;
      })
      .addCase(fetchOrderByNumber.fulfilled, (state, action) => {
        if (state.detailsRequestId !== action.meta.requestId) return;
        state.details = action.payload;
        state.detailsLoading = false;
      })
      .addCase(fetchOrderByNumber.rejected, (state, action) => {
        if (state.detailsRequestId !== action.meta.requestId) return;
        state.detailsLoading = false;
        state.detailsError = action.error.message ?? 'Не удалось загрузить заказ';
      });
  },
});

export const { clearOrderDetails, clearCreatedOrder } = orderSlice.actions;
export const orderReducer = orderSlice.reducer;
