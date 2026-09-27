import { ForgotPasswordUI } from '@ui-pages';
import { useState, type SyntheticEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { selectUserRequests } from '@services/selectors/userSelectors';
import { forgotPassword } from '@services/slices/userSlice';
import { useDispatch, useSelector } from '@services/store';

export const ForgotPassword = (): React.JSX.Element => {
  const [email, setEmail] = useState('');
  const dispatch = useDispatch();
  const { forgot } = useSelector(selectUserRequests);

  const navigate = useNavigate();

  const handleSubmit = (e: SyntheticEvent): void => {
    e.preventDefault();

    if (forgot.isLoading) return;
    void dispatch(forgotPassword({ email })).then((action) => {
      if (forgotPassword.fulfilled.match(action))
        void navigate('/reset-password', { replace: true });
    });
  };

  return (
    <ForgotPasswordUI
      errorText={forgot.error ?? undefined}
      email={email}
      setEmail={setEmail}
      handleSubmit={handleSubmit}
    />
  );
};
