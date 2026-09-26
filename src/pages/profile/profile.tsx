import { ProfileUI } from '@ui-pages';
import { type SyntheticEvent, useEffect, useState } from 'react';

import { selectUser, selectUserRequests } from '@services/selectors/userSelectors';
import { updateUser } from '@services/slices/userSlice';
import { useDispatch, useSelector } from '@services/store';

import type { TRegisterData } from '@api';

export const Profile = (): React.JSX.Element => {
  const user = useSelector(selectUser);
  const { update } = useSelector(selectUserRequests);
  const dispatch = useDispatch();

  const [formValue, setFormValue] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
  });

  useEffect(() => {
    setFormValue({
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: '',
    });
  }, [user]);

  const isFormChanged =
    formValue.name !== user?.name ||
    formValue.email !== user?.email ||
    !!formValue.password;

  const handleSubmit = (e: SyntheticEvent): void => {
    e.preventDefault();
    if (!user || !isFormChanged || update.isLoading) return;
    const data: Partial<TRegisterData> = {};
    if (formValue.name !== user.name) data.name = formValue.name;
    if (formValue.email !== user.email) data.email = formValue.email;
    if (formValue.password) data.password = formValue.password;
    void dispatch(updateUser(data));
  };

  const handleCancel = (e: SyntheticEvent): void => {
    e.preventDefault();
    setFormValue({
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormValue((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <ProfileUI
      formValue={formValue}
      isFormChanged={isFormChanged}
      handleCancel={handleCancel}
      handleSubmit={handleSubmit}
      handleInputChange={handleInputChange}
      updateUserError={update.error ?? undefined}
    />
  );
};
