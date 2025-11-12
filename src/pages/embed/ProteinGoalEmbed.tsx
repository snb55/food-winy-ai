/**
 * Protein Goal Embed Page
 *
 * Public embed page for protein goal progress bar.
 */

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import EmbedLayout from './EmbedLayout';
import { fetchEmbedData } from '../../services/embed';
import { getCurrentDayTotal } from '../../utils/dashboardData';
import type { FoodEntry, DatabaseSchema } from '../../types';
import '../../components/Dashboard.css';

export default function ProteinGoalEmbed() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [goalValue, setGoalValue] = useState(150);
  const [goalField, setGoalField] = useState('protein');

  useEffect(() => {
    if (!token) {
      setError('Invalid embed URL');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const data = await fetchEmbedData(token, 'protein-goal');
        setEntries(data.entries);
        setSchema(data.schema);
        setGoalValue(data.settings.proteinGoal || 150);
        setGoalField(data.settings.goalField || 'protein');
      } catch (err: any) {
        console.error('Error loading embed data:', err);
        setError(err.message || 'Failed to load chart');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const refreshInterval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [token]);

  const currentTotal = useMemo(() => {
    return getCurrentDayTotal(entries, goalField);
  }, [entries, goalField]);

  const goalProgress = goalValue > 0 ? Math.min((currentTotal / goalValue) * 100, 100) : 0;

  const goalFieldName = useMemo(() => {
    if (!schema) return 'Protein';
    const field = schema.fields.find((f) => f.id === goalField);
    return field?.name || 'Protein';
  }, [schema, goalField]);

  const goalUnit = useMemo(() => {
    if (!schema) return 'g';
    const field = schema.fields.find((f) => f.id === goalField);
    return field?.unit || 'g';
  }, [schema, goalField]);

  if (loading) {
    return (
      <EmbedLayout>
        <div className="embed-loading">Loading...</div>
      </EmbedLayout>
    );
  }

  if (error) {
    return (
      <EmbedLayout>
        <div className="embed-error">{error}</div>
      </EmbedLayout>
    );
  }

  return (
    <EmbedLayout title={`${goalFieldName} Goal`}>
      <div className="progress-card" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
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
    </EmbedLayout>
  );
}

