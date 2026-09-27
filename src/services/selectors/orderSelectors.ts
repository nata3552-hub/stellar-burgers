import type { RootState } from '../store';

export const selectOrderState = (state: RootState): RootState['order'] => state.order;
