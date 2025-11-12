/**
 * Privacy Policy Page
 */

import { useNavigate } from 'react-router-dom';
import './Legal.css';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="legal-container">
      <header className="legal-header">
        <button onClick={() => navigate('/')} className="back-btn">
          ← Back to Home
        </button>
      </header>

      <main className="legal-main">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last Updated: January 2025</p>

        <section className="legal-section">
          <h2>1. Introduction</h2>
          <p>
            Welcome to food.winy.ai ("we," "our," or "us"). This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you use our food tracking application.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Information We Collect</h2>
          <h3>2.1 Information You Provide</h3>
          <ul>
            <li><strong>Account Information:</strong> Email address and authentication credentials</li>
            <li><strong>Food Entries:</strong> Meal descriptions, photos, and nutritional data you log</li>
            <li><strong>Notion Integration:</strong> API keys or OAuth tokens to connect your Notion workspace</li>
            <li><strong>Settings:</strong> Your preferences, goals, and dashboard configurations</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <ul>
            <li><strong>Usage Data:</strong> How you interact with our service</li>
            <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
            <li><strong>Cookies:</strong> Session cookies for authentication</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. How We Use Your Information</h2>
          <ul>
            <li>Provide and maintain our food tracking service</li>
            <li>Process and analyze your food entries using AI</li>
            <li>Sync data with your Notion workspace</li>
            <li>Send service-related notifications</li>
            <li>Improve and optimize our application</li>
            <li>Ensure security and prevent fraud</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Data Storage and Security</h2>
          <p>
            Your data is stored using Firebase (Google Cloud Platform) with industry-standard encryption:
          </p>
          <ul>
            <li><strong>Firebase Authentication:</strong> Secure user authentication</li>
            <li><strong>Cloud Firestore:</strong> Encrypted database storage</li>
            <li><strong>Cloud Storage:</strong> Secure photo storage</li>
            <li><strong>Notion API:</strong> Your Notion data syncs directly to your workspace</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul>
            <li><strong>Firebase (Google):</strong> Authentication, database, and hosting</li>
            <li><strong>Notion API:</strong> To sync your food entries to Notion</li>
            <li><strong>Google Gemini AI:</strong> To analyze food photos and extract nutritional data</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. Data Sharing and Disclosure</h2>
          <p>We do not sell your personal information. We may share your data only in these cases:</p>
          <ul>
            <li><strong>With Your Consent:</strong> When you authorize Notion integration</li>
            <li><strong>Service Providers:</strong> Firebase, Notion, and Google Gemini for core functionality</li>
            <li><strong>Legal Requirements:</strong> If required by law or to protect our rights</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and data</li>
            <li>Export your data</li>
            <li>Opt-out of communications</li>
          </ul>
          <p>To exercise these rights, contact us at <a href="mailto:privacy@winy.ai">privacy@winy.ai</a></p>
        </section>

        <section className="legal-section">
          <h2>8. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. If you delete your account,
            we will delete your data within 30 days, except where required by law.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Children's Privacy</h2>
          <p>
            Our service is not intended for children under 13. We do not knowingly collect
            information from children under 13.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant
            changes by email or through the application.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at:
          </p>
          <p>
            Email: <a href="mailto:privacy@winy.ai">privacy@winy.ai</a><br />
            Website: <a href="https://winy.ai" target="_blank" rel="noopener noreferrer">winy.ai</a>
          </p>
        </section>
      </main>
    </div>
  );
}
