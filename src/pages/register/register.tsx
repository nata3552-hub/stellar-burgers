import { RegisterUI } from '@ui-pages';
import { type SyntheticEvent, useState } from 'react';

import { selectUserRequests } from '@services/selectors/userSelectors';
import { registerUser } from '@services/slices/userSlice';
import { useDispatch, useSelector } from '@services/store';

export const Register = (): React.JSX.Element => {
  const dispatch = useDispatch();
  const { register } = useSelector(selectUserRequests);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: SyntheticEvent): void => {
    e.preventDefault();
    if (!register.isLoading)
      void dispatch(registerUser({ email, password, name: userName }));
  };

  return (
    <RegisterUI
      errorText={register.error ?? ''}
      email={email}
      userName={userName}
      password={password}
      setEmail={setEmail}
      setPassword={setPassword}
      setUserName={setUserName}
      handleSubmit={handleSubmit}
    />
  );
};
