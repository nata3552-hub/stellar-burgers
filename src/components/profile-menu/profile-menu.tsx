import { ProfileMenuUI } from '@ui';
import { useLocation, useNavigate } from 'react-router-dom';

import { selectUserRequests } from '@services/selectors/userSelectors';
import { logoutUser } from '@services/slices/userSlice';
import { useDispatch, useSelector } from '@services/store';

export const ProfileMenu = (): React.JSX.Element => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { logout } = useSelector(selectUserRequests);

  const handleLogout = (): void => {
    if (logout.isLoading) return;
    void dispatch(logoutUser()).then((action) => {
      if (logoutUser.fulfilled.match(action)) void navigate('/login', { replace: true });
    });
  };

  return (
    <>
      <ProfileMenuUI handleLogout={handleLogout} pathname={pathname} />
      {logout.error && <p role="alert">{logout.error}</p>}
    </>
  );
};
