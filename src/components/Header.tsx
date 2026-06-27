import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../store';
import { ChevronDown, Settings as SettingsIcon, Play, Pause, Trash2 } from 'lucide-react';
import { formatTimer } from '../utils/time';

interface HeaderProps {
  togglePomodoroPanel: () => void;
  isPomodoroPanelOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ togglePomodoroPanel, isPomodoroPanelOpen }) => {
  const {
    state,
    setActiveBoardId,
    deleteBoard,
    updateBoardTitle,
    setActiveView,
    startTimer,
    pauseTimer,
  } = useAppState();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const activeBoard = state.boards.find((b) => b.id === state.activeBoardId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set initial input value when editing starts
  useEffect(() => {
    if (isEditingTitle && activeBoard) {
      setEditTitleValue(activeBoard.title);
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [isEditingTitle, activeBoard]);

  const handleSaveTitle = () => {
    if (activeBoard && editTitleValue.trim()) {
      updateBoardTitle(activeBoard.id, editTitleValue.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveTitle();
    if (e.key === 'Escape') setIsEditingTitle(false);
  };

  const handleTimerToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent panel toggle when clicking play button
    if (state.timer.isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  return (
    <header className="header glass">
      <div className="header-title-container" ref={dropdownRef}>
        {isEditingTitle && activeBoard ? (
          <input
            ref={titleInputRef}
            type="text"
            className="column-title-input"
            value={editTitleValue}
            onChange={(e) => setEditTitleValue(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={handleTitleKeyDown}
            style={{ fontSize: '20px', fontWeight: 700 }}
          />
        ) : (
          <div
            className="board-selector-trigger"
            onClick={() => state.activeView === 'boards' && setIsDropdownOpen(!isDropdownOpen)}
            onDoubleClick={() => state.activeView === 'boards' && setIsEditingTitle(true)}
          >
            <span>{state.activeView === 'boards' ? (activeBoard?.title || 'No board') : state.activeView.charAt(0).toUpperCase() + state.activeView.slice(1)}</span>
            {state.activeView === 'boards' && <ChevronDown size={16} />}
          </div>
        )}

        {isDropdownOpen && state.activeView === 'boards' && (
          <div className="dropdown-menu glass">
            {state.boards.map((board) => (
              <div
                key={board.id}
                className={`dropdown-item ${board.id === state.activeBoardId ? 'active' : ''}`}
                onClick={() => {
                  setActiveBoardId(board.id);
                  setIsDropdownOpen(false);
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                  {board.title}
                </span>
                
                <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    className="dropdown-delete-btn"
                    onClick={() => {
                      if (state.boards.length <= 1) {
                        alert('You must keep at least one board.');
                        return;
                      }
                      if (window.confirm(`Delete board "${board.title}"?`)) {
                        deleteBoard(board.id);
                      }
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="header-controls">
        {/* Quick Pomodoro Badge */}
        <div
          className="quick-pomo-badge"
          onClick={togglePomodoroPanel}
          style={{
            borderColor: isPomodoroPanelOpen ? 'var(--rust)' : '',
            boxShadow: isPomodoroPanelOpen ? '0 0 12px rgba(194, 65, 12, 0.2)' : '',
          }}
        >
          <button className="quick-pomo-play-btn" onClick={handleTimerToggle}>
            {state.timer.isRunning ? <Pause size={10} fill="white" /> : <Play size={10} fill="white" style={{ marginLeft: '1px' }} />}
          </button>
          <span>{formatTimer(state.timer.remainingTime)}</span>
        </div>

        {/* Settings Toggle */}
        <button
          className={`header-icon-btn ${state.activeView === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveView('settings')}
        >
          <SettingsIcon size={18} />
        </button>

        {/* User Profile Avatar */}
        <div className="user-profile">
          <img src="/avatar.png" alt="Profile" onError={(e) => {
            // Fallback avatar if local copy failed
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces';
          }} />
        </div>
      </div>
    </header>
  );
};
