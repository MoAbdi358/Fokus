import React from 'react';
import { useAppState } from '../store';
import { ColumnComponent } from './ColumnComponent';
import type { Card } from '../types';
import { LayoutGrid, Plus } from 'lucide-react';

interface BoardViewProps {
  onCardClick: (card: Card) => void;
}

export const BoardView: React.FC<BoardViewProps> = ({ onCardClick }) => {
  const { state, addColumn } = useAppState();

  const activeBoard = state.boards.find((b) => b.id === state.activeBoardId);

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cardId);
  };

  const handleDragEnd = () => {
    // Optional: reset any global dragging states
  };

  const handleAddColumn = () => {
    const title = window.prompt('Enter new column name:');
    if (title && title.trim()) {
      addColumn(state.activeBoardId, title.trim());
    }
  };

  if (!activeBoard) {
    return (
      <div className="board-view" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '16px' }}>
        <LayoutGrid size={48} style={{ opacity: 0.2 }} />
        <p className="empty-state">No active board. Create one in the sidebar to get started!</p>
      </div>
    );
  }

  return (
    <div className="board-view">
      {activeBoard.columns.map((col) => {
        const columnCards = activeBoard.cards.filter((card) => card.columnId === col.id);
        return (
          <ColumnComponent
            key={col.id}
            column={col}
            cards={columnCards}
            onCardClick={onCardClick}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        );
      })}

      {/* Add column button */}
      <button
        onClick={handleAddColumn}
        className="glass"
        style={{
          width: '240px',
          minWidth: '220px',
          padding: '16px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.15)',
          border: '1px dashed rgba(15, 23, 42, 0.08)',
          color: 'var(--navy-60)',
          fontWeight: 700,
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          height: '56px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.15)';
          e.currentTarget.style.color = 'var(--navy)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.08)';
          e.currentTarget.style.color = 'var(--navy-60)';
        }}
      >
        <Plus size={16} />
        <span>Add Column</span>
      </button>
    </div>
  );
};
