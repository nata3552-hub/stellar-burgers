import { fetchIngredients, ingredientsReducer } from './ingredientsSlice';

import type { TIngredient } from '@utils-types';

const ingredient: TIngredient = {
  _id: 'main-id',
  name: 'Тестовая начинка',
  type: 'main',
  proteins: 21,
  fat: 22,
  carbohydrates: 23,
  calories: 222,
  price: 200,
  image: '',
  image_mobile: '',
  image_large: '',
};

describe('ingredients reducer', () => {
  test('returns the initial state for an unknown action', () => {
    expect(ingredientsReducer(undefined, { type: 'UNKNOWN' })).toEqual({
      ingredients: [],
      isLoading: false,
      error: null,
    });
  });

  test('starts loading and clears the previous error on pending', () => {
    const state = {
      ingredients: [ingredient],
      isLoading: false,
      error: 'Предыдущая ошибка',
    };

    expect(ingredientsReducer(state, fetchIngredients.pending('request-id'))).toEqual({
      ingredients: [ingredient],
      isLoading: true,
      error: null,
    });
  });

  test('stores ingredients and finishes loading on fulfilled', () => {
    const state = { ingredients: [], isLoading: true, error: null };

    expect(
      ingredientsReducer(state, fetchIngredients.fulfilled([ingredient], 'request-id'))
    ).toEqual({
      ingredients: [ingredient],
      isLoading: false,
      error: null,
    });
  });

  test('stores the request error and finishes loading on rejected', () => {
    const state = { ingredients: [], isLoading: true, error: null };

    expect(
      ingredientsReducer(
        state,
        fetchIngredients.rejected(new Error('Сеть недоступна'), 'request-id')
      )
    ).toEqual({
      ingredients: [],
      isLoading: false,
      error: 'Сеть недоступна',
    });
  });
});
