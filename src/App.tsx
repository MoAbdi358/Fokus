import React, { useState } from 'react';
import { AppProvider, useAppState } from './store';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BoardView } from './components/BoardView';
import { PomodoroPanel } from './components/PomodoroPanel';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { CardModal } from './components/CardModal';
import type { Card } from './types';

const AppContent: React.FC = () => {
  const { state, setActiveView } = useAppState();
  const [isPomodoroPanelOpen, setIsPomodoroPanelOpen] = useState(true); // Default open to match the layout mock
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const togglePomodoroPanel = () => {
    setIsPomodoroPanelOpen(!isPomodoroPanelOpen);
  };

  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
  };

  // Render view based on sidebar selection
  const renderMainView = () => {
    switch (state.activeView) {
      case 'boards':
        return <BoardView onCardClick={handleCardClick} />;
      case 'analytics':
        return <AnalyticsView />;
      case 'pomodoro':
        // Clicking Pomodoro in navigation will open it floating on the board
        // and switch view to Board if not already there, or we can just focus the board
        return <BoardView onCardClick={handleCardClick} />;
      case 'settings':
        return <SettingsView />;
      default:
        return <BoardView onCardClick={handleCardClick} />;
    }
  };

  // If sidebar nav is clicked for 'pomodoro', open the floating panel and switch to boards
  React.useEffect(() => {
    if (state.activeView === 'pomodoro') {
      setIsPomodoroPanelOpen(true);
      setActiveView('boards');
    }
  }, [state.activeView]);

  // Find updated card data for modal if it was modified (e.g. time spent ticked)
  const getSelectedCardData = (): Card | null => {
    if (!selectedCard) return null;
    const activeBoard = state.boards.find((b) => b.id === state.activeBoardId);
    return activeBoard?.cards.find((c) => c.id === selectedCard.id) || null;
  };

  const currentCardForModal = getSelectedCardData();

  return (
    <div className="app-container">
      {/* Ambient Animated Gradient Blobs */}
      <div className="ambient-bg">
        <div className="bg-blob bg-blob-1"></div>
        <div className="bg-blob bg-blob-2"></div>
        <div className="bg-blob bg-blob-3"></div>
      </div>

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Workspace */}
      <main className="main-content">
        <Header
          togglePomodoroPanel={togglePomodoroPanel}
          isPomodoroPanelOpen={isPomodoroPanelOpen}
        />

        {/* View render */}
        {renderMainView()}

        {/* Floating Pomodoro Overlay */}
        {isPomodoroPanelOpen && (
          <PomodoroPanel onClose={() => setIsPomodoroPanelOpen(false)} />
        )}

        {/* Edit Card Details Modal */}
        {currentCardForModal && (
          <CardModal
            card={currentCardForModal}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
