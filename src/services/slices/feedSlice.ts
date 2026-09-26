import { getFeedsApi } from '@api';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { TFeedState, TOrdersData } from '@utils-types';

const initialState: Omit<TFeedState, 'error'> & {
  error: string | null;
  requestId: string | null;
} = {
  requestId: null,
  orders: [],
  total: 0,
  totalToday: 0,
  isLoading: false,
  error: null,
};

export const fetchFeed = createAsyncThunk<TOrdersData>('feed/fetch', () =>
  getFeedsApi()
);

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state, action) => {
        state.requestId = action.meta.requestId;
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeed.fulfilled, (state, { payload, meta }) => {
        if (state.requestId !== meta.requestId) return;
        state.orders = payload.orders;
        state.total = payload.total;
        state.totalToday = payload.totalToday;
        state.isLoading = false;
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.isLoading = false;
        state.error = action.error.message ?? 'Не удалось загрузить ленту';
      });
  },
});

export const feedReducer = feedSlice.reducer;
