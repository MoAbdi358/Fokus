import React, { useState, useRef, useEffect } from 'react';
import type { Column, Card } from '../types';
import { useAppState } from '../store';
import { Plus, X, Trash2 } from 'lucide-react';
import { CardComponent } from './CardComponent';

interface ColumnComponentProps {
  column: Column;
  cards: Card[];
  onCardClick: (card: Card) => void;
  onDragStart: (e: React.DragEvent, cardId: string, sourceColId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export const ColumnComponent: React.FC<ColumnComponentProps> = ({
  column,
  cards,
  onCardClick,
  onDragStart,
  onDragEnd,
}) => {
  const { state, updateColumnTitle, deleteColumn, addCard, moveCard } = useAppState();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(column.title);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const cardInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle) {
      inputRef.current?.focus();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isAddingCard) {
      cardInputRef.current?.focus();
    }
  }, [isAddingCard]);

  const handleSaveTitle = () => {
    if (titleValue.trim() && titleValue.trim() !== column.title) {
      updateColumnTitle(state.activeBoardId, column.id, titleValue.trim());
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveTitle();
    if (e.key === 'Escape') {
      setTitleValue(column.title);
      setIsEditingTitle(false);
    }
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCardTitle.trim()) {
      addCard(state.activeBoardId, column.id, newCardTitle.trim(), '');
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId) {
      moveCard(state.activeBoardId, cardId, column.id);
    }
  };

  const handleDropOnCard = (targetCardId: string) => {
    // Determine index of target card
    const targetIndex = cards.findIndex((c) => c.id === targetCardId);
    return (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const cardId = e.dataTransfer.getData('text/plain');
      if (cardId && cardId !== targetCardId) {
        moveCard(state.activeBoardId, cardId, column.id, targetIndex);
      }
    };
  };

  return (
    <section
      className={`board-column ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="column-header">
        <div className="column-title-container">
          {isEditingTitle ? (
            <input
              ref={inputRef}
              type="text"
              className="column-title-input"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <h2 className="column-title-text" onDoubleClick={() => setIsEditingTitle(true)}>
              {column.title}
            </h2>
          )}
          <span className="column-badge">{cards.length}</span>
        </div>

        <button
          className="column-actions-btn"
          onClick={() => {
            if (window.confirm(`Are you sure you want to delete column "${column.title}" and all its tasks?`)) {
              deleteColumn(state.activeBoardId, column.id);
            }
          }}
          title="Delete Column"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="column-cards-list">
        {cards.map((card) => (
          <CardComponent
            key={card.id}
            card={card}
            onClick={() => onCardClick(card)}
            onDragStart={(e) => onDragStart(e, card.id, column.id)}
            onDragEnd={onDragEnd}
            onDropOnCard={handleDropOnCard(card.id)}
          />
        ))}

        {isAddingCard ? (
          <form onSubmit={handleCreateCard} className="glass" style={{ borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              ref={cardInputRef}
              type="text"
              placeholder="What needs to be done?"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              className="form-input"
              style={{ fontSize: '13px', padding: '8px 10px' }}
              onKeyDown={(e) => e.key === 'Escape' && setIsAddingCard(false)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsAddingCard(false)}
                className="column-actions-btn"
                style={{ padding: '6px' }}
              >
                <X size={14} />
              </button>
              <button
                type="submit"
                className="modal-save-btn"
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}
              >
                Add
              </button>
            </div>
          </form>
        ) : (
          <button className="quick-add-btn" onClick={() => setIsAddingCard(true)}>
            <Plus size={14} />
            <span>Add Task</span>
          </button>
        )}
      </div>
    </section>
  );
};
