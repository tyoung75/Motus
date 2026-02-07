import React from 'react';
import { ArrowLeft } from 'lucide-react';

export function PrivacyPolicy({ onBack }) {
  const effectiveDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-dark-900 text-gray-300">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-dark-900/95 backdrop-blur-sm border-b border-dark-700">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-xl font-bold text-white">Privacy Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <p className="text-sm text-gray-500">Effective Date: {effectiveDate}</p>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">1. Introduction</h2>
          <p>
            Welcome to MOTUS. We are committed to protecting your privacy and ensuring you
            understand how we collect, use, and safeguard your personal information. This
            Privacy Policy applies to the MOTUS mobile application and related services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">2. Information We Collect</h2>

          <h3 className="text-md font-medium text-gray-200">2.1 Information You Provide Directly</h3>
          <p>When you create an account or use MOTUS, you may provide:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Account information (name, email address, phone number, profile photo)</li>
            <li>Physical characteristics (age, height, weight, gender)</li>
            <li>Fitness goals and preferences</li>
            <li>Dietary preferences and restrictions</li>
            <li>Workout logs and exercise history</li>
            <li>Meal logs and nutrition data</li>
          </ul>

          <h3 className="text-md font-medium text-gray-200">2.2 Information from Third-Party Services</h3>
          <p>With your explicit consent, we may collect data from connected services:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Strava:</strong> Workout activities, exercise data, distance, duration, pace, heart rate</li>
            <li><strong>Garmin:</strong> Activity data, sleep data, heart rate, stress levels, body composition</li>
            <li><strong>Apple Health:</strong> Workouts, steps, heart rate, sleep, nutrition data</li>
            <li><strong>Google Fit:</strong> Activity data, heart rate, nutrition</li>
          </ul>

          <h3 className="text-md font-medium text-gray-200">2.3 Automatically Collected Information</h3>
          <p>We automatically collect:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Device information (device type, operating system, unique identifiers)</li>
            <li>App usage data (features used, time spent, interaction patterns)</li>
            <li>Log data (access times, errors, performance data)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Provide personalized workout programs and meal plans</li>
            <li>Track your fitness progress and nutrition goals</li>
            <li>Calculate caloric needs and macro recommendations</li>
            <li>Sync data across your connected fitness devices</li>
            <li>Improve our services and develop new features</li>
            <li>Send important updates about your account or our services</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">4. How We Share Your Information</h2>
          <p className="font-medium text-accent-primary">We do NOT sell your personal information.</p>
          <p>We may share data with:</p>

          <h3 className="text-md font-medium text-gray-200">4.1 Third-Party Service Providers</h3>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Authentication providers for secure sign-in</li>
            <li>Cloud storage providers for data storage</li>
            <li>Payment processors for subscription management</li>
            <li>Analytics services to improve app performance</li>
          </ul>

          <h3 className="text-md font-medium text-gray-200">4.2 Connected Fitness Platforms</h3>
          <p>
            When you connect Strava, Garmin, or other platforms, data flows bidirectionally
            as authorized by you. Each platform has its own privacy policy governing their
            use of your data.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">5. Data Security</h2>
          <p>We implement industry-standard security measures:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Encryption of data in transit (TLS/SSL) and at rest</li>
            <li>Secure authentication protocols</li>
            <li>Regular security audits and updates</li>
            <li>Access controls limiting who can view your data</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">6. Your Rights and Choices</h2>
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Access your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Delete your account and associated data</li>
            <li>Disconnect third-party services at any time</li>
            <li>Export your data in a portable format</li>
            <li>Opt out of marketing communications</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">7. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active or as needed to
            provide services. Upon account deletion, we will delete or anonymize your
            data within 30 days, except where retention is required by law.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">8. Children's Privacy</h2>
          <p>
            MOTUS is not intended for children under 13 years of age. We do not knowingly
            collect personal information from children under 13. If we learn we have
            collected such information, we will delete it promptly.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">9. International Data Transfers</h2>
          <p>
            Your data may be transferred to and processed in countries other than your own.
            We ensure appropriate safeguards are in place to protect your information in
            compliance with applicable data protection laws.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. We will notify you of material
            changes through the app or via email. Your continued use of MOTUS after changes
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">11. Contact Us</h2>
          <p>If you have questions about this Privacy Policy or our data practices, please contact us at:</p>
          <p className="text-accent-primary">privacy@motusfit.app</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">12. California Privacy Rights (CCPA)</h2>
          <p>
            California residents have additional rights under the CCPA, including the right
            to know what personal information is collected, the right to deletion, and the
            right to opt-out of the sale of personal information. As stated above, we do
            not sell personal information.
          </p>
        </section>

        <section className="space-y-4 pb-12">
          <h2 className="text-lg font-semibold text-white">13. European Privacy Rights (GDPR)</h2>
          <p>
            If you are in the European Economic Area, you have rights under GDPR including
            access, rectification, erasure, restriction, portability, and objection. You may
            also lodge a complaint with your local data protection authority.
          </p>
        </section>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
