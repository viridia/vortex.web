import React, { FC, useCallback, useContext } from 'react';
import classNames from 'classnames';
import { Button } from '../controls/Button';
import { SessionContext } from '../Session';
import { observer } from 'mobx-react';

interface Props {
  onLogin: () => void;
  className?: string;
}

export const LoginButton: FC<Props> = observer(({ onLogin, className, ...props }) => {
  const session = useContext(SessionContext);

  const onClickLogin = useCallback(
    (e: React.MouseEvent) => {
      onLogin();
    },
    [onLogin]
  );

  const onClickLogout = useCallback((e: React.MouseEvent) => {
    session.signOut();
    window.location.reload();
  }, [session]);

  if (session.isLoggedIn) {
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
