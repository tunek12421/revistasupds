export function tiptapToBlocks(json) {
  const blocks = [];
  let currentText = [];

  const flushText = () => {
    if (currentText.length > 0) {
      blocks.push({ type: 'text', content: currentText.join('\n') });
      currentText = [];
    }
  };

  for (const node of json.content || []) {
    if (node.type === 'paragraph') {
      let text = '';
      for (const child of node.content || []) {
        if (child.type === 'text') {
          text += child.text;
        }
      }
      currentText.push(text);
    } else if (node.type === 'figureNode') {
      flushText();
      blocks.push({
        type: 'figure',
        ...node.attrs
      });
    } else if (node.type === 'footnoteNode') {
      flushText();
      blocks.push({
        type: 'footnote',
        ...node.attrs
      });
    }
  }
  flushText();
  if (blocks.length === 0) {
    blocks.push({ type: 'text', content: '' });
  }
  return blocks;
}

export function blocksToTiptapJSON(blocks) {
  const content = [];
  for (const b of blocks) {
    if (b.type === 'text') {
      const paras = (b.content || '').split('\n');
      paras.forEach(text => {
        content.push({
          type: 'paragraph',
          content: text ? [{ type: 'text', text }] : undefined
        });
      });
    } else if (b.type === 'figure') {
      content.push({
        type: 'figureNode',
        attrs: {
          tipo: b.tipo || 'Figura',
          num: b.num || 1,
          title: b.title || '',
          caption: b.caption || '',
          src: b.src || null,
          imgW: b.imgW || null,
          imgH: b.imgH || null,
          naturalW: b.naturalW || null,
          naturalH: b.naturalH || null
        }
      });
    } else if (b.type === 'footnote') {
      content.push({
        type: 'footnoteNode',
        attrs: { text: b.text || '', num: b.num || 1 }
      });
    }
  }
  if (content.length === 0) content.push({ type: 'paragraph' });
  return { type: 'doc', content };
}
