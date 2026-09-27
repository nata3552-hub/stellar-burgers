import type { RootState } from '../store';

export const selectUserOrders = (state: RootState): RootState['userOrders'] =>
  state.userOrders;
