import { LoginUI } from '@ui-pages';
import { type SyntheticEvent, useState } from 'react';

import { selectUserRequests } from '@services/selectors/userSelectors';
import { loginUser } from '@services/slices/userSlice';
import { useDispatch, useSelector } from '@services/store';

export const Login = (): React.JSX.Element => {
  const dispatch = useDispatch();
  const { login } = useSelector(selectUserRequests);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: SyntheticEvent): void => {
    e.preventDefault();
    if (!login.isLoading) void dispatch(loginUser({ email, password }));
  };

  return (
    <LoginUI
      errorText={login.error ?? ''}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      handleSubmit={handleSubmit}
    />
  );
};
