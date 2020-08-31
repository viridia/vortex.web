import React, { FC, useCallback, useContext } from 'react';
import classNames from 'classnames';
import { Button } from '../controls/Button';
import { UserContext } from '../user/User';
import { observer } from 'mobx-react';

interface Props {
  onLogin: () => void;
  className?: string;
}

export const LoginButton: FC<Props> = observer(({ onLogin, className, ...props }) => {
  const user = useContext(UserContext);

  const onClickLogin = useCallback(
    (e: React.MouseEvent) => {
      onLogin();
    },
    [onLogin]
  );

  const onClickLogout = useCallback((e: React.MouseEvent) => {
    localStorage.removeItem('session');
    window.location.reload();
  }, []);

  if (user.isLoggedIn) {
    return (
      <Button {...props} className={classNames('dark', className)} onClick={onClickLogout}>
        Logout
      </Button>
    );
  }
  return (
    <Button {...props} className={classNames('dark', className)} onClick={onClickLogin}>
      Login&hellip;
    </Button>
  );
});
LoginButton.displayName = 'LoginButton';
