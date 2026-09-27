import { OrderCardUI } from '@ui';
import { memo, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import {
  selectIngredients,
  selectIngredientsError,
} from '@services/selectors/ingredientsSelectors';
import { useSelector } from '@services/store';

import type { OrderCardProps } from './type';
import type { TIngredient } from '@utils-types';

const maxIngredients = 6;

export const OrderCard = memo(function OrderCard({
  order,
}: OrderCardProps): React.JSX.Element {
  const location = useLocation();

  const ingredients = useSelector(selectIngredients);
  const ingredientsError = useSelector(selectIngredientsError);

  const orderInfo = useMemo(() => {
    const ingredientsInfo = order.ingredients.reduce(
      (acc: TIngredient[], item: string) => {
        const ingredient = ingredients.find((ing) => ing._id === item);
        if (ingredient) return [...acc, ingredient];
        return acc;
      },
      []
    );

    const total =
      !ingredientsError &&
      order.ingredients.length > 0 &&
      ingredientsInfo.length === order.ingredients.length
        ? ingredientsInfo.reduce((acc, item) => acc + item.price, 0)
        : null;

    const ingredientsToShow = ingredientsInfo.slice(0, maxIngredients);

    const remains =
      ingredientsInfo.length > maxIngredients
        ? ingredientsInfo.length - maxIngredients
        : 0;

    const date = new Date(order.createdAt);
    return {
      ...order,
      ingredientsInfo,
      ingredientsToShow,
      remains,
      total,
      date,
    };
  }, [order, ingredients, ingredientsError]);

  return (
    <OrderCardUI
      orderInfo={orderInfo}
      maxIngredients={maxIngredients}
      locationState={{ background: location }}
    />
  );
});
