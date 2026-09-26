import { Preloader, OrderInfoUI } from '@ui';
import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import {
  selectIngredients,
  selectIngredientsError,
  selectIngredientsLoading,
} from '@services/selectors/ingredientsSelectors';
import { selectOrderState } from '@services/selectors/orderSelectors';
import { fetchOrderByNumber, clearOrderDetails } from '@services/slices/orderSlice';
import { useDispatch, useSelector } from '@services/store';

import type { TIngredient } from '@utils-types';

export const OrderInfo = (): React.JSX.Element => {
  const { number } = useParams<{ number: string }>();
  const orderNumber = Number(number);
  const dispatch = useDispatch();
  const { details, detailsNumber, detailsLoading, detailsError } =
    useSelector(selectOrderState);
  const ingredients = useSelector(selectIngredients);
  const ingredientsLoading = useSelector(selectIngredientsLoading);
  const ingredientsError = useSelector(selectIngredientsError);
  const orderData = details?.number === orderNumber ? details : null;

  useEffect(() => {
    void dispatch(fetchOrderByNumber(orderNumber));
    return (): void => {
      dispatch(clearOrderDetails());
    };
  }, [dispatch, orderNumber]);

  /**
   * использование useMemo не обязательно
   */
  /* Готовим данные для отображения */
  const orderInfo = useMemo(() => {
    if (!orderData) return null;

    const date = new Date(orderData.createdAt);

    type TIngredientsWithCount = Record<string, TIngredient & { count: number }>;

    const ingredientsInfo = orderData.ingredients.reduce(
      (acc: TIngredientsWithCount, item) => {
        if (!acc[item]) {
          const ingredient = ingredients.find((ing) => ing._id === item);
          if (ingredient) {
            acc[item] = {
              ...ingredient,
              count: 1,
            };
          }
        } else {
          acc[item].count++;
        }

        return acc;
      },
      {}
    );

    const total = Object.values(ingredientsInfo).reduce(
      (acc, item) => acc + item.price * item.count,
      0
    );

    return {
      ...orderData,
      ingredientsInfo,
      date,
      total,
    };
  }, [orderData, ingredients]);

  if (detailsLoading || ingredientsLoading || !Object.is(detailsNumber, orderNumber)) {
    return <Preloader />;
  }

  if (detailsError || ingredientsError)
    return <p role="alert">{detailsError ?? ingredientsError}</p>;
  if (!orderInfo) return <p>Заказ не найден</p>;

  return <OrderInfoUI orderInfo={orderInfo} />;
};
