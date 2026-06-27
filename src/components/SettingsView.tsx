import React, { useState } from 'react';
import { useAppState } from '../store';
import { Settings as SettingsIcon, Save } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { state, updateSettings } = useAppState();

  const [focusTime, setFocusTime] = useState(state.settings.pomodoroFocusTime);
  const [breakTime, setBreakTime] = useState(state.settings.pomodoroBreakTime);
  const [longBreakTime, setLongBreakTime] = useState(state.settings.pomodoroLongBreakTime || 15);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      pomodoroFocusTime: Number(focusTime),
      pomodoroBreakTime: Number(breakTime),
      pomodoroLongBreakTime: Number(longBreakTime),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="settings-view">
      <div className="settings-card glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SettingsIcon size={24} style={{ color: 'var(--rust)' }} />
          <h2 className="settings-section-title" style={{ border: 'none', padding: '0', margin: '0', flex: 1 }}>
            Application Settings
          </h2>
        </div>

        <p className="settings-info-text">
          Customize your Pomodoro durations. Changes will take effect immediately. If a focus session is in progress, the active timer will continue running and reset to your new configurations once it completes.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="settings-grid">
            {/* Focus Duration */}
            <div className="form-group">
              <label className="form-label">Focus Duration (mins)</label>
              <input
                type="number"
                min="1"
                max="180"
                className="form-input"
                value={focusTime}
                onChange={(e) => setFocusTime(Number(e.target.value))}
              />
            </div>

            {/* Short Break Duration */}
            <div className="form-group">
              <label className="form-label">Short Break Duration (mins)</label>
              <input
                type="number"
                min="1"
                max="60"
                className="form-input"
                value={breakTime}
                onChange={(e) => setBreakTime(Number(e.target.value))}
              />
            </div>

            {/* Long Break Duration */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Long Break Duration (mins)</label>
              <input
                type="number"
                min="1"
                max="90"
                className="form-input"
                value={longBreakTime}
                onChange={(e) => setLongBreakTime(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px' }}>
            <button type="submit" className="new-board-btn" style={{ width: 'auto', padding: '12px 24px' }}>
              <Save size={16} />
              <span>Save Configurations</span>
            </button>

            {isSaved && (
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a', transition: 'all 0.3s ease' }}>
                Configurations saved successfully!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
