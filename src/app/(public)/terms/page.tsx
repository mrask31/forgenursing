export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-semibold text-[var(--navy)] mb-4">Terms of Service</h1>
        <p className="text-sm text-[var(--gray-400)] mb-8">Last updated: March 25, 2026</p>

        <div className="bg-white border border-[var(--gray-200)] rounded-xl p-8 shadow-sm space-y-8">
          {/* 1. Agreement to Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">1. Agreement to Terms</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you and MJR Intelligence Group LLC (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) governing your use of ForgeNursing, an AI-powered clinical reasoning tutor for nursing students.
            </p>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              By accessing or using ForgeNursing, you agree to be bound by these Terms. If you do not agree to these Terms, you may not use the service.
            </p>
          </section>

          {/* 2. Eligibility */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">2. Eligibility</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              ForgeNursing is designed exclusively for nursing students aged 18 and older enrolled in accredited nursing programs (LPN, ADN, BSN, MSN, or DNP tracks). By creating an account, you represent that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--gray-800)] leading-relaxed mb-4">
              <li>You are at least 18 years of age</li>
              <li>You are currently enrolled in or preparing for a nursing or healthcare education program</li>
              <li>You have the legal authority to enter into this agreement</li>
            </ul>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              If you do not meet these requirements, you may not use ForgeNursing.
            </p>
          </section>

          {/* 3. Educational Use and Acceptable Use */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">3. Educational Use and Acceptable Use</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              ForgeNursing is designed exclusively for educational purposes to support nursing students in developing clinical reasoning skills, preparing for the NCLEX examination, and understanding course materials. The service is intended to supplement, not replace, formal clinical instruction, classroom learning, and faculty guidance.
            </p>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              <strong>Acceptable Use</strong> — ForgeNursing should be used to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--gray-800)] leading-relaxed mb-4">
              <li>Develop clinical reasoning and critical thinking skills</li>
              <li>Practice NCLEX-style question analysis and prioritization</li>
              <li>Understand pathophysiology, pharmacology, and nursing interventions</li>
              <li>Review and study uploaded course materials and textbooks</li>
              <li>Prepare for examinations and clinical competencies</li>
            </ul>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              <strong>Prohibited Use</strong> — ForgeNursing should not be used to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--gray-800)] leading-relaxed mb-4">
              <li>Submit AI-generated content as your own original work without attribution</li>
              <li>Replace required clinical training, simulation, or faculty instruction</li>
              <li>Make real patient care decisions — ForgeNursing is a study tool only</li>
              <li>Attempt to reverse engineer, decompile, or extract source code</li>
              <li>Use automated systems (bots, scrapers) to access or interact with the service</li>
              <li>Upload materials you do not have the right to share</li>
              <li>Violate any applicable local, state, national, or international law</li>
              <li>Impersonate any person or entity</li>
            </ul>
          </section>

          {/* 4. Clinical Disclaimer */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">4. Clinical Disclaimer — IMPORTANT</h2>
            <div className="bg-[var(--teal-light)] border border-[var(--teal)]/20 rounded-lg p-6 mb-4">
              <p className="text-[var(--gray-800)] leading-relaxed mb-4">
                ForgeNursing is a supplemental educational study tool. It is NOT a medical device, clinical decision support system, or substitute for professional clinical judgment.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[var(--gray-800)] leading-relaxed mb-4">
                <li>AI-generated responses are for educational purposes only and must never be used to guide actual patient care decisions</li>
                <li>ForgeNursing does not provide medical advice, diagnosis, or treatment recommendations</li>
                <li>Clinical information provided may contain errors, be incomplete, or may not reflect the most current evidence-based guidelines</li>
                <li>Always defer to your instructors, clinical preceptors, facility policies, and authoritative clinical resources for patient care decisions</li>
                <li>Passing the NCLEX or succeeding academically requires comprehensive instruction, clinical experience, and individual effort — ForgeNursing is one supplemental tool and makes no guarantees regarding examination outcomes or academic performance</li>
              </ul>
            </div>
          </section>

          {/* 5. AI Limitations */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">5. AI Limitations</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              ForgeNursing uses artificial intelligence to generate educational content. You acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--gray-800)] leading-relaxed mb-4">
              <li>AI-generated content may contain errors, inaccuracies, or outdated information</li>
              <li>AI responses are generated based on training data and may not always align with your specific program&apos;s curriculum or your institution&apos;s clinical protocols</li>
              <li>AI systems have limitations and may not fully understand context or nuance in all situations</li>
              <li>You should verify important clinical information through authoritative sources, your textbooks, faculty, and clinical guidelines</li>
            </ul>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              We continuously work to improve our AI systems, but we cannot guarantee the accuracy, completeness, or reliability of all AI-generated content.
            </p>
          </section>

          {/* 6. AI Provider Disclosure */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">6. AI Provider Disclosure</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              ForgeNursing uses the following third-party AI services to power its features:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--gray-800)] leading-relaxed mb-4">
              <li><strong>Anthropic Claude</strong> — primary clinical reasoning and tutoring responses</li>
              <li><strong>Google Gemini</strong> — clinical image analysis (EKG strips, wound photos, lab results) and supporting features</li>
            </ul>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              Your messages, uploaded materials, and session data are processed by these providers solely to generate educational responses. Their use of your data is governed by their respective privacy policies. We implement contractual safeguards to protect your data during AI processing.
            </p>
          </section>

          {/* 7. User Accounts and Responsibilities */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">7. User Accounts and Responsibilities</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              To use ForgeNursing, you must:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--gray-800)] leading-relaxed mb-4">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access to your account</li>
              <li>Use the service in compliance with all applicable laws and regulations</li>
            </ul>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              You are responsible for all activities that occur under your account. You agree not to share your account credentials with others or use the service for any unauthorized purpose.
            </p>
          </section>

          {/* 8. User Content */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">8. User Content</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              You may upload educational materials (PDFs, notes, slides, textbooks) to your account. You retain ownership of your content, but by uploading it, you grant us a license to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--gray-800)] leading-relaxed mb-4">
              <li>Store and process your content to provide the ForgeNursing service</li>
              <li>Use your content to generate personalized educational responses</li>
              <li>Improve our AI models and algorithms (content may be used in anonymized or aggregated form)</li>
            </ul>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              You represent and warrant that you have the right to upload any content you submit and that it does not violate any third-party rights, including publisher copyright, or applicable laws.
            </p>
          </section>

          {/* 9. Subscription, Billing, and Cancellation */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">9. Subscription, Billing, and Cancellation</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              ForgeNursing offers the following subscription plans:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--gray-800)] leading-relaxed mb-4">
              <li><strong>Monthly Access</strong> — $24.99/month</li>
              <li><strong>Semester Access</strong> — $89.00 per semester (approximately 4 months)</li>
              <li><strong>Annual Access</strong> — $199.00/year</li>
            </ul>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              <strong>Free Trial:</strong> Your subscription begins with a 7-day free trial. No credit card is required during the trial period. You may cancel at any time during the trial without being charged.
            </p>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              <strong>Automatic Billing:</strong> After the trial period ends, your subscription will automatically renew at the selected plan rate unless you cancel before the trial ends.
            </p>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              <strong>Cancellation:</strong> You may cancel your subscription at any time through your account Settings page or by contacting us at{" "}
              <a href="mailto:support@forgenursing.com" className="text-[#0D8F9C] hover:underline">support@forgenursing.com</a>.
              When you cancel, your subscription remains active until the end of your current billing period. You will not be charged for subsequent billing periods after cancellation.
            </p>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              <strong>No Refunds:</strong> Subscription fees are non-refundable after the free trial period ends, except as required by law. We do not provide refunds for partial subscription periods or unused portions of your subscription.
            </p>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              <strong>Price Changes:</strong> We reserve the right to modify subscription prices at any time. Price changes will be communicated at least 30 days in advance via email and will apply to subsequent billing periods.
            </p>
          </section>

          {/* 10. Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">10. Intellectual Property</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              The ForgeNursing service, including its software, design, text, graphics, AI models, ADPIE framework implementation, and all related intellectual property, is owned by MJR Intelligence Group LLC and protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              You retain ownership of any educational content you upload to the platform. You may not copy, modify, distribute, sell, or lease any part of the ForgeNursing service without our prior written consent.
            </p>
          </section>

          {/* 11. Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">11. Limitation of Liability</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4 font-semibold">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--gray-800)] leading-relaxed mb-4 font-semibold">
              <li>THE FORGENURSING SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED</li>
              <li>WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT</li>
              <li>WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE</li>
              <li>WE ARE NOT LIABLE FOR ANY CLINICAL, MEDICAL, OR PATIENT CARE OUTCOMES ARISING FROM USE OR MISUSE OF FORGENURSING</li>
              <li>OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM</li>
            </ul>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              Some jurisdictions do not allow certain warranty exclusions or liability limitations, so some of the above may not apply to you.
            </p>
          </section>

          {/* 12. Indemnification */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">12. Indemnification</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              You agree to indemnify, defend, and hold harmless MJR Intelligence Group LLC, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of ForgeNursing, your violation of these Terms, or your violation of any rights of another party.
            </p>
          </section>

          {/* 13. Service Modifications and Termination */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">13. Service Modifications and Termination</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              We reserve the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[var(--gray-800)] leading-relaxed mb-4">
              <li>Modify, suspend, or discontinue the service at any time, with or without notice</li>
              <li>Terminate or suspend your account if you violate these Terms</li>
              <li>Refuse service to anyone for any reason at any time</li>
            </ul>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              You may cancel your account at any time through your account Settings or by contacting us at{" "}
              <a href="mailto:support@forgenursing.com" className="text-[#0D8F9C] hover:underline">support@forgenursing.com</a>.
            </p>
          </section>

          {/* 14. Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">14. Governing Law</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the State of Missouri, United States, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of ForgeNursing shall be subject to the exclusive jurisdiction of the state and federal courts located in Missouri, United States.
            </p>
          </section>

          {/* 15. Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">15. Changes to Terms</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on this page, updating the &ldquo;Last updated&rdquo; date, and sending notice to the email address associated with your account. Your continued use of ForgeNursing after such modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          {/* 16. Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-4">16. Contact Information</h2>
            <p className="text-[var(--gray-800)] leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-[var(--gray-800)] leading-relaxed">
              <strong>MJR Intelligence Group LLC</strong><br />
              Email: <a href="mailto:support@forgenursing.com" className="text-[#0D8F9C] hover:underline">support@forgenursing.com</a><br />
              Website: <a href="https://forgenursing.com" className="text-[#0D8F9C] hover:underline">forgenursing.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
