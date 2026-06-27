export interface Card {
  id: string;
  columnId: string;
  title: string;
  description: string;
  timeSpentSeconds: number;
  tags: string[];
}

export interface Column {
  id: string;
  title: string;
}

export interface Board {
  id: string;
  title: string;
  columns: Column[];
  cards: Card[];
}

export type ViewType = 'boards' | 'analytics' | 'pomodoro' | 'settings';

export type SessionType = 'focus' | 'shortBreak' | 'longBreak';

export interface TimerState {
  isRunning: boolean;
  remainingTime: number; // in seconds
  sessionType: SessionType;
  linkedCardId: string | null;
  lastUpdated: number | null; // Date.now() timestamp
}

export interface Settings {
  pomodoroFocusTime: number; // in minutes
  pomodoroBreakTime: number; // in minutes
  pomodoroLongBreakTime: number; // in minutes
}

export interface AppState {
  boards: Board[];
  activeBoardId: string;
  activeView: ViewType;
  settings: Settings;
  timer: TimerState;
}
