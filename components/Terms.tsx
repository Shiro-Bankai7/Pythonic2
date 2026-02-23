import React from 'react';
import SEO from './SEO';

const Terms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 prose prose-invert">
      <SEO
        title="Terms of Service"
        description="Review the terms and conditions for using the Pythonic Journey platform."
        canonical="/terms"
      />
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <p className="text-sm text-slate-400">Last Updated: February 23, 2025</p>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
        <p>
          By accessing or using the Pythonic Journey platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
        <p>
          Permission is granted to temporarily use the materials (information or software) on Pythonic Journey for personal, non-commercial transitory viewing and learning only.
        </p>
        <p>You may not:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Modify or copy the materials.</li>
          <li>Use the materials for any commercial purpose.</li>
          <li>Attempt to decompile or reverse engineer any software contained on the platform.</li>
          <li>Remove any copyright or other proprietary notations from the materials.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
        <p>
          To access certain features, you must create an account via Google Sign-In. You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. We reserve the right to terminate accounts that violate these terms.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">4. Code Submissions</h2>
        <p>
          When you submit code on our platform, you retain ownership of your work, but you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and process your code for the purpose of providing feedback and improving our learning algorithms.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">5. Disclaimer</h2>
        <p>
          The materials on Pythonic Journey are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">6. Limitations</h2>
        <p>
          In no event shall Pythonic Journey or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the platform.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">7. Governing Law</h2>
        <p>
          These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which the platform operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
        </p>
      </section>
    </div>
  );
};

export default Terms;
