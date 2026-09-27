import {
  addIngredient,
  burgerConstructorReducer,
  clearConstructor,
  moveIngredientDown,
  moveIngredientUp,
  removeIngredient,
} from './burgerConstructorSlice';

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
const bun: TIngredient = {
  ...ingredient,
  _id: 'bun-id',
  name: 'Тестовая булка',
  type: 'bun',
};

describe('burger constructor reducer', () => {
  test('returns the initial state for an unknown action', () => {
    expect(burgerConstructorReducer(undefined, { type: 'UNKNOWN' })).toEqual({
      bun: null,
      ingredients: [],
    });
  });

  test('adds a bun', () => {
    const state = burgerConstructorReducer(undefined, addIngredient(bun));

    expect(state.bun).toMatchObject(bun);
    expect(typeof state.bun?.id).toBe('string');
    expect(state.ingredients).toEqual([]);
  });

  test('replaces the previous bun when another bun is added', () => {
    const firstState = burgerConstructorReducer(undefined, addIngredient(bun));
    const secondBun = { ...bun, _id: 'second-bun-id', name: 'Другая булка' };
    const state = burgerConstructorReducer(firstState, addIngredient(secondBun));

    expect(state.bun).toMatchObject(secondBun);
    expect(typeof state.bun?.id).toBe('string');
    expect(state.bun?._id).not.toBe(bun._id);
  });

  test('adds a filling', () => {
    const state = burgerConstructorReducer(undefined, addIngredient(ingredient));

    expect(state.ingredients).toHaveLength(1);
    expect(state.ingredients[0]).toMatchObject(ingredient);
    expect(typeof state.ingredients[0].id).toBe('string');
    expect(state.bun).toBeNull();
  });

  test('creates separate local instances for the same filling', () => {
    const firstState = burgerConstructorReducer(undefined, addIngredient(ingredient));
    const state = burgerConstructorReducer(firstState, addIngredient(ingredient));

    expect(state.ingredients).toHaveLength(2);
    expect(state.ingredients[0].id).not.toBe(state.ingredients[1].id);
  });

  test('removes the selected filling', () => {
    let state = burgerConstructorReducer(undefined, addIngredient(ingredient));
    state = burgerConstructorReducer(state, addIngredient(ingredient));
    const remainingId = state.ingredients[1].id;

    state = burgerConstructorReducer(state, removeIngredient(state.ingredients[0].id));

    expect(state.ingredients.map((item) => item.id)).toEqual([remainingId]);
  });

  test('moves the selected filling up', () => {
    let state = burgerConstructorReducer(undefined, addIngredient(ingredient));
    state = burgerConstructorReducer(
      state,
      addIngredient({ ...ingredient, _id: 'second-main-id' })
    );
    const secondId = state.ingredients[1].id;

    state = burgerConstructorReducer(state, moveIngredientUp(secondId));

    expect(state.ingredients[0].id).toBe(secondId);
  });

  test('moves the selected filling down', () => {
    let state = burgerConstructorReducer(undefined, addIngredient(ingredient));
    state = burgerConstructorReducer(
      state,
      addIngredient({ ...ingredient, _id: 'second-main-id' })
    );
    const firstId = state.ingredients[0].id;

    state = burgerConstructorReducer(state, moveIngredientDown(firstId));

    expect(state.ingredients[1].id).toBe(firstId);
  });

  test('clears the constructor', () => {
    let state = burgerConstructorReducer(undefined, addIngredient(bun));
    state = burgerConstructorReducer(state, addIngredient(ingredient));

    expect(burgerConstructorReducer(state, clearConstructor())).toEqual({
      bun: null,
      ingredients: [],
    });
  });
});
