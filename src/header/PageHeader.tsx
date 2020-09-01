/** @jsx jsx */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import bind from 'bind-decorator';
import classNames from 'classnames';
import githubImg from '../images/github.png';
import styled from '@emotion/styled';
import vortexImg from '../images/vortex.png';
import { Component } from 'react';
import { Graph } from '../graph';
import { GraphActions } from './GraphActions';
import { GraphNameInput } from './GraphNameInput';
import { LoginButton } from './LoginButton';
import { LoginDialog } from './LoginDialog';
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
  graphId?: string;
  onNew: () => void;
  // onSave: () => void;
}

interface State {
  showLogin: boolean;
  postLoginAction: string | null;
}

@observer
export class PageHeader extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showLogin: false,
      postLoginAction: null,
    };
  }

  public render() {
    const { graph, graphId, onNew } = this.props;
    const { showLogin, postLoginAction } = this.state;
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
        <GraphActions graph={graph} graphId={graphId} onSave={this.onSave} onNew={onNew} />
        <LoginButton css={{ marginLeft: '8px' }} onLogin={this.onShowLogin} />
        <LoginDialog open={showLogin} onClose={this.onHideLogin} postLoginAction={postLoginAction} />
      </PageHeaderStyle>
    );
  }

  @bind
  private onSave() {
    if (localStorage.getItem('session')) {
      // TODO
      // this.props.onSave();
    } else {
      this.setState({ showLogin: true, postLoginAction: 'save' });
    }
  }

  @bind
  private onShowLogin() {
    this.setState({ showLogin: true });
  }

  @bind
  private onHideLogin() {
    this.setState({ showLogin: false });
  }
}
