import React from 'react';
import { Home, Calendar, Utensils, User, BarChart3 } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'program', label: 'Program', icon: Calendar },
  { id: 'nutrition', label: 'Nutrition', icon: Utensils },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'profile', label: 'Profile', icon: User },
];

export function TabBar({ activeTab, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-dark-700 px-2 py-2">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => onChange(tab.id)}
              className={`flex flex-col items-center px-4 py-2 rounded-xl transition-all ${isActive ? 'text-accent-primary bg-accent-primary/10' : 'text-gray-500 hover:text-gray-300'}`}>
              <Icon className={`w-6 h-6 ${isActive ? 'stroke-2' : ''}`} />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default TabBar;
