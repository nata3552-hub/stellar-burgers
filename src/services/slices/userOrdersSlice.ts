import { getOrdersApi } from '@api';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { logoutUser } from './userSlice';

import type { TOrder } from '@utils-types';

type UserOrdersState = {
  orders: TOrder[];
  isLoading: boolean;
  error: string | null;
  requestId: string | null;
};
const initialState: UserOrdersState = {
  orders: [],
  isLoading: false,
  error: null,
  requestId: null,
};

export const fetchUserOrders = createAsyncThunk<TOrder[]>('userOrders/fetch', () =>
  getOrdersApi()
);

const userOrdersSlice = createSlice({
  name: 'userOrders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserOrders.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;
        state.requestId = action.meta.requestId;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.orders = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.isLoading = false;
        state.error = action.error.message ?? 'Не удалось загрузить историю заказов';
      })
      .addCase(logoutUser.fulfilled, () => initialState);
  },
});

export const userOrdersReducer = userOrdersSlice.reducer;
