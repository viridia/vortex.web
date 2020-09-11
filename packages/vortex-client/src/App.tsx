/** @jsx jsx */
import createCache from '@emotion/cache';
import qs from 'qs';
import styled from '@emotion/styled';
import { CacheProvider, Global, css, jsx } from '@emotion/core';
import { CatalogPanel } from './catalog/CatalogPanel';
import { ErrorDialog } from './controls/ErrorDialog';
import { FC, useCallback, useEffect, useState } from 'react';
import { Graph } from './graph';
import { GraphView } from './graphview/GraphView';
import { HistoryContext } from './hooks/useHistory';
import { PageHeader } from './header/PageHeader';
import { PropertyPanel } from './propertypanel/PropertyPanel';
import { RegistryContext, registry } from './operators/Registry';
import { Renderer, RendererContext } from './render/Renderer';
import { Session, SessionContext } from './Session';
import { autorun, configure, runInAction } from 'mobx';
import { axiosInstance } from './network';
import { createBrowserHistory } from 'history';
import { useShortcuts } from './hooks/useShortcuts';
import 'mobx-react/batchingForReactDom';
import { LoadingProgress } from './progress/LoadingProgress';

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

// The 'default doc' is the one stored in browser local storage.
const DEFAULT_DOC_ID = '';

const App: FC = () => {
  const [graph, setGraph] = useState(() => new Graph());
  const [sessionState] = useState(() => new Session());
  const [renderer] = useState(() => new Renderer());
  const [history] = useState(() => createBrowserHistory());
  const [docId, setDocId] = useState<string | undefined>(); // Empty string means local storage
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Function to save the graph - either as new file or updated.
  // Note: "Save" always means save to cloud storage.
  const saveGraph = useCallback(() => {
    if (docId && graph.ownedByUser) {
      // Overwrite existing document.
      axiosInstance.put(`/api/docs/${docId}`, graph.toJs()).then(resp => {
        runInAction(() => {
          graph.modified = false;
        });
        console.log('saved existing document as:', resp.data.id);
      });
    } else {
      // Save graph as new document.
      axiosInstance.post('/api/docs', graph.toJs()).then(resp => {
        runInAction(() => {
          graph.modified = false;
        });
        console.log('saved new document as:', resp.data.id);
        history.replace({ pathname: `/${resp.data.id}` });
      });
    }
  }, [docId, graph, history]);

  // Handle route changes: change the document id, and handle session redirect.
  useEffect(() => {
    const onHistoryChanged = () => {
      const location = history.location;
      const id = location.pathname.split('/')[1];
      setDocId(id || DEFAULT_DOC_ID);

      const { session, ...rest } = qs.parse(location.search, { ignoreQueryPrefix: true });
      if (typeof session === 'string') {
        sessionState.signIn(session);
        history.replace({
          pathname: location.pathname,
          search: qs.stringify(rest, { addQueryPrefix: true }),
        });
      }
    };

    onHistoryChanged();
    return history.listen(onHistoryChanged);
  }, [history, saveGraph, sessionState]);

  // Load textures when graph changes. Dispose old graph.
  useEffect(() => {
    if (!graph.loaded) {
      for (const node of graph.nodes) {
        node.loadTextures(renderer);
      }

      // Handle post-login save
      if (graph.saveAfterLogin) {
        graph.saveAfterLogin = false;
        saveGraph();
      }

      graph.setLoaded();
    }
    return () => graph.clear();
  }, [graph, renderer, saveGraph]);

  // Load previous graph we were working on, or when docId changes.
  useEffect(() => {
    if (docId === undefined) {
      return;
    }

    // This is the doc they were working on when they signed in. We want to load it
    // in place of the doc they would normally load, and immediately save it now that they
    // have a session. This may overwrite the existing doc.
    const postSaveDoc = localStorage.getItem('savePostLogin');
    localStorage.removeItem('savePostLogin');

    if (docId === DEFAULT_DOC_ID) {
      // Load from local storage.
      const savedGraph = postSaveDoc || localStorage.getItem('workingGraph');
      if (savedGraph) {
        try {
          runInAction(() => {
            const gr = new Graph();
            gr.fromJs(JSON.parse(savedGraph), registry);
            if (gr.nodes.length > 0) {
              gr.modified = true;
              gr.saveAfterLogin = Boolean(postSaveDoc);
            }
            setGraph(gr);
          });
        } catch (e) {
          console.error('node deserialization failed:', e);
        }
      } else {
        setGraph(new Graph());
      }
    } else if (docId) {
      // Load from cloud storage
      axiosInstance.get(`/api/docs/${docId}`).then(
        resp => {
          const gr = new Graph();
          // This will be true if the signed-in user owns the doc with this id.
          runInAction(() => {
            gr.ownedByUser = resp.data.ownedByUser;
            gr.ownedByAnother = !gr.ownedByUser;
          });
          if (resp.data) {
            // The reason this works is because when we login, we refresh the page (openid)
            // but keep the same url path, so the doc we want to save should be a modified
            // copy of the doc we are loading. The only reason for loading it is to determine
            // ownership, something that cannot be determined while logged out.
            gr.fromJs(postSaveDoc ? JSON.parse(postSaveDoc) : resp.data.data, registry);
            gr.saveAfterLogin = Boolean(postSaveDoc);
          }
          setGraph(gr);
        },
        error => {
          if (error.response) {
            if (error.response.status === 404) {
              setErrorMessage(`The document '${docId}' could not be found.`);
            }
          }
        }
      );
    }
  }, [renderer, docId]);

  // Save the graph when we navigate away.
  useEffect(() => {
    const onUnload = () => {
      if (docId) {
        if (graph.ownedByUser && graph.modified) {
          saveGraph();
        }
      } else {
        if (graph.modified) {
          localStorage.setItem('workingGraph', JSON.stringify(graph.toJs()));
        }
      }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [docId, graph, saveGraph]);

  // 'New' button handler
  const onNew = useCallback(() => {
    if (docId) {
      localStorage.removeItem('workingGraph');
      history.push({ pathname: '/' });
    } else {
      const newGraph = new Graph();
      newGraph.setLoaded();
      setGraph(newGraph);
    }
  }, [history, docId]);

  // 'Save' button handler
  const onSave = useCallback(() => {
    saveGraph();
  }, [saveGraph]);

  // Auto-save after 3 seconds.
  useEffect(() => {
    return autorun(
      () => {
        if (docId && graph.ownedByUser && graph.modified) {
          saveGraph();
        }
      },
      { delay: 1000 }
    );
  }, [graph, saveGraph, docId]);

  // Close error dialog
  const onCloseError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  // Delete key handler
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
        <HistoryContext.Provider value={history}>
          <SessionContext.Provider value={sessionState}>
            <RegistryContext.Provider value={registry}>
              <RendererContext.Provider value={renderer}>
                <AppHeader graph={graph} docId={docId || undefined} onSave={onSave} onNew={onNew} />
                <AppBody>
                  <CatalogPanel />
                  <GraphView graph={graph} />
                  <PropertyPanel graph={graph} />
                  <ErrorDialog errorMsg={errorMessage} onClose={onCloseError} />
                </AppBody>
                <LoadingProgress graph={graph} />
              </RendererContext.Provider>
            </RegistryContext.Provider>
          </SessionContext.Provider>
        </HistoryContext.Provider>
      </CacheProvider>
    </div>
  );
};

export default App;
