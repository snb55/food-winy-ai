/**
 * Pricing Page Component
 *
 * Shows Free (Starter Taste) and Pro plans for food.winy.ai
 */

import { useNavigate } from 'react-router-dom';
import './Pricing.css';

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="pricing-container">
      <header className="pricing-header">
        <div className="pricing-header-content">
          <div className="pricing-logo">
            <img src="/favicon.png" alt="food.winy.ai" className="pricing-logo-img" />
            <span className="pricing-logo-text">food.winy.ai</span>
          </div>
          <nav className="pricing-nav">
            <button className="btn btn-secondary" onClick={() => navigate('/')}>Home</button>
            <button className="btn btn-primary" onClick={() => navigate('/feed')}>Dashboard</button>
          </nav>
        </div>
      </header>

      <section className="pricing-hero">
        <div className="pricing-hero-content">
          <h1 className="pricing-title">Simple, fair pricing</h1>
          <p className="pricing-subtitle">Start free. Upgrade anytime for unlimited tracking and pro features.</p>
        </div>
      </section>

      <section className="pricing-plans">
        <div className="pricing-grid">
          {/* Free Plan */}
          <div className="plan-card">
            <div className="plan-header">
              <h2 className="plan-name">Free</h2>
              <p className="plan-tagline">Track your meals and sync with Notion — for free.</p>
              <div className="plan-price">
                <span className="plan-amount">$0</span>
                <span className="plan-period">/ forever</span>
              </div>
            </div>

            <ul className="plan-features">
              <Feature text="🥗 Tracked meals — Up to 50 meals/month" />
              <Feature text="🧠 AI food insights — Basic (no macros or history analysis)" />
              <Feature text="📸 Image-to-meal recognition — Up to 10 images/month" />
              <Feature text="📊 Charts & analytics — Basic overview chart only" />
              <Feature text="📓 Notion sync — One Notion database connected" />
              <Feature text="🕓 History retention — 30 days" />
              <Feature text="💬 Support — Email only" />
              <Feature text="🚫 Advanced automations — Not included" dim />
              <Feature text="🚫 Custom food databases — Not included" dim />
            </ul>

            <a className="btn btn-secondary plan-cta" href="/?signin=1">Get Started Free</a>
          </div>

          {/* Pro Plan */}
          <div className="plan-card plan-pro">
            <div className="plan-badge">Most Popular</div>
            <div className="plan-header">
              <h2 className="plan-name">Pro</h2>
              <p className="plan-tagline">Unlimited tracking, powerful insights, and pro automations.</p>
              <div className="plan-price">
                <span className="plan-amount">$12</span>
                <span className="plan-period">/ month</span>
              </div>
            </div>

            <ul className="plan-features">
              <Feature text="🥗 Tracked meals — Unlimited" strong />
              <Feature text="🧠 AI food insights — Advanced macros + history analysis" strong />
              <Feature text="📸 Image-to-meal recognition — Unlimited" strong />
              <Feature text="📊 Charts & analytics — Full suite + streaks" strong />
              <Feature text="📓 Notion sync — Unlimited databases" strong />
              <Feature text="🕓 History retention — Unlimited" strong />
              <Feature text="⚙️ Advanced automations — Included" strong />
              <Feature text="🍱 Custom food databases — Included" strong />
              <Feature text="💬 Support — Priority email" />
            </ul>

            <button className="btn btn-primary plan-cta" disabled>Coming soon</button>
          </div>
        </div>
      </section>

      <footer className="pricing-footer">
        <div className="pricing-footer-content">
          <p>&copy; 2025 <a href="https://winy.ai" target="_blank" rel="noopener noreferrer">Winy AI</a>. Built for nutrition tracking.</p>
        </div>
      </footer>
    </div>
  );
}

function Feature({ text, dim, strong }: { text: string; dim?: boolean; strong?: boolean }) {
  return (
    <li className={dim ? 'feature dim' : strong ? 'feature strong' : 'feature'}>
      {text}
    </li>
  );
}


