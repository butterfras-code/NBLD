import React from 'react';
import { Music, Calendar, LogOut } from 'lucide-react';

export const Layout = ({ children, title, onLogout, user }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
    <header className="bg-indigo-700 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/10 rounded-full">
            <Music size={20} className="text-indigo-100" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Line Dance Scheduler</h1>
            <p className="text-xs text-indigo-200">Neon Boots Lesson Planning</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium hidden sm:block bg-indigo-800/50 px-3 py-1 rounded-full border border-indigo-600/50">
            {title}
          </span>
          {user && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-indigo-200">Hi, {user}</span>
              <button
                onClick={onLogout}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
    <main className="flex-grow max-w-6xl w-full mx-auto p-4 md:p-6">{children}</main>
    <footer className="bg-slate-900 text-slate-400 py-6 mt-auto">
      <div className="max-w-6xl mx-auto px-4 text-center text-sm">
        <p>© 2025 Neon Boots Line Dance Scheduler</p>
      </div>
    </footer>
  </div>
);
