'use client'

import Link from 'next/link'
import { Bookmark, AlertCircle, Map, MessageSquare, FileText, GraduationCap, Activity, Settings, BookOpen, Sparkles, CheckCircle2, XCircle } from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent mb-4">
            How to Use ForgeNursing
          </h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            A quick guide to make the most of your AI tutor and build stronger clinical reasoning skills.
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="bg-white/80 backdrop-blur-sm border border-indigo-200/60 rounded-xl p-6 mb-12 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a href="#getting-started" className="text-indigo-600 hover:text-indigo-700 font-medium">Getting Started</a>
            <a href="#chat-features" className="text-indigo-600 hover:text-indigo-700 font-medium">Chat Features</a>
            <a href="#organizing" className="text-indigo-600 hover:text-indigo-700 font-medium">Organizing Your Work</a>
            <a href="#tips" className="text-indigo-600 hover:text-indigo-700 font-medium">Pro Tips</a>
          </div>
        </div>

        {/* Getting Started */}
        <section id="getting-started" className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            Getting Started
          </h2>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Upload Your Materials</h3>
                  <p className="text-slate-700 mb-3">
                    Go to <strong>My Classes</strong> in the sidebar and upload your syllabus, textbooks, and lecture notes. 
                    ForgeNursing works best when it can reference your specific program's materials.
                  </p>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-indigo-900">
                      <strong>💡 Tip:</strong> Upload PDFs of your textbooks and syllabus. The more materials you add, 
                      the better the tutor can align with your program's teaching style.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Start a New Chat</h3>
                  <p className="text-slate-700 mb-3">
                    Click <strong>"New Chat"</strong> in the top right of Clinical Studio to start fresh. 
                    Each chat session saves automatically, so you can return to it later.
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-slate-700">
                      <strong>Note:</strong> Your chat history is saved automatically. You can access past chats 
                      by clicking the history button (clock icon) in the sidebar.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Ask Your First Question</h3>
                  <p className="text-slate-700 mb-3">
                    Type a clinical question or paste an NCLEX-style question. The tutor will guide you through 
                    step-by-step reasoning, not just give you the answer.
                  </p>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-indigo-900">
                      <strong>Example:</strong> "How do I prioritize care for a patient with heart failure?" 
                      or "What's the first thing I should assess in a patient with chest pain?"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Chat Features */}
        <section id="chat-features" className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-indigo-600" />
            Chat Features Explained
          </h2>

          <div className="space-y-6">
            {/* Flag Button */}
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Flag Button</h3>
                  <p className="text-slate-700 mb-3">
                    Click the <strong>"Flag"</strong> button on any tutor response to mark it for focused review later. 
                    Flagged messages appear in your <strong>Dashboard</strong> under "Flagged for Review."
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-amber-900">
                      <strong>When to use:</strong> Flag explanations that helped a concept "click" or questions you 
                      want to revisit before exams. Click "Flag" again to unflag.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bookmark className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Save Button</h3>
                  <p className="text-slate-700 mb-3">
                    Click <strong>"Save"</strong> on any tutor response to save it as a learning clip. 
                    You can organize clips into folders and add tags for easy review.
                  </p>
                  <ul className="list-disc list-inside text-slate-700 space-y-1 mb-3">
                    <li>Give your clip a title</li>
                    <li>Choose a folder (or create a new one)</li>
                    <li>Add tags like "heart failure" or "prioritization"</li>
                  </ul>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-indigo-900">
                      <strong>Pro tip:</strong> Save key "aha!" moments. Review your saved clips before exams 
                      to quickly refresh important concepts.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Button */}
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Map className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Map Button</h3>
                  <p className="text-slate-700 mb-3">
                    Click <strong>"Map"</strong> to generate a visual concept map from any tutor response. 
                    Concept maps show relationships, priorities, and cause-and-effect chains visually.
                  </p>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-purple-900">
                      <strong>Best for:</strong> Complex topics with multiple connections. The visual map helps 
                      you see the big picture before diving into details.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attached Files */}
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-teal-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Attach Specific Files</h3>
                  <p className="text-slate-700 mb-3">
                    Use the <strong>"Attach Sources"</strong> bar to select specific files from your binder. 
                    This tells the tutor to focus on those materials for your current question.
                  </p>
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-teal-900">
                      <strong>When to use:</strong> If you're studying a specific chapter or topic, attach 
                      that file so the tutor references it directly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Strict Mode */}
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Strict Mode</h3>
                  <p className="text-slate-700 mb-3">
                    Toggle <strong>"Strict Mode"</strong> to simulate exam conditions. The tutor gives less guidance 
                    and expects you to reason through answers more independently.
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-red-900">
                      <strong>Use when:</strong> You're ready to test your understanding without step-by-step hints. 
                      Great for exam prep!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Organizing Your Work */}
        <section id="organizing" className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
            Organizing Your Work
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Classes */}
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <GraduationCap className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-semibold text-slate-900">My Classes</h3>
              </div>
              <p className="text-slate-700 mb-3">
                Organize your materials by class. Create classes for each course (e.g., "Med-Surg 1", "Pharmacology") 
                and upload materials to the appropriate class.
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm">
                <li>Upload files to specific classes</li>
                <li>Chats are organized by class</li>
                <li>Easier to find materials later</li>
              </ul>
            </div>

            {/* Dashboard */}
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Activity className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-semibold text-slate-900">Dashboard</h3>
              </div>
              <p className="text-slate-700 mb-3">
                View your progress, flagged items, and saved clips all in one place. The Dashboard helps you 
                track what you've learned and what needs review.
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm">
                <li>See flagged messages for review</li>
                <li>Track your study progress</li>
                <li>Quick access to saved clips</li>
              </ul>
            </div>

            {/* Saved Clips */}
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Bookmark className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-semibold text-slate-900">Saved Clips</h3>
              </div>
              <p className="text-slate-700 mb-3">
                Your saved learning moments are organized by folders and tags. Review them before exams or 
                when you need a quick refresher on a topic.
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm">
                <li>Organize by folders</li>
                <li>Tag by topic or concept</li>
                <li>Search and filter easily</li>
              </ul>
            </div>

            {/* History */}
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <MessageSquare className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-semibold text-slate-900">Chat History</h3>
              </div>
              <p className="text-slate-700 mb-3">
                All your chat sessions are saved automatically. Access past conversations through the history 
                button in the sidebar to review previous learning sessions.
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm">
                <li>All chats saved automatically</li>
                <li>Organized by class and date</li>
                <li>Search past conversations</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Pro Tips */}
        <section id="tips" className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            Pro Tips for Best Results
          </h2>

          <div className="space-y-4">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Upload Materials First</h3>
                  <p className="text-slate-700">
                    The tutor works best when it can reference your specific program materials. Upload your 
                    syllabus and textbooks before starting your first chat.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Ask "Why" Questions</h3>
                  <p className="text-slate-700">
                    Instead of asking "What's the answer?", ask "Why is this the priority?" or "How do I think 
                    through this?" The tutor is designed to teach reasoning, not just facts.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Flag and Save Strategically</h3>
                  <p className="text-slate-700">
                    Flag messages that helped concepts click. Save clips for key moments you'll want to review 
                    before exams. Use folders and tags to stay organized.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Use Concept Maps for Complex Topics</h3>
                  <p className="text-slate-700">
                    When learning multi-step processes or prioritization frameworks, click "Map" to see the 
                    visual structure. This helps you understand relationships and flow.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Practice with Strict Mode</h3>
                  <p className="text-slate-700">
                    Once you understand a concept, toggle Strict Mode to practice reasoning independently. 
                    This simulates exam conditions and builds confidence.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Review Your Dashboard Regularly</h3>
                  <p className="text-slate-700">
                    Check your Dashboard to see flagged items and review saved clips. This helps reinforce 
                    learning and identify areas that need more practice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
