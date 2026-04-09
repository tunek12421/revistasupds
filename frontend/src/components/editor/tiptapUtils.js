import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import FigureNodeView from './FigureNodeView';
import FootnoteNodeView from './FootnoteNodeView';

export const FigureNode = Node.create({
  name: 'figureNode',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      tipo: { default: 'Figura' },
      num: { default: 1 },
      title: { default: '' },
      caption: { default: '' },
      src: { default: null },
      imgW: { default: null },
      imgH: { default: null },
      naturalW: { default: null },
      naturalH: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-tiptap-figure]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-tiptap-figure': '' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FigureNodeView);
  }
});

export const FootnoteNode = Node.create({
  name: 'footnoteNode',
  group: 'inline',
  atom: true,
  inline: true,

  addAttributes() {
    return {
      text: { default: '' },
      num: { default: 1 },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-tiptap-footnote]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ 'data-tiptap-footnote': '' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FootnoteNodeView);
  }
});
