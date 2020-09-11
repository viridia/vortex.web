/** @jsx jsx */
import classNames from 'classnames';
import styled from '@emotion/styled';
import { DialogContent, DialogOverlay } from '@reach/dialog';
import { FC } from 'react';
import { colors } from '../styles';
import { jsx, keyframes } from '@emotion/core';
import { useShortcuts } from '../hooks/useShortcuts';
import { useTransition } from '../hooks/useTransition';
import '@reach/dialog/styles.css';

interface Props {
  ariaLabel: string;
  children?: any;
  className?: string;
  open: boolean;
  onClose?: () => void;
  onExited?: () => void;
}

const DialogOverlayKeyFrames = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const DialogOverlayKeyFramesExit = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const DialogContentKeyFrames = keyframes`
  from {
    opacity: 0;
    transform: scale(0.7);
  }
  to {
    opacity: 1;
    transform: scale(1.0);
  }
`;

const DialogContentKeyFramesExit = keyframes`
  from {
    opacity: 1;
    transform: scale(1.0);
  }
  to {
    opacity: 0;
    transform: scale(0.7);
  }
`;

export const ModalHeader = styled.header`
  padding: 8px 12px;
  font-weight: bold;
`;

export const ModalBody = styled.section`
  display: flex;
  flex-direction: column;
  padding: 12px;
  flex: 1 1 auto;
`;

export const ModalFooter = styled.footer`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 8px 12px 0 12px;
  flex-shrink: 0;
  flex-wrap: wrap;

  > * {
    margin-left: 8px;
    margin-bottom: 12px;
  }
`;

const ModalOverlay = styled(DialogOverlay)`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;

  &.entering,
  &.entered {
    animation: ${DialogOverlayKeyFrames} 300ms ease forwards;
  }

  &.exited,
  &.exiting {
    animation: ${DialogOverlayKeyFramesExit} 300ms ease forwards;
  }
`;

const ModalElt = styled(DialogContent)`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background-color: ${colors.modalDialogBg};
  box-shadow: 0px 1px 8px 1px ${colors.modalShadow};
  border: 1px solid ${colors.modalBorder};
  min-width: 10rem;
  min-height: 3rem;
  max-width: 95%;
  max-height: 95%;
  border-radius: 5px;
  padding: 0;
  opacity: 0;

  &.entering,
  &.entered {
    animation: ${DialogContentKeyFrames} 300ms ease forwards;
  }

  &.exited,
  &.exiting {
    animation: ${DialogContentKeyFramesExit} 300ms ease forwards;
  }

  &.busy {
    cursor: wait;
  }

  > * {
    border-top: 1px solid ${colors.modalSepLight};
    border-bottom: 1px solid ${colors.modalSepDark};
    &:first-child {
      border-top: none;
    }
    &:last-child {
      border-bottom: none;
    }
  }
`;

/** Modal dialog class. */
export const Modal: FC<Props> = ({
  ariaLabel,
  open,
  onClose,
  onExited,
  children,
  className,
  ...props
}) => {
  const state = useTransition({ in: open, onExited });
  useShortcuts({}, { scope: 'dialog' });

  return state !== 'exited' ? (
    <ModalOverlay isOpen={true} className={classNames(state)} onDismiss={onClose}>
      <ModalElt
        {...props}
        aria-label={ariaLabel}
        className={classNames('dialog', className, state, { open })}
      >
        {children}
      </ModalElt>
    </ModalOverlay>
  ) : null;
};
