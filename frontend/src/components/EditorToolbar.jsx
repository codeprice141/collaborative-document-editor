import React, { useState, useEffect } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Code, Link,
  List, ListOrdered, CheckSquare, Quote, Minus,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Highlighter, Palette, Type, RemoveFormatting,
  Undo, Redo, ChevronDown, Subscript, Superscript,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';

const HEADING_OPTIONS = [
  { label: 'Normal text', value: null, className: 'text-sm' },
  { label: 'Heading 1', value: 1, className: 'text-xl font-bold' },
  { label: 'Heading 2', value: 2, className: 'text-lg font-bold' },
  { label: 'Heading 3', value: 3, className: 'text-base font-semibold' },
  { label: 'Heading 4', value: 4, className: 'text-sm font-semibold' },
];

const TEXT_COLORS = [
  { label: 'Default', value: null, color: '#0f172a' },
  { label: 'Gray', value: '#64748b', color: '#64748b' },
  { label: 'Red', value: '#ef4444', color: '#ef4444' },
  { label: 'Orange', value: '#f97316', color: '#f97316' },
  { label: 'Yellow', value: '#eab308', color: '#eab308' },
  { label: 'Green', value: '#22c55e', color: '#22c55e' },
  { label: 'Blue', value: '#3b82f6', color: '#3b82f6' },
  { label: 'Indigo', value: '#6366f1', color: '#6366f1' },
  { label: 'Purple', value: '#a855f7', color: '#a855f7' },
  { label: 'Pink', value: '#ec4899', color: '#ec4899' },
];

const HIGHLIGHT_COLORS = [
  { label: 'None', value: null, color: 'transparent', border: '#cbd5e1' },
  { label: 'Yellow', value: '#fef08a', color: '#fef08a' },
  { label: 'Green', value: '#bbf7d0', color: '#bbf7d0' },
  { label: 'Blue', value: '#bae6fd', color: '#bae6fd' },
  { label: 'Pink', value: '#fbcfe8', color: '#fbcfe8' },
  { label: 'Orange', value: '#fed7aa', color: '#fed7aa' },
  { label: 'Purple', value: '#e9d5ff', color: '#e9d5ff' },
];

function ToolBtn({ active, onClick, title, disabled, children, className = '' }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        flex items-center justify-center w-7 h-7 rounded-md text-xs transition-all shrink-0 border
        ${active
          ? 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border-brand-300 dark:border-brand-700 font-semibold shadow-xs'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground border-transparent'
        }
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-border shrink-0 my-auto mx-1" />;
}

