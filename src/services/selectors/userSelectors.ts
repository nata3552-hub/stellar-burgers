import type { RootState } from '../store';
import type { TUser } from '@utils-types';

export const selectUser = (state: RootState): TUser | null => state.user.user;
export const selectAuthChecked = (state: RootState): boolean => state.user.isAuthChecked;
export const selectUserRequests = (state: RootState): RootState['user']['requests'] =>
  state.user.requests;
