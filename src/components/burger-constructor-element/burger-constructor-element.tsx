import { BurgerConstructorElementUI } from '@ui';
import { memo } from 'react';

import {
  moveIngredientDown,
  moveIngredientUp,
  removeIngredient,
} from '@services/slices/burgerConstructorSlice';
import { useDispatch } from '@services/store';

import type { BurgerConstructorElementProps } from './type';

export const BurgerConstructorElement = memo(function BurgerConstructorElement({
  ingredient,
  index,
  totalItems,
}: BurgerConstructorElementProps): React.JSX.Element {
  const dispatch = useDispatch();
  const handleMoveDown = (): void => {
    dispatch(moveIngredientDown(ingredient.id));
  };

  const handleMoveUp = (): void => {
    dispatch(moveIngredientUp(ingredient.id));
  };

  const handleClose = (): void => {
    dispatch(removeIngredient(ingredient.id));
  };

  return (
    <BurgerConstructorElementUI
      ingredient={ingredient}
      index={index}
      totalItems={totalItems}
      handleMoveUp={handleMoveUp}
      handleMoveDown={handleMoveDown}
      handleClose={handleClose}
    />
  );
});
