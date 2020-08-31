/** @jsx jsx */
import createCache from '@emotion/cache';
import styled from '@emotion/styled';
import { CacheProvider, Global, css, jsx } from '@emotion/core';
import { CatalogPanel } from './catalog/CatalogPanel';
import { FC, useCallback, useState } from 'react';
import { Graph } from './graph';
import { GraphView } from './graphview/GraphView';
import { PageHeader } from './header/PageHeader';
import { PropertyPanel } from './propertypanel/PropertyPanel';
import { RegistryContext, registry } from './operators/Registry';
import { Renderer, RendererContext } from './render/Renderer';
import { User, UserContext } from './user/User';
import { configure } from 'mobx';
import { useShortcuts } from './hooks/useShortcuts';
import 'mobx-react/batchingForReactDom';

// MobX strict mode
configure({ enforceActions: 'observed' });

// Keep emotion from complaining about 'first-child'.
const emotionCache = createCache();
emotionCache.compat = true;

const AppHeader = styled(PageHeader)`
  display: flex;
  align-items: center;
`;

const AppBody = styled.section`
  display: flex;
  align-items: stretch;
  flex: 1;
`;

interface Props {
  // path: string;
  id?: string;
  // session?: string;
  // action?: string;
}

const App: FC<Props> = ({ id }) => {
  const [graph, setGraph] = useState(() => new Graph());
  const [user] = useState(() => new User());
  const [renderer] = useState(() => new Renderer());

  // return {
  //   axios: this.axios,
  // };

  // super(props);
  // this.state = {
  //   graph: new Graph(),
  //   errorMsg: null,
  // };

  // this.axios = axios.create();
  // this.axios.interceptors.request.use(config => {
  //   const session = localStorage.getItem('session');
  //   if (session) {
  //     config.headers.Authorization = `Bearer ${session}`;
  //   }
  //   return config;
  // });

  // const sessionToken = localStorage.getItem('session');
  // this.user.isLoggedIn = !!sessionToken;

  // if (props.id) {
  //   this.loadGraph(props.id);
  // } else {
  //   this.loadLocalGraph(this.state.graph);
  // }

  // // Save the graph we are working on in local storage.
  // window.addEventListener('beforeunload', () => {
  //   localStorage.setItem('workingGraph', JSON.stringify(this.state.graph.toJs()));
  // });

  const onNew = useCallback(() => {
    if (!id) {
      setGraph(new Graph());
    } else {
      // route('/');
    }
  }, [id]);

  const onDelete = useCallback(() => {
    graph.deleteSelection();
  }, [graph]);

  useShortcuts({
    del: onDelete,
    backspace: onDelete,
  });

  return (
    <div
      className="app"
      css={css`
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        right: 0;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        flex: 1;
      `}
    >
      <CacheProvider value={emotionCache}>
        <Global
          styles={css`
            body {
              position: absolute;
              left: 0;
              right: 0;
              top: 0;
              bottom: 0;
              display: flex;
              flex-direction: row;
              align-items: stretch;
              align-content: stretch;
              font-family: 'PT Sans', sans-serif;
              overflow: hidden;
              margin: 0;
            }

            #root {
              display: flex;
              align-items: stretch;
              flex: 1;
            }
          `}
        />
        <UserContext.Provider value={user}>
          <RegistryContext.Provider value={registry}>
            <RendererContext.Provider value={renderer}>
              <AppHeader graph={graph} graphId={id} /*onSave={this.onSave}*/ onNew={onNew} />
              <AppBody>
                <CatalogPanel />
                <GraphView graph={graph} />
                <PropertyPanel graph={graph} />
              </AppBody>
            </RendererContext.Provider>
          </RegistryContext.Provider>
        </UserContext.Provider>
      </CacheProvider>
    </div>
  );
};

export default App;
