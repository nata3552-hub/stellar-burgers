import {
  forgotPasswordApi,
  getUserApi,
  loginUserApi,
  logoutApi,
  refreshToken,
  registerUserApi,
  resetPasswordApi,
  updateUserApi,
} from '@api';
import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';

import { deleteCookie, getCookie, setCookie } from '@utils/cookie';

import type { TLoginData, TRegisterData } from '@api';
import type { TUser } from '@utils-types';

type UserOperation =
  | 'check'
  | 'login'
  | 'register'
  | 'update'
  | 'logout'
  | 'forgot'
  | 'reset';
type RequestState = { isLoading: boolean; error: string | null; requestId?: string };
type UserState = {
  user: TUser | null;
  sessionId: string | null;
  isAuthChecked: boolean;
  requests: Record<UserOperation, RequestState>;
};

const initialState: UserState = {
  user: null,
  sessionId: null,
  isAuthChecked: false,
  requests: {
    check: { isLoading: false, error: null },
    login: { isLoading: false, error: null },
    register: { isLoading: false, error: null },
    update: { isLoading: false, error: null },
    logout: { isLoading: false, error: null },
    forgot: { isLoading: false, error: null },
    reset: { isLoading: false, error: null },
  },
};

const userThunk = createAsyncThunk.withTypes<{ state: { user: UserState } }>();

export const checkUser = userThunk<TUser | null>(
  'user/check',
  async () => {
    if (!getCookie('accessToken')) {
      if (!localStorage.getItem('refreshToken')) return null;
      await refreshToken();
    }
    const response = await getUserApi();
    if (!response.success) throw new Error('Не удалось проверить пользователя');
    return response.user;
  },
  { condition: (_, { getState }) => !getState().user.requests.check.isLoading }
);

export const loginUser = userThunk<TUser, TLoginData>(
  'user/login',
  async (data) => {
    const response = await loginUserApi(data);
    setCookie('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    return response.user;
  },
  { condition: (_, { getState }) => !getState().user.requests.login.isLoading }
);

export const registerUser = userThunk<TUser, TRegisterData>(
  'user/register',
  async (data) => {
    const response = await registerUserApi(data);
    setCookie('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    return response.user;
  },
  { condition: (_, { getState }) => !getState().user.requests.register.isLoading }
);

export const updateUser = userThunk<TUser, Partial<TRegisterData>>(
  'user/update',
  async (data) => {
    const response = await updateUserApi(data);
    if (!response.success) throw new Error('Не удалось сохранить профиль');
    return response.user;
  },
  { condition: (_, { getState }) => !getState().user.requests.update.isLoading }
);

export const logoutUser = userThunk<void>(
  'user/logout',
  async () => {
    const response = await logoutApi();
    if (!response.success) throw new Error('Не удалось выйти');
    deleteCookie('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('resetPassword');
  },
  { condition: (_, { getState }) => !getState().user.requests.logout.isLoading }
);

export const forgotPassword = userThunk<void, { email: string }>(
  'user/forgot',
  async (data) => {
    await forgotPasswordApi(data);
    localStorage.setItem('resetPassword', 'true');
  },
  { condition: (_, { getState }) => !getState().user.requests.forgot.isLoading }
);

export const resetPassword = userThunk<void, { password: string; token: string }>(
  'user/reset',
  async (data) => {
    await resetPasswordApi(data);
    localStorage.removeItem('resetPassword');
  },
  { condition: (_, { getState }) => !getState().user.requests.reset.isLoading }
);

const operations = [
  ['check', checkUser],
  ['login', loginUser],
  ['register', registerUser],
  ['update', updateUser],
  ['logout', logoutUser],
  ['forgot', forgotPassword],
  ['reset', resetPassword],
] as const;

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(checkUser.fulfilled, (state, action) => {
        if (state.requests.check.requestId !== action.meta.requestId) return;
        state.user = action.payload;
        state.sessionId = action.payload
          ? (state.sessionId ?? action.meta.requestId)
          : null;
        state.isAuthChecked = true;
      })
      .addCase(checkUser.rejected, (state, action) => {
        if (state.requests.check.requestId !== action.meta.requestId) return;
        state.user = null;
        state.sessionId = null;
        state.isAuthChecked = true;
      })
      .addCase(logoutUser.fulfilled, () => ({ ...initialState, isAuthChecked: true }))
      .addMatcher(
        isAnyOf(loginUser.fulfilled, registerUser.fulfilled, updateUser.fulfilled),
        (state, action) => {
          const operation = operations.find(([, thunk]) =>
            thunk.fulfilled.match(action)
          )?.[0];
          if (!operation) return;
          if (state.requests[operation].requestId !== action.meta.requestId) return;
          state.user = action.payload;
          if (
            loginUser.fulfilled.match(action) ||
            registerUser.fulfilled.match(action)
          ) {
            state.sessionId = action.meta.requestId;
          }
          state.isAuthChecked = true;
        }
      )
      .addMatcher(
        isAnyOf(...operations.map(([, thunk]) => thunk.pending)),
        (state, action) => {
          const operation = operations.find(([, thunk]) =>
            thunk.pending.match(action)
          )?.[0];
          if (!operation) return;
          state.requests[operation] = {
            isLoading: true,
            error: null,
            requestId: action.meta.requestId,
          };
        }
      )
      .addMatcher(
        isAnyOf(...operations.map(([, thunk]) => thunk.fulfilled)),
        (state, action) => {
          const operation = operations.find(([, thunk]) =>
            thunk.fulfilled.match(action)
          )?.[0];
          if (!operation) return;
          if (state.requests[operation].requestId !== action.meta.requestId) return;
          state.requests[operation].isLoading = false;
        }
      )
      .addMatcher(
        isAnyOf(...operations.map(([, thunk]) => thunk.rejected)),
        (state, action) => {
          const operation = operations.find(([, thunk]) =>
            thunk.rejected.match(action)
          )?.[0];
          if (!operation) return;
          if (state.requests[operation].requestId !== action.meta.requestId) return;
          state.requests[operation] = {
            isLoading: false,
            error: action.error.message ?? 'Ошибка запроса',
          };
        }
      );
  },
});

export const userReducer = userSlice.reducer;
