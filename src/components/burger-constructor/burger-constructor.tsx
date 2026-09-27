import { BurgerConstructorUI } from '@ui';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { selectBurgerConstructor } from '@services/selectors/burgerConstructorSelectors';
import { selectOrderState } from '@services/selectors/orderSelectors';
import { selectAuthChecked, selectUser } from '@services/selectors/userSelectors';
import { createOrder, clearCreatedOrder } from '@services/slices/orderSlice';
import { useDispatch, useSelector } from '@services/store';

import type { TConstructorIngredient } from '@utils-types';

export const BurgerConstructor = (): React.JSX.Element | null => {
  const constructorItems = useSelector(selectBurgerConstructor);
  const {
    createLoading: orderRequest,
    createdOrder: orderModalData,
    createError,
  } = useSelector(selectOrderState);
  const user = useSelector(selectUser);
  const isAuthChecked = useSelector(selectAuthChecked);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const onOrderClick = (): void => {
    if (!constructorItems.bun || orderRequest || !isAuthChecked) return;
    if (!user) {
      void navigate('/login', { state: { from: location } });
      return;
    }
    void dispatch(createOrder());
  };

  const closeOrderModal = (): void => {
    if (!orderRequest) dispatch(clearCreatedOrder());
  };

  const price = useMemo(
    () =>
      (constructorItems.bun ? constructorItems.bun.price * 2 : 0) +
      constructorItems.ingredients.reduce(
        (s: number, v: TConstructorIngredient) => s + v.price,
        0
      ),
    [constructorItems]
  );

  return (
    <>
      <BurgerConstructorUI
        price={price}
        orderRequest={orderRequest}
        constructorItems={constructorItems}
        orderModalData={orderModalData}
        onOrderClick={onOrderClick}
        closeOrderModal={closeOrderModal}
      />
      {createError && <p role="alert">{createError}</p>}
    </>
  );
};
