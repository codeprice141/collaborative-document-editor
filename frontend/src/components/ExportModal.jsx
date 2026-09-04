import React, { useState } from 'react';
import { X, Download, Upload, FileText, Code } from 'lucide-react';

export default function ExportModal({ isOpen, title, onClose }) {
  const [exporting, setExporting] = useState(null);

  const handleExport = async (format) => {
    setExporting(format);
    try {
      // Get TipTap editor HTML from DOM
      const editorEl = document.querySelector('.tiptap-document');
      const html = editorEl ? editorEl.innerHTML : '';

      if (format === 'txt') {
        const text = editorEl ? editorEl.innerText : '';
        const blob = new Blob([text], { type: 'text/plain' });
        download(blob, `${title || 'document'}.txt`);
      } else if (format === 'html') {
        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title || 'Document'}</title>
<style>
  body { font-family: Inter, -apple-system, sans-serif; max-width: 860px; margin: 0 auto; padding: 48px 32px; color: #1e293b; }
  h1 { font-size: 2.25rem; font-weight: 700; margin: 2rem 0 0.75rem; line-height: 1.15; }
  h2 { font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 0.5rem; }
  h3 { font-size: 1.25rem; font-weight: 600; margin: 1.25rem 0 0.5rem; }
  p { margin: 0.5rem 0; line-height: 1.85; }
  blockquote { border-left: 3px solid #6366f1; padding-left: 1rem; margin: 1rem 0; color: #64748b; font-style: italic; }
  code { background: #f1f5f9; padding: 0.1rem 0.35rem; border-radius: 4px; font-family: monospace; font-size: 0.875em; color: #6366f1; }
  pre { background: #0f172a; color: #e2e8f0; padding: 1.25rem; border-radius: 12px; overflow-x: auto; }
  pre code { background: none; color: inherit; padding: 0; }
  ul, ol { margin: 0.75rem 0; padding-left: 1.5rem; }
  li { margin: 0.25rem 0; line-height: 1.75; }
  a { color: #4f46e5; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 1.5rem 0; }
</style>
</head>
<body>
<h1>${title || 'Document'}</h1>
${html}
</body>
</html>`;
        const blob = new Blob([fullHtml], { type: 'text/html' });
        download(blob, `${title || 'document'}.html`);
      } else if (format === 'md') {
        // Basic HTML to Markdown conversion
        let md = (title ? `# ${title}\n\n` : '');
        if (editorEl) {
          md += htmlToMarkdown(editorEl);
        }
        const blob = new Blob([md], { type: 'text/markdown' });
        download(blob, `${title || 'document'}.md`);
      }
    } finally {
      setExporting(null);
      onClose();
    }
  };

  const download = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const htmlToMarkdown = (el) => {
    let md = '';
    el.childNodes.forEach(node => {
      if (node.nodeType === 3) { md += node.textContent; return; }
      const tag = node.tagName?.toLowerCase();
      if (tag === 'h1') md += `# ${node.textContent}\n\n`;
      else if (tag === 'h2') md += `## ${node.textContent}\n\n`;
      else if (tag === 'h3') md += `### ${node.textContent}\n\n`;
      else if (tag === 'p') md += `${node.textContent}\n\n`;
      else if (tag === 'blockquote') md += `> ${node.textContent}\n\n`;
      else if (tag === 'ul') {
        node.querySelectorAll('li').forEach(li => { md += `- ${li.textContent}\n`; });
        md += '\n';
      } else if (tag === 'ol') {
        node.querySelectorAll('li').forEach((li, i) => { md += `${i + 1}. ${li.textContent}\n`; });
        md += '\n';
      } else if (tag === 'pre') md += `\`\`\`\n${node.textContent}\n\`\`\`\n\n`;
      else if (tag === 'hr') md += `---\n\n`;
    });
    return md;
  };

  if (!isOpen) return null;

  const formats = [
    { id: 'txt', label: 'Plain Text', desc: '.txt — No formatting, pure text', icon: FileText, color: 'text-slate-500' },
    { id: 'html', label: 'HTML', desc: '.html — Formatted web page', icon: Code, color: 'text-brand-500' },
    { id: 'md', label: 'Markdown', desc: '.md — GitHub-flavored Markdown', icon: FileText, color: 'text-emerald-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 dark:bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-modal w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Download size={17} className="text-brand-600 dark:text-brand-400" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Export Document</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <X size={17} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-2.5">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Choose export format:</p>
          {formats.map(fmt => (
            <button
              key={fmt.id}
              onClick={() => handleExport(fmt.id)}
              disabled={!!exporting}
              className="w-full flex items-center gap-3.5 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-all disabled:opacity-60 text-left group"
            >
              <div className={`w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors`}>
                <fmt.icon size={20} className={fmt.color} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{fmt.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{fmt.desc}</p>
              </div>
              {exporting === fmt.id && (
                <svg className="animate-spin w-4 h-4 text-brand-500 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
            </button>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800">
          <button onClick={onClose} className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
