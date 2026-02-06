import React from 'react';
import { Home, Calendar, Utensils, User, BarChart3, Lock } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Home', icon: Home, requiresSubscription: false },
  { id: 'program', label: 'Program', icon: Calendar, requiresSubscription: true },
  { id: 'nutrition', label: 'Nutrition', icon: Utensils, requiresSubscription: true },
  { id: 'stats', label: 'Stats', icon: BarChart3, requiresSubscription: true },
  { id: 'profile', label: 'Profile', icon: User, requiresSubscription: false },
];

export function TabBar({ activeTab, onChange, isSubscribed = true }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-900/95 backdrop-blur-md border-t border-dark-700 px-2 pt-2 z-50" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const isLocked = !isSubscribed && tab.requiresSubscription;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                flex flex-col items-center px-4 py-2 rounded-xl transition-all duration-200 relative
                ${isActive
                  ? 'text-accent-primary'
                  : isLocked
                    ? 'text-dark-500'
                    : 'text-dark-400 hover:text-text-secondary'
                }
              `}
            >
              <div className={`
                relative p-1.5 rounded-lg transition-all duration-200
                ${isActive ? 'bg-accent-primary/10' : ''}
              `}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'} ${isLocked ? 'opacity-50' : ''}`} />
                {isActive && !isLocked && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-primary rounded-full" />
                )}
                {/* Lock indicator for non-subscribers */}
                {isLocked && (
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-dark-600 rounded-full flex items-center justify-center border border-dark-500">
                    <Lock className="w-2 h-2 text-accent-warning" />
                  </div>
                )}
              </div>
              <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : 'font-medium'} ${isLocked ? 'opacity-50' : ''}`}>
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
