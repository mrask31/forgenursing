export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-semibold text-[var(--navy)] mb-4">Privacy Policy</h1>
        <p className="text-sm text-[var(--gray-400)] mb-8">Last updated: March 25, 2026</p>

        <div className="bg-white border border-[var(--gray-200)] rounded-xl p-8 shadow-sm space-y-8">
          {/* 1. Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">1. Introduction</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              This Privacy Policy describes how MJR Intelligence Group LLC (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) collects, uses, and protects your personal information when you use ForgeNursing, our AI-powered clinical reasoning tutor for nursing students.
            </p>
            <p className="text-[var(--gray-800)] leading-relaxed">
              By using ForgeNursing, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          {/* 2. Who This Policy Applies To */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">2. Who This Policy Applies To</h2>
            <p className="text-[var(--gray-800)] leading-relaxed">
              ForgeNursing is designed for adult nursing students aged 18 and older. We do not knowingly collect personal information from anyone under the age of 18. If we become aware that a user is under 18, we will terminate their account and delete their data promptly.
            </p>
          </section>

          {/* 3. Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">3. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--gray-800)] mb-2">Account Information</h3>
                <p className="text-[var(--gray-800)] leading-relaxed">
                  When you create an account, we collect your email address, password (stored securely using industry-standard hashing), nursing program type (LPN, ADN, BSN, MSN, or DNP), graduation date, and school name (optional).
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--gray-800)] mb-2">Educational Content</h3>
                <p className="text-[var(--gray-800)] leading-relaxed">
                  You may upload educational materials (PDFs, textbooks, class notes, syllabi) to your account. This content is stored securely and used solely to provide personalized tutoring responses grounded in your curriculum.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--gray-800)] mb-2">Session and Learning Data</h3>
                <p className="text-[var(--gray-800)] leading-relaxed">
                  We collect information about how you interact with ForgeNursing, including chat conversations, study sessions, saved learning moments, and session history. This data is used exclusively to support your learning experience and improve the service.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--gray-800)] mb-2">Subscription and Billing Data</h3>
                <p className="text-[var(--gray-800)] leading-relaxed">
                  We collect subscription status and billing information. Payment processing is handled by Stripe. We do not store your full credit card number — Stripe handles all payment data under their PCI-compliant infrastructure.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--gray-800)] mb-2">Technical Data</h3>
                <p className="text-[var(--gray-800)] leading-relaxed">
                  We automatically collect certain technical information including IP address, browser type, device information, and usage timestamps to ensure service security and functionality.
                </p>
              </div>
            </div>
          </section>

          {/* 4. How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">4. How We Use Your Information</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              We use your data only to support your learning and operate the service. Specifically, we use information to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--gray-800)] leading-relaxed mb-4">
              <li>Provide AI-powered clinical reasoning tutoring and ADPIE-structured responses</li>
              <li>Generate content tailored to your nursing program level and uploaded course materials</li>
              <li>Save your study session history, learning moments, and flagged content</li>
              <li>Manage your subscription and process billing through Stripe</li>
              <li>Send transactional emails (welcome, trial expiration notices, billing receipts)</li>
              <li>Improve our AI systems and educational algorithms</li>
              <li>Ensure platform security and prevent unauthorized access</li>
            </ul>
            <div className="bg-[var(--teal-light)] border border-[var(--teal)]/20 rounded-lg p-4 mb-4">
              <p className="font-semibold text-[var(--navy)]">
                We do not use your data for advertising. We do not sell your personal information. We do not share your data with third parties for marketing purposes.
              </p>
            </div>
          </section>

          {/* 5. AI Provider Disclosure */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">5. AI Provider Disclosure</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--gray-800)] mb-2">Anthropic Claude</h3>
                <p className="text-[var(--gray-800)] leading-relaxed">
                  Primary AI for clinical reasoning tutoring, ADPIE-structured responses, and Socratic learning interactions. When you interact with the ForgeNursing tutor, your messages and relevant uploaded materials are processed by Anthropic&apos;s API to generate educational responses. Anthropic&apos;s use of your data is governed by their privacy policy at{" "}
                  <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#0D8F9C] hover:underline">anthropic.com/privacy</a>.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--gray-800)] mb-2">Google Gemini</h3>
                <p className="text-[var(--gray-800)] leading-relaxed">
                  Used for clinical image analysis (EKG strips, wound photos, lab results) and supporting text features. When you upload a clinical image for analysis, that image is processed by Google&apos;s Gemini API. Google&apos;s use of your data is governed by their privacy policy at{" "}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#0D8F9C] hover:underline">policies.google.com/privacy</a>.
                </p>
              </div>
            </div>
            <p className="text-[var(--gray-800)] leading-relaxed mt-4">
              We implement appropriate contractual safeguards to protect your data during AI processing. However, you acknowledge that data shared with third-party AI providers is subject to their respective privacy practices.
            </p>
          </section>

          {/* 6. Data Storage and Security */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">6. Data Storage and Security</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              We use Supabase for secure cloud data storage. All data is encrypted in transit and at rest using industry-standard encryption protocols. Our security measures include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--gray-800)] leading-relaxed mb-4">
              <li>End-to-end encryption for data in transit (HTTPS/TLS)</li>
              <li>Encryption at rest for all stored data</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security monitoring</li>
            </ul>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              No method of electronic storage is 100% secure. While we implement commercially reasonable security measures, we cannot guarantee absolute security.
            </p>
            <p className="text-[var(--gray-800)] leading-relaxed">
              <span className="font-semibold">Data Breach Notification:</span> In the event of a data breach that compromises your personal information, we will notify affected users and relevant authorities as required by applicable law, typically within 72 hours of becoming aware of the breach.
            </p>
          </section>

          {/* 7. Data Sharing and Disclosure */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">7. Data Sharing and Disclosure</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              We do not sell your personal information. We may share data only in the following limited circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--gray-800)] leading-relaxed mb-4">
              <li><span className="font-semibold">Service Providers:</span> With trusted third-party providers who assist in operating our service (Supabase for storage, Stripe for payments, Anthropic and Google for AI processing, Vercel for hosting), subject to strict confidentiality obligations</li>
              <li><span className="font-semibold">Legal Requirements:</span> When required by law, court order, or governmental authority</li>
              <li><span className="font-semibold">Business Transfers:</span> In connection with a merger, acquisition, or sale of assets, with advance notice to users</li>
              <li><span className="font-semibold">With Your Consent:</span> When you explicitly authorize us to share your information</li>
            </ul>
          </section>

          {/* 8. Your Rights and Choices */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">8. Your Rights and Choices</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--gray-800)] leading-relaxed mb-4">
              <li><span className="font-semibold">Access:</span> Review all personal information associated with your account</li>
              <li><span className="font-semibold">Correct:</span> Update inaccurate or incomplete information through your Settings page</li>
              <li><span className="font-semibold">Delete:</span> Request deletion of your account and all associated data</li>
              <li><span className="font-semibold">Export:</span> Request a copy of your data in a portable format</li>
              <li><span className="font-semibold">Opt Out:</span> Unsubscribe from non-transactional emails at any time</li>
            </ul>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              To exercise these rights, contact us at{" "}
              <a href="mailto:support@forgenursing.com" className="text-[#0D8F9C] hover:underline">support@forgenursing.com</a>. We will respond to your request within 30 days.
            </p>
            <p className="text-[var(--gray-800)] leading-relaxed">
              <span className="font-semibold">California Residents:</span> Under the California Consumer Privacy Act (CCPA), you have additional rights including the right to know what personal information we collect, the right to delete your personal information, and the right to opt out of the sale of personal information (we do not sell personal information). To exercise these rights, contact us at{" "}
              <a href="mailto:support@forgenursing.com" className="text-[#0D8F9C] hover:underline">support@forgenursing.com</a>.
            </p>
          </section>

          {/* 9. Uploaded Educational Materials */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">9. Uploaded Educational Materials</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              When you upload textbooks, class notes, or other educational materials, you retain full ownership of that content. We store it securely and use it only to provide personalized tutoring responses. We may use anonymized or aggregated versions of uploaded content to improve our educational algorithms.
            </p>
            <p className="text-[var(--gray-800)] leading-relaxed">
              You are responsible for ensuring you have the right to upload any materials you submit. Do not upload materials that violate publisher copyright or that you do not have permission to share.
            </p>
          </section>

          {/* 10. Cookies and Tracking */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">10. Cookies and Tracking</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              ForgeNursing uses cookies and similar technologies to maintain your session, remember your preferences, and ensure the service functions correctly. We do not use cookies for advertising or cross-site tracking.
            </p>
            <p className="text-[var(--gray-800)] leading-relaxed">
              You can control cookie settings through your browser, but disabling certain cookies may affect service functionality.
            </p>
          </section>

          {/* 11. Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">11. Data Retention</h2>
            <p className="text-[var(--gray-800)] leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide services. If you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legal, regulatory, or legitimate business purposes (such as billing records).
            </p>
          </section>

          {/* 12. Third-Party Links */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">12. Third-Party Links</h2>
            <p className="text-[var(--gray-800)] leading-relaxed">
              ForgeNursing may contain links to third-party websites or resources. We are not responsible for the privacy practices of those third parties. We encourage you to review their privacy policies before providing any personal information.
            </p>
          </section>

          {/* 13. AI-Generated Content Disclosure */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">13. AI-Generated Content Disclosure</h2>
            <p className="text-[var(--gray-800)] leading-relaxed">
              Responses generated by ForgeNursing are produced by artificial intelligence and are intended for educational purposes only. AI-generated content may contain errors or inaccuracies and must never be used to make real patient care decisions. Always verify clinical information through authoritative sources, your faculty, and established clinical guidelines.
            </p>
          </section>

          {/* 14. Changes to This Privacy Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">14. Changes to This Privacy Policy</h2>
            <p className="text-[var(--gray-800)] leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page, updating the &ldquo;Last updated&rdquo; date, and sending notice to the email address associated with your account. Your continued use of ForgeNursing after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* 15. Contact Us */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">15. Contact Us</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or your personal data, please contact us at:
            </p>
            <p className="text-[var(--gray-800)] leading-relaxed">
              <span className="font-semibold">MJR Intelligence Group LLC</span><br />
              Email: <a href="mailto:support@forgenursing.com" className="text-[#0D8F9C] hover:underline">support@forgenursing.com</a><br />
              Website: <a href="https://forgenursing.com" target="_blank" rel="noopener noreferrer" className="text-[#0D8F9C] hover:underline">forgenursing.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
