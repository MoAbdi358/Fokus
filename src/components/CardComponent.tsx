import React, { useState } from 'react';
import type { Card } from '../types';
import { useAppState } from '../store';
import { Clock, Play, Pause } from 'lucide-react';
import { formatDuration } from '../utils/time';

interface CardComponentProps {
  card: Card;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDropOnCard: (e: React.DragEvent) => void;
}

export const CardComponent: React.FC<CardComponentProps> = ({
  card,
  onClick,
  onDragStart,
  onDragEnd,
  onDropOnCard,
}) => {
  const { state, startTimer, pauseTimer, linkCardToTimer } = useAppState();
  const [isDragging, setIsDragging] = useState(false);

  const activeBoard = state.boards.find((b) => b.id === state.activeBoardId);
  const column = activeBoard?.columns.find((c) => c.id === card.columnId);
  const columnTitle = column?.title || '';

  // Determine styling based on column title
  const getStatusClass = (colTitle: string): 'todo' | 'doing' | 'done' => {
    const title = colTitle.toLowerCase();
    if (title.includes('doing') || title.includes('progress') || title.includes('run')) {
      return 'doing';
    }
    if (title.includes('done') || title.includes('shipped') || title.includes('complete') || title.includes('archive')) {
      return 'done';
    }
    return 'todo';
  };

  const statusClass = getStatusClass(columnTitle);

  const handleLocalDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    onDragStart(e);
  };

  const handleLocalDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    onDragEnd(e);
  };

  const isTimerLinkedToThis = state.timer.linkedCardId === card.id;
  const isTimerRunningOnThis = isTimerLinkedToThis && state.timer.isRunning;

  const handleTimerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTimerLinkedToThis) {
      if (state.timer.isRunning) {
        pauseTimer();
      } else {
        startTimer();
      }
    } else {
      // Link to this card and start
      linkCardToTimer(card.id);
      startTimer();
    }
  };

  return (
    <div
      draggable
      onDragStart={handleLocalDragStart}
      onDragEnd={handleLocalDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDropOnCard}
      onClick={onClick}
      className={`task-card ${statusClass} ${isDragging ? 'dragging' : ''}`}
    >
      <div className="card-top">
        <h4 className="card-title">{card.title}</h4>
        
        {/* If status is "Doing" or "Todo", allow quick play/pause tracking */}
        {statusClass !== 'done' && (
          <button
            onClick={handleTimerClick}
            className="column-actions-btn"
            style={{
              padding: '2px',
              color: isTimerRunningOnThis ? 'var(--rust)' : 'var(--navy-40)',
            }}
            title={isTimerRunningOnThis ? 'Pause Tracking' : 'Track Time'}
          >
            {isTimerRunningOnThis ? (
              <Pause size={12} fill="var(--rust)" />
            ) : (
              <Play size={12} style={{ marginLeft: '0.5px' }} />
            )}
          </button>
        )}
      </div>

      {card.description && <p className="card-desc">{card.description}</p>}

      {card.tags.length > 0 && (
        <div className="card-tags">
          {card.tags.map((tag) => (
            <span key={tag} className="card-tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Show time tracking indicator if time spent > 0 or if currently tracking */}
      {(card.timeSpentSeconds > 0 || isTimerLinkedToThis) && (
        <div className="card-timer-badge">
          <Clock size={12} className={isTimerRunningOnThis ? 'animate-pulse' : ''} />
          <span>{formatDuration(card.timeSpentSeconds)}</span>
          {isTimerLinkedToThis && (
            <span style={{ fontSize: '10px', opacity: 0.8 }}>
              ({isTimerRunningOnThis ? 'tracking' : 'linked'})
            </span>
          )}
        </div>
      )}
    </div>
  );
};
