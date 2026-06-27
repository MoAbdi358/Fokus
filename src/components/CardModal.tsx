import React, { useState, useEffect } from 'react';
import type { Card } from '../types';
import { useAppState } from '../store';
import { X, Trash2, Tag, Clock } from 'lucide-react';
import { formatDuration } from '../utils/time';

interface CardModalProps {
  card: Card;
  onClose: () => void;
}

export const CardModal: React.FC<CardModalProps> = ({ card, onClose }) => {
  const { state, updateCard, deleteCard, moveCard } = useAppState();
  
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [tags, setTags] = useState<string[]>(card.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [columnId, setColumnId] = useState(card.columnId);

  const activeBoard = state.boards.find((b) => b.id === state.activeBoardId);
  const columns = activeBoard?.columns || [];

  // Reset inputs when card changes
  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description);
    setTags(card.tags || []);
    setColumnId(card.columnId);
  }, [card]);

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Card title cannot be empty.');
      return;
    }

    // Save metadata
    updateCard(state.activeBoardId, card.id, {
      title: title.trim(),
      description: description.trim(),
      tags,
    });

    // Move column if changed
    if (columnId !== card.columnId) {
      moveCard(state.activeBoardId, card.id, columnId);
    }

    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Delete task "${card.title}"?`)) {
      deleteCard(state.activeBoardId, card.id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container glass" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Task</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Title */}
        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            type="text"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task Title"
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a detailed description..."
          />
        </div>

        {/* Tags */}
        <div className="form-group">
          <label className="form-label">Tags</label>
          <div className="tags-input-container">
            {tags.map((tag) => (
              <span key={tag} className="tag-badge">
                <Tag size={10} />
                <span>{tag}</span>
                <button
                  type="button"
                  className="tag-remove-btn"
                  onClick={() => handleRemoveTag(tag)}
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder="Add tag..."
              className="tag-input-inline"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = newTagInput.trim();
                  if (val && !tags.includes(val)) {
                    setTags([...tags, val]);
                    setNewTagInput('');
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Column Location */}
        <div className="form-group">
          <label className="form-label">Status / Column</label>
          <select
            className="pomodoro-linked-select"
            value={columnId}
            onChange={(e) => setColumnId(e.target.value)}
          >
            {columns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.title}
              </option>
            ))}
          </select>
        </div>

        {/* Time Spent */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.03)', marginTop: '8px' }}>
          <Clock size={16} style={{ color: 'var(--navy-60)' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--navy-60)', textTransform: 'uppercase' }}>Time Spent</span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--navy)' }}>{formatDuration(card.timeSpentSeconds)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-delete-btn" onClick={handleDelete}>
            <Trash2 size={14} />
            <span>Delete Task</span>
          </button>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="modal-save-btn"
              onClick={onClose}
              style={{ background: 'transparent', border: '1px solid rgba(15, 23, 42, 0.1)', color: 'var(--navy-80)' }}
            >
              Cancel
            </button>
            <button className="modal-save-btn" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
