import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AppState, Board, Card, Column, Settings, ViewType, SessionType } from './types';

interface AppContextType {
  state: AppState;
  setActiveView: (view: ViewType) => void;
  setActiveBoardId: (boardId: string) => void;
  createBoard: (title: string) => void;
  deleteBoard: (boardId: string) => void;
  updateBoardTitle: (boardId: string, title: string) => void;
  addColumn: (boardId: string, title: string) => void;
  updateColumnTitle: (boardId: string, columnId: string, title: string) => void;
  deleteColumn: (boardId: string, columnId: string) => void;
  addCard: (boardId: string, columnId: string, title: string, description?: string) => void;
  updateCard: (boardId: string, cardId: string, updates: Partial<Omit<Card, 'id' | 'columnId'>>) => void;
  moveCard: (boardId: string, cardId: string, targetColumnId: string, targetIndex?: number) => void;
  deleteCard: (boardId: string, cardId: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipTimer: () => void;
  linkCardToTimer: (cardId: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: Settings = {
  pomodoroFocusTime: 25,
  pomodoroBreakTime: 5,
  pomodoroLongBreakTime: 15,
};

const DEFAULT_BOARDS: Board[] = [
  {
    id: 'board-1',
    title: 'My board',
    columns: [
      { id: 'col-todo', title: 'Todo' },
      { id: 'col-doing', title: 'Doing' },
      { id: 'col-done', title: 'Done' },
    ],
    cards: [
      {
        id: 'card-1',
        columnId: 'col-todo',
        title: 'Review design tokens',
        description: 'Check Navy, Rust, and Glassmorphic specifications.',
        timeSpentSeconds: 0,
        tags: ['Design', 'System'],
      },
      {
        id: 'card-2',
        columnId: 'col-todo',
        title: 'Configure API integrations',
        description: 'Set up endpoints for Phase 2 cloud sync.',
        timeSpentSeconds: 0,
        tags: ['Dev'],
      },
      {
        id: 'card-3',
        columnId: 'col-doing',
        title: 'Animate glass transitions',
        description: 'Ensure smooth CSS transitions for elements.',
        timeSpentSeconds: 760, // 12m 40s
        tags: ['Dev'],
      },
    ],
  },
];

const INITIAL_STATE: AppState = {
  boards: DEFAULT_BOARDS,
  activeBoardId: 'board-1',
  activeView: 'boards',
  settings: DEFAULT_SETTINGS,
  timer: {
    isRunning: false,
    remainingTime: DEFAULT_SETTINGS.pomodoroFocusTime * 60,
    sessionType: 'focus',
    linkedCardId: 'card-3', // default linked to active card
    lastUpdated: null,
  },
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('fokus_app_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Reset timer run state on load to avoid running on boot
        if (parsed.timer) {
          parsed.timer.isRunning = false;
          parsed.timer.lastUpdated = null;
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse local storage', e);
      }
    }
    return INITIAL_STATE;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('fokus_app_state', JSON.stringify(state));
  }, [state]);

  // Timer Tick implementation (runs on interval when timer.isRunning is true)
  useEffect(() => {
    if (state.timer.isRunning) {
      state.timer.lastUpdated = Date.now();
      
      const tick = () => {
        setState((prev) => {
          if (!prev.timer.isRunning || !prev.timer.lastUpdated) return prev;
          
          const now = Date.now();
          const elapsedMs = now - prev.timer.lastUpdated;
          const elapsedSeconds = Math.round(elapsedMs / 1000);
          
          if (elapsedSeconds <= 0) {
            // If less than 1s elapsed, don't tick yet
            return prev;
          }

          let newRemaining = prev.timer.remainingTime - elapsedSeconds;
          let sessionFinished = false;

          if (newRemaining <= 0) {
            newRemaining = 0;
            sessionFinished = true;
          }

          // Update active card's time spent if it's focus session and linked
          let updatedBoards = prev.boards;
          if (
            prev.timer.sessionType === 'focus' &&
            prev.timer.linkedCardId &&
            elapsedSeconds > 0
          ) {
            updatedBoards = prev.boards.map((board) => {
              if (board.id !== prev.activeBoardId) return board;
              return {
                ...board,
                cards: board.cards.map((card) => {
                  if (card.id === prev.timer.linkedCardId) {
                    return {
                      ...card,
                      timeSpentSeconds: card.timeSpentSeconds + elapsedSeconds,
                    };
                  }
                  return card;
                }),
              };
            });
          }

          if (sessionFinished) {
            // Trigger audio beep or alert
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              oscillator.type = 'sine';
              oscillator.frequency.value = 523.25; // C5
              gainNode.gain.setValueAtTime(0, audioContext.currentTime);
              gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
              gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.8);
              oscillator.start(audioContext.currentTime);
              oscillator.stop(audioContext.currentTime + 0.8);
            } catch (e) {
              console.log('Audio feedback not supported or blocked by browser');
            }

            // Determine next session
            let nextSession: SessionType = 'focus';
            let nextRemaining = prev.settings.pomodoroFocusTime * 60;

            if (prev.timer.sessionType === 'focus') {
              nextSession = 'shortBreak';
              nextRemaining = prev.settings.pomodoroBreakTime * 60;
            } else {
              nextSession = 'focus';
              nextRemaining = prev.settings.pomodoroFocusTime * 60;
            }

            return {
              ...prev,
              boards: updatedBoards,
              timer: {
                ...prev.timer,
                isRunning: false,
                remainingTime: nextRemaining,
                sessionType: nextSession,
                lastUpdated: null,
              },
            };
          }

          return {
            ...prev,
            boards: updatedBoards,
            timer: {
              ...prev.timer,
              remainingTime: newRemaining,
              lastUpdated: now,
            },
          };
        });
      };

      const intervalId = window.setInterval(tick, 1000);
      return () => clearInterval(intervalId);
    }
  }, [state.timer.isRunning, state.activeBoardId]);

  // Actions
  const setActiveView = (view: ViewType) => {
    setState((prev) => ({ ...prev, activeView: view }));
  };

  const setActiveBoardId = (boardId: string) => {
    setState((prev) => ({ ...prev, activeBoardId: boardId }));
  };

  const createBoard = (title: string) => {
    const newBoardId = `board-${Date.now()}`;
    const newBoard: Board = {
      id: newBoardId,
      title,
      columns: [
        { id: `col-todo-${Date.now()}`, title: 'Todo' },
        { id: `col-doing-${Date.now()}`, title: 'Doing' },
        { id: `col-done-${Date.now()}`, title: 'Done' },
      ],
      cards: [],
    };
    setState((prev) => ({
      ...prev,
      boards: [...prev.boards, newBoard],
      activeBoardId: newBoardId,
      activeView: 'boards',
    }));
  };

  const deleteBoard = (boardId: string) => {
    setState((prev) => {
      const filteredBoards = prev.boards.filter((b) => b.id !== boardId);
      const nextActiveId = filteredBoards.length > 0 ? filteredBoards[0].id : '';
      return {
        ...prev,
        boards: filteredBoards,
        activeBoardId: nextActiveId,
      };
    });
  };

  const updateBoardTitle = (boardId: string, title: string) => {
    setState((prev) => ({
      ...prev,
      boards: prev.boards.map((b) => (b.id === boardId ? { ...b, title } : b)),
    }));
  };

  const addColumn = (boardId: string, title: string) => {
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      title,
    };
    setState((prev) => ({
      ...prev,
      boards: prev.boards.map((b) => {
        if (b.id !== boardId) return b;
        return {
          ...b,
          columns: [...b.columns, newColumn],
        };
      }),
    }));
  };

  const updateColumnTitle = (boardId: string, columnId: string, title: string) => {
    setState((prev) => ({
      ...prev,
      boards: prev.boards.map((b) => {
        if (b.id !== boardId) return b;
        return {
          ...b,
          columns: b.columns.map((c) => (c.id === columnId ? { ...c, title } : c)),
        };
      }),
    }));
  };

  const deleteColumn = (boardId: string, columnId: string) => {
    setState((prev) => ({
      ...prev,
      boards: prev.boards.map((b) => {
        if (b.id !== boardId) return b;
        return {
          ...b,
          columns: b.columns.filter((c) => c.id !== columnId),
          // Clean up cards in deleted column
          cards: b.cards.filter((card) => card.columnId !== columnId),
        };
      }),
    }));
  };

  const addCard = (boardId: string, columnId: string, title: string, description = '') => {
    const newCard: Card = {
      id: `card-${Date.now()}`,
      columnId,
      title,
      description,
      timeSpentSeconds: 0,
      tags: [],
    };
    setState((prev) => ({
      ...prev,
      boards: prev.boards.map((b) => {
        if (b.id !== boardId) return b;
        return {
          ...b,
          cards: [...b.cards, newCard],
        };
      }),
    }));
  };

  const updateCard = (boardId: string, cardId: string, updates: Partial<Omit<Card, 'id' | 'columnId'>>) => {
    setState((prev) => ({
      ...prev,
      boards: prev.boards.map((b) => {
        if (b.id !== boardId) return b;
        return {
          ...b,
          cards: b.cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)),
        };
      }),
    }));
  };

  const moveCard = (boardId: string, cardId: string, targetColumnId: string, targetIndex?: number) => {
    setState((prev) => {
      const board = prev.boards.find((b) => b.id === boardId);
      if (!board) return prev;

      const cardToMove = board.cards.find((c) => c.id === cardId);
      if (!cardToMove) return prev;

      // Filter out card being moved
      const otherCards = board.cards.filter((c) => c.id !== cardId);

      // Create new card instance with target column ID
      const updatedCard = { ...cardToMove, columnId: targetColumnId };

      let newCards = [...otherCards];
      if (targetIndex !== undefined) {
        // Find positions of cards inside the target column
        const columnCards = otherCards.filter((c) => c.columnId === targetColumnId);
        const nonColumnCards = otherCards.filter((c) => c.columnId !== targetColumnId);
        
        const updatedColumnCards = [...columnCards];
        updatedColumnCards.splice(targetIndex, 0, updatedCard);
        
        newCards = [...nonColumnCards, ...updatedColumnCards];
      } else {
        newCards.push(updatedCard);
      }

      return {
        ...prev,
        boards: prev.boards.map((b) => (b.id === boardId ? { ...b, cards: newCards } : b)),
      };
    });
  };

  const deleteCard = (boardId: string, cardId: string) => {
    setState((prev) => ({
      ...prev,
      boards: prev.boards.map((b) => {
        if (b.id !== boardId) return b;
        return {
          ...b,
          cards: b.cards.filter((c) => c.id !== cardId),
        };
      }),
      timer: {
        ...prev.timer,
        linkedCardId: prev.timer.linkedCardId === cardId ? null : prev.timer.linkedCardId,
      },
    }));
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setState((prev) => {
      const updatedSettings = { ...prev.settings, ...newSettings };
      let newRemaining = prev.timer.remainingTime;
      
      // If timer is not running, reset remaining time to the new focus duration
      if (!prev.timer.isRunning) {
        if (prev.timer.sessionType === 'focus') {
          newRemaining = updatedSettings.pomodoroFocusTime * 60;
        } else if (prev.timer.sessionType === 'shortBreak') {
          newRemaining = updatedSettings.pomodoroBreakTime * 60;
        } else {
          newRemaining = updatedSettings.pomodoroLongBreakTime * 60;
        }
      }

      return {
        ...prev,
        settings: updatedSettings,
        timer: {
          ...prev.timer,
          remainingTime: newRemaining,
        },
      };
    });
  };

  const startTimer = () => {
    setState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        isRunning: true,
        lastUpdated: Date.now(),
      },
    }));
  };

  const pauseTimer = () => {
    setState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        isRunning: false,
        lastUpdated: null,
      },
    }));
  };

  const resetTimer = () => {
    setState((prev) => {
      let resetRemaining = prev.settings.pomodoroFocusTime * 60;
      if (prev.timer.sessionType === 'shortBreak') {
        resetRemaining = prev.settings.pomodoroBreakTime * 60;
      } else if (prev.timer.sessionType === 'longBreak') {
        resetRemaining = prev.settings.pomodoroLongBreakTime * 60;
      }
      return {
        ...prev,
        timer: {
          ...prev.timer,
          isRunning: false,
          remainingTime: resetRemaining,
          lastUpdated: null,
        },
      };
    });
  };

  const skipTimer = () => {
    setState((prev) => {
      let nextSession: SessionType = 'focus';
      let nextRemaining = prev.settings.pomodoroFocusTime * 60;

      if (prev.timer.sessionType === 'focus') {
        nextSession = 'shortBreak';
        nextRemaining = prev.settings.pomodoroBreakTime * 60;
      } else {
        nextSession = 'focus';
        nextRemaining = prev.settings.pomodoroFocusTime * 60;
      }

      return {
        ...prev,
        timer: {
          ...prev.timer,
          isRunning: false,
          remainingTime: nextRemaining,
          sessionType: nextSession,
          lastUpdated: null,
        },
      };
    });
  };

  const linkCardToTimer = (cardId: string | null) => {
    setState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        linkedCardId: cardId,
      },
    }));
  };

  return (
    <AppContext.Provider
      value={{
        state,
        setActiveView,
        setActiveBoardId,
        createBoard,
        deleteBoard,
        updateBoardTitle,
        addColumn,
        updateColumnTitle,
        deleteColumn,
        addCard,
        updateCard,
        moveCard,
        deleteCard,
        updateSettings,
        startTimer,
        pauseTimer,
        resetTimer,
        skipTimer,
        linkCardToTimer,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
};
