import React from 'react';
import { useAppState } from '../store';
import { LayoutGrid, BarChart3, Timer, Settings as SettingsIcon, Plus } from 'lucide-react';
import type { ViewType } from '../types';

export const Sidebar: React.FC = () => {
  const { state, setActiveView, createBoard } = useAppState();

  const navItems = [
    { id: 'boards' as ViewType, label: 'Boards', icon: LayoutGrid },
    { id: 'analytics' as ViewType, label: 'Analytics', icon: BarChart3 },
    { id: 'pomodoro' as ViewType, label: 'Pomodoro', icon: Timer },
    { id: 'settings' as ViewType, label: 'Settings', icon: SettingsIcon },
  ];

  const handleCreateBoard = () => {
    const title = window.prompt('Enter new board name:');
    if (title && title.trim()) {
      createBoard(title.trim());
    }
  };

  return (
    <aside className="sidebar glass">
      <div>
        <h1 className="sidebar-logo">Fokus</h1>
        <div className="sidebar-subtitle">Deep Work Mode</div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = state.activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <button className="new-board-btn" onClick={handleCreateBoard}>
          <Plus size={16} />
          <span>New Board</span>
        </button>
      </div>
    </aside>
  );
};
