import React from 'react';
import { ArrowLeft } from 'lucide-react';

export function TermsConditions({ onBack }) {
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
          <h1 className="text-xl font-bold text-white">Terms & Conditions</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <p className="text-sm text-gray-500">Effective Date: {effectiveDate}</p>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">1. Agreement to Terms</h2>
          <p>
            By accessing or using MOTUS ("the App"), you agree to be bound by these Terms
            and Conditions ("Terms"). If you do not agree to these Terms, please do not
            use the App. These Terms constitute a legally binding agreement between you
            and MOTUS.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">2. Description of Service</h2>
          <p>
            MOTUS is a fitness and nutrition application that provides personalized workout
            programs, meal planning, macro tracking, and integration with third-party fitness
            platforms. The App is designed to help users achieve their fitness and health goals.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">3. User Accounts</h2>

          <h3 className="text-md font-medium text-gray-200">3.1 Account Creation</h3>
          <p>
            To use certain features of the App, you must create an account. You agree to
            provide accurate, current, and complete information during registration and to
            update such information to keep it accurate.
          </p>

          <h3 className="text-md font-medium text-gray-200">3.2 Account Security</h3>
          <p>
            You are responsible for safeguarding your account credentials and for all
            activities that occur under your account. You agree to notify us immediately
            of any unauthorized use of your account.
          </p>

          <h3 className="text-md font-medium text-gray-200">3.3 Account Termination</h3>
          <p>
            We reserve the right to suspend or terminate your account at any time for
            violation of these Terms or for any other reason at our sole discretion.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">4. Subscription and Payments</h2>

          <h3 className="text-md font-medium text-gray-200">4.1 Subscription Plans</h3>
          <p>
            MOTUS offers subscription-based access to premium features. Subscription fees
            and billing cycles are displayed in the App before purchase.
          </p>

          <h3 className="text-md font-medium text-gray-200">4.2 Automatic Renewal</h3>
          <p>
            Subscriptions automatically renew unless cancelled at least 24 hours before
            the end of the current billing period. You can manage or cancel your subscription
            through your account settings.
          </p>

          <h3 className="text-md font-medium text-gray-200">4.3 Refunds</h3>
          <p>
            Refund requests are handled on a case-by-case basis. Please contact our support
            team for assistance with refund requests.
          </p>

          <h3 className="text-md font-medium text-gray-200">4.4 Price Changes</h3>
          <p>
            We reserve the right to change subscription prices. Any price changes will be
            communicated to you in advance and will take effect at the start of your next
            billing cycle.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Use the App for any unlawful purpose</li>
            <li>Share your account credentials with others</li>
            <li>Attempt to reverse engineer or decompile the App</li>
            <li>Interfere with or disrupt the App's functionality</li>
            <li>Use automated systems to access the App without permission</li>
            <li>Upload malicious code or content</li>
            <li>Impersonate another person or entity</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">6. Health and Fitness Disclaimer</h2>
          <div className="p-4 bg-accent-warning/10 border border-accent-warning/30 rounded-lg">
            <p className="text-accent-warning font-medium mb-2">Important Health Notice</p>
            <p>
              MOTUS is not a medical service and does not provide medical advice. The workout
              programs, nutrition recommendations, and other content provided through the App
              are for informational purposes only and should not be considered medical advice.
            </p>
          </div>
          <p className="mt-4">
            Before starting any exercise program or making significant changes to your diet,
            you should consult with a qualified healthcare professional, especially if you
            have any pre-existing health conditions, injuries, or concerns.
          </p>
          <p>
            You acknowledge that physical exercise involves inherent risks, including the
            risk of injury or death. You assume full responsibility for any risks, injuries,
            or damages that may result from your use of the App.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">7. Third-Party Integrations</h2>
          <p>
            The App may integrate with third-party services such as Strava, Garmin, Apple
            Health, and Google Fit. Your use of these integrations is subject to the terms
            and privacy policies of those third parties. We are not responsible for the
            practices of third-party services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">8. Intellectual Property</h2>

          <h3 className="text-md font-medium text-gray-200">8.1 Our Content</h3>
          <p>
            The App and its original content, features, and functionality are owned by
            MOTUS and are protected by international copyright, trademark, and other
            intellectual property laws.
          </p>

          <h3 className="text-md font-medium text-gray-200">8.2 Your Content</h3>
          <p>
            You retain ownership of any content you submit to the App (such as workout logs
            and progress photos). By submitting content, you grant us a non-exclusive,
            worldwide, royalty-free license to use, store, and display such content for
            the purpose of providing our services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, MOTUS and its affiliates, officers,
            directors, employees, and agents shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, including loss of profits, data, or
            other intangible losses, resulting from:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Your use or inability to use the App</li>
            <li>Any injuries or health issues arising from workouts or nutrition plans</li>
            <li>Unauthorized access to your data</li>
            <li>Any third-party conduct on the App</li>
            <li>Any errors or omissions in the App's content</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">10. Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold harmless MOTUS and its affiliates from
            any claims, damages, losses, or expenses (including reasonable attorney fees)
            arising from your use of the App, your violation of these Terms, or your violation
            of any rights of another.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">11. Disclaimers</h2>
          <p>
            THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
            EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED,
            ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">12. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of
            the United States, without regard to conflict of law principles. Any disputes
            arising under these Terms shall be resolved in the state or federal courts
            located within the United States.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">13. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify you of
            any material changes by posting the updated Terms in the App or by other means.
            Your continued use of the App after changes constitutes acceptance of the
            modified Terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">14. Severability</h2>
          <p>
            If any provision of these Terms is found to be unenforceable, the remaining
            provisions will continue in full force and effect.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">15. Entire Agreement</h2>
          <p>
            These Terms, together with our Privacy Policy, constitute the entire agreement
            between you and MOTUS regarding your use of the App and supersede any prior
            agreements.
          </p>
        </section>

        <section className="space-y-4 pb-12">
          <h2 className="text-lg font-semibold text-white">16. Contact Us</h2>
          <p>If you have questions about these Terms, please contact us at:</p>
          <p className="text-accent-primary">legal@motusfit.app</p>
        </section>
      </div>
    </div>
  );
}

export default TermsConditions;
