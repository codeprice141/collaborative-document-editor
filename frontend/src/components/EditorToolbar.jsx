import React, { useState, useRef, useEffect } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Code, Link,
  List, ListOrdered, CheckSquare, Quote, Minus,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Highlighter, Palette, Type, RemoveFormatting,
  Undo, Redo, ChevronDown, Subscript, Superscript,
} from 'lucide-react';

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
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        flex items-center justify-center w-8 h-8 rounded-lg text-sm transition-all duration-100 flex-shrink-0
        ${active
          ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 flex-shrink-0" />;
}

function ColorPickerDropdown({ label, icon, colors, onSelect, onCustom, activeColor, type = 'text' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const customRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        title={label}
        className={`
          flex items-center gap-0.5 px-1.5 h-8 rounded-lg text-sm transition-all duration-100
          text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800
          hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer
        `}
      >
        <div className="flex flex-col items-center">
          {icon}
          <div
            className="w-3 h-0.5 rounded-full mt-0.5"
            style={{ backgroundColor: activeColor || (type === 'text' ? '#0f172a' : 'transparent'), border: !activeColor ? '1px solid #cbd5e1' : 'none' }}
          />
        </div>
        <ChevronDown size={10} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-modal border border-slate-200 dark:border-slate-700 p-3 w-52">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">{label}</p>
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {colors.map(c => (
                <button
                  key={c.label}
                  onClick={() => { onSelect(c.value); setOpen(false); }}
                  title={c.label}
                  className="w-8 h-8 rounded-lg transition-transform hover:scale-110 border-2"
                  style={{
                    backgroundColor: c.color,
                    borderColor: c.border || (activeColor === c.value ? '#6366f1' : 'transparent'),
                    boxShadow: c.color === 'transparent' ? 'inset 0 0 0 1px #cbd5e1' : undefined,
                  }}
                />
              ))}
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200">
                <span>Custom color:</span>
                <input
                  ref={customRef}
                  type="color"
                  defaultValue={activeColor || '#000000'}
                  onChange={(e) => onSelect(e.target.value)}
                  className="w-8 h-6 cursor-pointer rounded border border-slate-200 dark:border-slate-700"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HeadingDropdown({ editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentHeading = HEADING_OPTIONS.find(h =>
    h.value ? editor.isActive('heading', { level: h.value }) : !editor.isActive('heading')
  ) || HEADING_OPTIONS[0];

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-2 h-8 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-w-[110px]"
      >
        <span className="flex-1 text-left text-xs truncate">{currentHeading.label}</span>
        <ChevronDown size={13} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-modal border border-slate-200 dark:border-slate-700 overflow-hidden w-48">
            {HEADING_OPTIONS.map(h => (
              <button
                key={h.label}
                onClick={() => {
                  if (h.value) {
                    editor.chain().focus().toggleHeading({ level: h.value }).run();
                  } else {
                    editor.chain().focus().setParagraph().run();
                  }
                  setOpen(false);
                }}
                className={`
                  w-full px-3 py-2 text-left transition-colors
                  hover:bg-slate-50 dark:hover:bg-slate-800
                  ${h.value && editor.isActive('heading', { level: h.value }) ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/30' : 'text-slate-800 dark:text-slate-200'}
                  ${h.className}
                `}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditorToolbar({ editor }) {
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
    <div className="flex-shrink-0 sticky top-0 z-20">
      <div className="mx-auto my-3 max-w-[860px] px-4 sm:px-8">
        <div className="
          flex items-center gap-1 flex-wrap
          bg-white dark:bg-slate-900
          border border-slate-200 dark:border-slate-700
          rounded-2xl px-3 py-1.5 shadow-card
        ">
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
    </div>
  );
}
