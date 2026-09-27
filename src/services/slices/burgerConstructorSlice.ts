import { createSlice, nanoid } from '@reduxjs/toolkit';

import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  TConstructorIngredient,
  TConstructorState,
  TIngredient,
} from '@utils-types';

const initialState: TConstructorState = { bun: null, ingredients: [] };

const burgerConstructorSlice = createSlice({
  name: 'burgerConstructor',
  initialState,
  reducers: {
    addIngredient: {
      prepare: (ingredient: TIngredient): { payload: TConstructorIngredient } => ({
        payload: { ...ingredient, id: nanoid() },
      }),
      reducer: (state, { payload }: PayloadAction<TConstructorIngredient>) => {
        if (payload.type === 'bun') state.bun = payload;
        else state.ingredients.push(payload);
      },
    },
    removeIngredient: (state, { payload }: PayloadAction<string>) => {
      state.ingredients = state.ingredients.filter((item) => item.id !== payload);
    },
    moveIngredientUp: (state, { payload }: PayloadAction<string>) => {
      const index = state.ingredients.findIndex((item) => item.id === payload);
      if (index > 0) {
        [state.ingredients[index - 1], state.ingredients[index]] = [
          state.ingredients[index],
          state.ingredients[index - 1],
        ];
      }
    },
    moveIngredientDown: (state, { payload }: PayloadAction<string>) => {
      const index = state.ingredients.findIndex((item) => item.id === payload);
      if (index >= 0 && index < state.ingredients.length - 1) {
        [state.ingredients[index], state.ingredients[index + 1]] = [
          state.ingredients[index + 1],
          state.ingredients[index],
        ];
      }
    },
    clearConstructor: () => initialState,
  },
});

export const {
  addIngredient,
  removeIngredient,
  moveIngredientUp,
  moveIngredientDown,
  clearConstructor,
} = burgerConstructorSlice.actions;
export const burgerConstructorReducer = burgerConstructorSlice.reducer;
