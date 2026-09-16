import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ConfirmModal from './ConfirmModal';
import ProfileModal from './ProfileModal';
import { Layers, LogOut, Sun, Moon, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userInitials = (user?.full_name || user?.email || 'U')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="h-14 bg-card border-b border-border px-4 sm:px-6 flex items-center justify-between shadow-soft">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
            <Layers size={15} strokeWidth={2.2} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground tracking-tight">
              AetherDoc
            </span>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium text-muted-foreground">
              v1.0
            </Badge>
          </div>
        </Link>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
          </Button>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 px-2 gap-2 rounded-lg text-xs font-medium hover:bg-muted"
                >
                  <Avatar className="h-6 w-6 border border-border shrink-0">
                    {user.avatar_url && (
                      <AvatarImage src={user.avatar_url} alt={user.full_name || 'User'} />
                    )}
                    <AvatarFallback className="bg-secondary text-foreground text-[10px] font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline-block max-w-[130px] truncate text-foreground font-medium">
                    {user.full_name || user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-2.5 py-1">
                    <Avatar className="h-9 w-9 border border-border shrink-0">
                      {user.avatar_url && (
                        <AvatarImage src={user.avatar_url} alt={user.full_name || 'User'} />
                      )}
                      <AvatarFallback className="bg-secondary text-foreground text-xs font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5 min-w-0">
                      <p className="text-sm font-semibold leading-none truncate text-foreground">{user.full_name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    setTimeout(() => setShowProfileModal(true), 50);
                  }}
                  className="cursor-pointer gap-2"
                >
                  <User size={14} className="text-muted-foreground" />
                  <span>Edit Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    setTimeout(() => setShowLogoutConfirm(true), 50);
                  }}
                  className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out of your AetherDoc session?"
        confirmText="Sign Out"
        cancelText="Stay"
        type="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}
