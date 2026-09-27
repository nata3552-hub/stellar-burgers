import {
  BurgerIcon,
  ListIcon,
  ProfileIcon,
  Logo,
} from '@krgaa/react-developer-burger-ui-components';
import { clsx } from 'clsx';
import { Link, NavLink } from 'react-router-dom';

import type { TAppHeaderUIProps } from './type';

import styles from './app-header.module.css';

export const AppHeaderUI = ({ userName }: TAppHeaderUIProps): React.JSX.Element => (
  <header className={styles.header}>
    <nav className={clsx(styles.menu, 'p-4')}>
      <div className={styles.menu_part_left}>
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            clsx(styles.link, { [styles.link_active]: isActive })
          }
        >
          {({ isActive }) => (
            <>
              <BurgerIcon type={isActive ? 'primary' : 'secondary'} />
              <p className="text text_type_main-default ml-2 mr-10">Конструктор</p>
            </>
          )}
        </NavLink>
        <NavLink
          to="/feed"
          className={({ isActive }) =>
            clsx(styles.link, { [styles.link_active]: isActive })
          }
        >
          {({ isActive }) => (
            <>
              <ListIcon type={isActive ? 'primary' : 'secondary'} />
              <p className="text text_type_main-default ml-2">Лента заказов</p>
            </>
          )}
        </NavLink>
      </div>
      <div className={styles.logo}>
        <Link to="/">
          <Logo className="" />
        </Link>
      </div>
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          clsx(styles.link, styles.link_position_last, {
            [styles.link_active]: isActive,
          })
        }
      >
        {({ isActive }) => (
          <>
            <ProfileIcon type={isActive ? 'primary' : 'secondary'} />
            <p className="text text_type_main-default ml-2">
              {userName ?? 'Личный кабинет'}
            </p>
          </>
        )}
      </NavLink>
    </nav>
  </header>
);
