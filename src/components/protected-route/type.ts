import type { ReactElement } from 'react';

export type TProtectedRouteProps = {
  children: ReactElement;
  onlyUnAuth?: boolean;
};
