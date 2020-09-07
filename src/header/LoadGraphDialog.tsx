import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import classNames from 'classnames';
import dateformat from 'dateformat';
import styled from '@emotion/styled';
import { Button } from '../controls/Button';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../controls/Modal';
import { SessionContext } from '../Session';
import { axiosInstance } from '../network';
import { colors } from '../styles';
import { useHistory } from '../hooks/useHistory';

const GraphTable = styled.section`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex: 1 1 auto;

  > header {
    display: flex;
    font-weight: bold;
  }

  .graph-table-body {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    overflow-y: auto;
    background-color: ${colors.listBg};
    border: 1px inset;
    min-height: 10em;
    max-height: 10em;
  }

  .graph-entry {
    display: flex;
    flex: 0 0 auto;
    cursor: pointer;
    user-select: none;

    &:hover {
      background-color: ${colors.listBgHover};
    }

    &.selected {
      background-color: ${colors.listBgSelected};
    }
  }

  .name {
    padding: 4px;
    width: 70%;
  }

  .date {
    width: 30%;
    text-align: right;
    padding: 4px;
  }
`;

const Untitled = styled.span`
  font-style: italic;
`;

interface ListEntry {
  name: string;
  id: string;
  created: Date;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export const LoadGraphDialog: FC<Props> = ({ open, onClose }) => {
  const [selected, setSelected] = useState<string>();
  const [list, setList] = useState<ListEntry[]>([]);
  const session = useContext(SessionContext);
  const history = useHistory();

  useEffect(() => {
    if (open && session.isLoggedIn) {
      axiosInstance.get('/api/docs').then(resp => {
        setList(
          resp.data.map((record: any) => ({
            name: record.data.name,
            id: record.id,
            created: new Date(record.created),
          }))
        );
      });
    }
  }, [open, session.isLoggedIn]);

  const onClickLoad = useCallback(() => {
    if (selected) {
      history.push({ pathname: `/${selected}` });
      onClose();
    }
  }, [history, onClose, selected]);

  const onClickEntry = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const selected = e.currentTarget.dataset.id;
    setSelected(selected);
  }, []);

  const onDblClickEntry = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const selected = e.currentTarget.dataset.id;
      history.push({ pathname: `/${selected}` });
      onClose();
    },
    [history, onClose]
  );

  return (
    <Modal className="load" open={open} onClose={onClose} ariaLabel="Load Graph">
      <ModalHeader>Load graph</ModalHeader>
      <ModalBody>
        <GraphTable className="graph-table">
          <header>
            <span className="name">Name</span>
            <span className="date">Created</span>
          </header>
          <section className="graph-table-body">
            {list.map(entry => (
              <section
                key={entry.id}
                data-id={entry.id}
                className={classNames('graph-entry', { selected: entry.id === selected })}
                onClick={onClickEntry}
                onDoubleClick={onDblClickEntry}
              >
                <span className="name">
                  {entry.name ? entry.name : <Untitled>Untitled</Untitled>}
                </span>
                <span className="date">{dateformat(new Date(entry.created), 'longDate')}</span>
              </section>
            ))}
          </section>
        </GraphTable>
      </ModalBody>
      <ModalFooter className="modal-buttons">
        <Button className="close" onClick={onClose}>
          Cancel
        </Button>
        <Button className="close" onClick={onClickLoad} disabled={!selected}>
          Load
        </Button>
      </ModalFooter>
    </Modal>
  );
};
