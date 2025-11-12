/**
 * Calorie Limit Embed Page
 *
 * Public embed page for calorie limit progress bar.
 */

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import EmbedLayout from './EmbedLayout';
import { fetchEmbedData } from '../../services/embed';
import { getCurrentDayTotal } from '../../utils/dashboardData';
import '../../components/Dashboard.css';

export default function CalorieLimitEmbed() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [calorieLimit, setCalorieLimit] = useState(2000);

  useEffect(() => {
    if (!token) {
      setError('Invalid embed URL');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const data = await fetchEmbedData(token, 'calorie-limit');
        setEntries(data.entries);
        setCalorieLimit(data.settings.calorieLimit || 2000);
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
    return getCurrentDayTotal(entries, 'calories');
  }, [entries]);

  // For calorie limit, show how much remains (or how much over)
  const remaining = Math.max(0, calorieLimit - currentTotal);
  const overLimit = currentTotal > calorieLimit ? currentTotal - calorieLimit : 0;
  const progress = calorieLimit > 0 
    ? Math.min((currentTotal / calorieLimit) * 100, 100) 
    : 0;

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
    <EmbedLayout title="Calorie Limit">
      <div className="progress-card" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
        <div className="progress-header">
          <span className="progress-label">Calorie Limit</span>
          <span className="progress-value">
            {Math.round(currentTotal)} / {Math.round(calorieLimit)} kcal
          </span>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ 
              width: `${progress}%`,
              backgroundColor: overLimit > 0 ? '#ff4444' : '#000000'
            }}
          />
        </div>
        <div className="progress-percentage">
          {overLimit > 0 ? (
            <span style={{ color: '#ff4444' }}>
              {Math.round(overLimit)} over limit
            </span>
          ) : (
            <span>{Math.round(remaining)} remaining</span>
          )}
        </div>
      </div>
    </EmbedLayout>
  );
}

