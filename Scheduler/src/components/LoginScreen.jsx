import React, { useState } from 'react';
import { UserCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { Layout } from './Layout.jsx';

export const LoginScreen = ({ instructors, isLoading, onLogin }) => {
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPwd, setAdminPwd] = useState('');
  const [authError, setAuthError] = useState(false);

  const handleInstructorLogin = (instructor) => {
    onLogin(instructor);
  };

  const verifyAdmin = (e) => {
    e.preventDefault();
    if (adminPwd === 'annoyedbutfine.') {
      onLogin({ id: 'admin', name: 'Admin' });
      setShowAdminAuth(false);
    } else {
      setAuthError(true);
    }
  };

  return (
    <Layout title="Login">
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg border border-indigo-100 mt-10 relative">
        <h2 className="text-2xl font-bold text-center text-indigo-900 mb-6">Welcome Back</h2>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Loader2 className="animate-spin mb-2" size={32} />
            <span>Loading...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {instructors.length === 0 ? (
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200 text-orange-700 text-sm">
                <p><strong>No instructors found.</strong></p>
                <p className="mt-1">Please add instructor documents to Firebase.</p>
              </div>
            ) : (
              <>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Instructors
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {instructors.map(inst => (
                    <button
                      key={inst.id}
                      onClick={() => handleInstructorLogin(inst)}
                      className="flex items-center justify-center space-x-2 p-3 border border-slate-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all text-slate-700 text-sm font-medium"
                    >
                      <UserCircle size={18} className="text-indigo-400" />
                      <span>{inst.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">Or</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowAdminAuth(true);
                setAdminPwd('');
                setAuthError(false);
              }}
              className="w-full flex items-center justify-center space-x-2 bg-slate-900 text-white p-3 rounded-lg hover:bg-slate-800 transition-colors shadow-md"
            >
              <ShieldCheck size={18} />
              <span>Access Admin Dashboard</span>
            </button>
          </div>
        )}
        
        {showAdminAuth && (
          <div className="absolute inset-0 z-10 bg-slate-900/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 animate-fade-in text-white">
            <div className="bg-indigo-800/40 p-3 rounded-full mb-4">
              <ShieldCheck className="text-indigo-300" size={32} />
            </div>
            <h3 className="text-lg font-bold mb-1">Admin Access</h3>
            <p className="text-xs text-slate-400 mb-4">Enter admin password</p>
            
            <form onSubmit={verifyAdmin} className="w-full max-w-xs">
              <input
                type="password"
                autoFocus
                value={adminPwd}
                onChange={e => {
                  setAdminPwd(e.target.value);
                  setAuthError(false);
                }}
                className={`w-full px-4 py-2 rounded-lg border ${
                  authError
                    ? 'border-red-500 bg-red-900/30'
                    : 'border-slate-700 bg-slate-800 focus:border-indigo-500'
                } outline-none text-sm mb-2`}
                placeholder="Password"
              />
              {authError && (
                <p className="text-xs text-red-400 mb-3 text-center font-medium">
                  Incorrect password
                </p>
              )}
              
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminAuth(false)}
                  className="flex-1 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-700 font-medium"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
};
