/**
 * Dashboard Settings Component
 *
 * Allows users to:
 * 1. Toggle visibility of each chart/widget in the main dashboard
 * 2. View and copy embed URLs for each chart for Notion embedding
 */

import { useState } from 'react';
import type { UserSettings, DashboardVisibility, EmbedTokens } from '../types';
import { generateEmbedToken, generateEmbedUrl, type ChartType } from '../utils/embedTokens';
import { saveUserSettings } from '../services/firestore';
import { useToast } from '../hooks/useToast';
import './DashboardSettings.css';

interface DashboardSettingsProps {
  userId: string;
  settings: UserSettings | null;
  onSave: (updatedSettings: UserSettings) => void;
  onClose: () => void;
}

export default function DashboardSettings({
  userId,
  settings,
  onSave,
  onClose,
}: DashboardSettingsProps) {
  const { showToast } = useToast();

  // Default visibility settings (all enabled by default)
  const defaultVisibility: DashboardVisibility = {
    mainChart: true,
    proteinGoal: true,
    calorieLimit: true,
    proteinStreak: true,
    calorieStreak: true,
  };

  const [visibility, setVisibility] = useState<DashboardVisibility>(
    settings?.dashboardVisibility || defaultVisibility
  );

  // Initialize embedTokens - generate for visible charts if they don't exist
  const initializeTokens = () => {
    const existingTokens = settings?.embedTokens || {};
    const initialVisibility = settings?.dashboardVisibility || defaultVisibility;
    const newTokens = { ...existingTokens };

    // Generate tokens for enabled charts that don't have them
    const chartIds: Array<keyof DashboardVisibility> = [
      'mainChart', 'proteinGoal', 'calorieLimit', 'proteinStreak', 'calorieStreak'
    ];

    chartIds.forEach((chartId) => {
      if (initialVisibility[chartId] && !newTokens[chartId]) {
        newTokens[chartId] = generateEmbedToken();
      }
    });

    return newTokens;
  };

  const [embedTokens, setEmbedTokens] = useState<EmbedTokens>(initializeTokens);
  const [saving, setSaving] = useState(false);

  // Chart configuration
  const charts = [
    {
      id: 'mainChart' as const,
      label: 'Main Line Chart',
      description: 'Daily macros over time (calories, protein, carbs, fat)',
      chartType: 'main-chart' as ChartType,
    },
    {
      id: 'proteinGoal' as const,
      label: 'Protein Goal',
      description: 'Progress toward protein goal',
      chartType: 'protein-goal' as ChartType,
    },
    {
      id: 'calorieLimit' as const,
      label: 'Calorie Limit',
      description: 'Progress staying under calorie limit',
      chartType: 'calorie-limit' as ChartType,
    },
    {
      id: 'proteinStreak' as const,
      label: 'Protein Goal Streak',
      description: 'Consecutive days protein goal was reached',
      chartType: 'protein-streak' as ChartType,
    },
    {
      id: 'calorieStreak' as const,
      label: 'Calorie Limit Streak',
      description: 'Consecutive days calorie limit was met',
      chartType: 'calorie-streak' as ChartType,
    },
  ];

  // Generate token for a chart if it doesn't exist
  const ensureToken = (chartId: keyof EmbedTokens) => {
    if (!embedTokens[chartId]) {
      const newToken = generateEmbedToken();
      setEmbedTokens((prev) => ({
        ...prev,
        [chartId]: newToken,
      }));
      return newToken;
    }
    return embedTokens[chartId]!;
  };

  // Handle visibility toggle
  const handleToggle = (chartId: keyof DashboardVisibility) => {
    const newVisibility = { ...visibility, [chartId]: !visibility[chartId] };
    setVisibility(newVisibility);

    // If enabling a chart and it doesn't have a token, generate one
    if (newVisibility[chartId]) {
      const tokenKey = chartId as keyof EmbedTokens;
      if (!embedTokens[tokenKey]) {
        ensureToken(tokenKey);
      }
    }
  };

  // Copy embed URL to clipboard
  const handleCopyUrl = async (chartType: ChartType, token: string) => {
    const url = generateEmbedUrl(chartType, token);
    try {
      await navigator.clipboard.writeText(url);
      showToast('Embed URL copied to clipboard!', 'success');
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('Failed to copy URL', 'error');
    }
  };

  // Save settings
  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      // Ensure all enabled charts have tokens
      const finalTokens = { ...embedTokens };
      charts.forEach((chart) => {
        if (visibility[chart.id]) {
          const tokenKey = chart.id as keyof EmbedTokens;
          if (!finalTokens[tokenKey]) {
            finalTokens[tokenKey] = generateEmbedToken();
          }
        }
      });

      const updatedSettings: UserSettings = {
        ...settings,
        dashboardVisibility: visibility,
        embedTokens: finalTokens,
      };

      await saveUserSettings(userId, updatedSettings);
      onSave(updatedSettings);
      showToast('Dashboard settings saved!', 'success');
    } catch (error: any) {
      console.error('Error saving dashboard settings:', error);
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-settings-modal">
      <div className="dashboard-settings-content">
        <div className="dashboard-settings-header">
          <h2>Dashboard Settings</h2>
          <button onClick={onClose} className="close-btn" title="Close">
            ×
          </button>
        </div>

        <div className="dashboard-settings-body">
          <p className="settings-description">
            Configure which charts appear in your dashboard and get embed URLs
            to share them in Notion.
          </p>

          <div className="charts-list">
            {charts.map((chart) => {
              const isVisible = visibility[chart.id];
              const token = embedTokens[chart.id as keyof EmbedTokens];
              const embedUrl = token
                ? generateEmbedUrl(chart.chartType, token)
                : null;

              return (
                <div key={chart.id} className="chart-setting-item">
                  <div className="chart-setting-header">
                    <div className="chart-toggle">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => handleToggle(chart.id)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <div className="chart-info">
                        <h3 className="chart-label">{chart.label}</h3>
                        <p className="chart-description">{chart.description}</p>
                      </div>
                    </div>
                  </div>

                  {isVisible && (
                    <div className="chart-embed-section">
                      {token ? (
                        <div className="embed-url-container">
                          <label className="embed-url-label">Embed URL:</label>
                          <div className="embed-url-input-group">
                            <input
                              type="text"
                              value={embedUrl || ''}
                              readOnly
                              className="embed-url-input"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyUrl(chart.chartType, token)
                              }
                              className="copy-btn"
                              title="Copy to clipboard"
                            >
                              📋 Copy
                            </button>
                          </div>
                          <p className="embed-url-hint">
                            Paste this URL in Notion to embed the chart
                          </p>
                        </div>
                      ) : (
                        <p className="embed-url-generating">
                          Generating embed URL...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="dashboard-settings-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

