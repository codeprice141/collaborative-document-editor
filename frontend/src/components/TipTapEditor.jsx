import React, { useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Collaboration } from '@tiptap/extension-collaboration';
import { Highlight } from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Typography from '@tiptap/extension-typography';
import EditorToolbar from './EditorToolbar';

export default function TipTapEditor({
  yjsDoc,
  initialContent = '',
  currentUser,
  isReadOnly = false,
  onOpenCommentDraft,
  onContentChange,
}) {
  const initializedRef = useRef(false);
  const saveDebounceRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Collaboration.configure({
        document: yjsDoc,
      }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: ({ node, pos, editor }) => {
          if (node.type.name === 'heading') return 'Heading...';
          // Only show placeholder on the very first line when the document is empty
          if (pos === 0 && editor.isEmpty) {
            return 'Start writing your document... use the toolbar for styling';
          }
          return '';
        },
        emptyNodeClass: ({ node, pos, editor }) => {
          if ((pos === 0 && editor.isEmpty) || node.type.name === 'heading') {
            return 'is-empty';
          }
          return '';
        },
      }),
      CharacterCount,
      Subscript,
      Superscript,
      Typography,
    ],
    editable: !isReadOnly,
    editorProps: {
      attributes: {
        class: 'tiptap-document focus:outline-none min-h-[500px]',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor }) => {
      clearTimeout(saveDebounceRef.current);
      saveDebounceRef.current = setTimeout(() => {
        if (onContentChange) {
          onContentChange(editor.getHTML());
        }
      }, 1000);
    },
  });

  // Seed initial content into Yjs document if it's newly created
  useEffect(() => {
    if (editor && initialContent && !initializedRef.current) {
      const fragment = yjsDoc.getXmlFragment('default');
      // If the Yjs fragment is currently empty, load the initial HTML
      if (fragment.length === 0) {
        editor.commands.setContent(initialContent, false);
      }
      initializedRef.current = true;
    }
  }, [editor, initialContent, yjsDoc]);

  // Sync read-only status
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [editor, isReadOnly]);

  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const charCount = editor?.storage.characterCount?.characters() ?? 0;

  return (
    <div className="flex flex-col w-full h-full">
      {/* Sticky Fixed Toolbar */}
      {!isReadOnly && editor && (
        <EditorToolbar editor={editor} />
      )}

      {/* Document Sheet Container */}
      <div className="flex-1 overflow-y-auto bg-muted/30">
        <div className="max-w-[840px] mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-48">
          <div className="bg-card text-card-foreground rounded-xl p-8 sm:p-14 shadow-sm border border-border transition-colors">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Word & Character Count Bar */}
      {editor && (
        <div className="flex justify-between items-center px-6 py-2 text-[11px] font-medium text-muted-foreground border-t border-border bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{wordCount} words</span>
            <span className="text-muted-foreground/40">·</span>
            <span>{charCount} characters</span>
          </div>
        </div>
      )}
    </div>
  );
}
