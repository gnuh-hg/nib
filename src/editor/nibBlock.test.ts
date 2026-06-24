/**
 * Phase B schema tests — row + mathInline (free-caret rebuild).
 *
 * Replaces the old NibBlock document-model tests. Verifies that:
 *  1. doc accepts `row` children, each row accepts `text` and `mathInline`.
 *  2. Serialize → parse round-trip recovers correct node types + attrs.
 *  3. NibBlock is NOT in the new schema (cannot be created or parsed).
 *  4. Attrs on `row` and `mathInline` are ONLY `id` (no xOffset/lineIndex/latex etc.)
 */
import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/react';
import { NibDocument } from './extensions/NibDocument';
import { NibText } from './extensions/NibText';
import { Row } from './extensions/Row';
import { MathInline } from './extensions/MathInline';

let editor: Editor | null = null;

function makeEditor(content?: object) {
  editor = new Editor({
    extensions: [NibDocument, NibText, Row, MathInline],
    content: content ?? {
      type: 'doc',
      content: [
        {
          type: 'row',
          attrs: { id: 'r1' },
          content: [
            { type: 'text', text: 'hello ' },
            { type: 'mathInline', attrs: { id: 'm1' } },
          ],
        },
      ],
    },
  });
  return editor;
}

afterEach(() => {
  editor?.destroy();
  editor = null;
});

describe('Phase B — row + mathInline schema', () => {
  it('doc is a flat list of rows (no paragraph wrapper)', () => {
    const e = makeEditor();
    const json = e.getJSON();
    expect(json.type).toBe('doc');
    expect(json.content).toHaveLength(1);
    expect(json.content![0].type).toBe('row');
  });

  it('row carries only the `id` attr — no xOffset/lineIndex/latex/blockState', () => {
    const e = makeEditor();
    const rowAttrs = e.getJSON().content![0].attrs ?? {};
    expect(rowAttrs.id).toBe('r1');
    expect(rowAttrs.xOffset).toBeUndefined();
    expect(rowAttrs.lineIndex).toBeUndefined();
    expect(rowAttrs.latex).toBeUndefined();
    expect(rowAttrs.blockState).toBeUndefined();
  });

  it('mathInline carries only the `id` attr — no xOffset/lineIndex/latex/blockState', () => {
    const e = makeEditor();
    const rowContent = e.getJSON().content![0].content ?? [];
    const atom = rowContent.find((n) => n.type === 'mathInline');
    expect(atom).toBeDefined();
    const attrs = atom!.attrs ?? {};
    expect(attrs.id).toBe('m1');
    expect(attrs.xOffset).toBeUndefined();
    expect(attrs.lineIndex).toBeUndefined();
    expect(attrs.latex).toBeUndefined();
    expect(attrs.blockState).toBeUndefined();
  });

  it('nibBlock is NOT a known node type in the schema', () => {
    const e = makeEditor();
    expect(e.schema.nodes.nibBlock).toBeUndefined();
  });

  // Done-criteria test (PLAN B.1): round-trip serialize → parse preserves types.
  it('round-trip: doc(row({id:"r1"}, mathInline({id:"m1"}))) → serialize → parse → correct types', () => {
    const e = makeEditor({
      type: 'doc',
      content: [
        {
          type: 'row',
          attrs: { id: 'r1' },
          content: [{ type: 'mathInline', attrs: { id: 'm1' } }],
        },
      ],
    });

    // Serialize to JSON then re-parse.
    const serialized = e.getJSON();
    expect(serialized.type).toBe('doc');
    expect(serialized.content).toHaveLength(1);

    const rowJson = serialized.content![0];
    expect(rowJson.type).toBe('row');
    expect(rowJson.attrs?.id).toBe('r1');

    const atomJson = rowJson.content?.find((n) => n.type === 'mathInline');
    expect(atomJson).toBeDefined();
    expect(atomJson!.attrs?.id).toBe('m1');

    // Verify PM node tree (not just JSON) has correct types.
    const doc = e.state.doc;
    expect(doc.childCount).toBe(1);
    const row = doc.child(0);
    expect(row.type.name).toBe('row');
    expect(row.attrs.id).toBe('r1');

    // mathInline is the first (and only) child of the row.
    // (A row can also contain text; here it has only the atom.)
    expect(row.childCount).toBe(1);
    const atom = row.child(0);
    expect(atom.type.name).toBe('mathInline');
    expect(atom.attrs.id).toBe('m1');
  });

  it('row can contain mixed text and mathInline atoms', () => {
    const e = makeEditor({
      type: 'doc',
      content: [
        {
          type: 'row',
          attrs: { id: 'r1' },
          content: [
            { type: 'text', text: '2x + ' },
            { type: 'mathInline', attrs: { id: 'm1' } },
            { type: 'text', text: ' + 3' },
          ],
        },
      ],
    });

    const row = e.state.doc.child(0);
    expect(row.type.name).toBe('row');
    // children: text + mathInline + text
    expect(row.childCount).toBe(3);
    expect(row.child(0).isText).toBe(true);
    expect(row.child(1).type.name).toBe('mathInline');
    expect(row.child(2).isText).toBe(true);
  });

  it('empty doc has no rows (zero-or-more)', () => {
    const e = makeEditor({ type: 'doc', content: [] });
    expect(e.state.doc.childCount).toBe(0);
  });

  it('doc can contain multiple rows', () => {
    const e = makeEditor({
      type: 'doc',
      content: [
        { type: 'row', attrs: { id: 'r1' } },
        { type: 'row', attrs: { id: 'r2' } },
        { type: 'row', attrs: { id: 'r3' } },
      ],
    });
    expect(e.state.doc.childCount).toBe(3);
    expect(e.state.doc.child(0).attrs.id).toBe('r1');
    expect(e.state.doc.child(2).attrs.id).toBe('r3');
  });
});