function ColorPickerDropdown({ label, icon, colors, onSelect, activeColor, isActive, type = 'text' }) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          title={label}
          className={`flex items-center gap-0.5 px-1.5 h-7 rounded-md text-xs cursor-pointer transition-all shrink-0 border ${
            isActive || activeColor
              ? 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border-brand-300 dark:border-brand-700 font-semibold shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground border-transparent'
          }`}
        >
          <div className="flex flex-col items-center">
            {icon}
            <div
              className="w-3 h-0.5 rounded-full mt-0.5"
              style={{
                backgroundColor: activeColor || (type === 'text' ? 'currentColor' : 'transparent'),
                border: !activeColor && type !== 'text' ? '1px solid #cbd5e1' : 'none',
              }}
            />
          </div>
          <ChevronDown size={10} className={isActive || activeColor ? 'text-brand-700 dark:text-brand-300' : ''} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-3 w-52 bg-card border-border shadow-modal z-50" align="start">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {label}
        </p>
        <div className="grid grid-cols-5 gap-1.5 mb-2.5">
          {colors.map((c) => {
            const isSelected = activeColor === c.value;
            return (
              <button
                key={c.label}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(c.value);
                  setOpen(false);
                }}
                title={c.label}
                className={`w-7 h-7 rounded-lg transition-transform hover:scale-110 border-2 ${
                  isSelected ? 'ring-2 ring-brand-500 ring-offset-1' : ''
                }`}
                style={{
                  backgroundColor: c.color,
                  borderColor: c.border || (isSelected ? '#6366f1' : 'transparent'),
                  boxShadow: c.color === 'transparent' ? 'inset 0 0 0 1px #cbd5e1' : undefined,
                }}
              />
            );
          })}
        </div>
        <div className="border-t border-border pt-2">
          <label className="flex items-center justify-between text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            <span>Custom color:</span>
            <input
              type="color"
              defaultValue={activeColor || '#000000'}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => onSelect(e.target.value)}
              className="w-7 h-5 cursor-pointer rounded border border-border bg-transparent"
            />
          </label>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HeadingDropdown({ editor }) {
  const [open, setOpen] = useState(false);
  const isHeadingActive = editor.isActive('heading');
  const currentHeading = HEADING_OPTIONS.find((h) =>
    h.value ? editor.isActive('heading', { level: h.value }) : !editor.isActive('heading')
  ) || HEADING_OPTIONS[0];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          className={`flex items-center gap-1 px-2 h-7 rounded-md text-xs font-medium transition-all min-w-[100px] shrink-0 border ${
            isHeadingActive
              ? 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border-brand-300 dark:border-brand-700 font-semibold shadow-xs'
              : 'text-foreground hover:bg-muted border-transparent'
          }`}
        >
          <span className="flex-1 text-left truncate">{currentHeading.label}</span>
          <ChevronDown size={11} className={isHeadingActive ? 'text-brand-700 dark:text-brand-300' : 'text-muted-foreground'} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1 min-w-[140px] bg-card border-border shadow-modal z-50" align="start">
        {HEADING_OPTIONS.map((h) => {
          const isActive = h.value
            ? editor.isActive('heading', { level: h.value })
            : !editor.isActive('heading');
          return (
            <button
              key={h.label}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (h.value) {
                  editor.chain().focus().toggleHeading({ level: h.value }).run();
                } else {
                  editor.chain().focus().setParagraph().run();
                }
                setOpen(false);
              }}
              className={`w-full px-2.5 py-1.5 text-left text-xs rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${
                isActive
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-semibold'
                  : 'text-foreground/80'
              }`}
            >
              <span className={h.className}>{h.label}</span>
            </button>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function EditorToolbar({ editor }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const updateHandler = () => {
      setTick((t) => (t + 1) % 1000000);
    };

    editor.on('transaction', updateHandler);
    editor.on('selectionUpdate', updateHandler);

    return () => {
      editor.off('transaction', updateHandler);
      editor.off('selectionUpdate', updateHandler);
    };
  }, [editor]);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('URL:', prev);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  return (
    <div className="shrink-0 sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {/* History */}
          <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
            <Undo size={15} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Shift+Z)">
            <Redo size={15} />
          </ToolBtn>

          <Divider />

          {/* Block Type */}
          <HeadingDropdown editor={editor} />

          <Divider />

          {/* Text Formatting */}
          <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
            <Bold size={15} />
          </ToolBtn>
          <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
            <Italic size={15} />
          </ToolBtn>
          <ToolBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)">
            <Underline size={15} />
          </ToolBtn>
          <ToolBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
            <Strikethrough size={15} />
          </ToolBtn>
          <ToolBtn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline Code">
            <Code size={15} />
          </ToolBtn>
          <ToolBtn active={editor.isActive('link')} onClick={setLink} title="Link">
            <Link size={15} />
          </ToolBtn>
          <ToolBtn active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()} title="Subscript">
            <Subscript size={15} />
          </ToolBtn>
          <ToolBtn active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()} title="Superscript">
            <Superscript size={15} />
          </ToolBtn>

          <Divider />

          {/* Color Pickers */}
          <ColorPickerDropdown
            label="Text Color"
            icon={<Type size={14} />}
            colors={TEXT_COLORS}
            activeColor={editor.getAttributes('textStyle').color}
            isActive={!!editor.getAttributes('textStyle').color}
            onSelect={(color) => {
              if (!color) editor.chain().focus().unsetColor().run();
              else editor.chain().focus().setColor(color).run();
            }}
            type="text"
          />
          <ColorPickerDropdown
            label="Highlight"
            icon={<Highlighter size={14} />}
            colors={HIGHLIGHT_COLORS}
            activeColor={editor.getAttributes('highlight').color}
            isActive={editor.isActive('highlight')}
            onSelect={(color) => {
              if (!color) editor.chain().focus().unsetHighlight().run();
              else editor.chain().focus().setHighlight({ color }).run();
            }}
            type="highlight"
          />

          <Divider />

          {/* Lists */}
          <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
            <List size={15} />
          </ToolBtn>
          <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
            <ListOrdered size={15} />
          </ToolBtn>
          <ToolBtn active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Task List">
            <CheckSquare size={15} />
          </ToolBtn>
          <ToolBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
            <Quote size={15} />
          </ToolBtn>
          <ToolBtn active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code Block">
            <Code size={15} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
            <Minus size={15} />
          </ToolBtn>

          <Divider />

          {/* Alignment */}
          <ToolBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align Left">
            <AlignLeft size={15} />
          </ToolBtn>
          <ToolBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align Center">
            <AlignCenter size={15} />
          </ToolBtn>
          <ToolBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align Right">
            <AlignRight size={15} />
          </ToolBtn>
          <ToolBtn active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Justify">
            <AlignJustify size={15} />
          </ToolBtn>

          <Divider />

          {/* Clear Formatting */}
          <ToolBtn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear Formatting">
            <RemoveFormatting size={15} />
          </ToolBtn>
        </div>
      </div>
  );
}
