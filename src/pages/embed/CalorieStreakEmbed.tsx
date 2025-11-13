/**
 * Calorie Streak Embed Page
 *
 * Public embed page for calorie limit streak counter.
 */

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import EmbedLayout from './EmbedLayout';
import { fetchEmbedData } from '../../services/embed';
import { calculateCalorieStreak } from '../../utils/dashboardData';
import '../../components/Dashboard.css';

export default function CalorieStreakEmbed() {
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
        const data = await fetchEmbedData(token, 'calorie-streak');
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
    // Removed auto-refresh polling - data loads from Firestore which is fast
  }, [token]);

  const streak = useMemo(() => {
    return calculateCalorieStreak(entries, calorieLimit);
  }, [entries, calorieLimit]);

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
    <EmbedLayout title="Calorie Limit Streak">
      <div className="progress-card" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
        <div className="progress-header">
          <span className="progress-label">
            {streak > 0 ? '🔥' : '📅'} {streak > 0 ? `${streak} day streak` : 'No streak yet'}
          </span>
          <span className="progress-value">
            {streak > 0 ? 'Keep it up!' : 'Stay under limit daily'}
          </span>
        </div>
        <div className="streak-indicator">
          <div
            className="streak-bar"
            style={{ width: streak > 0 ? '100%' : '0%' }}
          />
        </div>
      </div>
    </EmbedLayout>
  );
}

