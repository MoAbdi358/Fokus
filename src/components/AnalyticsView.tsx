import React from 'react';
import { useAppState } from '../store';
import { Clock, CheckSquare, Award, BarChart2 } from 'lucide-react';
import { formatDuration } from '../utils/time';

export const AnalyticsView: React.FC = () => {
  const { state } = useAppState();

  const activeBoard = state.boards.find((b) => b.id === state.activeBoardId);
  const cards = activeBoard?.cards || [];
  const columns = activeBoard?.columns || [];

  // 1. Total time spent
  const totalSeconds = cards.reduce((acc, card) => acc + card.timeSpentSeconds, 0);

  // 2. Total tasks & completed tasks
  const totalTasks = cards.length;

  // Determine completed column ID
  const doneColumnId = columns.find((col) => {
    const title = col.title.toLowerCase();
    return title.includes('done') || title.includes('shipped') || title.includes('complete');
  })?.id;

  const completedTasks = cards.filter((card) => card.columnId === doneColumnId).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 3. Average time per task (only for tasks that have time tracked)
  const trackedCards = cards.filter((c) => c.timeSpentSeconds > 0);
  const averageSeconds = trackedCards.length > 0
    ? Math.round(trackedCards.reduce((acc, c) => acc + c.timeSpentSeconds, 0) / trackedCards.length)
    : 0;

  // 4. Data for Task Focus Time Chart
  const taskChartData = [...cards]
    .filter((c) => c.timeSpentSeconds > 0)
    .sort((a, b) => b.timeSpentSeconds - a.timeSpentSeconds)
    .slice(0, 5); // top 5 tasks

  const maxTaskSeconds = taskChartData.length > 0 ? Math.max(...taskChartData.map((t) => t.timeSpentSeconds)) : 1;

  // 5. Data for Column Card Count Distribution
  const columnData = columns.map((col) => {
    const colCards = cards.filter((c) => c.columnId === col.id);
    const colTime = colCards.reduce((acc, c) => acc + c.timeSpentSeconds, 0);
    return {
      title: col.title,
      cardCount: colCards.length,
      timeSpent: colTime,
    };
  });

  const maxColumnTime = columnData.length > 0 ? Math.max(...columnData.map((c) => c.timeSpent)) : 1;

  return (
    <div className="analytics-view">
      <div className="stats-grid">
        {/* Stat 1: Total Time */}
        <div className="stat-card glass">
          <div className="stat-icon-wrapper">
            <Clock size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{formatDuration(totalSeconds)}</span>
            <span className="stat-label">Total Focus Time</span>
          </div>
        </div>

        {/* Stat 2: Tasks Completed */}
        <div className="stat-card glass">
          <div className="stat-icon-wrapper">
            <CheckSquare size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{completedTasks} / {totalTasks}</span>
            <span className="stat-label">Tasks Completed</span>
          </div>
        </div>

        {/* Stat 3: Completion Rate */}
        <div className="stat-card glass">
          <div className="stat-icon-wrapper">
            <Award size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{completionRate}%</span>
            <span className="stat-label">Completion Rate</span>
          </div>
        </div>

        {/* Stat 4: Avg Time per Task */}
        <div className="stat-card glass">
          <div className="stat-icon-wrapper">
            <BarChart2 size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{formatDuration(averageSeconds)}</span>
            <span className="stat-label">Avg Focus / Task</span>
          </div>
        </div>
      </div>

      <div className="charts-section">
        {/* Chart 1: Top Tasks by Focus Time */}
        <div className="chart-card glass">
          <h3 className="chart-card-title">Top Tasks by Focus Time</h3>
          {taskChartData.length > 0 ? (
            <div className="chart-list">
              {taskChartData.map((task) => {
                const pct = (task.timeSpentSeconds / maxTaskSeconds) * 100;
                return (
                  <div key={task.id} className="chart-bar-item">
                    <div className="chart-bar-header">
                      <span className="chart-bar-name">{task.title}</span>
                      <span className="chart-bar-value">{formatDuration(task.timeSpentSeconds)}</span>
                    </div>
                    <div className="chart-bar-track">
                      <div className="chart-bar-fill" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty-state">No focus time logged yet. Start working on a task to see metrics!</p>
          )}
        </div>

        {/* Chart 2: Time Distribution by Column */}
        <div className="chart-card glass">
          <h3 className="chart-card-title">Time Spent by Column</h3>
          {totalSeconds > 0 ? (
            <div className="chart-list">
              {columnData.map((col, idx) => {
                const pct = col.timeSpent > 0 ? (col.timeSpent / maxColumnTime) * 100 : 0;
                return (
                  <div key={idx} className="chart-bar-item">
                    <div className="chart-bar-header">
                      <span className="chart-bar-name">
                        {col.title} ({col.cardCount} {col.cardCount === 1 ? 'task' : 'tasks'})
                      </span>
                      <span className="chart-bar-value">{formatDuration(col.timeSpent)}</span>
                    </div>
                    <div className="chart-bar-track">
                      <div
                        className="chart-bar-fill"
                        style={{
                          width: `${pct}%`,
                          backgroundColor:
                            col.title.toLowerCase().includes('done')
                              ? '#16a34a'
                              : col.title.toLowerCase().includes('doing')
                              ? 'var(--rust)'
                              : '#64748b',
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty-state">No time tracked in columns yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
