import React from 'react';
import { format } from 'date-fns';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const MonthNavigator = ({ month, onMonthChange }) => (
  <div className="flex justify-center items-center mb-8 bg-white inline-flex mx-auto rounded-full shadow-sm border border-slate-200 p-1">
    <button
      onClick={() => onMonthChange(-1)}
      className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
    >
      <ArrowLeft size={20} />
    </button>
    <div className="px-6 font-bold text-slate-800 min-w-[160px] text-center">
      {format(month, 'MMMM yyyy')}
    </div>
    <button
      onClick={() => onMonthChange(1)}
      className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
    >
      <ArrowRight size={20} />
    </button>
  </div>
);
