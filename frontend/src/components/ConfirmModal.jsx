import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}) {
  const isDanger = type === 'danger';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel?.(); }}>
      <DialogContent className="max-w-sm">
        <div className="flex items-start gap-4">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              isDanger
                ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                : 'bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400'
            }`}
          >
            {isDanger ? <AlertTriangle size={22} /> : <Info size={22} />}
          </div>
          <div className="space-y-1">
            <DialogHeader className="text-left">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                {message}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={isDanger ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
