import React from 'react';
import githubImg from '../images/github.png';
import styled from '@emotion/styled';
import { Button } from '../controls/Button';
import { FC, useCallback } from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../controls/Modal';
import { colors } from '../styles';
import { lighten } from 'polished';

// const googleImg: string = require('../../../images/google.png');

const LoginButton = styled.a`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 2px;
  border: none;
  color: #fff;
  font-size: 18px;
  width: 12em;
  padding: 12px;
  margin-bottom: 4px;
  text-decoration: none;
  &:last-child {
    margin-bottom: 0;
  }

  &.google {
    background: ${colors.buttonLoginGoogleBg};
    &:active {
      background: ${lighten(.05, colors.buttonLoginGoogleBg)};
    }
  }

  &.github {
    background: ${colors.buttonLoginGitHubBg};
    &:active {
      background: ${lighten(.05, colors.buttonLoginGitHubBg)};
    }
  }

  > .logo {
    height: 18px;
    margin-right: 8px;
  }
`;

interface Props {
  open: boolean;
  postLoginAction: string | null;
  onClose: () => void;
}

// @observer
export const LoginDialog: FC<Props> = ({ open, postLoginAction, onClose }) => {
  const saveUrl = postLoginAction
      ? `${window.location.pathname}?action=${postLoginAction}` : window.location.pathname;
  const thisUrl = `${window.location.protocol}//${window.location.host}`;
  const nextUrl = `?next=${encodeURIComponent(saveUrl)}`;

  const onClickLogin = useCallback((e: React.MouseEvent<HTMLElement>) => {
    window.location.href = e.currentTarget.getAttribute('href')!;
  }, []);

  return (
    <Modal className="login" open={open} onClose={onClose} ariaLabel="Login" >
      <ModalHeader>Login</ModalHeader>
      <ModalBody>
        {/* <LoginButton
            className="login google"
            href={`${thisUrl}/auth/google${nextUrl}`}
            onClick={this.onClickLogin}
        >
          <img className="logo" src={googleImg} />
          Login with Google
        </LoginButton> */}
        <LoginButton
            className="login github"
            href={`${thisUrl}/auth/github${nextUrl}`}
            onClick={onClickLogin}
        >
          <img className="logo" src={githubImg} alt="Github" />
          Login with GitHub
        </LoginButton>
        {/* <LoginButton
            className="login facebook"
            href={`${thisUrl}/auth/facebook${nextUrl}`}
            onClick={onClickLogin}
        >
          <img className="logo" src={facebookImg} />
          Login with Facebook
        </LoginButton> */}
      </ModalBody>
      <ModalFooter className="modal-buttons">
        <Button className="close" onClick={onClose}>Cancel</Button>
      </ModalFooter>
    </Modal>
  );
}
