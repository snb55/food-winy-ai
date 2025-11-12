/**
 * Terms of Use Page
 */

import { useNavigate } from 'react-router-dom';
import './Legal.css';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="legal-container">
      <header className="legal-header">
        <button onClick={() => navigate('/')} className="back-btn">
          ← Back to Home
        </button>
      </header>

      <main className="legal-main">
        <h1>Terms of Use</h1>
        <p className="legal-updated">Last Updated: January 2025</p>

        <section className="legal-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using food.winy.ai ("Service"), you accept and agree to be bound by these
            Terms of Use. If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Description of Service</h2>
          <p>
            food.winy.ai is a food tracking application that:
          </p>
          <ul>
            <li>Allows you to log meals and track nutritional data</li>
            <li>Uses AI to analyze food photos and extract macro information</li>
            <li>Syncs your food entries to your Notion workspace</li>
            <li>Provides visualizations and progress tracking</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. User Accounts</h2>
          <h3>3.1 Account Creation</h3>
          <p>
            You must create an account to use the Service. You are responsible for:
          </p>
          <ul>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Providing accurate and complete information</li>
          </ul>

          <h3>3.2 Account Security</h3>
          <p>
            You must immediately notify us of any unauthorized use of your account at{' '}
            <a href="mailto:security@winy.ai">security@winy.ai</a>
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Acceptable Use</h2>
          <h3>4.1 You Agree To:</h3>
          <ul>
            <li>Use the Service for lawful purposes only</li>
            <li>Provide accurate food entry information</li>
            <li>Respect the intellectual property rights of others</li>
            <li>Comply with all applicable laws and regulations</li>
          </ul>

          <h3>4.2 You Agree NOT To:</h3>
          <ul>
            <li>Use the Service to transmit harmful or malicious content</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Use automated tools to access the Service without permission</li>
            <li>Reverse engineer or attempt to extract source code</li>
            <li>Resell or commercially exploit the Service</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Notion Integration</h2>
          <p>
            When you connect your Notion workspace:
          </p>
          <ul>
            <li>You grant us permission to read and write to your specified Notion database</li>
            <li>You are responsible for managing Notion access permissions</li>
            <li>We will only access the database you designate for food tracking</li>
            <li>You can revoke access at any time through Notion or our Settings page</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. AI-Generated Content</h2>
          <p>
            Our AI analyzes your food photos and descriptions to estimate nutritional information:
          </p>
          <ul>
            <li>AI-generated nutritional data is an estimate and may not be 100% accurate</li>
            <li>You should verify nutritional information for critical dietary needs</li>
            <li>We are not liable for decisions made based on AI-generated data</li>
            <li>The Service is not a substitute for professional dietary or medical advice</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>7. Intellectual Property</h2>
          <h3>7.1 Our Content</h3>
          <p>
            The Service, including its design, features, and functionality, is owned by Winy AI
            and protected by copyright, trademark, and other intellectual property laws.
          </p>

          <h3>7.2 Your Content</h3>
          <p>
            You retain ownership of your food entries, photos, and data. By using the Service,
            you grant us a license to:
          </p>
          <ul>
            <li>Process and analyze your content to provide the Service</li>
            <li>Store your content in Firebase and sync to Notion</li>
            <li>Use anonymized, aggregated data to improve the Service</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>8. Fees and Payment</h2>
          <p>
            Currently, food.winy.ai is free to use. We reserve the right to introduce paid features
            or subscription plans in the future. You will be notified of any changes to pricing.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Disclaimers</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.
            We do not guarantee that:
          </p>
          <ul>
            <li>The Service will be uninterrupted or error-free</li>
            <li>AI-generated nutritional data will be completely accurate</li>
            <li>The Service will meet your specific requirements</li>
            <li>Data stored in Notion will be immune to loss or corruption</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>10. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WINY AI SHALL NOT BE LIABLE FOR:
          </p>
          <ul>
            <li>Any indirect, incidental, special, or consequential damages</li>
            <li>Loss of data, profits, or business opportunities</li>
            <li>Damages arising from your use or inability to use the Service</li>
            <li>Health or dietary decisions made based on the Service</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>11. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Winy AI from any claims, damages, or expenses
            arising from your use of the Service or violation of these Terms.
          </p>
        </section>

        <section className="legal-section">
          <h2>12. Termination</h2>
          <p>
            We may terminate or suspend your account and access to the Service:
          </p>
          <ul>
            <li>If you violate these Terms</li>
            <li>If required by law</li>
            <li>For any reason with notice</li>
          </ul>
          <p>
            You may terminate your account at any time through the Settings page.
            Upon termination, your data will be deleted within 30 days.
          </p>
        </section>

        <section className="legal-section">
          <h2>13. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify users of
            significant changes via email or through the application. Continued use of the Service
            after changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section className="legal-section">
          <h2>14. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the
            United States, without regard to conflict of law principles.
          </p>
        </section>

        <section className="legal-section">
          <h2>15. Contact Information</h2>
          <p>
            For questions about these Terms of Use, please contact us at:
          </p>
          <p>
            Email: <a href="mailto:legal@winy.ai">legal@winy.ai</a><br />
            Website: <a href="https://winy.ai" target="_blank" rel="noopener noreferrer">winy.ai</a>
          </p>
        </section>

        <section className="legal-section">
          <h2>16. Severability</h2>
          <p>
            If any provision of these Terms is found to be unenforceable, the remaining provisions
            will continue in full force and effect.
          </p>
        </section>
      </main>
    </div>
  );
}
