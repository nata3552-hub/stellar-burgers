import { Preloader } from '@ui';
import { ProfileOrdersUI } from '@ui-pages';
import { useEffect } from 'react';

import {
  selectIngredientsError,
  selectIngredientsLoading,
} from '@services/selectors/ingredientsSelectors';
import { selectUserOrders } from '@services/selectors/userOrdersSelectors';
import { fetchUserOrders } from '@services/slices/userOrdersSlice';
import { useDispatch, useSelector } from '@services/store';

export const ProfileOrders = (): React.JSX.Element => {
  const dispatch = useDispatch();
  const {
    orders,
    isLoading: userOrdersLoading,
    error: userOrdersError,
  } = useSelector(selectUserOrders);
  const ingredientsLoading = useSelector(selectIngredientsLoading);
  const ingredientsError = useSelector(selectIngredientsError);
  useEffect(() => {
    void dispatch(fetchUserOrders());
  }, [dispatch]);

  if (userOrdersLoading || ingredientsLoading) return <Preloader />;
  return (
    <>
      {(userOrdersError ?? ingredientsError) && (
        <p role="alert">{userOrdersError ?? ingredientsError}</p>
      )}
      {!userOrdersError && !orders.length && <p>У вас пока нет заказов</p>}
      <ProfileOrdersUI orders={orders} />
    </>
  );
};
