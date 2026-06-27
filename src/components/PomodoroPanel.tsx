import React from 'react';
import { useAppState } from '../store';
import { Play, Pause, RotateCcw, SkipForward, X, Link } from 'lucide-react';
import { formatTimer } from '../utils/time';

interface PomodoroPanelProps {
  onClose: () => void;
}

export const PomodoroPanel: React.FC<PomodoroPanelProps> = ({ onClose }) => {
  const {
    state,
    startTimer,
    pauseTimer,
    resetTimer,
    skipTimer,
    linkCardToTimer,
  } = useAppState();

  const activeBoard = state.boards.find((b) => b.id === state.activeBoardId);
  const cards = activeBoard?.cards || [];
  const columns = activeBoard?.columns || [];

  // Find column IDs that represent "Doing"
  const doingColumnIds = columns
    .filter((col) => {
      const title = col.title.toLowerCase();
      return title.includes('doing') || title.includes('progress') || title.includes('run');
    })
    .map((col) => col.id);

  // Filter cards to only those in the "Doing" columns
  const doingCards = cards.filter((card) => doingColumnIds.includes(card.columnId));

  // Determine total time for the current session type (for progress percentage)
  const getSessionTotalTime = (): number => {
    const { sessionType } = state.timer;
    const { settings } = state;
    if (sessionType === 'focus') return settings.pomodoroFocusTime * 60;
    if (sessionType === 'shortBreak') return settings.pomodoroBreakTime * 60;
    return settings.pomodoroLongBreakTime * 60;
  };

  const totalTime = getSessionTotalTime();
  const timeRemaining = state.timer.remainingTime;
  const fraction = totalTime > 0 ? timeRemaining / totalTime : 0;

  // SVG Circular progress dimensions
  const radius = 80;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - fraction * circumference;

  const handleLinkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    linkCardToTimer(value === 'none' ? null : value);
  };

  const currentLinkedCard = cards.find((c) => c.id === state.timer.linkedCardId);

  return (
    <div className="pomodoro-panel-wrapper glass">
      <div className="pomodoro-panel-header">
        <h3 className="pomodoro-panel-title">Pomodoro Timer</h3>
        <button
          className="modal-close-btn"
          onClick={onClose}
          title="Close Timer Panel"
        >
          <X size={18} />
        </button>
      </div>

      <div className="pomodoro-circle-container">
        {/* SVG Progress Ring */}
        <svg height={radius * 2} width={radius * 2}>
          {/* Base circle background */}
          <circle
            stroke="rgba(15, 23, 42, 0.04)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <circle
            className="progress-ring-circle"
            stroke="var(--rust)"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeLinecap="round"
          />
        </svg>

        <div className="pomodoro-circle-text-wrapper">
          <span className="pomodoro-mode-label">
            {state.timer.sessionType === 'focus' ? 'Focus' : 'Break'}
          </span>
          <span className="pomodoro-time-display">
            {formatTimer(state.timer.remainingTime)}
          </span>
        </div>
      </div>

      {/* Timer Control Buttons */}
      <div className="pomodoro-controls">
        <button
          className="pomodoro-control-btn"
          onClick={resetTimer}
          title="Reset Timer"
        >
          <RotateCcw size={16} />
        </button>

        <button
          className="pomodoro-control-btn play-pause"
          onClick={state.timer.isRunning ? pauseTimer : startTimer}
          title={state.timer.isRunning ? 'Pause' : 'Start'}
        >
          {state.timer.isRunning ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" style={{ marginLeft: '2px' }} />}
        </button>

        <button
          className="pomodoro-control-btn"
          onClick={skipTimer}
          title="Skip Session"
        >
          <SkipForward size={16} />
        </button>
      </div>

      {/* Linked Task Selection */}
      <div className="pomodoro-linking-section">
        <div className="pomodoro-linking-label">
          <Link size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          <span>Linked to Task</span>
        </div>

        {doingCards.length > 0 ? (
          <select
            className="pomodoro-linked-select"
            value={state.timer.linkedCardId || 'none'}
            onChange={handleLinkChange}
          >
            <option value="none">No card linked</option>
            {doingCards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.title}
              </option>
            ))}
          </select>
        ) : (
          <div style={{ width: '100%' }}>
            <select className="pomodoro-linked-select" disabled>
              <option>No tasks in "Doing" column</option>
            </select>
            <p
              style={{
                fontSize: '11px',
                color: 'var(--navy-60)',
                marginTop: '6px',
                textAlign: 'center',
                lineHeight: '1.3',
              }}
            >
              Move a task card into the <strong>Doing</strong> column to link and accumulate active focus time on it.
            </p>
          </div>
        )}

        {currentLinkedCard && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--navy-40)', textTransform: 'uppercase', marginBottom: '4px' }}>Linked Focus:</span>
            <div className="pomodoro-linked-badge">
              {currentLinkedCard.title}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
