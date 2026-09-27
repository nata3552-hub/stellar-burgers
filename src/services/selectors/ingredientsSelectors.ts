import type { RootState } from '../store';
import type { TIngredient } from '@utils-types';

export const selectIngredients = (state: RootState): TIngredient[] =>
  state.ingredients.ingredients;

export const selectIngredientsLoading = (state: RootState): boolean =>
  state.ingredients.isLoading;

export const selectIngredientsError = (state: RootState): string | null =>
  state.ingredients.error;
