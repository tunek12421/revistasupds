import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import ResizableImage from './ResizableImage'; // Need to break this out or just inline it

// We'll define the NodeView inline for now
