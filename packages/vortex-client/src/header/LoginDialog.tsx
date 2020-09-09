/** @jsx jsx */
import React from 'react';
import githubImg from '../images/github.png';
import googleImg from '../images/google.png';
import qs from 'qs';
import styled from '@emotion/styled';
import { AUTH_HOST } from '../network';
import { Button } from '../controls/Button';
import { FC, useCallback } from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../controls/Modal';
import { colors } from '../styles';
import { jsx } from '@emotion/core';
import { lighten } from 'polished';

const LoginButton = styled.a`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 2px;
  border: none;
  color: #fff;
  font-size: 18px;
  width: 16rem;
  padding: 12px;
  margin-bottom: 4px;
  text-decoration: none;
  &:last-child {
    margin-bottom: 0;
  }

  &.google {
    background: ${colors.buttonLoginGoogleBg};
    &:active {
      background: ${lighten(0.05, colors.buttonLoginGoogleBg)};
    }
  }

  &.github {
    background: ${colors.buttonLoginGitHubBg};
    &:active {
      background: ${lighten(0.05, colors.buttonLoginGitHubBg)};
    }
  }

  > .logo {
    height: 18px;
    margin-right: 8px;
  }
`;

interface Props {
  open: boolean;
  onClose: () => void;
}

export const LoginDialog: FC<Props> = ({ open, onClose }) => {
  const apiUrl = new URL(AUTH_HOST);
  const nextUrl = qs.stringify({ next: window.location.pathname }, { addQueryPrefix: true });

  const onClickLogin = useCallback((e: React.MouseEvent<HTMLElement>) => {
    window.location.href = e.currentTarget.getAttribute('href')!;
  }, []);

  return (
    <Modal
      className="login"
      open={open}
      onClose={onClose}
      ariaLabel="Login"
      css={{ width: '20rem' }}
    >
      <ModalHeader>Login</ModalHeader>
      <ModalBody css={{ alignItems: 'center' }}>
        <LoginButton
            className="login google"
            href={`${apiUrl}auth/google${nextUrl}`}
            onClick={onClickLogin}
        >
          <img className="logo" src={googleImg} alt="Google" />
          Login with Google
        </LoginButton>
        <LoginButton
          className="login github"
          href={`${apiUrl}auth/github${nextUrl}`}
          onClick={onClickLogin}
        >
          <img className="logo" src={githubImg} alt="Github" />
          Login with GitHub
        </LoginButton>
      </ModalBody>
      <ModalFooter className="modal-buttons">
        <Button className="close" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
