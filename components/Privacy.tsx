import React from 'react';
import { Link } from 'react-router-dom';
import SEO from './SEO';

const Privacy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 prose prose-invert">
      <SEO
        title="Privacy Policy"
        description="Read our privacy policy to understand how we handle your data and protect your privacy."
        canonical="/privacy"
      />
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-sm text-slate-400">Last Updated: February 23, 2025</p>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
        <p>
          Welcome to Pythonic Journey ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website and use our interactive learning platform.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
        <p>
          We collect personal information that you voluntarily provide to us when you register on the platform, such as:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Account Information:</strong> Name, email address, and profile picture (via Google Sign-In).</li>
          <li><strong>Usage Data:</strong> Information about your progress, completed lessons, streak data, and code submissions.</li>
          <li><strong>Technical Data:</strong> IP address, browser type, and device information collected via cookies and analytics.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
        <p>
          We use the collected information for various purposes:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>To provide and maintain our Service.</li>
          <li>To track your learning progress and reward XP/coins.</li>
          <li>To improve our platform and user experience.</li>
          <li>To communicate with you regarding updates or support.</li>
          <li>To display your username on public leaderboards (if opted in).</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services</h2>
        <p>
          We use third-party services to enhance our platform:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Supabase:</strong> For authentication and database management.</li>
          <li><strong>Google AdSense:</strong> To serve advertisements (see "Advertising" below).</li>
          <li><strong>Vercel Analytics:</strong> To understand site traffic.</li>
          <li><strong>Gemini AI:</strong> To provide automated code review and hints.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">5. Advertising</h2>
        <p>
          We use Google AdSense to serve ads on our site. Google use cookies to serve ads based on a user's prior visits to our website or other websites. Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our sites and/or other sites on the Internet.
        </p>
        <p>
          You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-blue-400">Ads Settings</a>.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
        <p>
          We implement appropriate technical and organizational security measures to protect the security of any personal information we process. However, please remember that no method of transmission over the internet is 100% secure.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
        <p>
          Depending on your location, you may have rights regarding your personal data, including the right to access, correct, or delete your information. You can manage your profile data within the app settings.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
        <p>
          If you have questions or comments about this policy, you may email us at <span className="text-blue-400">privacy@pythonicjourney.com</span> or via our <Link to="/contact" className="text-blue-400">Contact Page</Link>.
        </p>
      </section>
    </div>
  );
};

export default Privacy;
