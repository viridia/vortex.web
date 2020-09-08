import React from 'react';
import styled from '@emotion/styled';
import { ColorGradientProperty } from './ColorGradientProperty';
import { ColorProperty } from './ColorProperty';
import { DataType, Parameter } from '../operators';
import { Graph, GraphNode } from '../graph';
import { ImageProperty } from './ImageProperty';
import { ScalarProperty } from './ScalarProperty';
import { colors, roundedScrollbars } from '../styles';
import { lighten } from 'polished';

const PropertyPanelElt = styled.section`
  ${roundedScrollbars}
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  flex: 1 1 0;
  padding: 8px;
  overflow-y: auto;
  overflow-x: hidden;

  > header {
    text-align: center;
    font-weight: bold;
    margin-bottom: 4px;
  }
`;

const PropertyGroup = styled.section`
  display: flex;
  flex-direction: column;
  margin-bottom: 4px;
  margin-top: 4px;
  flex-shrink: 0;

  > header {
    display: inline-flex;
    position: relative;
    align-items: center;
    font-size: 15px;
    font-weight: bold;
    background-color: ${lighten(0.05, '#aab')};
    justify-content: center;
    border: 1px solid ${colors.controlBorder};
    border-top: 1px solid ${colors.controlBorder};
    border-top-right-radius: 6px;
    border-top-left-radius: 6px;
    overflow: hidden;
    user-select: none;
  }
`;

interface Props {
  graph: Graph;
  node: GraphNode;
}

export function PropertyEditor({ node, graph }: Props) {
  const children: JSX.Element[] = [];
  let group: JSX.Element[] = [];

  let nextIndex = 0;
  const groupKey = () => {
    nextIndex += 1;
    return `group-${nextIndex}`;
  };

  function makeGroups(params: Parameter[]) {
    params.forEach(param => {
      if (param.type === DataType.FLOAT || param.type === DataType.INTEGER) {
        group.push(<ScalarProperty key={param.id} graph={graph} node={node} parameter={param} />);
      } else if (param.type === DataType.VEC4 && param.editor === 'color') {
        if (group.length > 0) {
          children.push(<PropertyGroup key={groupKey()}>{group}</PropertyGroup>);
        }
        children.push(<ColorProperty key={param.id} graph={graph} node={node} parameter={param} />);
        group = [];
      } else if (param.type === DataType.IMAGE) {
        if (group.length > 0) {
          children.push(<PropertyGroup key={groupKey()}>{group}</PropertyGroup>);
        }
        children.push(<ImageProperty key={param.id} graph={graph} node={node} parameter={param} />);
        group = [];
      } else if (param.type === DataType.RGBA_GRADIENT) {
        if (group.length > 0) {
          children.push(<PropertyGroup key={groupKey()}>{group}</PropertyGroup>);
        }
        children.push(
          <ColorGradientProperty key={param.id} graph={graph} node={node} parameter={param} />
        );
        group = [];
      } else if (param.type === DataType.GROUP) {
        if (group.length > 0) {
          children.push(<PropertyGroup key={groupKey()}>{group}</PropertyGroup>);
        }
        group = [];
        group.push(<header key={`header.${param.name}`}>{param.name}</header>);
        makeGroups(param.children!);
        children.push(<PropertyGroup key={groupKey()}>{group}</PropertyGroup>);
        group = [];
      } else {
        if (group.length > 0) {
          children.push(<PropertyGroup key={groupKey()}>{group}</PropertyGroup>);
          group = [];
        }
      }
    });
  }

  makeGroups(node.operator.params);
  if (group.length > 0) {
    children.push(<PropertyGroup key={groupKey()}>{group}</PropertyGroup>);
    group = [];
  }

  return (
    <PropertyPanelElt className="property-editor">
      <header>{node.name}</header>
      {children}
    </PropertyPanelElt>
  );
}
