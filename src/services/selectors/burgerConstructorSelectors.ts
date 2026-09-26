import type { RootState } from '../store';
import type { TConstructorState } from '@utils-types';

export const selectBurgerConstructor = (state: RootState): TConstructorState =>
  state.burgerConstructor;
