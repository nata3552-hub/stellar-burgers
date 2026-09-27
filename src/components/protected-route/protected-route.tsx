import { Preloader } from '@ui';
import { Navigate, useLocation } from 'react-router-dom';

import { selectAuthChecked, selectUser } from '@services/selectors/userSelectors';
import { useSelector } from '@services/store';

import type { TProtectedRouteProps } from './type';
import type { Location } from 'react-router-dom';

export const ProtectedRoute = ({
  children,
  onlyUnAuth = false,
}: TProtectedRouteProps): React.JSX.Element => {
  const location = useLocation();
  const user = useSelector(selectUser);
  const isAuthChecked = useSelector(selectAuthChecked);
  if (!isAuthChecked) return <Preloader />;
  if (!onlyUnAuth && !user)
    return <Navigate to="/login" replace state={{ from: location }} />;
  if (onlyUnAuth && user) {
    const from = (location.state as { from?: Location } | null)?.from;
    const isAllowed =
      from && (from.pathname === '/' || from.pathname.startsWith('/profile'));
    return (
      <Navigate
        to={
          isAllowed
            ? { pathname: from.pathname, search: from.search, hash: from.hash }
            : '/'
        }
        replace
      />
    );
  }
  return children;
};
