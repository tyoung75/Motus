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
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-900/95 backdrop-blur-md border-t border-dark-700 px-2 py-2 z-50">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                flex flex-col items-center px-4 py-2 rounded-xl transition-all duration-200
                ${isActive
                  ? 'text-accent-primary'
                  : 'text-dark-400 hover:text-text-secondary'
                }
              `}
            >
              <div className={`
                relative p-1.5 rounded-lg transition-all duration-200
                ${isActive ? 'bg-accent-primary/10' : ''}
              `}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-primary rounded-full" />
                )}
              </div>
              <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default TabBar;
