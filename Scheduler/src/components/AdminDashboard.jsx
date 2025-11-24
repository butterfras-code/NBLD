import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * AdminDashboard - Placeholder component
 * 
 * TODO: This component needs to be fully refactored from the monolithic index.html
 * It includes complex schedule management, drag-and-drop, auto-generation, etc.
 * For now, showing a notice to use the legacy version.
 */
export const AdminDashboard = ({ month, instructors }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
      <div className="inline-flex p-4 bg-orange-100 rounded-full mb-4">
        <AlertTriangle className="text-orange-600" size={48} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-3">
        Admin Dashboard - Refactoring In Progress
      </h2>
      <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
        The Admin Dashboard is being refactored into modular components. 
        This complex component includes schedule management, drag-and-drop lesson assignment,
        auto-generation algorithms, and Google Sheets integration.
      </p>
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-w-xl mx-auto mb-6">
        <p className="text-sm text-slate-700">
          <strong>Current Status:</strong> Use the legacy <code className="bg-slate-200 px-1 rounded">index.html</code> 
          {' '}for full admin functionality until refactoring is complete.
        </p>
      </div>
      <p className="text-xs text-slate-500">
        Month: {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} | 
        Instructors: {instructors.length}
      </p>
    </div>
  );
};
