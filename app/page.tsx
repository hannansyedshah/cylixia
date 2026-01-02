import Link from 'next/link'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { HeroCTA } from '@/components/layout/HeroCTA'
import { 
  ShieldCheck, 
  Code2, 
  Sparkles, 
  Upload, 
  MessageSquare, 
  BarChart3, 
  History, 
  Users, 
  GitBranch, 
  Zap, 
  Share2, 
  Lock,
  Globe,
  Clock,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'

export default function Home() {
  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-white via-blue-50 to-blue-100 relative overflow-hidden">
        {/* Enhanced Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-blue-200/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>

        {/* Hero Section */}
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-block mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium animate-fade-in">
                <Zap className="w-4 h-4" />
                AI-Powered R Code Generation
              </span>
            </div>
            <h1 className="text-7xl md:text-8xl font-bold mb-6 text-darktext animate-fade-in-up">
              Cylixia
            </h1>
            <p className="text-3xl md:text-4xl text-gray-600 mb-4 animate-fade-in-up animation-delay-200 font-semibold">
              From question to insight—R code and visuals in seconds
            </p>
            <p className="text-lg md:text-xl text-gray-500 mb-12 max-w-3xl mx-auto animate-fade-in-up animation-delay-400 leading-relaxed">
              Upload a dataset, ask in plain English, and get clean R code with publication‑ready plots. 
              Collaborate in real-time with your team, share datasets, and track every version.
            </p>
            <div className="mb-12 animate-fade-in-up animation-delay-600">
              <HeroCTA />
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600 animate-fade-in-up animation-delay-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                <span>Real-time Collaboration</span>
              </div>
            </div>
          </div>
        </div>

        {/* Core Features Section */}
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-darktext mb-4">
              Everything you need for data analysis
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make your research faster and more collaborative
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* AI Chat */}
            <div className="bg-blue-50 p-8 rounded-2xl border border-blue-200 text-center transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-blue-200/50 group">
              <div className="bg-blue-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-200 group-hover:bg-blue-200 transition-colors">
                <Sparkles className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-darktext">
                AI-Powered Chat
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Ask questions in plain English. Get tailored R code that fits your data and intent instantly.
              </p>
            </div>

            {/* Real-time Collaboration */}
            <div className="bg-blue-50 p-8 rounded-2xl border border-blue-200 text-center transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-blue-200/50 group">
              <div className="bg-blue-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-200 group-hover:bg-blue-200 transition-colors">
                <Users className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-darktext">
                Real-time Collaboration
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Work together seamlessly with live edits, team chat, and real-time code collaboration.
              </p>
            </div>

            {/* Shared Datasets */}
            <div className="bg-blue-50 p-8 rounded-2xl border border-blue-200 text-center transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-blue-200/50 group">
              <div className="bg-blue-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-200 group-hover:bg-blue-200 transition-colors">
                <Share2 className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-darktext">
                Shared Datasets
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Share datasets with your team for consistent analysis across projects.
              </p>
            </div>

            {/* Version History */}
            <div className="bg-blue-50 p-8 rounded-2xl border border-blue-200 text-center transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-blue-200/50 group">
              <div className="bg-blue-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-200 group-hover:bg-blue-200 transition-colors">
                <History className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-darktext">
                Version History
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Never lose your work. Full version history with plots, code snapshots, and easy restoration.
              </p>
            </div>

            {/* Privacy & Security */}
            <div className="bg-blue-50 p-8 rounded-2xl border border-blue-200 text-center transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-blue-200/50 group">
              <div className="bg-blue-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-200 group-hover:bg-blue-200 transition-colors">
                <Lock className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-darktext">
                Privacy First
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Your data stays yours. Private by default with optional data randomization for extra security.
              </p>
            </div>

            {/* Clean Code */}
            <div className="bg-blue-50 p-8 rounded-2xl border border-blue-200 text-center transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-blue-200/50 group">
              <div className="bg-blue-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-200 group-hover:bg-blue-200 transition-colors">
                <Code2 className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-darktext">
                Clean, Editable Code
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Transparent outputs you can tweak, run, and reproduce. No black boxes—just clean, readable R code.
              </p>
            </div>
          </div>
        </div>

        {/* Collaboration Features Section */}
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-darktext mb-4">
                Built for teams
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Collaborate seamlessly with powerful team features
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Features List */}
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-6 bg-blue-50 rounded-xl border border-blue-200 hover:shadow-lg hover:shadow-blue-200/50 transition-shadow">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-darktext">Invite Collaborators</h3>
                    <p className="text-gray-600">
                      Invite team members with edit or view-only access. Manage permissions and roles easily.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-blue-50 rounded-xl border border-blue-200 hover:shadow-lg hover:shadow-blue-200/50 transition-shadow">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-darktext">Team Chat</h3>
                    <p className="text-gray-600">
                      Built-in collaboration chat. Share code selections, discuss changes, and communicate in real-time.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-blue-50 rounded-xl border border-blue-200 hover:shadow-lg hover:shadow-blue-200/50 transition-shadow">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
                    <Share2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-darktext">Shared Datasets</h3>
                    <p className="text-gray-600">
                      Share CSV files with your team for consistent analysis.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-blue-50 rounded-xl border border-blue-200 hover:shadow-lg hover:shadow-blue-200/50 transition-shadow">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-darktext">Live Editing</h3>
                    <p className="text-gray-600">
                      See who&apos;s editing in real-time. Typing indicators and live cursors keep everyone in sync.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Visual Demo */}
              <div className="relative">
                <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-blue-100">
                      <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-darktext">Active Collaborators</div>
                        <div className="text-sm text-gray-500">3 people editing</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-gray-700">Sarah is typing...</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                        <span className="text-gray-700">Mike is editing code</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                        <span className="text-gray-700">Emma shared a dataset</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-darktext mb-4">
                How it works
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Four simple steps from raw data to publication‑ready visuals
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-10 items-stretch">
              {/* Steps */}
              <div className="space-y-4">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 hover:shadow-lg hover:shadow-blue-200/50 transition-all group">
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 text-blue-600 flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors flex-shrink-0">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 border border-blue-200 px-2 py-1 rounded">STEP 1</span>
                        <h3 className="font-bold text-lg text-darktext">Upload your data</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        CSV or spreadsheet—Cylixia previews columns and types automatically.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 hover:shadow-lg hover:shadow-blue-200/50 transition-all group">
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 text-blue-600 flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors flex-shrink-0">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 border border-blue-200 px-2 py-1 rounded">STEP 2</span>
                        <h3 className="font-bold text-lg text-darktext">Ask in plain English</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Describe the plot or analysis you need. No R experience required.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 hover:shadow-lg hover:shadow-blue-200/50 transition-all group">
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 text-blue-600 flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors flex-shrink-0">
                      <Code2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 border border-blue-200 px-2 py-1 rounded">STEP 3</span>
                        <h3 className="font-bold text-lg text-darktext">Review editable R code</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Transparent, clean code you can tweak, run, and reuse.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 hover:shadow-lg hover:shadow-blue-200/50 transition-all group">
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 text-blue-600 flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors flex-shrink-0">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 border border-blue-200 px-2 py-1 rounded">STEP 4</span>
                        <h3 className="font-bold text-lg text-darktext">Get beautiful visuals</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Publication‑ready plots with consistent themes and accessibility in mind. Save versions and restore anytime.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <History className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Everything autosaves. Browse full version history anytime.
                  </span>
                </div>
              </div>

              {/* Demo Card */}
              <div className="bg-blue-50 rounded-2xl border border-blue-200 p-8 flex flex-col">
                <div className="text-xs uppercase tracking-wide text-blue-600 mb-4 font-semibold">Example</div>
                <div className="bg-white rounded-xl p-5 border border-blue-200 mb-6">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Prompt</div>
                  <p className="text-sm text-gray-600 font-medium">
                    &quot;Make a bar chart of average mpg by cylinder count.&quot;
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4 flex-1">
                  <div className="bg-white rounded-xl p-5 border border-blue-200 overflow-hidden">
                    <div className="text-sm font-semibold text-gray-700 mb-3">Generated R</div>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed font-mono">
{`library(dplyr)
library(ggplot2)
mtcars %>%
  group_by(cyl) %>%
  summarise(avg_mpg = mean(mpg)) %>%
  ggplot(aes(x = factor(cyl), y = avg_mpg, fill = factor(cyl))) +
  geom_col() +
  theme_minimal() +
  labs(x = 'Cylinders', y = 'Average MPG')`}
                    </pre>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-blue-200 flex items-center justify-center">
                    {/* Inline demo chart (SVG) */}
                    <svg viewBox="0 0 220 160" className="w-full h-32">
                      <defs>
                        <linearGradient id="barGrad" x1="0" x2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                      <rect x="0" y="0" width="220" height="160" rx="8" fill="transparent" />
                      <g transform="translate(30,10)">
                        <line x1="0" y1="120" x2="170" y2="120" stroke="#94a3b8" strokeWidth="1" />
                        <g className="animate-fade-in-up">
                          <rect x="10" y="60" width="30" height="60" rx="4" fill="url(#barGrad)" className="transform origin-bottom group-hover:scale-y-105" />
                          <rect x="70" y="40" width="30" height="80" rx="4" fill="url(#barGrad)" className="transform origin-bottom animate-float" />
                          <rect x="130" y="50" width="30" height="70" rx="4" fill="url(#barGrad)" className="transform origin-bottom" />
                        </g>
                        <text x="15" y="146" fontSize="10" fill="#94a3b8">4</text>
                        <text x="75" y="146" fontSize="10" fill="#94a3b8">6</text>
                        <text x="135" y="146" fontSize="10" fill="#94a3b8">8</text>
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-12 md:p-16 text-center max-w-4xl mx-auto shadow-lg hover:shadow-xl hover:shadow-blue-200/50 transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-darktext animate-fade-in-up">
                Ready to accelerate your research?
              </h2>
              <p className="text-xl md:text-2xl mb-8 text-gray-600 animate-fade-in-up animation-delay-200">
                Join researchers who are saving hours on data visualization and collaboration
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-400">
                <Link href="/signup">
                  <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 text-lg px-8 py-6 shadow-lg flex items-center gap-2">
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-2 border-blue-300 text-blue-600 hover:bg-blue-100 text-lg px-8 py-6">
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
