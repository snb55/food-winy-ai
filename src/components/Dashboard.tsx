/**
 * Dashboard Component
 *
 * Mobile-optimized dashboard showing macro trends and goal progress.
 * Displays a multi-line chart for daily macros and progress bars for goals/streaks.
 */

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { FoodEntry, DatabaseSchema, UserSettings } from '../types';
import {
  aggregateDailyMacros,
  getCurrentDayTotal,
  calculateStreak,
  calculateCalorieStreak,
  getCalorieLimit,
} from '../utils/dashboardData';
import './Dashboard.css';

interface DashboardProps {
  entries: FoodEntry[];
  schema: DatabaseSchema | null;
  settings?: UserSettings | null;
}

export default function Dashboard({ entries, schema, settings }: DashboardProps) {
  // Get goal configuration from settings (with defaults)
  const goalField = settings?.goalField || 'protein';
  const goalValue = settings?.proteinGoal || 150;
  const calorieLimit = getCalorieLimit(settings?.calorieLimit);
  
  // Get visibility settings (default to all visible)
  const visibility = settings?.dashboardVisibility || {
    mainChart: true,
    proteinGoal: true,
    calorieLimit: true,
    proteinStreak: true,
    calorieStreak: true,
  };

  // Filter state for which macros to show
  const [visibleMacros, setVisibleMacros] = useState({
    calories: true,
    protein: true,
    carbs: true,
    fat: true,
  });

  // Aggregate daily macro data for chart
  const dailyData = useMemo(() => {
    const data = aggregateDailyMacros(entries, 7); // Last 7 days
    console.log('Dashboard - entries:', entries);
    console.log('Dashboard - dailyData:', data);
    console.log('Dashboard - schema:', schema);
    return data;
  }, [entries, schema]);

  // Get current day's total for goal field
  const currentTotal = useMemo(() => {
    return getCurrentDayTotal(entries, goalField);
  }, [entries, goalField]);

  // Calculate streaks
  const proteinStreak = useMemo(() => {
    return calculateStreak(entries, goalField, goalValue);
  }, [entries, goalField, goalValue]);

  const calorieStreak = useMemo(() => {
    return calculateCalorieStreak(entries, calorieLimit);
  }, [entries, calorieLimit]);
  
  // Get current day calorie total
  const currentCalories = useMemo(() => {
    return getCurrentDayTotal(entries, 'calories');
  }, [entries]);
  
  // Calorie limit progress (shows how close to limit)
  const calorieProgress = calorieLimit > 0 
    ? Math.min((currentCalories / calorieLimit) * 100, 100) 
    : 0;
  const overLimit = currentCalories > calorieLimit;

  // Calculate goal progress percentage
  const goalProgress = goalValue > 0 ? Math.min((currentTotal / goalValue) * 100, 100) : 0;

  // Get field name for display
  const goalFieldName = useMemo(() => {
    if (!schema) return 'Protein';
    const field = schema.fields.find((f) => f.id === goalField);
    return field?.name || 'Protein';
  }, [schema, goalField]);

  // Get unit for goal field
  const goalUnit = useMemo(() => {
    if (!schema) return 'g';
    const field = schema.fields.find((f) => f.id === goalField);
    return field?.unit || 'g';
  }, [schema, goalField]);

  // Show empty state if no entries
  if (entries.length === 0) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-empty">
          <p>No entries yet. Start logging to see your progress!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Multi-line Chart Section */}
      {visibility.mainChart && (
      <div className="dashboard-section">
        <div className="dashboard-header-with-filter">
          <h2 className="dashboard-title">Daily Macros</h2>
          {/* Macro Filter Toggles */}
          <div className="macro-filters">
            <label className="macro-filter-item">
              <input
                type="checkbox"
                checked={visibleMacros.calories}
                onChange={(e) =>
                  setVisibleMacros({ ...visibleMacros, calories: e.target.checked })
                }
              />
              <span className="filter-label">Calories</span>
            </label>
            <label className="macro-filter-item">
              <input
                type="checkbox"
                checked={visibleMacros.protein}
                onChange={(e) =>
                  setVisibleMacros({ ...visibleMacros, protein: e.target.checked })
                }
              />
              <span className="filter-label">Protein</span>
            </label>
            <label className="macro-filter-item">
              <input
                type="checkbox"
                checked={visibleMacros.carbs}
                onChange={(e) =>
                  setVisibleMacros({ ...visibleMacros, carbs: e.target.checked })
                }
              />
              <span className="filter-label">Carbs</span>
            </label>
            <label className="macro-filter-item">
              <input
                type="checkbox"
                checked={visibleMacros.fat}
                onChange={(e) =>
                  setVisibleMacros({ ...visibleMacros, fat: e.target.checked })
                }
              />
              <span className="filter-label">Fat</span>
            </label>
          </div>
        </div>
        <div className="chart-container">
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis
                  dataKey="dateLabel"
                  stroke="#666666"
                  fontSize={12}
                  tick={{ fill: '#666666' }}
                />
                <YAxis
                  stroke="#666666"
                  fontSize={12}
                  tick={{ fill: '#666666' }}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  iconType="line"
                />
                {visibleMacros.calories && (
                  <Line
                    type="monotone"
                    dataKey="calories"
                    stroke="#000000"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Calories"
                  />
                )}
                {visibleMacros.protein && (
                  <Line
                    type="monotone"
                    dataKey="protein"
                    stroke="#666666"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Protein (g)"
                  />
                )}
                {visibleMacros.carbs && (
                  <Line
                    type="monotone"
                    dataKey="carbs"
                    stroke="#999999"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Carbs (g)"
                  />
                )}
                {visibleMacros.fat && (
                  <Line
                    type="monotone"
                    dataKey="fat"
                    stroke="#cccccc"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Fat (g)"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">
              <p>
                {entries.length > 0
                  ? 'No macro data found in entries. Make sure entries have calories, protein, carbs, or fat.'
                  : 'No data to display'}
              </p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Progress Bars Section */}
      <div className="dashboard-section">
        {/* Protein Goal Progress Bar */}
        {visibility.proteinGoal && (
        <div className="progress-card">
          <div className="progress-header">
            <span className="progress-label">{goalFieldName} Goal</span>
            <span className="progress-value">
              {Math.round(currentTotal)}{goalUnit} / {Math.round(goalValue)}{goalUnit}
            </span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          <div className="progress-percentage">
            {Math.round(goalProgress)}%
          </div>
        </div>
        )}

        {/* Calorie Limit Progress Bar */}
        {visibility.calorieLimit && calorieLimit > 0 && (
        <div className="progress-card">
          <div className="progress-header">
            <span className="progress-label">Calorie Limit</span>
            <span className="progress-value">
              {Math.round(currentCalories)} / {Math.round(calorieLimit)} kcal
            </span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ 
                width: `${calorieProgress}%`,
                backgroundColor: overLimit ? '#ff4444' : '#000000'
              }}
            />
          </div>
          <div className="progress-percentage">
            {overLimit ? (
              <span style={{ color: '#ff4444' }}>
                {Math.round(currentCalories - calorieLimit)} over limit
              </span>
            ) : (
              <span>{Math.round(calorieLimit - currentCalories)} remaining</span>
            )}
          </div>
        </div>
        )}

        {/* Protein Streak Counter Bar */}
        {visibility.proteinStreak && (
        <div className="progress-card">
          <div className="progress-header">
            <span className="progress-label">
              {proteinStreak > 0 ? '🔥' : '📅'} {proteinStreak > 0 ? `${proteinStreak} day streak` : 'No streak yet'}
            </span>
            <span className="progress-value">
              {proteinStreak > 0 ? 'Keep it up!' : 'Start logging daily'}
            </span>
          </div>
          <div className="streak-indicator">
            <div
              className="streak-bar"
              style={{ width: proteinStreak > 0 ? '100%' : '0%' }}
            />
          </div>
        </div>
        )}

        {/* Calorie Streak Counter Bar */}
        {visibility.calorieStreak && calorieLimit > 0 && (
        <div className="progress-card">
          <div className="progress-header">
            <span className="progress-label">
              {calorieStreak > 0 ? '🔥' : '📅'} {calorieStreak > 0 ? `${calorieStreak} day streak` : 'No streak yet'}
            </span>
            <span className="progress-value">
              {calorieStreak > 0 ? 'Keep it up!' : 'Stay under limit daily'}
            </span>
          </div>
          <div className="streak-indicator">
            <div
              className="streak-bar"
              style={{ width: calorieStreak > 0 ? '100%' : '0%' }}
            />
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

