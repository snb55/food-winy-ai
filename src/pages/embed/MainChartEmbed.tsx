/**
 * Main Chart Embed Page
 *
 * Public embed page for the daily macros line chart.
 * Renders only the chart component optimized for iframe embedding.
 */

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
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
import EmbedLayout from './EmbedLayout';
import { fetchEmbedData } from '../../services/embed';
import { aggregateDailyMacros } from '../../utils/dashboardData';
import type { FoodEntry } from '../../types';
import '../../components/Dashboard.css';

export default function MainChartEmbed() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<FoodEntry[]>([]);

  useEffect(() => {
    if (!token) {
      setError('Invalid embed URL');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const data = await fetchEmbedData(token, 'main-chart');
        setEntries(data.entries);
      } catch (err: any) {
        console.error('Error loading embed data:', err);
        setError(err.message || 'Failed to load chart');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Auto-refresh every 5 minutes
    const refreshInterval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [token]);

  const dailyData = useMemo(() => {
    return aggregateDailyMacros(entries, 7);
  }, [entries]);

  if (loading) {
    return (
      <EmbedLayout>
        <div className="embed-loading">Loading chart...</div>
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
    <EmbedLayout title="Daily Macros">
      <div className="chart-container" style={{ width: '100%', padding: '1rem' }}>
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
              <Line
                type="monotone"
                dataKey="calories"
                stroke="#000000"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Calories"
              />
              <Line
                type="monotone"
                dataKey="protein"
                stroke="#666666"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Protein (g)"
              />
              <Line
                type="monotone"
                dataKey="carbs"
                stroke="#999999"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Carbs (g)"
              />
              <Line
                type="monotone"
                dataKey="fat"
                stroke="#cccccc"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Fat (g)"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty">
            <p>No data to display</p>
          </div>
        )}
      </div>
    </EmbedLayout>
  );
}

