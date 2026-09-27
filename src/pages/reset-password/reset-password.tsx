import { ResetPasswordUI } from '@ui-pages';
import { type SyntheticEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { selectUserRequests } from '@services/selectors/userSelectors';
import { resetPassword } from '@services/slices/userSlice';
import { useDispatch, useSelector } from '@services/store';

export const ResetPassword = (): React.JSX.Element => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const dispatch = useDispatch();
  const { reset } = useSelector(selectUserRequests);

  const handleSubmit = (e: SyntheticEvent): void => {
    e.preventDefault();

    if (reset.isLoading) return;
    void dispatch(resetPassword({ password, token })).then((action) => {
      if (resetPassword.fulfilled.match(action)) void navigate('/login');
    });
  };

  useEffect(() => {
    if (!localStorage.getItem('resetPassword')) {
      void navigate('/forgot-password', { replace: true });
    }
  }, [navigate]);

  return (
    <ResetPasswordUI
      errorText={reset.error ?? undefined}
      password={password}
      token={token}
      setPassword={setPassword}
      setToken={setToken}
      handleSubmit={handleSubmit}
    />
  );
};
