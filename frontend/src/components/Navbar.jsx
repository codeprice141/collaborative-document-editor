import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ConfirmModal from './ConfirmModal';
import { Layers, LogOut, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userInitials = (user?.full_name || user?.email || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shadow-soft">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-sm">
            <Layers size={17} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base text-slate-900 dark:text-slate-100 tracking-tight">AetherDoc</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">PRO</span>
          </div>
        </Link>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
          </button>

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {userInitials}
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:block">
                {user.full_name || user.email}
              </span>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </header>

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
