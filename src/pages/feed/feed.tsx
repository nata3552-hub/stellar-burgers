import { Preloader } from '@ui';
import { FeedUI } from '@ui-pages';
import { useEffect } from 'react';

import { selectFeed } from '@services/selectors/feedSelectors';
import {
  selectIngredientsError,
  selectIngredientsLoading,
} from '@services/selectors/ingredientsSelectors';
import { fetchFeed } from '@services/slices/feedSlice';
import { useDispatch, useSelector } from '@services/store';

export const Feed = (): React.JSX.Element => {
  const dispatch = useDispatch();
  const { orders, isLoading: feedLoading, error: feedError } = useSelector(selectFeed);
  const ingredientsLoading = useSelector(selectIngredientsLoading);
  const ingredientsError = useSelector(selectIngredientsError);

  useEffect(() => {
    void dispatch(fetchFeed());
  }, [dispatch]);

  const handleGetFeeds = (): void => {
    void dispatch(fetchFeed());
  };

  if (feedLoading || ingredientsLoading) {
    return <Preloader />;
  }

  return (
    <>
      {(feedError ?? ingredientsError) && (
        <p role="alert">{feedError ?? ingredientsError}</p>
      )}
      {!feedError && !orders.length && <p>Заказов пока нет</p>}
      <FeedUI orders={orders} handleGetFeeds={handleGetFeeds} />
    </>
  );
};
