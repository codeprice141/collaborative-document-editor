import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Trash2, Loader2, User, Mail, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && user) {
      setFullName(user.full_name || '');
      setAvatarUrl(user.avatar_url || '');
      setError('');
      setSuccess(false);
    }
  }, [isOpen, user]);

  const userInitials = (fullName || user?.email || 'U')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file is too large (maximum 5MB).');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Square crop and compress via canvas (max 256x256)
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        const targetSize = Math.min(size, 256);
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext('2d');
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;

        ctx.drawImage(img, startX, startY, size, size, 0, 0, targetSize, targetSize);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatarUrl(compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected if desired
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const trimmed = fullName.trim();
    if (!trimmed) {
      setError('Please enter your full name.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await updateProfile({
        full_name: trimmed,
        avatar_url: avatarUrl || null,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      setError(err?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !saving && !open && onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-lg font-semibold text-foreground">
            Edit Profile
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Customize your display name and profile picture across AetherDoc.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5 pt-2">
          {/* Avatar Edit Section */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full border-2 border-border overflow-hidden bg-secondary flex items-center justify-center text-foreground shadow-sm">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold tracking-wider">
                    {userInitials}
                  </span>
                )}
              </div>

              {/* Camera Hover Overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
                title="Upload new photo"
              >
                <Camera size={18} />
                <span className="text-[10px] font-medium">Change</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5 gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={13} />
                <span>Upload photo</span>
              </Button>

              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2 text-muted-foreground hover:text-destructive gap-1"
                  onClick={handleRemovePhoto}
                >
                  <Trash2 size={13} />
                  <span>Remove</span>
                </Button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <label htmlFor="full_name" className="text-xs font-semibold text-foreground">
                Full Name
              </label>
              <div className="relative">
                <Input
                  id="full_name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={100}
                  className="pl-8 text-sm"
                  autoFocus
                />
                <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-foreground">
                Email Address
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="pl-8 text-sm bg-muted/50 cursor-not-allowed opacity-80"
                />
                <Mail size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Your email is linked to your authentication account and cannot be changed.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded-lg">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">
              <Check size={14} className="shrink-0" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <DialogFooter className="pt-2 gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || success}
              className="flex-1 gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
