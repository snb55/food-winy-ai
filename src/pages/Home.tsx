/**
 * Home Page Component
 *
 * Landing page for food.winy.ai, similar to charts.winy.ai but with food/nutrition tracking theming.
 * Includes hero section, features, embed examples, and how it works sections.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SignInModal from '../components/SignInModal';
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
import type { DailyMacroData } from '../utils/dashboardData';
import './Home.css';

// Sample data for homepage chart examples
const sampleMacroData: DailyMacroData[] = [
  { date: '2025-01-25', dateLabel: 'Jan 25', timestamp: new Date('2025-01-25').getTime(), calories: 1850, protein: 120, carbs: 180, fat: 65 },
  { date: '2025-01-26', dateLabel: 'Jan 26', timestamp: new Date('2025-01-26').getTime(), calories: 2100, protein: 145, carbs: 200, fat: 70 },
  { date: '2025-01-27', dateLabel: 'Jan 27', timestamp: new Date('2025-01-27').getTime(), calories: 1950, protein: 130, carbs: 190, fat: 68 },
  { date: '2025-01-28', dateLabel: 'Jan 28', timestamp: new Date('2025-01-28').getTime(), calories: 2200, protein: 155, carbs: 220, fat: 75 },
  { date: '2025-01-29', dateLabel: 'Jan 29', timestamp: new Date('2025-01-29').getTime(), calories: 2000, protein: 140, carbs: 195, fat: 72 },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showSignIn, setShowSignIn] = useState(false);

  // Redirect to feed if user becomes authenticated
  useEffect(() => {
    if (user) {
      navigate('/feed', { replace: true });
    }
  }, [user, navigate]);

  // Open sign-in modal if URL contains ?signin=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('signin') === '1') {
      setShowSignIn(true);
    }
  }, []);

  const handleGetStarted = () => {
    if (user) {
      navigate('/feed');
    } else {
      setShowSignIn(true);
    }
  };

  return (
    <div className="home-container">
      {/* Header Navigation */}
      <header className="home-header">
        <div className="home-header-content">
          <div className="home-logo">
            <img src="/favicon.png" alt="food.winy.ai" className="home-logo-img" />
            <span className="home-logo-text">food.winy.ai</span>
          </div>
          <nav className="home-nav">
            <a href="/pricing" className="btn btn-secondary home-nav-button">Pricing</a>
            <button
              onClick={handleGetStarted}
              className="btn btn-primary home-nav-button"
            >
              {user ? 'Dashboard' : 'Get Started'}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-logo">
            <img src="/favicon.png" alt="food.winy.ai" width={80} height={80} />
          </div>
          <h1 className="home-hero-title">
            Track Your Nutrition
            <span className="home-hero-title-accent"> Effortlessly</span>
          </h1>
          <p className="home-hero-description">
            Log your meals, track macros, and visualize your nutrition data in Notion.
            AI-powered food tracking that syncs seamlessly with your workspace.
          </p>
          <div className="home-hero-actions">
            <button
              onClick={handleGetStarted}
              className="btn btn-primary home-hero-button"
            >
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="home-features">
        <div className="home-features-content">
          <div className="home-feature-card">
            <div className="home-feature-icon">🍎</div>
            <h3 className="home-feature-title">Easy Food Logging</h3>
            <p className="home-feature-description">
              Log meals naturally with AI-powered parsing. Just describe what you ate and let our AI extract macros automatically.
            </p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">📊</div>
            <h3 className="home-feature-title">Beautiful Charts</h3>
            <p className="home-feature-description">
              Visualize your nutrition data with interactive charts for macros, goals, and streaks. Perfect for tracking progress.
            </p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">🔗</div>
            <h3 className="home-feature-title">Notion Integration</h3>
            <p className="home-feature-description">
              Embed your nutrition charts directly in Notion pages. Your data stays synchronized and always up to date.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section (moved above examples) */}
      <section className="home-how-it-works">
        <div className="home-how-it-works-content">
          <h2 className="home-section-title">How It Works</h2>
          <div className="home-steps">
            <Step number={1} title="Connect to Notion" description="Authenticate with your Notion account and select the database where you want to track your food entries." />
            <Step number={2} title="Log Your Meals" description="Add food entries by describing what you ate. Our AI extracts calories, protein, carbs, and fat automatically." />
            <Step number={3} title="Visualize in Notion" description="Copy embed URLs and paste them into your Notion pages using /embed. Your charts update automatically as you log meals." />
          </div>
        </div>
      </section>

      {/* Chart Examples Section */}
      <section id="examples" className="home-examples">
        <div className="home-examples-content">
          <h2 className="home-section-title">Interactive Chart Examples</h2>
          <p className="home-section-description">
            See how your nutrition data can come to life with beautiful, interactive charts
          </p>

          {/* Main Chart Example */}
          <div className="home-example-card">
            <h3 className="home-example-title">Daily Macros Chart</h3>
            <p className="home-example-description">
              Track your calories, protein, carbs, and fat over time with an intuitive line chart
            </p>
            <div className="home-chart-container">
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={sampleMacroData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                      fontSize: '12px' 
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
                    dot={{ r: 4 }} 
                    name="Calories"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="protein" 
                    stroke="#666666" 
                    strokeWidth={2} 
                    dot={{ r: 4 }} 
                    name="Protein (g)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="carbs" 
                    stroke="#999999" 
                    strokeWidth={2} 
                    dot={{ r: 4 }} 
                    name="Carbs (g)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="fat" 
                    stroke="#cccccc" 
                    strokeWidth={2} 
                    dot={{ r: 4 }} 
                    name="Fat (g)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <EmbedUrlDisplay url="https://food.winy.ai/embed/main-chart/[your-token]" />
          </div>

          {/* Progress Card Examples */}
          <div className="home-example-row">
            <div className="home-example-card-small">
              <h3 className="home-example-title">Protein Goal</h3>
              <div className="home-progress-example">
                <div className="home-progress-header">
                  <span className="home-progress-label">Protein Goal</span>
                  <span className="home-progress-value">125g / 150g</span>
                </div>
                <div className="home-progress-bar-container">
                  <div className="home-progress-bar-fill" style={{ width: '83%' }} />
                </div>
                <div className="home-progress-percentage">83%</div>
              </div>
            </div>

            <div className="home-example-card-small">
              <h3 className="home-example-title">Calorie Limit</h3>
              <div className="home-progress-example">
                <div className="home-progress-header">
                  <span className="home-progress-label">Calorie Limit</span>
                  <span className="home-progress-value">1850 / 2000 kcal</span>
                </div>
                <div className="home-progress-bar-container">
                  <div className="home-progress-bar-fill" style={{ width: '92%' }} />
                </div>
                <div className="home-progress-percentage">150 remaining</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="home-how-it-works">
        <div className="home-how-it-works-content">
          <h2 className="home-section-title">How It Works</h2>
          <div className="home-steps">
            <Step number={1} title="Connect to Notion" description="Authenticate with your Notion account and select the database where you want to track your food entries." />
            <Step number={2} title="Log Your Meals" description="Add food entries by describing what you ate. Our AI extracts calories, protein, carbs, and fat automatically." />
            <Step number={3} title="Visualize in Notion" description="Copy embed URLs and paste them into your Notion pages using /embed. Your charts update automatically as you log meals." />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-content">
          <p className="home-footer-text">
            &copy; 2025 <a href="https://winy.ai" target="_blank" rel="noopener noreferrer" className="home-footer-link">Winy AI</a>. Built for nutrition tracking.
          </p>
        </div>
      </footer>

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        redirectTo="/feed"
      />
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="home-step">
      <div className="home-step-number">{number}</div>
      <div className="home-step-content">
        <h3 className="home-step-title">{title}</h3>
        <p className="home-step-description">{description}</p>
      </div>
    </div>
  );
}

function EmbedUrlDisplay({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="home-embed-display">
      <p className="home-embed-label">Example embed URL:</p>
      <div className="home-embed-row">
        <code className="home-embed-code">{url}</code>
        <button
          onClick={handleCopy}
          className="btn btn-primary home-embed-button"
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
      <p className="home-embed-hint">
        💡 <strong>Embed in Notion:</strong> Type <code>/embed</code> in any Notion page, paste the URL above, and your chart appears instantly!
      </p>
    </div>
  );
}

