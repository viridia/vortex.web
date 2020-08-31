import Axios from 'axios';
import React, { Component } from 'react';
import bind from 'bind-decorator';
import { Button } from '../controls/Button';
import { ChangeType, Graph, GraphNode } from '../graph';
import { Parameter } from '../operators';
import { Renderer } from '../render/Renderer';
import { action } from 'mobx';

interface Props {
  parameter: Parameter;
  node: GraphNode;
  graph: Graph;
}

interface State {
  imageName: string | null;
}

/** Property editor for RGBA colors. */
export class ImageProperty extends Component<Props, State> {
  private fileEl?: HTMLInputElement;

  constructor(props: Props) {
    super(props);
    this.state = {
      imageName: null,
    };
  }

  public componentWillMount() {
    const { parameter, node } = this.props;
    const url = node.paramValues.get(parameter.id);
    if (url) {
      Axios.head(url).then(resp => {
        const name = resp.headers['x-amz-meta-name'];
        if (name) {
          this.setState({ imageName: name });
        } else if (name) {
          this.setState({ imageName: null });
        }
      });
    }
  }

  public render() {
    const { parameter } = this.props;
    const { imageName } = this.state;
    return (
      <section className="image-property">
        <input
          ref={(el: HTMLInputElement) => {
            this.fileEl = el;
          }}
          type="file"
          style={{ display: 'none' }}
          accept="image/*"
          onChange={this.onFileChanged}
        />
        <Button onClick={this.onClick}>
          <span className="name">{parameter.name}:&nbsp;</span>
          <span className="value">{imageName}</span>
        </Button>
      </section>
    );
  }

  @bind
  private onClick(e: React.MouseEvent) {
    e.preventDefault();
    this.fileEl?.click();
  }

  @action.bound
  private onFileChanged(e: any) {
    const { parameter, node, graph } = this.props;
    const renderer: Renderer = this.context.renderer;
    if (this.fileEl && this.fileEl.files && this.fileEl.files.length > 0) {
      const file = this.fileEl.files[0];
      const formData = new FormData();
      formData.append('attachment', file);
      Axios.post('/api/images', formData).then(resp => {
        renderer.loadTexture(resp.data.url, texture => {
          node.glResources?.textures.set(parameter.id, texture);
          node.paramValues.set(parameter.id, resp.data.url);
          graph.modified = true;
          node.notifyChange(ChangeType.PARAM_VALUE_CHANGED);
        });
      });
    } else {
      node.paramValues.set(parameter.id, null);
      graph.modified = true;
      node.notifyChange(ChangeType.PARAM_VALUE_CHANGED);
    }
  }
}
