/** @jsx jsx */
import classNames from 'classnames';
import githubImg from '../images/github.png';
import styled from '@emotion/styled';
import vortexImg from '../images/vortex.png';
import { FC, useCallback, useContext, useState } from 'react';
import { Graph } from '../graph';
import { GraphActions } from './GraphActions';
import { GraphNameInput } from './GraphNameInput';
import { LoginButton } from './LoginButton';
import { LoginDialog } from './LoginDialog';
import { SessionContext } from '../Session';
import { colors } from '../styles';
import { darken } from 'polished';
import { jsx } from '@emotion/core';
import { observer } from 'mobx-react';

const PageHeaderStyle = styled.header`
  display: flex;
  background: ${colors.headerBg};
  color: ${colors.headerColor};
  padding: 8px;
  align-items: center;
`;

const PageTitle = styled.div`
  font-size: 20px;
  font-weight: bold;

  &.modified {
    color: ${darken(0.15, colors.headerColor)};
  }
`;

const VortexLogo = styled.img`
  width: 32px;
  height: 32px;
  margin-right: 4px;
`;

const DocName = styled.div`
  color: ${darken(0.4, colors.headerColor)};
  margin: 0 4px 0 8px;
`;

const GithubLink = styled.a`
  height: 28px;
  margin-right: 12px;
  > img {
    height: 28px;
    opacity: 0.7;
  }
`;

interface Props {
  graph: Graph;
  docId?: string;
  onNew: () => void;
  onSave: () => void;
}

export const PageHeader: FC<Props> = observer(({ graph, docId, onNew, onSave }) => {
  const [showLogin, setShowLogin] = useState(false);
  const session = useContext(SessionContext);

  const onClickSave = useCallback(() => {
    if (session.isLoggedIn) {
      onSave();
    } else {
      localStorage.setItem('savePostLogin', JSON.stringify(graph.toJs()));
      setShowLogin(true);
    }
  }, [graph, onSave, session.isLoggedIn]);

  const onShowLogin = useCallback(() => {
    setShowLogin(true);
  }, []);

  const onHideLogin = useCallback(() => {
    setShowLogin(false);
  }, []);

  return (
    <PageHeaderStyle className="page-header">
      <VortexLogo src={vortexImg} alt="Vortex" />
      <PageTitle className={classNames('title', { modified: graph.modified })}>Vortex</PageTitle>
      <DocName className="doc-name">-</DocName>
      <GraphNameInput graph={graph} />
      <GithubLink
        className="github-link"
        href="https://github.com/viridia/vortex"
        title="Source Code"
      >
        <img src={githubImg} alt="GitHub" />
      </GithubLink>
      <GraphActions graph={graph} docId={docId} onSave={onClickSave} onNew={onNew} />
      <LoginButton css={{ marginLeft: '8px' }} onLogin={onShowLogin} />
      <LoginDialog open={showLogin} onClose={onHideLogin} />
    </PageHeaderStyle>
  );
});
