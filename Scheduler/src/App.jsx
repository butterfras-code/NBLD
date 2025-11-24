import React, { useState, useEffect } from 'react';
import { addMonths } from 'date-fns';
import { Layout } from './components/Layout.jsx';
import { InstructorPortal } from './components/InstructorPortal.jsx';
import { AdminDashboard } from './components/AdminDashboard.jsx';
import { LoginScreen } from './components/LoginScreen.jsx';
import { MonthNavigator } from './components/MonthNavigator.jsx';
import { StorageService } from './services/storage.service.js';

export const App = () => {
  const [instructors, setInstructors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState(() => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return {
      currentUser: null,
      viewMode: 'instructor',
      selectedMonth: nextMonth
    };
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await StorageService.getInstructors();
        setInstructors(data || []);
      } catch (e) {
        console.error('Failed to load instructors:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleLogin = (user) => {
    setState(prev => ({ ...prev, currentUser: user, viewMode: user.id === 'admin' ? 'admin' : 'instructor' }));
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  const changeMonth = (delta) => {
    setState(prev => ({ ...prev, selectedMonth: addMonths(prev.selectedMonth, delta) }));
  };

  if (!state.currentUser) {
    return <LoginScreen instructors={instructors} isLoading={isLoading} onLogin={handleLogin} />;
  }

  return (
    <Layout
      title={state.viewMode === 'admin' ? 'Admin Dashboard' : 'Instructor Portal'}
      user={state.currentUser.name}
      onLogout={handleLogout}
    >
      <MonthNavigator month={state.selectedMonth} onMonthChange={changeMonth} />
      
      {state.viewMode === 'admin' ? (
        <AdminDashboard month={state.selectedMonth} instructors={instructors} />
      ) : (
        <InstructorPortal instructor={state.currentUser} month={state.selectedMonth} />
      )}
    </Layout>
  );
};
