import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Palette,
  Sparkles,
  Calendar,
  FileCode,
  Loader2,
  Check,
} from 'lucide-react';

const STARTER_TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank',
    icon: Sparkles,
    content: '',
  },
  {
    id: 'meeting',
    name: 'Meeting Notes',
    icon: Calendar,
    defaultTitle: 'Meeting Notes',
    content: '<h2>🎯 Meeting Agenda</h2><p>Brief description of today\'s focus.</p><h2>📝 Discussion Notes</h2><ul><li>Point 1</li><li>Point 2</li></ul><h2>✅ Action Items</h2><ul><li>Follow up with team</li></ul>',
  },
  {
    id: 'spec',
    name: 'Project Spec',
    icon: FileCode,
    defaultTitle: 'Project Spec',
    content: '<h2>📋 Project Overview</h2><p>Summary of goals, target users, and key outcomes.</p><h2>🎯 Objectives & Success Metrics</h2><ul><li>Metric 1</li><li>Metric 2</li></ul><h2>🛠️ Technical Architecture</h2><p>Core stack and system design notes.</p>',
  },
];

export default function CreateDocumentModal({ isOpen, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState('doc'); // 'doc' or 'canvas'
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [submitting, setSubmitting] = useState(false);

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template.id);
    setFormat('doc');
    if (!title.trim() && template.defaultTitle) {
      const today = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      setTitle(`${template.defaultTitle} - ${today}`);
    }
  };

  const handleSelectFormat = (newFormat) => {
    setFormat(newFormat);
    if (newFormat === 'canvas') {
      setSelectedTemplate('blank');
      if (!title.trim()) {
        setTitle('Untitled Whiteboard');
      }
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const activeTemplate = STARTER_TEMPLATES.find(t => t.id === selectedTemplate);
      const content = format === 'doc' && activeTemplate ? activeTemplate.content : '';
      await onCreate({
        title: title.trim(),
        format,
        content,
      });
      setTitle('');
      setFormat('doc');
      setSelectedTemplate('blank');
    } catch {
      // Error handled by caller
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !submitting) onClose(); }}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Create New Document
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Document Title */}
          <div className="space-y-2">
            <label htmlFor="doc-title" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Document Title
            </label>
            <Input
              id="doc-title"
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sprint Planning, Architecture Spec..."
              className="h-10 text-sm bg-card border-border rounded-xl focus-visible:ring-brand-500"
            />
          </div>

          {/* Starting Canvas Format (Document vs Whiteboard) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Starting Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Document Option */}
              <button
                type="button"
                onClick={() => handleSelectFormat('doc')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  format === 'doc'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 ring-1 ring-brand-500/30'
                    : 'border-border bg-card hover:bg-muted/40'
                }`}
              >
                <div className={`p-2 rounded-lg ${format === 'doc' ? 'bg-brand-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-foreground">Document</p>
                    {format === 'doc' && <Check size={13} className="text-brand-600 dark:text-brand-400" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                    Rich collaborative text
                  </p>
                </div>
              </button>

              {/* Whiteboard Option */}
              <button
                type="button"
                onClick={() => handleSelectFormat('canvas')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  format === 'canvas'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 ring-1 ring-brand-500/30'
                    : 'border-border bg-card hover:bg-muted/40'
                }`}
              >
                <div className={`p-2 rounded-lg ${format === 'canvas' ? 'bg-brand-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                  <Palette size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-foreground">Whiteboard</p>
                    {format === 'canvas' && <Check size={13} className="text-brand-600 dark:text-brand-400" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                    Diagrams & freehand canvas
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Quick Starter Templates (when Document is selected) */}
          {format === 'doc' && (
            <div className="space-y-2 animate-in fade-in zoom-in-95 duration-150">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Starter Template
              </label>
              <div className="flex flex-wrap gap-2">
                {STARTER_TEMPLATES.map((tmpl) => {
                  const Icon = tmpl.icon;
                  const isSelected = selectedTemplate === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold shadow-2xs'
                          : 'border-border bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon size={13} className={isSelected ? 'text-brand-500' : 'text-muted-foreground'} />
                      <span>{tmpl.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl text-xs h-9 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-xl text-xs h-9 px-4 font-semibold shadow-xs"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1.5" />
                  Creating...
                </>
              ) : format === 'canvas' ? (
                'Create Whiteboard'
              ) : (
                'Create Document'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
