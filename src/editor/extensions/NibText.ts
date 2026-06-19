import { Node } from '@tiptap/core';

/**
 * Minimal inline text node so nibBlock (content: 'inline*') has something to
 * hold. Session 1.3 swaps math blocks to MathLive; text blocks keep this.
 */
export const NibText = Node.create({
  name: 'text',
  group: 'inline',
});
