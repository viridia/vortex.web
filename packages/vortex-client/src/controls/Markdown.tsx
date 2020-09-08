import React from 'react';
import marked from 'marked';

interface Props {
  markdown: string;
  className?: string;
}

export function Markdown({ markdown, className }: Props) {
  return (<div className={className} dangerouslySetInnerHTML={{ __html: marked(markdown) }} />);
}
